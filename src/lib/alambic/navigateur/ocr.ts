"use client";

/*
 * Reconnaître le texte (OCR) d'une photo, d'un scan ou d'un PDF scanné, dans le navigateur, avec Tesseract
 * (servi par le site : français, anglais, arabe). Rien n'est envoyé.
 * Donne le texte en paragraphes, et sait rendre un PDF « cherchable » : le texte reconnu y est posé,
 * invisible, à la place des lignes lues, sans toucher à l'image.
 */
import { degrees, popGraphicsState, pushGraphicsState, setTextRenderingMode, StandardFonts, TextRenderingMode, type PDFFont, type PDFPage } from "@cantoo/pdf-lib";
import { versRepereePdf } from "../filigrane";
import type { Noeud } from "../pm";

export type LangueOcr = "fra" | "eng" | "ara";
/** Une ligne de texte reconnue et sa place dans l'image (pixels). */
export type Ligne = { t: string; x0: number; y0: number; x1: number; y1: number };
/** Une page lue : dimensions de l'image analysée (pixels), paragraphes, lignes placées. `deja` : le PDF avait déjà du texte. */
export type PageLue = { largeur: number; hauteur: number; paragraphes: string[]; lignes: Ligne[]; deja?: boolean; confiance?: number };

type Avancer = (fraction: number | null, etape: string) => void;
type Ouvrier = Awaited<ReturnType<typeof import("tesseract.js").createWorker>>;

const annule = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
};

/** L'OCR travaille mieux autour de 200 points par pouce. */
const ECHELLE_PDF = 200 / 72;
const SEUIL_TEXTE = 40;

async function ouvrier(langues: LangueOcr[], suivre: (p: number) => void): Promise<Ouvrier> {
  const { createWorker, OEM } = await import("tesseract.js");
  return createWorker(langues.length ? langues : ["fra"], OEM.LSTM_ONLY, {
    workerPath: "/vendor/tesseract/worker.min.js",
    corePath: "/vendor/tesseract/core/",
    langPath: "/vendor/tesseract/lang",
    workerBlobURL: false,
    gzip: true,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") suivre(m.progress);
    },
  });
}

type Boite = { x0: number; y0: number; x1: number; y1: number };
type ResultatTesseract = { blocks: { paragraphs: { lines: { text: string; words: { text: string; confidence: number; bbox: Boite }[] }[] }[] }[] | null; confidence: number };

/** Paragraphes et lignes d'un résultat de Tesseract ; les mots coupés en fin de ligne sont recollés. */
function analyser(data: ResultatTesseract): Omit<PageLue, "largeur" | "hauteur"> {
  const paragraphes: string[] = [];
  const lignes: Ligne[] = [];
  for (const b of data.blocks ?? [])
    for (const p of b.paragraphs) {
      let texte = "";
      for (const l of p.lines) {
        const ligne = l.text.replace(/\s+/g, " ").trim();
        if (!ligne) continue;
        texte = !texte ? ligne : /[\p{L}]-$/u.test(texte) ? texte.slice(0, -1) + ligne : `${texte} ${ligne}`;
        const mots = l.words.filter((w) => w.text.trim() && w.confidence >= 20);
        if (mots.length)
          lignes.push({
            t: mots.map((w) => w.text.trim()).join(" "),
            x0: Math.min(...mots.map((w) => w.bbox.x0)),
            y0: Math.min(...mots.map((w) => w.bbox.y0)),
            x1: Math.max(...mots.map((w) => w.bbox.x1)),
            y1: Math.max(...mots.map((w) => w.bbox.y1)),
          });
      }
      if (texte) paragraphes.push(texte);
    }
  return { paragraphes, lignes, confiance: data.confidence };
}

async function lireToile(o: Ouvrier, toile: HTMLCanvasElement): Promise<Omit<PageLue, "largeur" | "hauteur">> {
  const { data } = await o.recognize(toile, {}, { blocks: true, text: true });
  return analyser(data as unknown as ResultatTesseract);
}

/** Lit des images (photos, scans), une page par image. */
export async function lireImages(fichiers: { fichier: Blob; format: string }[], langues: LangueOcr[], avancer: Avancer, signal?: AbortSignal): Promise<PageLue[]> {
  let courant = 0;
  avancer(0, "Chargement de la reconnaissance (la première fois : quelques secondes)");
  const o = await ouvrier(langues, (p) => avancer((courant + p) / fichiers.length, `Lecture de l'image ${courant + 1} sur ${fichiers.length}`));
  const { decoder } = await import("./images");
  const pages: PageLue[] = [];
  try {
    for (; courant < fichiers.length; courant++) {
      annule(signal);
      const p = await decoder(fichiers[courant].fichier, fichiers[courant].format);
      const c = document.createElement("canvas");
      c.width = p.largeur;
      c.height = p.hauteur;
      c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(p.donnees), p.largeur, p.hauteur), 0, 0);
      pages.push({ largeur: p.largeur, hauteur: p.hauteur, ...(await lireToile(o, c)) });
      c.width = 0;
    }
  } finally {
    await o.terminate();
  }
  return pages;
}

/** Lit un PDF : les pages qui ont déjà du texte le gardent (sauf si `forcer`), les pages scannées passent à l'OCR. */
export async function lirePdf(octets: Uint8Array, langues: LangueOcr[], avancer: Avancer, signal?: AbortSignal, forcer = false): Promise<PageLue[]> {
  const { ouvrir } = await import("./pdf");
  const { doc, fermer } = await ouvrir(octets);
  const pages: PageLue[] = [];
  let o: Ouvrier | null = null;
  let courant = 0;
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      annule(signal);
      courant = n - 1;
      const page = await doc.getPage(n);
      if (!forcer) {
        const contenu = await page.getTextContent();
        const texte = contenu.items.map((i) => ("str" in i ? i.str + (i.hasEOL ? "\n" : "") : "")).join("");
        if (texte.replace(/\s/g, "").length >= SEUIL_TEXTE) {
          const vue = page.getViewport({ scale: 1 });
          pages.push({ largeur: vue.width, hauteur: vue.height, paragraphes: texte.split(/\n\s*\n|\n(?=\s*[A-ZÉÈÀÂÎÔ0-9•–-])/).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean), lignes: [], deja: true });
          page.cleanup();
          avancer(n / doc.numPages, `Page ${n} sur ${doc.numPages} : texte déjà présent`);
          continue;
        }
      }
      if (!o) {
        avancer((n - 1) / doc.numPages, "Chargement de la reconnaissance (la première fois : quelques secondes)");
        o = await ouvrier(langues, (p) => avancer((courant + p) / doc.numPages, `Lecture de la page ${courant + 1} sur ${doc.numPages}`));
      }
      const vue = page.getViewport({ scale: ECHELLE_PDF });
      const c = document.createElement("canvas");
      c.width = Math.ceil(vue.width);
      c.height = Math.ceil(vue.height);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vue, canvas: c }).promise;
      page.cleanup();
      pages.push({ largeur: c.width, hauteur: c.height, ...(await lireToile(o, c)) });
      c.width = 0;
    }
  } finally {
    await o?.terminate();
    await fermer();
  }
  return pages;
}

/** Le texte reconnu, en document (Word, OpenDocument, Markdown…) : un paragraphe par paragraphe, une page par page. */
export function documentLu(pages: PageLue[]): Noeud {
  const content: Noeud[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && content.length) content.push({ type: "sautPage" });
    for (const t of p.paragraphes) content.push({ type: "paragraph", content: [{ type: "text", text: t }] });
  });
  if (!content.length) content.push({ type: "paragraph" });
  return { type: "doc", content };
}

export function texteLu(pages: PageLue[]): string {
  return pages.map((p) => p.paragraphes.join("\n\n")).filter(Boolean).join("\n\n\n");
}

/**
 * Pose les lignes reconnues, invisibles, sur une page (repère visible en pixels → repère du PDF).
 * Une ligne entière par texte : le copier-coller rend des lignes, pas des mots en colonne.
 */
function poserLignes(page: PDFPage, police: PDFFont, lue: PageLue, connus: Set<number>): number {
  const boite = page.getCropBox();
  const rotation = page.getRotation().angle;
  const r = ((rotation % 360) + 360) % 360;
  const [lv, hv] = r === 90 || r === 270 ? [boite.height, boite.width] : [boite.width, boite.height];
  const ex = lv / lue.largeur;
  const ey = hv / lue.hauteur;
  let poses = 0;
  page.pushOperators(pushGraphicsState(), setTextRenderingMode(TextRenderingMode.Invisible));
  for (const m of lue.lignes) {
    if (![...m.t].every((c) => connus.has(c.codePointAt(0)!))) continue;
    const largeur = (m.x1 - m.x0) * ex;
    const hauteur = (m.y1 - m.y0) * ey;
    const naturelle = police.widthOfTextAtSize(m.t, 1);
    if (largeur <= 0 || hauteur <= 0 || naturelle <= 0) continue;
    const taille = Math.max(hauteur * 0.5, Math.min(hauteur * 1.6, largeur / naturelle));
    // La ligne part du coin bas-gauche de sa boîte (repère visible), à l'angle de la page.
    const [x, y] = versRepereePdf(m.x0 * ex, m.y1 * ey - hauteur * 0.15, boite.width, boite.height, rotation);
    page.drawText(m.t, { x: x + boite.x, y: y + boite.y, size: taille, font: police, rotate: degrees(r) });
    poses++;
  }
  page.pushOperators(popGraphicsState());
  return poses;
}

/**
 * Un PDF cherchable : pour un PDF, ses pages d'origine (intactes) reçoivent le texte invisible ;
 * pour des images, chacune devient une page. Les lignes en écriture non latine ne sont pas posées
 * (la police standard des PDF ne les a pas) : elles restent dans le texte exporté.
 */
export async function pdfCherchable(source: { pdf: Uint8Array } | { images: { fichier: Blob; format: string }[] }, pages: PageLue[], titre: string): Promise<{ octets: Uint8Array; absents: number }> {
  const { PDFDocument } = await import("@cantoo/pdf-lib");
  const { charger, imageEnPage } = await import("./pdf");
  let doc;
  if ("pdf" in source) doc = await charger(source.pdf);
  else {
    doc = await PDFDocument.create();
    for (const im of source.images) await imageEnPage(doc, im.fichier, im.format);
  }
  doc.setTitle(titre);
  const police = await doc.embedFont(StandardFonts.Helvetica);
  const connus = new Set(police.getCharacterSet());
  let absents = 0;
  doc.getPages().forEach((page, i) => {
    const lue = pages[i];
    if (!lue || lue.deja || !lue.lignes.length) return;
    const poses = poserLignes(page, police, lue, connus);
    absents += lue.lignes.length - poses;
  });
  return { octets: await doc.save(), absents };
}
