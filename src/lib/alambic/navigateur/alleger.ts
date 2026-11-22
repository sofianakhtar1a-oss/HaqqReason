"use client";

/*
 * Alléger, dans le navigateur : photos, PDF, vidéos, sons, documents bureautiques.
 * Rien n'est envoyé. Un résultat qui ne serait pas plus léger n'est jamais proposé : on garde l'original.
 */
import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, decodePDFRawStream, type PDFDocument } from "@cantoo/pdf-lib";
import { dimensionsCibles, dimensionsVideo, defiltrerPng, REGLAGES_IMAGE, REGLAGES_MEDIA, REGLAGES_PDF, retirerOrphelins, viserPoids, type Niveau } from "../allegement";
import { nomDuFormat } from "../formats";
import type { Capacites } from "../graphe";
import { bureautique } from "../outils";
import type { Resultat } from "./moteur";

export type OptionsAllegement = {
  niveau: Niveau;
  /** Photos : format de sortie. */
  formatImage: "garder" | "jpg" | "webp";
  /** Photos : poids visé en octets (0 = aucun). */
  poidsVise: number;
  /** PDF : chaque page devient une image (le plus léger, mais le texte ne se sélectionne plus). */
  pagesEnImages: boolean;
  signal?: AbortSignal;
};

type Avancer = (fraction: number | null, etape: string) => void;

const annule = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
};
const sansExtension = (nom: string) => nom.replace(/\.[^.]+$/, "");
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/* ---------------------------------------------------------------- toiles */

type Toile = OffscreenCanvas | HTMLCanvasElement;
function toile(l: number, h: number): Toile {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(l, h);
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  return c;
}
function ctx2d(c: Toile) {
  const x = c.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!x) throw new Error("Ton navigateur refuse de dessiner l'image (mémoire insuffisante ?).");
  return x;
}
async function versBlob(c: Toile, type: string, qualite?: number): Promise<Blob> {
  if ("convertToBlob" in c) return c.convertToBlob({ type, quality: qualite });
  return new Promise((ok, ko) => (c as HTMLCanvasElement).toBlob((b) => (b ? ok(b) : ko(new Error("Encodage impossible."))), type, qualite));
}

/** Dessine une image réduite ; `fond` blanc pour le JPEG (qui n'a pas de transparence). */
function redessiner(source: CanvasImageSource, l: number, h: number, fond?: string): Toile {
  const c = toile(l, h);
  const x = ctx2d(c);
  x.imageSmoothingQuality = "high";
  if (fond) {
    x.fillStyle = fond;
    x.fillRect(0, 0, l, h);
  }
  x.drawImage(source, 0, 0, l, h);
  return c;
}

function aDeLaTransparence(c: Toile): boolean {
  const x = ctx2d(c);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  for (let i = 3; i < d.length; i += 4 * 7) if (d[i] < 250) return true;
  return false;
}

/* ---------------------------------------------------------------- photos */

async function allegerImage(fichier: Blob, format: string, nom: string, o: OptionsAllegement, avancer: Avancer): Promise<Resultat> {
  const r = REGLAGES_IMAGE[o.niveau];
  avancer(0.1, "Lecture de la photo");
  let source: CanvasImageSource & { width: number; height: number; close?: () => void };
  if (format === "tiff" || format === "bmp") {
    const { decoder } = await import("./images");
    const p = await decoder(fichier, format);
    const c = toile(p.largeur, p.hauteur);
    ctx2d(c).putImageData(new ImageData(new Uint8ClampedArray(p.donnees), p.largeur, p.hauteur), 0, 0);
    source = c;
  } else {
    try {
      source = await createImageBitmap(fichier);
    } catch {
      throw new Error("Ton navigateur n'arrive pas à lire cette image : elle est peut-être abîmée.");
    }
  }
  const avertissements: string[] = [];
  const d0 = dimensionsCibles(source.width, source.height, r.cote);
  const essai = redessiner(source, d0.largeur, d0.hauteur);
  const transparente = (format === "png" || format === "webp") && aDeLaTransparence(essai);

  // Format d'arrivée : le même, sauf pour les formats sans compression (BMP, TIFF) ; JPEG si demandé.
  let sortie = o.formatImage === "garder" ? (format === "bmp" || format === "tiff" ? "jpg" : format) : o.formatImage;
  if (sortie === "jpg" && transparente) {
    sortie = "png";
    avertissements.push("Cette image a des zones transparentes : elle reste en PNG (le JPEG les rendrait blanches).");
  }
  if (format !== sortie) avertissements.push(`Elle devient un ${nomDuFormat(sortie)}.`);

  const encoder = async (l: number, h: number, qualite: number): Promise<Blob> => {
    annule(o.signal);
    const c = redessiner(source, l, h, sortie === "jpg" ? "#ffffff" : undefined);
    if (sortie === "png") {
      const couleurs = o.niveau === "leger" && !o.poidsVise ? 0 : r.couleurs || 256;
      const donnees = ctx2d(c).getImageData(0, 0, l, h).data;
      const UPNG = (await import("@cantoo/pdf-lib/upng")).default;
      const png = UPNG.encode([donnees.buffer.slice(donnees.byteOffset, donnees.byteOffset + donnees.byteLength) as ArrayBuffer], l, h, qualite >= 0.99 ? 0 : couleurs);
      return new Blob([png], { type: "image/png" });
    }
    const b = await versBlob(c, TYPES[sortie], qualite);
    if (sortie === "webp" && b.type !== "image/webp") throw new Error("Ton navigateur ne sait pas produire de WebP. Choisis JPEG.");
    return b;
  };

  avancer(0.4, "Compression");
  let blob: Blob;
  let dims = d0;
  if (o.poidsVise > 0) {
    let trouve: Blob | null = null;
    for (let tour = 0; tour < 6 && !trouve; tour++) {
      if (sortie === "png") {
        const b = await encoder(dims.largeur, dims.hauteur, 0.5);
        if (b.size <= o.poidsVise) trouve = b;
      } else {
        const v = await viserPoids((q) => encoder(dims.largeur, dims.hauteur, q), o.poidsVise, 0.35, Math.min(0.92, r.qualite + 0.1), 6);
        if (v) trouve = v.resultat;
      }
      if (!trouve) {
        dims = dimensionsCibles(dims.largeur, dims.hauteur, Math.max(dims.largeur, dims.hauteur) * 0.75);
        avancer(0.4 + tour * 0.08, "Réduction des dimensions pour tenir dans le poids visé");
      }
    }
    if (!trouve) throw new Error("Impossible d'atteindre ce poids sans rendre la photo méconnaissable : choisis un poids visé plus grand.");
    blob = trouve;
  } else blob = await encoder(dims.largeur, dims.hauteur, r.qualite);
  source.close?.();

  if (dims.echelle < 1 || dims.largeur !== d0.largeur) avertissements.push(`Elle mesure maintenant ${dims.largeur} × ${dims.hauteur} pixels.`);
  if (format === "jpg" || format === "webp" || format === "tiff") avertissements.push("Les informations cachées (lieu, appareil, date) sont retirées au passage.");
  return { nom: `${sansExtension(nom)} (allégé).${sortie}`, blob, format: sortie, avertissements };
}

/* ---------------------------------------------------------------- PDF */

const NOMS = (n: string) => PDFName.of(n);

/** Composantes de couleur d'une image de PDF qu'on sait recompresser (RVB ou gris), ou null. */
function composantes(doc: PDFDocument, dict: PDFDict): 1 | 3 | null {
  const cs = dict.lookup(NOMS("ColorSpace"));
  if (cs === NOMS("DeviceRGB")) return 3;
  if (cs === NOMS("DeviceGray")) return 1;
  if (cs && "asArray" in cs) {
    const a = (cs as unknown as { asArray(): unknown[] }).asArray();
    if (a[0] === NOMS("ICCBased")) {
      const flux = doc.context.lookup(a[1] as never) as { dict?: PDFDict } | undefined;
      const n = flux?.dict?.lookup(NOMS("N"));
      const v = n instanceof PDFNumber ? n.asNumber() : 0;
      return v === 3 ? 3 : v === 1 ? 1 : null;
    }
  }
  return null;
}

async function imageDepuisPixels(donnees: Uint8Array, l: number, h: number, comp: 1 | 3): Promise<Toile> {
  const rgba = new Uint8ClampedArray(l * h * 4);
  for (let i = 0, j = 0; i < l * h; i++) {
    if (comp === 3) {
      rgba[i * 4] = donnees[j++];
      rgba[i * 4 + 1] = donnees[j++];
      rgba[i * 4 + 2] = donnees[j++];
    } else {
      const g = donnees[j++];
      rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = g;
    }
    rgba[i * 4 + 3] = 255;
  }
  const c = toile(l, h);
  ctx2d(c).putImageData(new ImageData(rgba, l, h), 0, 0);
  return c;
}

/** Recompresse les images d'un PDF (JPEG, et images sans perte en niveau Fort) : le texte et les dessins restent intacts. */
async function recompresserImages(doc: PDFDocument, niveau: Niveau, avancer: Avancer, signal?: AbortSignal): Promise<{ traitees: number; gagne: number }> {
  const r = REGLAGES_PDF[niveau];
  if (!r) return { traitees: 0, gagne: 0 };
  const pages = doc.getPages();
  const plusGrandCote = Math.max(...pages.map((p) => Math.max(p.getWidth(), p.getHeight())), 595);
  const maxPixels = Math.round((plusGrandCote / 72) * r.ppp);
  const images = doc.context.enumerateIndirectObjects().filter(([, o]) => o instanceof PDFRawStream && o.dict.lookup(NOMS("Subtype")) === NOMS("Image")) as [import("@cantoo/pdf-lib").PDFRef, PDFRawStream][];
  let traitees = 0;
  let gagne = 0;
  for (let i = 0; i < images.length; i++) {
    annule(signal);
    const [ref, flux] = images[i];
    avancer(0.1 + (i / Math.max(1, images.length)) * 0.75, `Image ${i + 1} sur ${images.length}`);
    const d = flux.dict;
    if (d.lookup(NOMS("ImageMask")) || d.has(NOMS("Decode")) || d.has(NOMS("Mask"))) continue;
    const comp = composantes(doc, d);
    if (!comp) continue;
    // Les filtres s'enchaînent parfois (ASCII85 puis JPEG, chez ReportLab par exemple) : seul le dernier compte ici.
    const brutFiltre = d.lookup(NOMS("Filter"));
    const filtres = brutFiltre instanceof PDFName ? [brutFiltre] : brutFiltre instanceof PDFArray ? brutFiltre.asArray().filter((x): x is PDFName => x instanceof PDFName) : [];
    const filtre = filtres[filtres.length - 1];
    const l = (d.lookup(NOMS("Width")) as PDFNumber | undefined)?.asNumber() ?? 0;
    const h = (d.lookup(NOMS("Height")) as PDFNumber | undefined)?.asNumber() ?? 0;
    const bits = (d.lookup(NOMS("BitsPerComponent")) as PDFNumber | undefined)?.asNumber() ?? 8;
    if (l < 16 || h < 16 || bits !== 8 || !filtre) continue;
    const contenu = flux.getContents();
    let image: CanvasImageSource & { width: number; height: number; close?: () => void };
    try {
      if (filtre === NOMS("DCTDecode")) {
        let jpeg = contenu;
        if (filtres.length > 1) {
          // On défait les filtres qui enveloppent le JPEG, sans toucher au JPEG lui-même.
          const enveloppe = d.clone(doc.context);
          enveloppe.set(NOMS("Filter"), filtres.length === 2 ? filtres[0] : doc.context.obj(filtres.slice(0, -1)));
          enveloppe.delete(NOMS("DecodeParms"));
          jpeg = decodePDFRawStream(PDFRawStream.of(enveloppe, contenu)).decode();
        }
        image = await createImageBitmap(new Blob([jpeg.slice().buffer], { type: "image/jpeg" }));
      } else if (filtre === NOMS("FlateDecode") && niveau === "fort" && l * h >= 250_000) {
        // Images sans perte (captures, scans en couleur) : seulement en niveau Fort, elles deviennent des JPEG.
        let brut = decodePDFRawStream(flux).decode();
        const brutParms = d.lookup(NOMS("DecodeParms"));
        const parms = brutParms instanceof PDFArray ? brutParms.lookup(brutParms.size() - 1) : brutParms;
        const predicteur = parms instanceof PDFDict ? ((parms.lookup(NOMS("Predictor")) as PDFNumber | undefined)?.asNumber() ?? 1) : 1;
        if (predicteur >= 10) brut = defiltrerPng(brut, l, comp);
        else if (predicteur !== 1) continue;
        if (brut.length < l * h * comp) continue;
        image = await imageDepuisPixels(brut, l, h, comp);
      } else continue;
    } catch {
      continue; // image que le navigateur ne sait pas lire : on la garde telle quelle
    }
    const cible = dimensionsCibles(image.width, image.height, maxPixels);
    const c = redessiner(image, cible.largeur, cible.hauteur, "#ffffff");
    image.close?.();
    const jpeg = new Uint8Array(await (await versBlob(c, "image/jpeg", r.qualite)).arrayBuffer());
    if (jpeg.length >= contenu.length * 0.9) continue;
    const nouveau = d.clone(doc.context);
    nouveau.set(NOMS("Width"), PDFNumber.of(cible.largeur));
    nouveau.set(NOMS("Height"), PDFNumber.of(cible.hauteur));
    nouveau.set(NOMS("Filter"), NOMS("DCTDecode"));
    nouveau.set(NOMS("BitsPerComponent"), PDFNumber.of(8));
    nouveau.delete(NOMS("DecodeParms"));
    // Le navigateur rend toujours du RVB : une image en gris devient RVB.
    if (comp === 1) nouveau.set(NOMS("ColorSpace"), NOMS("DeviceRGB"));
    nouveau.delete(NOMS("Length"));
    doc.context.assign(ref, PDFRawStream.of(nouveau, jpeg));
    traitees++;
    gagne += contenu.length - jpeg.length;
  }
  return { traitees, gagne };
}

/** Retire ce qui n'est jamais utile à l'affichage : vignettes intégrées, données privées des logiciels. */
function nettoyerPdf(doc: PDFDocument, retirerXmp: boolean) {
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    const d = o instanceof PDFDict ? o : o instanceof PDFRawStream ? o.dict : null;
    if (!d) continue;
    d.delete(NOMS("PieceInfo"));
    if (d.lookup(NOMS("Type")) === NOMS("Page")) d.delete(NOMS("Thumb"));
    if (retirerXmp && d.lookup(NOMS("Type")) !== NOMS("Catalog")) d.delete(NOMS("Metadata"));
  }
}

async function pagesEnImages(octets: Uint8Array, niveau: Niveau, titre: string, avancer: Avancer, signal?: AbortSignal): Promise<Uint8Array> {
  const { ouvrir } = await import("./pdf");
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const { doc, fermer } = await ouvrir(octets);
  const sortie = await PDFDocument.create();
  sortie.setTitle(titre);
  const r = REGLAGES_PDF[niveau] ?? { ppp: 110, qualite: 0.6 };
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      annule(signal);
      avancer((n - 1) / doc.numPages, `Page ${n} sur ${doc.numPages}`);
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const vue = page.getViewport({ scale: r.ppp / 72 });
      const c = document.createElement("canvas");
      c.width = Math.ceil(vue.width);
      c.height = Math.ceil(vue.height);
      const x = c.getContext("2d")!;
      x.fillStyle = "#fff";
      x.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: x, viewport: vue, canvas: c }).promise;
      page.cleanup();
      const jpeg = new Uint8Array(await (await versBlob(c, "image/jpeg", r.qualite)).arrayBuffer());
      c.width = 0;
      const img = await sortie.embedJpg(jpeg);
      const p = sortie.addPage([base.width, base.height]);
      p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
    }
  } finally {
    await fermer();
  }
  return sortie.save();
}

async function allegerPdf(fichier: Blob, nom: string, o: OptionsAllegement, avancer: Avancer): Promise<Resultat> {
  const octets = new Uint8Array(await fichier.arrayBuffer());
  const avertissements: string[] = [];
  let sortie: Uint8Array;
  if (o.pagesEnImages && o.niveau === "fort") {
    sortie = await pagesEnImages(octets, o.niveau, sansExtension(nom), avancer, o.signal);
    avertissements.push("Chaque page est devenue une image : le texte ne se sélectionne plus et ne se cherche plus.");
  } else {
    const { charger } = await import("./pdf");
    avancer(0.05, "Lecture du PDF");
    const doc = await charger(octets);
    const { traitees } = await recompresserImages(doc, o.niveau, avancer, o.signal);
    nettoyerPdf(doc, o.niveau !== "leger");
    const orphelins = retirerOrphelins(doc);
    avancer(0.9, "Écriture du PDF");
    sortie = await doc.save({ useObjectStreams: true });
    if (traitees) avertissements.push(`${traitees} image${traitees > 1 ? "s" : ""} recompressée${traitees > 1 ? "s" : ""} ; le texte reste sélectionnable.`);
    else if (o.niveau !== "leger") avertissements.push("Aucune image à recompresser : le PDF a seulement été compacté.");
    if (orphelins > 20) avertissements.push("Les restes d'anciennes versions du document ont été retirés.");
  }
  return { nom: `${sansExtension(nom)} (allégé).pdf`, blob: new Blob([sortie.slice().buffer], { type: "application/pdf" }), format: "pdf", avertissements };
}

/* ---------------------------------------------------------------- vidéos et sons */

const AUDIO_SANS_PERTE = new Set(["wav", "flac"]);

async function allegerMedia(fichier: Blob, format: string, nom: string, video: boolean, o: OptionsAllegement, capacites: Capacites, avancer: Avancer): Promise<Resultat> {
  const m = await import("mediabunny");
  if (!(await m.canEncodeAudio("mp3"))) (await import("@mediabunny/mp3-encoder")).registerMp3Encoder();
  const r = REGLAGES_MEDIA[o.niveau];
  const avertissements: string[] = [];
  let cible = format;
  if (video) {
    if (format === "mov") cible = "mp4";
    if ((cible === "mp4" && !capacites.h264) || (cible === "webm" && !capacites.vp9 && !capacites.h264) || (cible === "mkv" && !capacites.vp9 && !capacites.h264)) cible = capacites.vp9 ? "webm" : "mp4";
    if (!capacites.h264 && !capacites.vp9) throw new Error("Ton navigateur ne sait pas encoder de vidéo. Essaie avec Chrome, Edge ou Safari.");
    if (cible !== format) avertissements.push(`Elle devient un ${nomDuFormat(cible)}, que ton navigateur sait produire.`);
  } else if (AUDIO_SANS_PERTE.has(format)) {
    cible = "mp3";
    avertissements.push(`Un ${nomDuFormat(format)} n'est pas compressé : il devient un MP3, bien plus léger.`);
  } else if ((format === "m4a" || format === "aac") && !capacites.aac) {
    cible = "mp3";
    avertissements.push("Ton navigateur ne sait pas produire d'AAC : le son devient un MP3.");
  } else if (format === "ogg" && !capacites.opus) {
    cible = "mp3";
  }

  const entree = new m.Input({ source: new m.BlobSource(fichier), formats: m.ALL_FORMATS });
  const formats: Record<string, () => InstanceType<typeof m.Mp4OutputFormat> | InstanceType<typeof m.WebMOutputFormat> | InstanceType<typeof m.MkvOutputFormat> | InstanceType<typeof m.Mp3OutputFormat> | InstanceType<typeof m.OggOutputFormat> | InstanceType<typeof m.AdtsOutputFormat>> = {
    mp4: () => new m.Mp4OutputFormat({ fastStart: "in-memory" }),
    m4a: () => new m.Mp4OutputFormat({ fastStart: "in-memory" }),
    webm: () => new m.WebMOutputFormat(),
    mkv: () => new m.MkvOutputFormat(),
    mp3: () => new m.Mp3OutputFormat(),
    ogg: () => new m.OggOutputFormat(),
    aac: () => new m.AdtsOutputFormat(),
  };
  if (!formats[cible]) throw new Error(`Ce format (${nomDuFormat(format)}) ne s'allège pas ici.`);
  const sortie = new m.Output({ format: formats[cible](), target: new m.BufferTarget() });

  let tailleVideo: { largeur: number; hauteur: number } | null = null;
  if (video) {
    const piste = await entree.getPrimaryVideoTrack();
    if (!piste) throw new Error("Ce fichier ne contient pas d'images.");
    tailleVideo = dimensionsVideo(piste.displayWidth, piste.displayHeight, r.petitCote);
  }
  const qualite = o.niveau === "leger" ? m.QUALITY_HIGH : o.niveau === "equilibre" ? m.QUALITY_MEDIUM : m.QUALITY_LOW;
  const conversion = await m.Conversion.init({
    input: entree,
    output: sortie,
    video: video ? { ...(tailleVideo ? { width: tailleVideo.largeur, height: tailleVideo.hauteur, fit: "contain" as const } : {}), bitrate: qualite, forceTranscode: true } : { discard: true },
    audio: { bitrate: r.debitSon, forceTranscode: true, ...(r.mono && !video ? { numberOfChannels: 1 } : {}) },
  });
  if (!conversion.isValid) {
    const raisons = conversion.discardedTracks.map((d) => d.reason);
    if (raisons.includes("undecodable_source_codec") || raisons.includes("unknown_source_codec")) throw new Error("Ton navigateur ne sait pas lire le codec de ce fichier. Essaie avec Chrome ou Edge.");
    throw new Error("Ton navigateur ne sait pas produire ce format : essaie avec Chrome, Edge ou Safari.");
  }
  conversion.onProgress = (f) => avancer(f * 0.98, video ? "Réencodage de la vidéo" : "Réencodage du son");
  const arreter = () => void conversion.cancel();
  o.signal?.addEventListener("abort", arreter, { once: true });
  try {
    await conversion.execute();
  } finally {
    o.signal?.removeEventListener("abort", arreter);
  }
  annule(o.signal);
  const tampon = (sortie.target as InstanceType<typeof m.BufferTarget>).buffer;
  if (!tampon) throw new Error("La compression n'a rien produit.");
  if (tailleVideo) avertissements.push(`Elle passe en ${Math.min(tailleVideo.largeur, tailleVideo.hauteur)}p (${tailleVideo.largeur} × ${tailleVideo.hauteur}).`);
  const types: Record<string, string> = { mp4: "video/mp4", webm: "video/webm", mkv: "video/x-matroska", mp3: "audio/mpeg", m4a: "audio/mp4", ogg: "audio/ogg", aac: "audio/aac" };
  return { nom: `${sansExtension(nom)} (allégé).${cible}`, blob: new Blob([tampon], { type: types[cible] }), format: cible, avertissements };
}

/* ---------------------------------------------------------------- documents bureautiques */

const MEDIAS_BUREAU = /\.(jpe?g|png)$/i;

async function allegerBureautique(fichier: Blob, format: string, nom: string, o: OptionsAllegement, avancer: Avancer): Promise<Resultat> {
  const { unzipSync, zipSync } = await import("fflate");
  const r = REGLAGES_IMAGE[o.niveau];
  avancer(0.05, "Ouverture du document");
  let entrees: Record<string, Uint8Array>;
  try {
    entrees = unzipSync(new Uint8Array(await fichier.arrayBuffer()));
  } catch {
    throw new Error("Ce document ne s'ouvre pas : il est peut-être protégé par un mot de passe, ou abîmé.");
  }
  const noms = Object.keys(entrees);
  const medias = noms.filter((n) => MEDIAS_BUREAU.test(n) && entrees[n].length > 40_000);
  let traitees = 0;
  for (let i = 0; i < medias.length; i++) {
    annule(o.signal);
    const n = medias[i];
    avancer(0.1 + (i / Math.max(1, medias.length)) * 0.8, `Image ${i + 1} sur ${medias.length}`);
    const jpeg = /\.jpe?g$/i.test(n);
    try {
      const bitmap = await createImageBitmap(new Blob([entrees[n].slice().buffer], { type: jpeg ? "image/jpeg" : "image/png" }));
      const dims = dimensionsCibles(bitmap.width, bitmap.height, r.cote);
      const c = redessiner(bitmap, dims.largeur, dims.hauteur, jpeg ? "#ffffff" : undefined);
      bitmap.close();
      let nouveau: Uint8Array;
      if (jpeg) nouveau = new Uint8Array(await (await versBlob(c, "image/jpeg", r.qualite)).arrayBuffer());
      else {
        const UPNG = (await import("@cantoo/pdf-lib/upng")).default;
        const donnees = ctx2d(c).getImageData(0, 0, dims.largeur, dims.hauteur).data;
        nouveau = new Uint8Array(UPNG.encode([donnees.buffer.slice(donnees.byteOffset, donnees.byteOffset + donnees.byteLength) as ArrayBuffer], dims.largeur, dims.hauteur, o.niveau === "leger" ? 0 : r.couleurs));
      }
      if (nouveau.length < entrees[n].length * 0.9) {
        entrees[n] = nouveau;
        traitees++;
      }
    } catch {
      // image illisible ou format inattendu : gardée telle quelle
    }
  }
  avancer(0.92, "Recompression du document");
  // OpenDocument et EPUB : « mimetype » d'abord, sans compression (exigé par la norme).
  const ordre = noms.includes("mimetype") ? ["mimetype", ...noms.filter((n) => n !== "mimetype")] : noms;
  const zip = zipSync(Object.fromEntries(ordre.map((n) => [n, [entrees[n], { level: n === "mimetype" || /\.(jpe?g|png|gif|mp4|mp3|m4a|wav)$/i.test(n) ? 0 : 9 }]])) as never);
  const avertissements = traitees ? [`${traitees} image${traitees > 1 ? "s" : ""} allégée${traitees > 1 ? "s" : ""} ; la mise en page ne change pas.`] : ["Aucune image lourde dans ce document : il a seulement été recompressé."];
  const types: Record<string, string> = {
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
    epub: "application/epub+zip",
  };
  const ext = nom.match(/\.([^.]+)$/)?.[1] ?? format;
  return { nom: `${sansExtension(nom)} (allégé).${ext}`, blob: new Blob([zip.slice().buffer], { type: types[format] ?? "application/zip" }), format, avertissements };
}

/* ---------------------------------------------------------------- aiguillage */

const IMAGES = new Set(["jpg", "png", "webp", "bmp", "tiff"]);
const VIDEOS = new Set(["mp4", "webm", "mov", "mkv"]);
const SONS = new Set(["mp3", "wav", "ogg", "flac", "aac", "m4a"]);

/** La famille d'allègement d'un fichier, ou null s'il ne s'allège pas ici. */
export function genreAllegement(format: string, nom: string): "image" | "pdf" | "video" | "son" | "bureau" | null {
  if (IMAGES.has(format)) return "image";
  if (format === "pdf") return "pdf";
  if (VIDEOS.has(format)) return "video";
  if (SONS.has(format)) return "son";
  if (bureautique(format, nom)) return "bureau";
  return null;
}

export async function alleger(fichier: File, format: string, o: OptionsAllegement, capacites: Capacites, avancer: Avancer): Promise<Resultat> {
  const genre = genreAllegement(format, fichier.name);
  let r: Resultat;
  switch (genre) {
    case "image":
      r = await allegerImage(fichier, format, fichier.name, o, avancer);
      break;
    case "pdf":
      r = await allegerPdf(fichier, fichier.name, o, avancer);
      break;
    case "video":
    case "son":
      r = await allegerMedia(fichier, format, fichier.name, genre === "video", o, capacites, avancer);
      break;
    case "bureau":
      r = await allegerBureautique(fichier, bureautique(format, fichier.name)!, fichier.name, o, avancer);
      break;
    default:
      throw new Error("Ce type de fichier ne s'allège pas ici.");
  }
  // Jamais plus lourd : si rien n'est gagné (et le format n'a pas changé), l'original est rendu tel quel.
  const formatGarde = r.format === format || (genre === "bureau" && r.format === bureautique(format, fichier.name));
  if (r.blob.size >= fichier.size * 0.98 && formatGarde && !(genre === "image" && o.poidsVise > 0 && fichier.size > o.poidsVise)) {
    return { nom: fichier.name, blob: fichier, format, avertissements: ["Ce fichier était déjà bien compressé : il est rendu tel quel, rien n'y gagnerait."] };
  }
  return r;
}
