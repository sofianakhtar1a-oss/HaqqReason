"use client";

/*
 * Filigraner et numéroter, dans le navigateur : sur un PDF (texte vectoriel, ou pages aplaties en images
 * pour que le filigrane ne puisse pas être retiré) et sur des images.
 */
import { degrees, rgb, StandardFonts, type PDFFont } from "@cantoo/pdf-lib";
import { couleurRvb, departPdf, placerFiligrane, poseNumero, tailleVisible, type Pose, type ReglagesFiligrane, type ReglagesNumeros } from "../filigrane";
import type { Resultat } from "./moteur";

export type OptionsMarquage = {
  filigrane: ReglagesFiligrane | null;
  numeros: ReglagesNumeros | null;
  /** PDF : les pages deviennent des images, le filigrane fait corps avec elles. */
  inseparable: boolean;
  signal?: AbortSignal;
};

type Avancer = (fraction: number | null, etape: string) => void;
type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const POLICE = "Helvetica, Arial, 'Liberation Sans', sans-serif";
const NUMERO_COULEUR = "#2b2f3a";

const annule = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
};
const sansExtension = (nom: string) => nom.replace(/\.[^.]+$/, "");

/** Mesure d'un texte gras pour une police de taille 1, par le navigateur. */
export function mesureToile(ctx: Ctx): (t: string) => number {
  return (t) => {
    ctx.font = `bold 100px ${POLICE}`;
    return ctx.measureText(t).width / 100;
  };
}

function poser(ctx: Ctx, p: Pose, echelle: number, couleur: string, opacite: number) {
  ctx.save();
  ctx.globalAlpha = opacite;
  ctx.fillStyle = couleur;
  ctx.font = `bold ${p.taillePolice * echelle}px ${POLICE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(p.x * echelle, p.y * echelle);
  ctx.rotate((-p.angle * Math.PI) / 180);
  ctx.fillText(p.texte, 0, 0);
  ctx.restore();
}

/**
 * Dessine filigrane et numéro sur une toile dont le contenu représente une page de largeur × hauteur
 * (en points pour un PDF, en pixels pour une image), à l'échelle donnée.
 */
export function dessiner(ctx: Ctx, largeur: number, hauteur: number, index: number, total: number, o: Pick<OptionsMarquage, "filigrane" | "numeros">, echelle = 1) {
  const mesure = mesureToile(ctx);
  if (o.filigrane) for (const p of placerFiligrane(largeur, hauteur, o.filigrane, mesure)) poser(ctx, p, echelle, o.filigrane.couleur, o.filigrane.opacite);
  if (o.numeros) {
    const p = poseNumero(largeur, hauteur, index, total, o.numeros, mesure);
    if (p) poser(ctx, p, echelle, NUMERO_COULEUR, 1);
  }
}

/** Les caractères que la police intégrée aux lecteurs PDF ne sait pas écrire (arabe, emoji…). */
function horsPolice(police: PDFFont, textes: string[]): boolean {
  const connus = new Set(police.getCharacterSet());
  return textes.some((t) => [...t].some((c) => !connus.has(c.codePointAt(0)!)));
}

async function aplatir(octets: Uint8Array, titre: string, o: OptionsMarquage, avancer: Avancer): Promise<Uint8Array> {
  const [{ ouvrir }, { PDFDocument }] = await Promise.all([import("./pdf"), import("@cantoo/pdf-lib")]);
  const { doc, fermer } = await ouvrir(octets);
  const sortie = await PDFDocument.create();
  sortie.setTitle(titre);
  sortie.setProducer("HaqqReason — L'Alambic");
  const echelle = 150 / 72;
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      annule(o.signal);
      avancer((n - 1) / doc.numPages, `Page ${n} sur ${doc.numPages}`);
      const page = await doc.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const vue = page.getViewport({ scale: echelle });
      const c = document.createElement("canvas");
      c.width = Math.ceil(vue.width);
      c.height = Math.ceil(vue.height);
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vue, canvas: c }).promise;
      page.cleanup();
      dessiner(ctx, base.width, base.height, n - 1, doc.numPages, o, echelle);
      const jpeg = await new Promise<Blob>((ok, ko) => c.toBlob((b) => (b ? ok(b) : ko(new Error("Encodage impossible."))), "image/jpeg", 0.88));
      c.width = 0;
      const img = await sortie.embedJpg(new Uint8Array(await jpeg.arrayBuffer()));
      sortie.addPage([base.width, base.height]).drawImage(img, { x: 0, y: 0, width: base.width, height: base.height });
    }
  } finally {
    await fermer();
  }
  return sortie.save();
}

export async function marquerPdf(fichier: Blob, nom: string, o: OptionsMarquage, avancer: Avancer): Promise<Resultat> {
  const octets = new Uint8Array(await fichier.arrayBuffer());
  const avertissements: string[] = [];
  let sortie: Uint8Array;
  let inseparable = o.inseparable;
  if (!inseparable) {
    const { charger } = await import("./pdf");
    avancer(0.05, "Lecture du PDF");
    const doc = await charger(octets);
    const police = await doc.embedFont(StandardFonts.HelveticaBold);
    const textes = [o.filigrane?.texte ?? "", ...(o.numeros ? ["Page 0123456789 sur –/"] : [])];
    if (horsPolice(police, textes)) {
      // Écriture non latine : seule la version aplatie peut l'afficher fidèlement.
      inseparable = true;
      avertissements.push("Le texte contient des caractères que les lecteurs PDF n'ont pas en standard (arabe, par exemple) : les pages ont été aplaties en images pour l'afficher fidèlement.");
    } else {
      const mesure = (t: string) => police.widthOfTextAtSize(t, 1);
      const pages = doc.getPages();
      const [r, g, b] = o.filigrane ? couleurRvb(o.filigrane.couleur) : [0, 0, 0];
      pages.forEach((page, i) => {
        annule(o.signal);
        avancer(0.1 + (i / pages.length) * 0.8, `Page ${i + 1} sur ${pages.length}`);
        const boite = page.getCropBox();
        const rotation = page.getRotation().angle;
        const [lv, hv] = tailleVisible(boite.width, boite.height, rotation);
        const ecrire = (p: Pose, couleur: ReturnType<typeof rgb>, opacite: number) => {
          const largeur = police.widthOfTextAtSize(p.texte, p.taillePolice);
          const d = departPdf(p, largeur, boite.width, boite.height, rotation);
          page.drawText(p.texte, { x: d.x + boite.x, y: d.y + boite.y, size: p.taillePolice, font: police, color: couleur, opacity: opacite, rotate: degrees(d.angle) });
        };
        if (o.filigrane) for (const p of placerFiligrane(lv, hv, o.filigrane, mesure)) ecrire(p, rgb(r, g, b), o.filigrane.opacite);
        if (o.numeros) {
          const p = poseNumero(lv, hv, i, pages.length, o.numeros, mesure);
          if (p) ecrire(p, rgb(0.17, 0.18, 0.23), 1);
        }
      });
      avancer(0.92, "Écriture du PDF");
      sortie = await doc.save();
      if (o.filigrane) avertissements.push("Le filigrane est un texte ajouté par-dessus la page : un logiciel de PDF peut le retirer. Pour une pièce d'identité, choisis « Inséparable ».");
      return { nom: `${sansExtension(nom)} (${o.filigrane ? "filigrane" : "numéroté"}).pdf`, blob: new Blob([sortie.slice().buffer], { type: "application/pdf" }), format: "pdf", avertissements };
    }
  }
  sortie = await aplatir(octets, sansExtension(nom), o, avancer);
  if (inseparable) avertissements.push("Le filigrane fait corps avec chaque page (devenue une image) : il ne peut pas être effacé. Le texte du document ne se sélectionne plus.");
  return { nom: `${sansExtension(nom)} (${o.filigrane ? "filigrane" : "numéroté"}).pdf`, blob: new Blob([sortie.slice().buffer], { type: "application/pdf" }), format: "pdf", avertissements };
}

const SORTIES: Record<string, { format: string; type: string; qualite?: number }> = {
  heic: { format: "jpg", type: "image/jpeg", qualite: 0.92 },
  avif: { format: "jpg", type: "image/jpeg", qualite: 0.92 },
  jpg: { format: "jpg", type: "image/jpeg", qualite: 0.92 },
  webp: { format: "webp", type: "image/webp", qualite: 0.92 },
  png: { format: "png", type: "image/png" },
};

export async function marquerImage(fichier: Blob, format: string, nom: string, o: OptionsMarquage): Promise<Resultat> {
  const { decoder } = await import("./images");
  const p = await decoder(fichier, format);
  const c = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(p.largeur, p.hauteur) : Object.assign(document.createElement("canvas"), { width: p.largeur, height: p.hauteur });
  const ctx = c.getContext("2d") as Ctx;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(p.donnees), p.largeur, p.hauteur), 0, 0);
  dessiner(ctx, p.largeur, p.hauteur, 0, 1, { filigrane: o.filigrane, numeros: null });
  const s = SORTIES[format] ?? SORTIES.png;
  const blob = "convertToBlob" in c ? await c.convertToBlob({ type: s.type, quality: s.qualite }) : await new Promise<Blob>((ok, ko) => (c as HTMLCanvasElement).toBlob((b) => (b ? ok(b) : ko(new Error("Encodage impossible."))), s.type, s.qualite));
  const sortie = blob.type === s.type ? s.format : "png";
  return { nom: `${sansExtension(nom)} (filigrane).${sortie === "jpg" ? "jpg" : sortie}`, blob, format: sortie, avertissements: ["Le filigrane fait partie de l'image : il ne peut pas être effacé."] };
}
