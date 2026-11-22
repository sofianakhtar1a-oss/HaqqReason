"use client";

/*
 * Masquer, dans le navigateur : ce qui est caché disparaît vraiment du fichier.
 *
 * Un rectangle noir posé sur un PDF ne suffit pas (le texte reste dessous et se copie). Ici, chaque
 * page où quelque chose est masqué est redessinée en image, avec les caches dedans ; les autres pages
 * sont reprises telles quelles. Pour une photo, les caches sont peints dans les pixels.
 */
import type { PDFDocument as DocPdfLib } from "@cantoo/pdf-lib";
import { chercher, enPixels, type Morceau, type PageTexte } from "../caviardage";
import type { BoiteVisible } from "../signature";
import type { Resultat } from "./moteur";

export type Cadre = { id: string; page: number; boite: BoiteVisible; texte?: string };
export type Couleur = "noir" | "blanc";
type Avancer = (fraction: number | null, etape: string) => void;
type DocPdf = Awaited<ReturnType<typeof import("./pdf").ouvrir>>["doc"];

const annule = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
};
const sansExtension = (nom: string) => nom.replace(/\.[^.]+$/, "");
const TEINTE: Record<Couleur, string> = { noir: "#000000", blanc: "#ffffff" };
/** Netteté des pages redessinées (points par pouce), et plafond de pixels par page (mémoire des téléphones). */
const PPP = 200;
const MAX_PIXELS = 14_000_000;

/** Le texte placé de chaque page d'un PDF (couche texte de pdf.js), en points de la page visible. */
export async function lireTextePdf(doc: DocPdf, signal?: AbortSignal): Promise<PageTexte[]> {
  const { chargerPdfjs } = await import("@/lib/client/pdf");
  const { Util } = await chargerPdfjs();
  // Les largeurs des lettres, mesurées dans une police de même famille : les caches tombent juste
  // même dans un texte en police proportionnelle (un « i » est plus étroit qu'un « m »).
  const mesure = document.createElement("canvas").getContext("2d");
  const avancesDe = (texte: string, famille: string, largeur: number): number[] | undefined => {
    if (!mesure) return undefined;
    mesure.font = `100px ${famille || "sans-serif"}`;
    const lettres = [...texte];
    const bords = [0];
    for (const l of lettres) bords.push(bords[bords.length - 1] + mesure.measureText(l).width);
    const total = bords[bords.length - 1];
    return total > 0 ? bords.map((b) => (b / total) * largeur) : undefined;
  };
  const pages: PageTexte[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    annule(signal);
    const page = await doc.getPage(n);
    const vue = page.getViewport({ scale: 1 });
    const contenu = await page.getTextContent();
    const morceaux: Morceau[] = [];
    for (const it of contenu.items) {
      if (!("str" in it)) continue;
      if (!it.str) {
        if (it.hasEOL && morceaux.length) morceaux[morceaux.length - 1].finDeLigne = true;
        continue;
      }
      const tx = Util.transform(vue.transform, it.transform);
      const largeur = it.width * vue.scale;
      const famille = (contenu.styles as Record<string, { fontFamily?: string } | undefined>)[it.fontName]?.fontFamily ?? "sans-serif";
      morceaux.push({ t: it.str, ox: tx[4], oy: tx[5], angle: Math.atan2(tx[1], tx[0]), largeur, hauteur: Math.hypot(tx[2], tx[3]), finDeLigne: it.hasEOL, avances: avancesDe(it.str, famille, largeur) });
    }
    pages.push({ largeur: vue.width, hauteur: vue.height, morceaux });
    page.cleanup();
  }
  return pages;
}

/** Un PDF sans texte (scan, photo mise en PDF) : il faudra le lire avant d'y chercher. */
export const sansTexte = (pages: PageTexte[]) => pages.every((p) => p.morceaux.reduce((s, m) => s + m.t.trim().length, 0) < 10);

/** Les mots reconnus (OCR) d'images ou de pages, devenus des morceaux placés. */
export async function lireTexteImages(nombre: number, toile: (i: number) => Promise<HTMLCanvasElement>, langues: import("./ocr").LangueOcr[], avancer: Avancer, signal?: AbortSignal): Promise<PageTexte[]> {
  const { lireMots } = await import("./ocr");
  const lues = await lireMots(nombre, toile, langues, avancer, signal);
  return lues.map((p) => ({
    largeur: p.largeur,
    hauteur: p.hauteur,
    morceaux: p.mots.map((m) => ({ t: m.t, ox: m.x0, oy: m.y1, angle: 0, largeur: m.x1 - m.x0, hauteur: m.y1 - m.y0, cadre: { x0: m.x0, y0: m.y0, x1: m.x1, y1: m.y1 } })),
  }));
}

/** Une page de PDF dessinée sur une toile, à la netteté voulue (bornée pour la mémoire). */
export async function dessinerPage(doc: DocPdf, numero: number, ppp = PPP): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(numero);
  const base = page.getViewport({ scale: 1 });
  const echelle = Math.min(ppp / 72, Math.sqrt(MAX_PIXELS / Math.max(1, base.width * base.height)));
  const vue = page.getViewport({ scale: echelle });
  const c = document.createElement("canvas");
  c.width = Math.ceil(vue.width);
  c.height = Math.ceil(vue.height);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vue, canvas: c }).promise;
  page.cleanup();
  return c;
}

function peindre(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, cadres: Cadre[], l: number, h: number, couleur: Couleur) {
  ctx.fillStyle = TEINTE[couleur];
  for (const c of cadres) {
    const r = enPixels(c.boite, l, h, Math.max(1, Math.round(Math.min(l, h) / 900)));
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
}

/**
 * Le PDF masqué : les pages qui portent un cache deviennent des images (le texte caché n'y est plus),
 * les autres sont reprises sans changement. Le titre, l'auteur, les signets et les pièces jointes du
 * document ne sont pas repris : ils peuvent contenir ce qu'on veut cacher.
 */
export async function masquerPdf(octets: Uint8Array, cadres: Cadre[], couleur: Couleur, nom: string, avancer: Avancer, signal?: AbortSignal): Promise<Resultat & { pagesAplaties: number }> {
  const [{ ouvrir, charger }, { PDFDocument }] = await Promise.all([import("./pdf"), import("@cantoo/pdf-lib")]);
  avancer(0.02, "Lecture du PDF");
  const { doc, fermer } = await ouvrir(octets);
  try {
    const source: DocPdfLib = await charger(octets);
    const sortie = await PDFDocument.create();
    const total = source.getPageCount();
    const masquees = new Set(cadres.map((c) => c.page));
    const reprises = Array.from({ length: total }, (_, i) => i).filter((i) => !masquees.has(i));
    const copiees = new Map<number, Awaited<ReturnType<typeof sortie.copyPages>>[number]>();
    if (reprises.length) (await sortie.copyPages(source, reprises)).forEach((p, k) => copiees.set(reprises[k], p));
    let faites = 0;
    for (let i = 0; i < total; i++) {
      annule(signal);
      const reprise = copiees.get(i);
      if (reprise) {
        sortie.addPage(reprise);
        continue;
      }
      faites++;
      avancer(0.05 + (faites / Math.max(1, masquees.size)) * 0.85, `Page ${i + 1} : les caches sont posés`);
      const toile = await dessinerPage(doc, i + 1);
      const ctx = toile.getContext("2d")!;
      peindre(
        ctx,
        cadres.filter((c) => c.page === i),
        toile.width,
        toile.height,
        couleur,
      );
      const jpeg = await new Promise<Blob>((ok, ko) => toile.toBlob((b) => (b ? ok(b) : ko(new Error("La page n'a pas pu être redessinée."))), "image/jpeg", 0.9));
      const { width, height } = (await doc.getPage(i + 1)).getViewport({ scale: 1 });
      toile.width = 0;
      toile.height = 0;
      const image = await sortie.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
      sortie.addPage([width, height]).drawImage(image, { x: 0, y: 0, width, height });
    }
    avancer(0.94, "Écriture du PDF");
    sortie.setProducer("HaqqReason — L'Alambic");
    sortie.setCreator("HaqqReason — L'Alambic");
    const fini = await sortie.save();
    return {
      nom: `${sansExtension(nom)} (masqué).pdf`,
      blob: new Blob([fini.slice().buffer], { type: "application/pdf" }),
      format: "pdf",
      avertissements: [
        `${masquees.size === 1 ? "La page masquée est devenue une image" : `Les ${masquees.size} pages masquées sont devenues des images`} : ce qui est caché a disparu du fichier, et leur texte ne se sélectionne plus.`,
        "Titre, auteur, signets et pièces jointes du document n'ont pas été repris.",
      ],
      pagesAplaties: masquees.size,
    };
  } finally {
    await fermer();
  }
}

const SORTIES: Record<string, { format: string; type: string; qualite?: number }> = {
  heic: { format: "jpg", type: "image/jpeg", qualite: 0.92 },
  avif: { format: "jpg", type: "image/jpeg", qualite: 0.92 },
  jpg: { format: "jpg", type: "image/jpeg", qualite: 0.92 },
  webp: { format: "webp", type: "image/webp", qualite: 0.92 },
  png: { format: "png", type: "image/png" },
};

/** Une photo ou une capture masquée : les caches sont peints dans l'image (et ses informations cachées partent avec l'ancien fichier). */
export async function masquerImage(fichier: Blob, format: string, cadres: Cadre[], couleur: Couleur, nom: string): Promise<Resultat> {
  const { decoder } = await import("./images");
  const p = await decoder(fichier, format);
  const c = document.createElement("canvas");
  c.width = p.largeur;
  c.height = p.hauteur;
  const ctx = c.getContext("2d")!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(p.donnees), p.largeur, p.hauteur), 0, 0);
  peindre(ctx, cadres, p.largeur, p.hauteur, couleur);
  const s = SORTIES[format] ?? SORTIES.png;
  const blob = await new Promise<Blob>((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("L'image n'a pas pu être enregistrée."))), s.type, s.qualite));
  c.width = 0;
  const sortie = blob.type === s.type ? s.format : "png";
  return {
    nom: `${sansExtension(nom)} (masqué).${sortie}`,
    blob,
    format: sortie,
    avertissements: ["Les caches font partie de l'image : ce qu'ils couvrent n'existe plus. Les informations cachées de la photo (lieu, appareil) sont parties aussi."],
  };
}

/** Relit le PDF produit : les textes cherchés y figurent-ils encore ? (un cache retiré, une page oubliée) */
export async function verifierPdf(octets: Uint8Array, motifs: (RegExp | import("../caviardage").IdMotif)[]): Promise<{ page: number; texte: string }[]> {
  if (!motifs.length) return [];
  const { ouvrir } = await import("./pdf");
  const { doc, fermer } = await ouvrir(octets);
  try {
    const pages = await lireTextePdf(doc);
    const restes = motifs.flatMap((m) => chercher(pages, m)).map((t) => ({ page: t.page, texte: t.texte }));
    const vus = new Set<string>();
    return restes.filter((r) => {
      const cle = `${r.page}|${r.texte}`;
      if (vus.has(cle)) return false;
      vus.add(cle);
      return true;
    });
  } finally {
    await fermer();
  }
}
