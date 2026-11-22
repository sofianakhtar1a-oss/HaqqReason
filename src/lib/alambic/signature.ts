/*
 * Signer et remplir : passer du repère « tel qu'on voit la page » (fractions de la page, origine en haut
 * à gauche) au repère du PDF et inversement, pages pivotées comprises ; dates ; nettoyage d'une signature
 * photographiée. Pur : testé dans tests/test-alambic-studio.mts.
 */
import { versRepereePdf } from "./filigrane";

/** Une boîte dans le repère visible : fractions de la largeur et de la hauteur de la page (0 à 1). */
export type BoiteVisible = { x: number; y: number; w: number; h: number };

/** Repère du PDF (coin bas-gauche de la boîte de recadrage retiré) → repère visible, en points. */
export function versRepereVisible(x: number, y: number, largeur: number, hauteur: number, rotation: number): [number, number] {
  switch (((rotation % 360) + 360) % 360) {
    case 90:
      return [y, x];
    case 180:
      return [largeur - x, y];
    case 270:
      return [hauteur - y, largeur - x];
    default:
      return [x, hauteur - y];
  }
}

/** Un rectangle du PDF (x, y, largeur, hauteur en points) → boîte visible en fractions de la page. */
export function rectVersVisible(r: { x: number; y: number; width: number; height: number }, largeur: number, hauteur: number, rotation: number): BoiteVisible {
  const a = versRepereVisible(r.x, r.y, largeur, hauteur, rotation);
  const b = versRepereVisible(r.x + r.width, r.y + r.height, largeur, hauteur, rotation);
  const rot = ((rotation % 360) + 360) % 360;
  const [lv, hv] = rot === 90 || rot === 270 ? [hauteur, largeur] : [largeur, hauteur];
  const x0 = Math.min(a[0], b[0]);
  const y0 = Math.min(a[1], b[1]);
  return { x: x0 / lv, y: y0 / hv, w: Math.abs(a[0] - b[0]) / lv, h: Math.abs(a[1] - b[1]) / hv };
}

/**
 * Où dessiner une image (ou un texte) pour qu'elle apparaisse droite dans la boîte visible :
 * pdf-lib dessine depuis le coin bas-gauche et tourne autour de lui ; on tourne de l'angle de la page.
 */
export function boiteVersPdf(b: BoiteVisible, largeur: number, hauteur: number, rotation: number): { x: number; y: number; largeur: number; hauteur: number; angle: number } {
  const rot = ((rotation % 360) + 360) % 360;
  const [lv, hv] = rot === 90 || rot === 270 ? [hauteur, largeur] : [largeur, hauteur];
  const [x, y] = versRepereePdf(b.x * lv, (b.y + b.h) * hv, largeur, hauteur, rot);
  return { x, y, largeur: b.w * lv, hauteur: b.h * hv, angle: rot };
}

/** Un point visible (fractions) → point du PDF. */
export function pointVersPdf(fx: number, fy: number, largeur: number, hauteur: number, rotation: number): [number, number] {
  const rot = ((rotation % 360) + 360) % 360;
  const [lv, hv] = rot === 90 || rot === 270 ? [hauteur, largeur] : [largeur, hauteur];
  return versRepereePdf(fx * lv, fy * hv, largeur, hauteur, rot);
}

export function dateDuJour(d = new Date()): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Garde une boîte dans la page. */
export function borner(b: BoiteVisible): BoiteVisible {
  const w = Math.min(1, Math.max(0.01, b.w));
  const h = Math.min(1, Math.max(0.005, b.h));
  return { w, h, x: Math.min(1 - w, Math.max(0, b.x)), y: Math.min(1 - h, Math.max(0, b.y)) };
}

/**
 * Une signature photographiée sur papier blanc : le papier devient transparent, l'encre reste
 * (fondu doux entre les deux pour éviter les bords crénelés). RVBA, modifié sur place.
 */
export function detourerEncre(donnees: Uint8ClampedArray, seuilPapier = 200, seuilEncre = 120): void {
  for (let i = 0; i < donnees.length; i += 4) {
    const l = 0.299 * donnees[i] + 0.587 * donnees[i + 1] + 0.114 * donnees[i + 2];
    const a = l >= seuilPapier ? 0 : l <= seuilEncre ? 255 : Math.round(((seuilPapier - l) / (seuilPapier - seuilEncre)) * 255);
    donnees[i + 3] = Math.min(donnees[i + 3], a);
  }
}

/** Le plus petit rectangle qui contient les pixels non transparents (pour rogner une signature). */
export function cadreUtile(donnees: Uint8ClampedArray, largeur: number, hauteur: number, seuil = 8): { x: number; y: number; w: number; h: number } | null {
  let x0 = largeur;
  let y0 = hauteur;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < hauteur; y++)
    for (let x = 0; x < largeur; x++)
      if (donnees[(y * largeur + x) * 4 + 3] > seuil) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
