"use client";

/*
 * Outils PDF, dans le navigateur : pages → images, images → PDF, fusion, découpe, vignettes.
 */
import { PDFDict, PDFDocument, PDFName, PDFStream } from "@cantoo/pdf-lib";
import { chargerPdfjs } from "@/lib/client/pdf";
import { MotDePasseFaux, PdfProtege } from "../erreurs";
import { encoder, pourPdf } from "./images";

export const OPTIONS_PDFJS = { cMapUrl: "/vendor/pdfjs/cmaps/", cMapPacked: true, standardFontDataUrl: "/vendor/pdfjs/standard_fonts/", wasmUrl: "/vendor/pdfjs/wasm/", iccUrl: "/vendor/pdfjs/iccs/", enableXfa: false };

/** Ouvre un PDF pour l'afficher (pdf.js). `motDePasse` : pour un PDF protégé dont on connaît le mot de passe. */
export async function ouvrir(octets: Uint8Array, motDePasse?: string) {
  const pdfjs = await chargerPdfjs();
  const tache = pdfjs.getDocument({ data: octets.slice(), ...OPTIONS_PDFJS, ...(motDePasse !== undefined ? { password: motDePasse } : {}) });
  try {
    const doc = await tache.promise;
    return { doc, fermer: () => tache.destroy() };
  } catch (e) {
    await tache.destroy();
    if ((e as { name?: string }).name === "PasswordException") throw motDePasse ? new MotDePasseFaux() : new PdfProtege();
    throw new Error("Ce PDF est illisible : il est peut-être abîmé.");
  }
}

/**
 * Retire du document déchiffré ce qui ne servait qu'au chiffrement (dictionnaire de chiffrement,
 * anciennes tables de renvoi) : le fichier enregistré ensuite s'ouvre sans mot de passe.
 */
function retirerChiffrement(doc: PDFDocument) {
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    const dict = obj instanceof PDFDict ? obj : obj instanceof PDFStream ? obj.dict : null;
    if (!dict) continue;
    if (dict.get(PDFName.of("Type")) === PDFName.of("XRef") || dict.get(PDFName.of("Filter")) === PDFName.of("Standard") || dict.has(PDFName.of("Encrypt"))) doc.context.delete(ref);
  }
  doc.context.trailerInfo.Encrypt = undefined;
}

/**
 * Charge un PDF pour le modifier. Un PDF qui s'ouvre sans mot de passe mais porte des restrictions
 * (impression, copie) est ouvert tel quel ; un PDF qui demande un mot de passe lève PdfProtege
 * (ou MotDePasseFaux si celui donné ne l'ouvre pas).
 */
export async function charger(octets: Uint8Array, motDePasse?: string): Promise<PDFDocument> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(octets, { updateMetadata: false, ignoreEncryption: true });
  } catch {
    throw new Error("Ce PDF est illisible : il est peut-être abîmé.");
  }
  if (!doc.isEncrypted) return doc;
  // Mot de passe vide d'abord : beaucoup de PDF (relevés, documents officiels) ne sont que « restreints ».
  for (const essai of motDePasse !== undefined ? [motDePasse, ""] : [""]) {
    try {
      const clair = await PDFDocument.load(octets, { updateMetadata: false, password: essai });
      retirerChiffrement(clair);
      return clair;
    } catch {
      // essai suivant
    }
  }
  throw motDePasse ? new MotDePasseFaux() : new PdfProtege();
}

/** Le PDF demande-t-il un mot de passe pour s'ouvrir ? (Les PDF seulement « restreints » répondent non.) */
export async function demandeMotDePasse(octets: Uint8Array): Promise<boolean> {
  try {
    await charger(octets);
    return false;
  } catch (e) {
    if (e instanceof PdfProtege) return true;
    throw e;
  }
}

/** Les octets d'un PDF sans aucune protection (ni mot de passe, ni restriction), métadonnées gardées. */
export async function dechiffrer(octets: Uint8Array, motDePasse: string): Promise<Uint8Array> {
  const doc = await charger(octets, motDePasse);
  return doc.save();
}

/** Rend une page en image. `echelle` 2 ≈ 144 points par pouce : net à l'écran et à l'impression courante. */
export async function pageEnImage(doc: Awaited<ReturnType<typeof ouvrir>>["doc"], numero: number, format: string, echelle = 2): Promise<Blob> {
  const page = await doc.getPage(numero);
  const vue = page.getViewport({ scale: echelle });
  const toile = document.createElement("canvas");
  toile.width = Math.ceil(vue.width);
  toile.height = Math.ceil(vue.height);
  const ctx = toile.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, toile.width, toile.height);
  await page.render({ canvasContext: ctx, viewport: vue, canvas: toile }).promise;
  page.cleanup();
  const pixels = { largeur: toile.width, hauteur: toile.height, donnees: ctx.getImageData(0, 0, toile.width, toile.height).data };
  toile.width = 0;
  return encoder(pixels, format, 0.92);
}

/** Vignette d'une page, pour la découpe. */
export async function vignettePage(doc: Awaited<ReturnType<typeof ouvrir>>["doc"], numero: number, largeur = 140): Promise<string> {
  const page = await doc.getPage(numero);
  const base = page.getViewport({ scale: 1 });
  const vue = page.getViewport({ scale: largeur / base.width });
  const toile = document.createElement("canvas");
  toile.width = Math.ceil(vue.width);
  toile.height = Math.ceil(vue.height);
  const ctx = toile.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, toile.width, toile.height);
  await page.render({ canvasContext: ctx, viewport: vue, canvas: toile }).promise;
  page.cleanup();
  const blob = await new Promise<Blob>((ok) => toile.toBlob((b) => ok(b!), "image/png"));
  return URL.createObjectURL(blob);
}

/** Une image devient une page de PDF à sa taille (72 points par pouce, ramenée à l'A4 si elle est plus grande). */
export async function imageEnPage(pdf: PDFDocument, blob: Blob, format: string) {
  const img = await pourPdf(blob, format);
  const incrustee = img.type === "jpg" ? await pdf.embedJpg(img.octets) : await pdf.embedPng(img.octets);
  const max = { l: 595.28, h: 841.89 };
  const paysage = img.largeur > img.hauteur;
  const cadre = paysage ? { l: max.h, h: max.l } : max;
  const echelle = Math.min(1, cadre.l / img.largeur, cadre.h / img.hauteur);
  const l = img.largeur * echelle;
  const h = img.hauteur * echelle;
  const page = pdf.addPage([l, h]);
  page.drawImage(incrustee, { x: 0, y: 0, width: l, height: h });
}

/** « 1-3, 5, 8-10 » → [1,2,3,5,8,9,10] (pages existantes, sans doublon, dans l'ordre donné). */
export function lirePlages(texte: string, total: number): number[] {
  const sortie: number[] = [];
  for (const morceau of texte.split(/[,;]/)) {
    const m = /^\s*(\d+)\s*(?:[-–à]\s*(\d+|fin)?)?\s*$/i.exec(morceau);
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] === undefined ? (morceau.includes("-") || morceau.includes("–") ? total : a) : m[2].toLowerCase() === "fin" ? total : Number(m[2]);
    const [debut, fin] = a <= b ? [a, b] : [b, a];
    for (let p = Math.max(1, debut); p <= Math.min(total, fin); p++) if (!sortie.includes(p)) sortie.push(p);
  }
  return sortie;
}

/** Garde certaines pages (numérotées à partir de 1), dans l'ordre donné. */
export async function extraire(octets: Uint8Array, pages: number[]): Promise<Uint8Array> {
  const source = await charger(octets);
  const sortie = await PDFDocument.create();
  const copiees = await sortie.copyPages(source, pages.map((p) => p - 1));
  copiees.forEach((p) => sortie.addPage(p));
  sortie.setProducer("HaqqReason — L'Alambic");
  return sortie.save();
}

export async function nombreDePages(octets: Uint8Array): Promise<number> {
  return (await charger(octets)).getPageCount();
}

/** Assemble des PDF (déjà convertis) en un seul. */
export async function assembler(pdfs: Uint8Array[], avancer: (f: number) => void): Promise<Uint8Array> {
  const sortie = await PDFDocument.create();
  sortie.setProducer("HaqqReason — L'Alambic");
  for (let i = 0; i < pdfs.length; i++) {
    const source = await charger(pdfs[i]);
    const pages = await sortie.copyPages(source, source.getPageIndices());
    pages.forEach((p) => sortie.addPage(p));
    avancer((i + 1) / pdfs.length);
  }
  return sortie.save();
}
