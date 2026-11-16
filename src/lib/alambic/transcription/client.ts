"use client";

/*
 * Appels aux routes /api/alambic, avec nouvel essai automatique quand le service est saturé,
 * et le déroulé complet d'une transcription : préparer, distiller, mettre en page.
 */
import { inspecter, morceaux } from "./decoupe";
import { construirePhrases, type Morceau, recoller } from "./phrases";
import type { Analyse, Fragment, Transcription } from "./types";

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

type ReponseYoutube = { id: string; titre: string; auteur: string; duree: number; langue: string; automatiques: boolean; fragments: Fragment[] };

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
  suivi.etape("distillation");
  suivi.progression(0.2, { prets: 1, transcrits: 0, total: 1 });
  const r = await appeler<ReponseYoutube>(`/api/alambic/youtube?v=${id}${langue ? `&langue=${langue}` : ""}`, {}, signal, 2);
  suivi.distillat(r.fragments.flatMap((f) => f.texte.split(/\s+/)).slice(0, 80));
  suivi.etape("mise-en-page");
  const phrases = construirePhrases(recoller([{ decalage: 0, de: Number.NEGATIVE_INFINITY, a: Number.POSITIVE_INFINITY, fragments: r.fragments }]));
  if (!phrases.length) throw new ErreurService("Les sous-titres de cette vidéo sont vides.");
  suivi.progression(1, { prets: 1, transcrits: 1, total: 1 });
  return {
    id: nouvelId(),
    titre: r.titre,
    langue: r.langue,
    duree: r.duree,
    source: { type: "youtube", id, auteur: r.auteur },
    phrases,
    creeLe: Date.now(),
    traductions: {},
    analyses: {},
  };
}
