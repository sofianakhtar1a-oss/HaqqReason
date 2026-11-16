"use client";

/*
 * Appels aux routes /api/alambic, avec nouvel essai automatique quand le service est saturé,
 * et le déroulé complet d'une transcription : préparer, distiller, mettre en page.
 */
import { inspecter, morceaux } from "./decoupe";
import { construirePhrases, type Morceau, recoller } from "./phrases";
import type { Analyse, Fragment, Transcription } from "./types";
import { choisirPistes, depuisVtt, RELAIS_CONNUS, type VideoInvidious } from "./vtt";

export class ErreurService extends Error {}

const pause = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const minuteur = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(minuteur);
        reject(new DOMException("Annulé", "AbortError"));
      },
      { once: true },
    );
  });

async function appeler<T>(adresse: string, init: RequestInit, signal?: AbortSignal, essais = 4): Promise<T> {
  for (let n = 0; ; n++) {
    let reponse: Response;
    try {
      reponse = await fetch(adresse, { ...init, signal, credentials: "same-origin" });
    } catch (e) {
      if (signal?.aborted) throw e;
      if (n + 1 >= essais) throw new ErreurService("Connexion perdue. Vérifie ta connexion à Internet, puis réessaie.");
      await pause(1500 * (n + 1), signal);
      continue;
    }
    if (reponse.ok) return (await reponse.json()) as T;
    let corps: { erreur?: string; attente?: number } = {};
    try {
      corps = await reponse.json();
    } catch {
      // Réponse sans corps.
    }
    const reessayable = reponse.status === 429 || reponse.status === 502 || reponse.status === 503 || reponse.status === 504;
    const quotaVisiteur = reponse.status === 429 && (corps.attente ?? 0) >= 300;
    if (!reessayable || quotaVisiteur || n + 1 >= essais || /clé Groq/.test(corps.erreur ?? "")) {
      throw new ErreurService(corps.erreur ?? `Le service a répondu ${reponse.status}.`);
    }
    const attente = corps.attente || Number(reponse.headers.get("retry-after")) || 2 ** n;
    await pause(Math.min(30, attente) * 1000 + 300, signal);
  }
}

type ReponseMorceau = { langue: string; duree: number; fragments: Fragment[] };

export function transcrireMorceau(blob: Blob, nom: string, langue: string | null, signal?: AbortSignal) {
  const f = new FormData();
  f.append("fichier", blob, nom);
  f.append("nom", nom);
  if (langue) f.append("langue", langue);
  return appeler<ReponseMorceau>("/api/alambic/transcrire", { method: "POST", body: f }, signal);
}

export async function traduireLot(langue: string, phrases: string[], contexte: string, signal?: AbortSignal): Promise<string[]> {
  const r = await appeler<{ traductions: string[] }>(
    "/api/alambic/traduire",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ langue, phrases, contexte }) },
    signal,
    3,
  );
  return r.traductions;
}

export function analyserPhrase(langue: string, mots: string[], contexte: string, signal?: AbortSignal) {
  return appeler<Analyse>(
    "/api/alambic/analyser",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ langue, mots, contexte }) },
    signal,
    3,
  );
}

export type ApercuYoutube = { id: string; titre: string; auteur: string };
export const apercuYoutube = (id: string, signal?: AbortSignal) => appeler<ApercuYoutube>(`/api/alambic/youtube?apercu=1&v=${id}`, {}, signal, 1);

type SonYoutube = { relais: string; itag: string; taille: number; type: string; url?: string };
type ReponseYoutube = { id: string; titre: string; auteur: string; duree: number; langue: string; automatiques: boolean; fragments: Fragment[]; son: SonYoutube | null };

/** Les relais répondent au navigateur (pas aux serveurs) : on les interroge d'ici en premier. */
async function viaRelaisNavigateur(id: string, langue: string | null, signal?: AbortSignal): Promise<ReponseYoutube | null> {
  // Chaque relais a droit à deux essais : ils ont des coupures passagères.
  for (const hote of RELAIS_CONNUS.flatMap((h) => [h, h])) {
    try {
      const minuteur = AbortSignal.timeout(10000);
      const s = signal ? AbortSignal.any([signal, minuteur]) : minuteur;
      const r = await fetch(`https://${hote}/api/v1/videos/${id}?local=true&fields=title,author,lengthSeconds,captions,adaptiveFormats`, { signal: s });
      if (!r.ok) continue;
      const v = (await r.json()) as VideoInvidious;
      if (!v.title) continue;
      const { piste, son, langue: l } = choisirPistes(v, langue);
      let fragments: Fragment[] = [];
      if (piste) {
        try {
          const t = await fetch(`https://${hote}${piste.url}`, { signal: s });
          if (t.ok) fragments = depuisVtt(await t.text());
        } catch {
          // Sous-titres illisibles : le son prendra le relais.
        }
      }
      if (!fragments.length && !son) continue;
      const url = son ? (son.url?.startsWith("http") ? son.url : `https://${hote}/latest_version?id=${id}&itag=${son.itag}&local=true`) : undefined;
      return {
        id,
        titre: v.title,
        auteur: v.author ?? "",
        duree: v.lengthSeconds ?? 0,
        langue: l,
        automatiques: piste ? /auto/i.test(piste.label) : true,
        fragments,
        son: son ? { relais: hote, itag: son.itag, taille: Number(son.clen), type: son.type.split(";")[0], url } : null,
      };
    } catch (e) {
      if (signal?.aborted) throw e;
      await pause(600, signal);
    }
  }
  return null;
}

/** Son récupéré directement au relais, avec l'avancement. */
async function telechargerDirect(son: SonYoutube, avancer: (f: number) => void, signal?: AbortSignal): Promise<Blob> {
  const r = await fetch(son.url!, { signal });
  if (!r.ok || !r.body) throw new ErreurService("Le relais n'a pas livré le son.");
  const lecteur = r.body.getReader();
  const parts: BlobPart[] = [];
  let recu = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    parts.push(value);
    recu += value.length;
    avancer(Math.min(1, recu / son.taille));
  }
  if (!recu) throw new ErreurService("Le son de la vidéo est vide.");
  return new Blob(parts, { type: son.type });
}

/** Le son d'une vidéo, rapatrié par morceaux de 3,5 Mo à travers le relais de l'application. */
async function telechargerSon(id: string, son: SonYoutube, avancer: (f: number) => void, signal?: AbortSignal): Promise<Blob> {
  const MORCEAU = 3_500_000;
  const parts: Blob[] = [];
  for (let debut = 0; debut < son.taille; debut += MORCEAU) {
    const fin = Math.min(son.taille, debut + MORCEAU) - 1;
    const adresse = `/api/alambic/youtube/son?v=${id}&relais=${encodeURIComponent(son.relais)}&itag=${son.itag}&debut=${debut}&fin=${fin}`;
    let morceau: Blob | null = null;
    for (let essai = 0; essai < 3 && !morceau; essai++) {
      try {
        const r = await fetch(adresse, { signal, credentials: "same-origin" });
        if (r.ok) morceau = await r.blob();
        else if (r.status === 429) throw new ErreurService("Tu as atteint la limite de l'heure pour YouTube. Réessaie un peu plus tard.");
      } catch (e) {
        if (signal?.aborted || e instanceof ErreurService) throw e;
      }
      if (!morceau) await pause(1200 * (essai + 1), signal);
    }
    if (!morceau || !morceau.size) throw new ErreurService("Le son de la vidéo n'a pas pu être récupéré.");
    parts.push(morceau);
    avancer((fin + 1) / son.taille);
  }
  return new Blob(parts, { type: son.type });
}

/* ---------- Déroulé complet ---------- */

export type Etape = "preparation" | "distillation" | "mise-en-page";

export type Suivi = {
  etape: (e: Etape) => void;
  /** Avancement global, de 0 à 1. */
  progression: (f: number, detail: { prets: number; transcrits: number; total: number }) => void;
  /** Les premiers mots réellement entendus, pour les montrer pendant l'attente. */
  distillat: (mots: string[]) => void;
};

const nouvelId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export async function transcrireFichier(fichier: File, langue: string | null, suivi: Suivi, signal?: AbortSignal): Promise<Transcription> {
  suivi.etape("preparation");
  const { duree, video } = await inspecter(fichier);
  if (duree < 0.5) throw new ErreurService("Ce son est trop court pour être transcrit.");
  if (duree > 6 * 3600) throw new ErreurService("Au-delà de 6 heures, découpe d'abord l'enregistrement dans « Découper ».");

  let prepare = 0;
  let total = 1;
  let transcrits = 0;
  const signaler = () => suivi.progression(Math.min(0.99, prepare * 0.35 + (transcrits / total) * 0.65), { prets: Math.round(prepare * total), transcrits, total });

  const resultats: Morceau[] = [];
  const enCours = new Set<Promise<void>>();
  let langueDetectee = langue;
  let premier = true;
  const SIMULTANES = 3;

  for await (const m of morceaux(
    fichier,
    duree,
    (f) => {
      prepare = f;
      signaler();
    },
    signal,
  )) {
    total = m.total;
    if (premier) {
      suivi.etape("distillation");
      premier = false;
    }
    // L'arabe, l'anglais ou l'espagnol détecté sur le premier morceau est imposé aux suivants : plus juste.
    const tache = (async () => {
      const r = await transcrireMorceau(m.blob, m.nom, langueDetectee, signal);
      if (!langueDetectee && r.langue && ["en", "ar", "es"].includes(r.langue)) langueDetectee = r.langue;
      resultats.push({ decalage: m.decalage, de: m.de, a: m.a, fragments: r.fragments });
      transcrits++;
      signaler();
      if (m.index === 0 || resultats.length === 1) suivi.distillat(r.fragments.flatMap((fr) => fr.texte.split(/\s+/)).slice(0, 80));
    })();
    enCours.add(tache);
    void tache.finally(() => enCours.delete(tache)).catch(() => undefined);
    // Le premier morceau fixe la langue : on l'attend avant de lancer les autres.
    if (m.index === 0 && !langue) await tache;
    while (enCours.size >= SIMULTANES) await Promise.race(enCours);
  }
  await Promise.all(enCours);

  suivi.etape("mise-en-page");
  const phrases = construirePhrases(recoller(resultats));
  if (!phrases.length) throw new ErreurService("Aucune parole n'a été entendue dans ce fichier.");
  suivi.progression(1, { prets: total, transcrits, total });
  return {
    id: nouvelId(),
    titre: fichier.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Sans titre",
    langue: langueDetectee ?? "en",
    duree,
    source: { type: "fichier", nom: fichier.name, mime: fichier.type, video },
    phrases,
    creeLe: Date.now(),
    traductions: {},
    analyses: {},
  };
}

export async function transcrireYoutube(id: string, langue: string | null, suivi: Suivi, signal?: AbortSignal): Promise<Transcription> {
  suivi.etape("preparation");
  suivi.progression(0.03, { prets: 0, transcrits: 0, total: 1 });
  const r = (await viaRelaisNavigateur(id, langue, signal)) ?? (await appeler<ReponseYoutube>(`/api/alambic/youtube?v=${id}${langue ? `&langue=${langue}` : ""}`, {}, signal, 2));
  const source = { type: "youtube" as const, id, auteur: r.auteur };

  const depuisSousTitres = (): Transcription => {
    suivi.etape("mise-en-page");
    suivi.distillat(r.fragments.flatMap((f) => f.texte.split(/\s+/)).slice(0, 80));
    const phrases = construirePhrases(recoller([{ decalage: 0, de: Number.NEGATIVE_INFINITY, a: Number.POSITIVE_INFINITY, fragments: r.fragments }]));
    if (!phrases.length) throw new ErreurService("Les sous-titres de cette vidéo sont vides.");
    suivi.progression(1, { prets: 1, transcrits: 1, total: 1 });
    return { id: nouvelId(), titre: r.titre, langue: r.langue || langue || "en", duree: r.duree, source, phrases, creeLe: Date.now(), traductions: {}, analyses: {} };
  };

  // 1. Sous-titres écrits par l'auteur : les plus justes.
  if (r.fragments.length && !r.automatiques) return depuisSousTitres();

  // 2. Sinon, Whisper écoute le son de la vidéo (bien mieux que les sous-titres automatiques).
  if (r.son) {
    try {
      const avancer = (f: number) => suivi.progression(f * 0.25, { prets: 0, transcrits: 0, total: 1 });
      let son: Blob;
      try {
        son = r.son.url ? await telechargerDirect(r.son, avancer, signal) : await telechargerSon(id, r.son, avancer, signal);
      } catch (e) {
        if (signal?.aborted || !r.son.url) throw e;
        son = await telechargerSon(id, r.son, avancer, signal);
      }
      const fichier = new File([son], `${id}.${r.son.type.includes("webm") ? "webm" : "m4a"}`, { type: r.son.type });
      const indice = langue ?? (["en", "ar", "es"].includes(r.langue) ? r.langue : null);
      const t = await transcrireFichier(fichier, indice, { ...suivi, progression: (f, d) => suivi.progression(0.25 + f * 0.75, d) }, signal);
      return { ...t, titre: r.titre, duree: r.duree || t.duree, source };
    } catch (e) {
      if (signal?.aborted || !r.fragments.length) throw e;
    }
  }

  // 3. En dernier recours, les sous-titres automatiques.
  if (r.fragments.length) return depuisSousTitres();
  throw new ErreurService("Cette vidéo n'a ni sous-titres ni son accessible. Télécharge son audio et dépose le fichier ici.");
}
