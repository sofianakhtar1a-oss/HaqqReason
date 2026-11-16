"use client";

/*
 * Préparation du son, dans le navigateur, avec Mediabunny.
 * Un long enregistrement (ou une vidéo) devient des morceaux de 10 minutes, en mono 16 kHz
 * très compressé (Opus, sinon MP3) : environ 2 Mo par morceau, quel que soit le fichier d'origine.
 * Les morceaux se chevauchent d'une seconde et demie pour ne couper aucun mot.
 */

export const LONGUEUR = 600;
const CHEVAUCHEMENT = 1.5;
/** Un fichier déjà léger part tel quel, sans réencodage. */
const POIDS_DIRECT = 3_900_000;
const DIRECTS = /^(audio\/(mpeg|mp3|mp4|x-m4a|m4a|wav|x-wav|wave|ogg|webm|flac|x-flac)|video\/(mp4|webm))$/;

export type MorceauPret = {
  index: number;
  total: number;
  blob: Blob;
  nom: string;
  decalage: number;
  de: number;
  a: number;
};

export type Inspection = { duree: number; video: boolean };

async function bibliotheque() {
  const m = await import("mediabunny");
  return m;
}

export async function inspecter(fichier: Blob): Promise<Inspection> {
  const m = await bibliotheque();
  const entree = new m.Input({ source: new m.BlobSource(fichier), formats: m.ALL_FORMATS });
  try {
    const son = await entree.getPrimaryAudioTrack();
    if (!son) throw new Error("Ce fichier ne contient pas de son à transcrire.");
    if (!(await son.canDecode())) throw new Error("Ton navigateur ne sait pas lire le son de ce fichier. Essaie avec Chrome ou Edge, ou convertis-le d'abord en MP3 dans « Convertir ».");
    const video = Boolean(await entree.getPrimaryVideoTrack());
    return { duree: await entree.computeDuration(), video };
  } catch (e) {
    if (e instanceof Error && /son|navigateur/.test(e.message)) throw e;
    throw new Error("Ce fichier n'est ni un son ni une vidéo lisible.");
  } finally {
    entree.dispose?.();
  }
}

let mp3Pret = false;

/** Produit les morceaux un par un : le suivant se prépare pendant que le précédent est transcrit. */
export async function* morceaux(fichier: File, duree: number, avancer: (f: number) => void, signal?: AbortSignal): AsyncGenerator<MorceauPret> {
  if (fichier.size <= POIDS_DIRECT && duree <= LONGUEUR + 60 && DIRECTS.test(fichier.type)) {
    avancer(1);
    yield { index: 0, total: 1, blob: fichier, nom: fichier.name.replace(/[^\w.-]/g, "_") || "son", decalage: 0, de: 0, a: Number.POSITIVE_INFINITY };
    return;
  }
  const m = await bibliotheque();
  const opus = await m.canEncodeAudio("opus");
  if (!opus && !mp3Pret) {
    if (!(await m.canEncodeAudio("mp3"))) (await import("@mediabunny/mp3-encoder")).registerMp3Encoder();
    mp3Pret = true;
  }
  const total = Math.max(1, Math.ceil(duree / LONGUEUR));
  for (let k = 0; k < total; k++) {
    if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
    const debut = Math.max(0, k * LONGUEUR - CHEVAUCHEMENT);
    const fin = Math.min(duree, (k + 1) * LONGUEUR + CHEVAUCHEMENT);
    const entree = new m.Input({ source: new m.BlobSource(fichier), formats: m.ALL_FORMATS });
    const sortie = new m.Output({ format: opus ? new m.OggOutputFormat() : new m.Mp3OutputFormat(), target: new m.BufferTarget() });
    try {
      const conversion = await m.Conversion.init({
        input: entree,
        output: sortie,
        video: { discard: true },
        audio: { codec: opus ? "opus" : "mp3", numberOfChannels: 1, sampleRate: opus ? 16000 : 16000, bitrate: opus ? 24000 : 32000, forceTranscode: true },
        trim: { start: debut, end: fin },
      });
      if (!conversion.isValid) throw new Error("Le son de ce fichier n'a pas pu être préparé. Convertis-le d'abord en MP3 dans « Convertir ».");
      conversion.onProgress = (f) => avancer((k + f) / total);
      const annuler = () => void conversion.cancel();
      signal?.addEventListener("abort", annuler, { once: true });
      try {
        await conversion.execute();
      } finally {
        signal?.removeEventListener("abort", annuler);
      }
      if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
      const tampon = (sortie.target as InstanceType<typeof m.BufferTarget>).buffer;
      if (!tampon) throw new Error("La préparation du son n'a rien produit.");
      yield {
        index: k,
        total,
        blob: new Blob([tampon], { type: opus ? "audio/ogg" : "audio/mpeg" }),
        nom: `morceau-${k + 1}.${opus ? "ogg" : "mp3"}`,
        decalage: debut,
        de: k === 0 ? Number.NEGATIVE_INFINITY : k * LONGUEUR,
        a: k === total - 1 ? Number.POSITIVE_INFINITY : (k + 1) * LONGUEUR,
      };
    } finally {
      entree.dispose?.();
    }
  }
  avancer(1);
}
