/*
 * Alléger : les réglages de chaque niveau, et les calculs qui ne dépendent pas du navigateur
 * (taille d'arrivée, recherche de la qualité qui tient dans un poids, défiltrage PNG, objets orphelins d'un PDF).
 * Testé dans tests/test-alambic-studio.mts.
 */
import { PDFArray, PDFDict, PDFRef, PDFStream, type PDFDocument, type PDFObject } from "@cantoo/pdf-lib";

export type Niveau = "leger" | "equilibre" | "fort";

export const NIVEAUX: { id: Niveau; nom: string; aide: string }[] = [
  { id: "leger", nom: "Léger", aide: "Presque aucune perte visible" },
  { id: "equilibre", nom: "Équilibré", aide: "Le bon compromis pour l'envoyer" },
  { id: "fort", nom: "Fort", aide: "Le plus léger possible" },
];

/** Photos : plus grand côté et qualité JPEG/WebP ; PNG : nombre de couleurs (0 = sans perte). */
export const REGLAGES_IMAGE: Record<Niveau, { cote: number; qualite: number; couleurs: number }> = {
  leger: { cote: 2560, qualite: 0.85, couleurs: 0 },
  equilibre: { cote: 1920, qualite: 0.75, couleurs: 256 },
  fort: { cote: 1280, qualite: 0.6, couleurs: 128 },
};

/** Images d'un PDF : résolution visée (points par pouce) et qualité JPEG. */
export const REGLAGES_PDF: Record<Niveau, { ppp: number; qualite: number } | null> = {
  leger: null,
  equilibre: { ppp: 150, qualite: 0.72 },
  fort: { ppp: 100, qualite: 0.55 },
};

/** Vidéos : petit côté maximal ; sons (et bande-son des vidéos) : débit en bits par seconde. */
export const REGLAGES_MEDIA: Record<Niveau, { petitCote: number; debitSon: number; mono: boolean }> = {
  leger: { petitCote: 1080, debitSon: 160_000, mono: false },
  equilibre: { petitCote: 720, debitSon: 128_000, mono: false },
  fort: { petitCote: 480, debitSon: 64_000, mono: true },
};

/** Poids visés proposés pour les photos (0 = aucun). */
export const POIDS_VISES = [0, 2 * 1024 * 1024, 1024 * 1024, 500 * 1024, 200 * 1024];

/** Dimensions ramenées pour que le plus grand côté ne dépasse pas `cote` (jamais agrandies). */
export function dimensionsCibles(largeur: number, hauteur: number, cote: number): { largeur: number; hauteur: number; echelle: number } {
  const echelle = Math.min(1, cote / Math.max(largeur, hauteur, 1));
  return { largeur: Math.max(1, Math.round(largeur * echelle)), hauteur: Math.max(1, Math.round(hauteur * echelle)), echelle };
}

/** Dimensions d'une vidéo dont le petit côté ne dépasse pas `petitCote`, arrondies au pair (exigé par les encodeurs). */
export function dimensionsVideo(largeur: number, hauteur: number, petitCote: number): { largeur: number; hauteur: number } | null {
  const petit = Math.min(largeur, hauteur);
  if (petit <= petitCote) return null;
  const e = petitCote / petit;
  const pair = (x: number) => Math.max(2, Math.round((x * e) / 2) * 2);
  return { largeur: pair(largeur), hauteur: pair(hauteur) };
}

/**
 * La meilleure qualité dont le résultat tient dans `cible` octets (recherche par dichotomie).
 * Renvoie null si même la qualité minimale dépasse : il faut alors réduire les dimensions.
 */
export async function viserPoids<T extends { size: number }>(encoder: (qualite: number) => Promise<T>, cible: number, min = 0.3, max = 0.92, essais = 7): Promise<{ resultat: T; qualite: number } | null> {
  const haut = await encoder(max);
  if (haut.size <= cible) return { resultat: haut, qualite: max };
  const bas = await encoder(min);
  if (bas.size > cible) return null;
  let meilleur = { resultat: bas, qualite: min };
  let a = min;
  let b = max;
  for (let i = 0; i < essais; i++) {
    const q = (a + b) / 2;
    const r = await encoder(q);
    if (r.size <= cible) {
      meilleur = { resultat: r, qualite: q };
      a = q;
    } else b = q;
  }
  return meilleur;
}

/** Retire le filtre « prédicteur PNG » (Predictor ≥ 10) des lignes d'une image décompressée. */
export function defiltrerPng(donnees: Uint8Array, colonnes: number, composantes: number, bits = 8): Uint8Array {
  const octetsParPixel = Math.max(1, Math.ceil((composantes * bits) / 8));
  const ligne = Math.ceil((colonnes * composantes * bits) / 8);
  const lignes = Math.floor(donnees.length / (ligne + 1));
  const sortie = new Uint8Array(lignes * ligne);
  for (let y = 0; y < lignes; y++) {
    const filtre = donnees[y * (ligne + 1)];
    const src = y * (ligne + 1) + 1;
    const dst = y * ligne;
    for (let x = 0; x < ligne; x++) {
      const brut = donnees[src + x];
      const a = x >= octetsParPixel ? sortie[dst + x - octetsParPixel] : 0;
      const b = y > 0 ? sortie[dst - ligne + x] : 0;
      const c = y > 0 && x >= octetsParPixel ? sortie[dst - ligne + x - octetsParPixel] : 0;
      let v: number;
      switch (filtre) {
        case 1:
          v = brut + a;
          break;
        case 2:
          v = brut + b;
          break;
        case 3:
          v = brut + ((a + b) >> 1);
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = brut + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default:
          v = brut;
      }
      sortie[dst + x] = v & 0xff;
    }
  }
  return sortie;
}

/** Retire du PDF les objets que plus rien ne référence (restes d'anciennes versions, ressources abandonnées). */
export function retirerOrphelins(doc: PDFDocument): number {
  const ctx = doc.context;
  const atteints = new Set<string>();
  const file: PDFObject[] = [];
  const visiter = (o: PDFObject | undefined) => {
    if (!o) return;
    if (o instanceof PDFRef) {
      const cle = o.toString();
      if (atteints.has(cle)) return;
      atteints.add(cle);
      const cible = ctx.lookup(o);
      if (cible) file.push(cible);
    } else file.push(o);
  };
  const t = ctx.trailerInfo;
  [t.Root, t.Info, t.Encrypt, t.ID].forEach((o) => visiter(o as PDFObject | undefined));
  let garde = 0;
  while (file.length && garde++ < 5_000_000) {
    const o = file.pop()!;
    if (o instanceof PDFDict) for (const [, v] of o.entries()) visiter(v);
    else if (o instanceof PDFArray) for (const v of o.asArray()) visiter(v);
    else if (o instanceof PDFStream) for (const [, v] of o.dict.entries()) visiter(v);
  }
  let retires = 0;
  for (const [ref] of ctx.enumerateIndirectObjects()) {
    if (!atteints.has(ref.toString())) {
      ctx.delete(ref);
      retires++;
    }
  }
  return retires;
}

/**
 * Images qui servent de masque à une autre image (/SMask, ou /Mask quand c'est une image) : elles
 * doivent rester en gris et sans perte, on ne les recompresse jamais.
 */
export function masquesDImages(doc: PDFDocument): Set<string> {
  const masques = new Set<string>();
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (!(o instanceof PDFStream)) continue;
    for (const [cle, v] of o.dict.entries()) {
      const nom = cle.asString();
      if ((nom === "/SMask" || nom === "/Mask") && v instanceof PDFRef) masques.add(v.toString());
    }
  }
  return masques;
}

/**
 * Retire les blocs EXIF d'un JPEG. Dans un PDF, les lecteurs ignorent l'orientation qu'ils indiquent ;
 * le navigateur, lui, l'appliquerait en relisant l'image et la ferait pivoter.
 */
export function sansExif(jpeg: Uint8Array): Uint8Array {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg;
  const gardes: Uint8Array[] = [jpeg.subarray(0, 2)];
  let i = 2;
  let retire = false;
  while (i + 4 <= jpeg.length && jpeg[i] === 0xff) {
    const marqueur = jpeg[i + 1];
    // Début des données de l'image (ou fin) : tout le reste est gardé tel quel.
    if (marqueur === 0xda || marqueur === 0xd9) break;
    const longueur = (jpeg[i + 2] << 8) | jpeg[i + 3];
    const fin = i + 2 + longueur;
    if (longueur < 2 || fin > jpeg.length) break;
    const exif = marqueur === 0xe1 && longueur >= 8 && jpeg[i + 4] === 0x45 && jpeg[i + 5] === 0x78 && jpeg[i + 6] === 0x69 && jpeg[i + 7] === 0x66;
    if (exif) retire = true;
    else gardes.push(jpeg.subarray(i, fin));
    i = fin;
  }
  if (!retire) return jpeg;
  gardes.push(jpeg.subarray(i));
  const sortie = new Uint8Array(gardes.reduce((s, g) => s + g.length, 0));
  let o = 0;
  for (const g of gardes) {
    sortie.set(g, o);
    o += g.length;
  }
  return sortie;
}
