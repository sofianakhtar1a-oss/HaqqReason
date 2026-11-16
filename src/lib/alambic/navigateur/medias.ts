"use client";

/*
 * Son et vidéo, dans le navigateur, avec Mediabunny (WebCodecs).
 * Le fichier est lu par morceaux, jamais chargé en entier : de gros fichiers passent.
 * Quand le format de destination accepte les pistes d'origine, elles sont recopiées sans
 * réencodage (sans perte, très vite) ; sinon elles sont réencodées par la puce du téléphone ou de l'ordinateur.
 */
import type { Capacites } from "../graphe";
import type { Pixels } from "./images";

let enregistres = false;

async function bibliotheque() {
  const m = await import("mediabunny");
  if (!enregistres) {
    enregistres = true;
    // MP3 et FLAC : encodeurs fournis quand le navigateur n'en a pas (il n'en a presque jamais).
    if (!(await m.canEncodeAudio("mp3"))) (await import("@mediabunny/mp3-encoder")).registerMp3Encoder();
    if (!(await m.canEncodeAudio("flac"))) (await import("@mediabunny/flac-encoder")).registerFlacEncoder();
  }
  return m;
}

export async function capacites(): Promise<Capacites> {
  try {
    const m = await import("mediabunny");
    const [aac, opus, h264, vp9] = await Promise.all([m.canEncodeAudio("aac"), m.canEncodeAudio("opus"), m.canEncodeVideo("avc"), m.canEncodeVideo("vp9")]);
    return { aac, opus, h264, vp9 };
  } catch {
    return { aac: false, opus: false, h264: false, vp9: false };
  }
}

export type OptionsMedia = {
  /**
   * null : automatique. Les pistes que le format d'arrivée accepte sont recopiées telles quelles
   * (sans perte, très vite) ; les autres sont réencodées en bonne qualité.
   * 0 à 1 : réencodage imposé, de léger à maximal.
   */
  qualite: number | null;
  extrait?: { debut: number; fin: number };
  signal?: AbortSignal;
};

const TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  m4a: "audio/mp4",
};

const AUDIO = new Set(["mp3", "wav", "ogg", "flac", "aac", "m4a"]);

/** Durée d'un son ou d'une vidéo, en secondes. */
export async function duree(blob: Blob): Promise<number> {
  const m = await import("mediabunny");
  const entree = new m.Input({ source: new m.BlobSource(blob), formats: m.ALL_FORMATS });
  try {
    return await entree.computeDuration();
  } finally {
    entree.dispose?.();
  }
}

export async function convertirMedia(blob: Blob, cible: string, o: OptionsMedia, avancer: (f: number) => void): Promise<{ blob: Blob; avertissements: string[] }> {
  const m = await bibliotheque();
  const entree = new m.Input({ source: new m.BlobSource(blob), formats: m.ALL_FORMATS });
  const formatSortie = {
    mp4: () => new m.Mp4OutputFormat({ fastStart: "in-memory" }),
    m4a: () => new m.Mp4OutputFormat({ fastStart: "in-memory" }),
    mov: () => new m.MovOutputFormat({ fastStart: "in-memory" }),
    webm: () => new m.WebMOutputFormat(),
    mkv: () => new m.MkvOutputFormat(),
    mp3: () => new m.Mp3OutputFormat(),
    wav: () => new m.WavOutputFormat(),
    ogg: () => new m.OggOutputFormat(),
    flac: () => new m.FlacOutputFormat(),
    aac: () => new m.AdtsOutputFormat(),
  }[cible];
  if (!formatSortie) throw new Error("Ce format n'est ni un son ni une vidéo.");
  const sortie = new m.Output({ format: formatSortie(), target: new m.BufferTarget() });
  const q = o.qualite;
  const qualite = q === null ? undefined : q >= 0.85 ? m.QUALITY_VERY_HIGH : q >= 0.6 ? m.QUALITY_HIGH : q >= 0.35 ? m.QUALITY_MEDIUM : m.QUALITY_LOW;

  const conversion = await m.Conversion.init({
    input: entree,
    output: sortie,
    video: AUDIO.has(cible) ? { discard: true } : qualite ? { bitrate: qualite } : {},
    audio: qualite ? { bitrate: qualite } : {},
    trim: o.extrait ? { start: o.extrait.debut, end: o.extrait.fin } : undefined,
  });

  const avertissements: string[] = [];
  const ecartees = conversion.discardedTracks.filter((d) => d.reason !== "discarded_by_user");
  if (!conversion.isValid) {
    const raisons = conversion.discardedTracks.map((d) => d.reason);
    if (raisons.includes("undecodable_source_codec") || raisons.includes("unknown_source_codec"))
      throw new Error("Ton navigateur ne sait pas lire le codec de ce fichier. Essaie avec Chrome ou Edge, ou convertis-le sur ordinateur avec VLC.");
    if (raisons.includes("no_encodable_target_codec")) throw new Error("Ton navigateur ne sait pas produire ce format. Choisis-en un autre (MP4 ou WebM pour une vidéo, MP3 pour un son).");
    throw new Error(AUDIO.has(cible) ? "Ce fichier ne contient pas de son à extraire." : "Ce fichier ne contient ni image ni son exploitable.");
  }
  if (ecartees.length) {
    const sous = ecartees.filter((d) => d.track.type === "subtitle").length;
    const autres = ecartees.length - sous;
    if (sous) avertissements.push(`${sous} piste${sous > 1 ? "s" : ""} de sous-titres n'${sous > 1 ? "ont" : "a"} pas de place dans ce format et ${sous > 1 ? "sont écartées" : "est écartée"}.`);
    if (autres) avertissements.push(`${autres} piste${autres > 1 ? "s" : ""} supplémentaire${autres > 1 ? "s" : ""} (autre langue, autre angle) n'${autres > 1 ? "ont" : "a"} pas été gardée${autres > 1 ? "s" : ""} : ce format n'en accepte qu'une.`);
  }

  conversion.onProgress = (f) => avancer(f);
  const annuler = () => void conversion.cancel();
  o.signal?.addEventListener("abort", annuler, { once: true });
  try {
    await conversion.execute();
  } finally {
    o.signal?.removeEventListener("abort", annuler);
  }
  if (o.signal?.aborted) throw new DOMException("Annulé", "AbortError");
  const tampon = (sortie.target as InstanceType<typeof m.BufferTarget>).buffer;
  if (!tampon) throw new Error("La conversion n'a rien produit.");
  return { blob: new Blob([tampon], { type: TYPES[cible] }), avertissements };
}

/** Une vidéo devient un GIF animé : 10 images par seconde, 480 px de large, 15 secondes au plus. */
export async function videoVersGif(blob: Blob, o: OptionsMedia, avancer: (f: number) => void): Promise<{ blob: Blob; avertissements: string[] }> {
  const m = await import("mediabunny");
  const entree = new m.Input({ source: new m.BlobSource(blob), formats: m.ALL_FORMATS });
  const piste = await entree.getPrimaryVideoTrack();
  if (!piste) throw new Error("Ce fichier ne contient pas d'images.");
  if (!(await piste.canDecode())) throw new Error("Ton navigateur ne sait pas lire les images de cette vidéo. Essaie avec Chrome ou Edge.");
  const total = await entree.computeDuration();
  const debut = o.extrait?.debut ?? 0;
  const finVoulue = o.extrait?.fin ?? total;
  const fin = Math.min(finVoulue, debut + 15, total);
  const avertissements: string[] = [];
  if (finVoulue - debut > 15) avertissements.push("Le GIF est limité aux 15 premières secondes : au-delà, il pèserait des dizaines de mégaoctets. Choisis un extrait dans « Découper » pour un autre passage.");

  const largeur = Math.min(480, piste.displayWidth);
  const hauteur = Math.round((piste.displayHeight / piste.displayWidth) * largeur / 2) * 2;
  const puits = new m.CanvasSink(piste, { width: largeur, height: hauteur, fit: "contain", poolSize: 1 });
  // Instants comptés en entiers : additionner 0,1 de proche en proche fait dériver les nombres à virgule.
  const nombre = Math.max(1, Math.round((fin - debut) * 10));
  const instants = Array.from({ length: nombre }, (_, k) => debut + k / 10);
  const images: { pixels: Pixels; delai: number }[] = [];
  let k = 0;
  for await (const c of puits.canvasesAtTimestamps(instants)) {
    if (o.signal?.aborted) throw new DOMException("Annulé", "AbortError");
    k++;
    if (!c) continue;
    const ctx = (c.canvas as OffscreenCanvas).getContext("2d") as OffscreenCanvasRenderingContext2D;
    images.push({ pixels: { largeur, hauteur, donnees: new Uint8ClampedArray(ctx.getImageData(0, 0, largeur, hauteur).data) }, delai: 100 });
    avancer((k / instants.length) * 0.85);
  }
  if (!images.length) throw new Error("Aucune image n'a pu être extraite de cette vidéo.");
  const { gif } = await import("./images");
  const octets = await gif(images);
  avancer(1);
  avertissements.push("Le GIF n'a pas de son : ce format n'en contient jamais.");
  return { blob: new Blob([octets.slice().buffer], { type: "image/gif" }), avertissements };
}
