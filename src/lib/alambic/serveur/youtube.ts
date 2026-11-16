import "server-only";
import type { Fragment } from "../transcription/types";
import { ErreurGroq } from "./groq";

/*
 * Vidéo YouTube : on lit les sous-titres qu'elle a déjà (écrits par l'auteur, ou automatiques).
 * Rien n'est téléchargé : le son reste chez YouTube, la vidéo est lue par le lecteur officiel.
 * YouTube refuse parfois les serveurs : l'erreur le dit clairement et propose de déposer le fichier.
 */

type Piste = { baseUrl: string; languageCode: string; kind?: string; name?: { simpleText?: string; runs?: { text: string }[] } };

type Reponse = {
  videoDetails?: { title?: string; author?: string; lengthSeconds?: string };
  playabilityStatus?: { status?: string; reason?: string };
  captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: Piste[] } };
};

const CLIENTS = [
  {
    context: { client: { clientName: "ANDROID", clientVersion: "20.10.38", androidSdkVersion: 30, hl: "fr", gl: "FR" } },
    agent: "com.google.android.youtube/20.10.38 (Linux; U; Android 11) gzip",
  },
  {
    context: { client: { clientName: "WEB", clientVersion: "2.20251110.01.00", hl: "fr", gl: "FR" } },
    agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Safari/537.36",
  },
];

async function lecteur(id: string, signal?: AbortSignal): Promise<Reponse | null> {
  for (const c of CLIENTS) {
    try {
      const r = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": c.agent, "Accept-Language": "fr-FR,fr;q=0.9" },
        body: JSON.stringify({ context: c.context, videoId: id, contentCheckOk: true, racyCheckOk: true }),
        signal,
      });
      if (!r.ok) continue;
      const corps = (await r.json()) as Reponse;
      if (corps.captions?.playerCaptionsTracklistRenderer?.captionTracks?.length) return corps;
      if (corps.videoDetails) return corps;
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }
  // Dernier recours : la page de la vidéo contient la même description.
  try {
    const r = await fetch(`https://www.youtube.com/watch?v=${id}&hl=fr`, { headers: { "User-Agent": CLIENTS[1].agent, "Accept-Language": "fr-FR,fr;q=0.9" }, signal });
    const html = await r.text();
    const debut = html.indexOf("ytInitialPlayerResponse = ");
    if (debut < 0) return null;
    const fin = html.indexOf(";</script>", debut);
    return JSON.parse(html.slice(debut + "ytInitialPlayerResponse = ".length, fin)) as Reponse;
  } catch (e) {
    if (signal?.aborted) throw e;
    return null;
  }
}

function choisir(pistes: Piste[], voulue: string | null): Piste | undefined {
  const ordre = voulue ? [voulue] : ["ar", "en", "es"];
  for (const l of ordre) {
    const dansLaLangue = pistes.filter((p) => p.languageCode.split("-")[0] === l);
    const ecrite = dansLaLangue.find((p) => p.kind !== "asr");
    if (ecrite || dansLaLangue[0]) return ecrite ?? dansLaLangue[0];
  }
  return voulue ? undefined : pistes.find((p) => p.kind !== "asr") ?? pistes[0];
}

const ENTITES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
const decoder = (s: string) =>
  s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e: string) => {
    if (ENTITES[e]) return ENTITES[e];
    if (e.startsWith("#x")) return String.fromCodePoint(Number.parseInt(e.slice(2), 16));
    if (e.startsWith("#")) return String.fromCodePoint(Number(e.slice(1)));
    return m;
  });

type Json3 = { events?: { tStartMs?: number; dDurationMs?: number; segs?: { utf8?: string; tOffsetMs?: number }[] }[] };

function depuisJson3(j: Json3): Fragment[] {
  const sortie: Fragment[] = [];
  for (const e of j.events ?? []) {
    const segs = (e.segs ?? []).filter((s) => s.utf8 && s.utf8 !== "\n");
    if (!segs.length) continue;
    const d0 = (e.tStartMs ?? 0) / 1000;
    const f0 = d0 + (e.dDurationMs ?? 0) / 1000;
    const texte = decoder(segs.map((s) => s.utf8).join("").replace(/\s+/g, " ").trim());
    if (!texte || /^\[[^\]]*\]$/.test(texte)) continue;
    if (segs.length > 1 || segs[0].tOffsetMs !== undefined) {
      const mots = segs
        .map((s, k) => ({ t: decoder((s.utf8 ?? "").trim()), d: d0 + (s.tOffsetMs ?? 0) / 1000, f: k + 1 < segs.length ? d0 + (segs[k + 1].tOffsetMs ?? 0) / 1000 : f0 }))
        .filter((m) => m.t);
      sortie.push({ texte, d: d0, f: f0, mots: mots.length === texte.split(" ").length ? mots : undefined });
    } else sortie.push({ texte, d: d0, f: f0 });
  }
  return sortie;
}

function depuisXml(xml: string): Fragment[] {
  const sortie: Fragment[] = [];
  for (const m of xml.matchAll(/<text start="([\d.]+)"(?: dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g)) {
    const d = Number(m[1]);
    const texte = decoder(decoder(m[3]).replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (texte) sortie.push({ texte, d, f: d + Number(m[2] ?? 2) });
  }
  return sortie;
}

export type VideoYoutube = { titre: string; auteur: string; duree: number; langue: string; automatiques: boolean; fragments: Fragment[] };

export async function sousTitres(id: string, langueVoulue: string | null, signal?: AbortSignal): Promise<VideoYoutube> {
  const reponse = await lecteur(id, signal);
  if (!reponse) throw new ErreurGroq("YouTube n'a pas répondu. Télécharge le son de la vidéo et dépose le fichier ici.", 502);
  const statut = reponse.playabilityStatus?.status;
  if (statut && statut !== "OK" && !reponse.captions) {
    throw new ErreurGroq(statut === "LOGIN_REQUIRED" ? "YouTube refuse de répondre à ce serveur pour cette vidéo. Télécharge le son et dépose le fichier ici." : `Vidéo indisponible${reponse.playabilityStatus?.reason ? ` : ${reponse.playabilityStatus.reason}` : "."}`, 422);
  }
  const pistes = reponse.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  if (!pistes.length) throw new ErreurGroq("Cette vidéo n'a pas de sous-titres. Télécharge son audio et dépose le fichier ici : Whisper le transcrira.", 422);
  const piste = choisir(pistes, langueVoulue);
  if (!piste) throw new ErreurGroq("Cette vidéo n'a pas de sous-titres dans la langue choisie. Choisis « Détecter », ou dépose le fichier audio.", 422);

  const adresse = piste.baseUrl.replace(/&fmt=[^&]*/, "");
  let fragments: Fragment[] = [];
  try {
    const r = await fetch(`${adresse}&fmt=json3`, { headers: { "User-Agent": CLIENTS[1].agent }, signal });
    const texte = await r.text();
    if (texte.trim()) fragments = depuisJson3(JSON.parse(texte) as Json3);
  } catch (e) {
    if (signal?.aborted) throw e;
  }
  if (!fragments.length) {
    try {
      const r = await fetch(adresse, { headers: { "User-Agent": CLIENTS[1].agent }, signal });
      fragments = depuisXml(await r.text());
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }
  if (!fragments.length) throw new ErreurGroq("YouTube a refusé de livrer les sous-titres à ce serveur. Télécharge le son de la vidéo et dépose le fichier ici.", 502);

  return {
    titre: reponse.videoDetails?.title ?? "Vidéo YouTube",
    auteur: reponse.videoDetails?.author ?? "",
    duree: Number(reponse.videoDetails?.lengthSeconds ?? 0) || fragments[fragments.length - 1].f,
    langue: piste.languageCode.split("-")[0],
    automatiques: piste.kind === "asr",
    fragments,
  };
}

/** Titre et auteur seuls (aperçu du lien), par le service public oEmbed. */
export async function apercu(id: string, signal?: AbortSignal): Promise<{ titre: string; auteur: string } | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, { signal });
    if (!r.ok) return null;
    const j = (await r.json()) as { title?: string; author_name?: string };
    return { titre: j.title ?? "Vidéo YouTube", auteur: j.author_name ?? "" };
  } catch {
    return null;
  }
}
