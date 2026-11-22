/*
 * Découper › « Ses images » : retrouver les photos et illustrations rangées dans un PDF, telles
 * qu'elles y sont. Les JPEG ressortent à l'octet près (aucune recompression) ; les images sans perte
 * (RVB, gris, palette, avec ou sans transparence) sont dépliées en pixels RVBA, que le navigateur
 * enregistre en PNG. Pur : testé dans tests/test-alambic-studio.mts.
 */
import { decodePDFRawStream, PDFArray, PDFDict, PDFHexString, PDFName, PDFNumber, PDFRawStream, PDFRef, PDFStream, PDFString, type PDFDocument } from "@cantoo/pdf-lib";
import { defiltrerPng, masquesDImages } from "./allegement";

type Placee = {
  ref: string;
  page: number;
  largeur: number;
  hauteur: number;
  /** JPEG en couleurs d'imprimerie (CMJN) : ses couleurs peuvent paraître fausses hors d'un logiciel de PAO. */
  cmjn?: boolean;
  /** Sa transparence n'a pas pu être reprise (masque d'une autre taille ou compressé en JPEG). */
  sansTransparence?: boolean;
};
export type ImageTrouvee = (Placee & { genre: "jpeg"; octets: Uint8Array }) | (Placee & { genre: "jpx"; octets: Uint8Array }) | (Placee & { genre: "pixels"; rgba: Uint8ClampedArray });

const N = (n: string) => PDFName.of(n);
/** En dessous, ce sont des puces, des icônes ou des filets : on ne les propose pas. */
export const COTE_MIN = 24;

type Espace = { comp: 1 | 3; palette?: Uint8Array; hival?: number };

/** Ce qu'on sait déplier d'un espace de couleur : gris, RVB (ICC compris), ou palette sur l'un des deux. */
export function espaceDe(doc: PDFDocument, brut: unknown): Espace | null {
  const cs = brut instanceof PDFRef ? doc.context.lookup(brut) : brut;
  if (cs === N("DeviceRGB") || cs === N("CalRGB")) return { comp: 3 };
  if (cs === N("DeviceGray") || cs === N("CalGray")) return { comp: 1 };
  if (!(cs instanceof PDFArray) || !cs.size()) return null;
  const type = cs.lookup(0);
  if (type === N("CalRGB")) return { comp: 3 };
  if (type === N("CalGray")) return { comp: 1 };
  if (type === N("ICCBased")) {
    const flux = cs.lookup(1);
    const n = flux instanceof PDFStream ? flux.dict.lookup(N("N")) : undefined;
    const v = n instanceof PDFNumber ? n.asNumber() : 0;
    return v === 3 ? { comp: 3 } : v === 1 ? { comp: 1 } : null;
  }
  if (type === N("Indexed") || type === N("I")) {
    const base = espaceDe(doc, cs.get(1));
    const hival = cs.lookup(2);
    const table = cs.lookup(3);
    if (!base || base.palette || !(hival instanceof PDFNumber)) return null;
    let palette: Uint8Array;
    if (table instanceof PDFHexString || table instanceof PDFString) palette = table.asBytes();
    else if (table instanceof PDFRawStream) palette = decodePDFRawStream(table).decode();
    else return null;
    return { comp: base.comp, palette, hival: hival.asNumber() };
  }
  return null;
}

/** Lit l'échantillon n° i d'une ligne de `bits` bits (1, 2, 4 ou 8). */
function echantillon(ligne: Uint8Array, i: number, bits: number): number {
  if (bits === 8) return ligne[i];
  const parOctet = 8 / bits;
  const octet = ligne[Math.floor(i / parOctet)];
  const decalage = 8 - bits * ((i % parOctet) + 1);
  return (octet >> decalage) & ((1 << bits) - 1);
}

/** Des échantillons (lignes alignées sur l'octet) deviennent des pixels RVBA opaques. */
export function versRgba(donnees: Uint8Array, l: number, h: number, esp: Espace, bits: number, inverser = false): Uint8ClampedArray | null {
  if (![1, 2, 4, 8].includes(bits) || (!esp.palette && esp.comp === 3 && bits !== 8)) return null;
  const parPixel = esp.palette ? 1 : esp.comp;
  const octetsParLigne = Math.ceil((l * parPixel * bits) / 8);
  if (donnees.length < octetsParLigne * h) return null;
  const rgba = new Uint8ClampedArray(l * h * 4);
  const max = (1 << bits) - 1;
  for (let y = 0; y < h; y++) {
    const ligne = donnees.subarray(y * octetsParLigne, (y + 1) * octetsParLigne);
    for (let x = 0; x < l; x++) {
      const o = (y * l + x) * 4;
      if (esp.palette) {
        const k = Math.min(echantillon(ligne, x, bits), esp.hival ?? 255) * esp.comp;
        if (esp.comp === 3) {
          rgba[o] = esp.palette[k] ?? 0;
          rgba[o + 1] = esp.palette[k + 1] ?? 0;
          rgba[o + 2] = esp.palette[k + 2] ?? 0;
        } else rgba[o] = rgba[o + 1] = rgba[o + 2] = esp.palette[k] ?? 0;
      } else if (esp.comp === 3) {
        rgba[o] = inverser ? 255 - ligne[x * 3] : ligne[x * 3];
        rgba[o + 1] = inverser ? 255 - ligne[x * 3 + 1] : ligne[x * 3 + 1];
        rgba[o + 2] = inverser ? 255 - ligne[x * 3 + 2] : ligne[x * 3 + 2];
      } else {
        let v = Math.round((echantillon(ligne, x, bits) * 255) / max);
        if (inverser) v = 255 - v;
        rgba[o] = rgba[o + 1] = rgba[o + 2] = v;
      }
      rgba[o + 3] = 255;
    }
  }
  return rgba;
}

function filtres(d: PDFDict): PDFName[] {
  const f = d.lookup(N("Filter"));
  return f instanceof PDFName ? [f] : f instanceof PDFArray ? f.asArray().filter((x): x is PDFName => x instanceof PDFName) : [];
}

/** Les octets d'un flux, filtres défaits sauf le dernier quand c'est un format d'image (JPEG, JPEG 2000). */
function octetsBruts(doc: PDFDocument, flux: PDFRawStream, garderDernier: boolean): Uint8Array {
  const liste = filtres(flux.dict);
  if (!liste.length) return flux.getContents();
  if (!garderDernier) return decodePDFRawStream(flux).decode();
  if (liste.length === 1) return flux.getContents();
  const enveloppe = flux.dict.clone(doc.context);
  enveloppe.set(N("Filter"), liste.length === 2 ? liste[0] : doc.context.obj(liste.slice(0, -1)));
  enveloppe.delete(N("DecodeParms"));
  return decodePDFRawStream(PDFRawStream.of(enveloppe, flux.getContents())).decode();
}

/** Le tableau /Decode inverse-t-il chaque composante ([1 0], [1 0 1 0 1 0]) ? */
function inverse(decode: unknown, comp: number): boolean {
  if (!(decode instanceof PDFArray) || decode.size() !== comp * 2) return false;
  for (let i = 0; i < comp * 2; i++) {
    const v = decode.lookup(i);
    if (!(v instanceof PDFNumber) || v.asNumber() !== (i % 2 === 0 ? 1 : 0)) return false;
  }
  return true;
}

/** Pixels d'une image sans perte (Flate, LZW, RunLength ou sans filtre), ou null si on ne sait pas la lire. */
function pixels(doc: PDFDocument, flux: PDFRawStream, l: number, h: number): { rgba: Uint8ClampedArray; sansTransparence: boolean } | null {
  const d = flux.dict;
  const esp = espaceDe(doc, d.get(N("ColorSpace")));
  const bitsBrut = d.lookup(N("BitsPerComponent"));
  const bits = bitsBrut instanceof PDFNumber ? bitsBrut.asNumber() : 8;
  if (!esp) return null;
  const decode = d.lookup(N("Decode"));
  // Seule l'inversion simple est comprise (gris ou RVB) ; tout autre /Decode, ou une palette décodée, est laissé de côté.
  const inverser = !esp.palette && inverse(decode, esp.comp);
  if (decode && !inverser) return null;
  let brut = decodePDFRawStream(flux).decode();
  const parms = d.lookup(N("DecodeParms"));
  const p = parms instanceof PDFArray ? parms.lookup(parms.size() - 1) : parms;
  const predicteur = p instanceof PDFDict ? ((p.lookup(N("Predictor")) as PDFNumber | undefined)?.asNumber() ?? 1) : 1;
  if (predicteur >= 10) brut = defiltrerPng(brut, l, esp.palette ? 1 : esp.comp, bits);
  else if (predicteur !== 1) return null;
  const rgba = versRgba(brut, l, h, esp, bits, inverser);
  if (!rgba) return null;
  // Transparence (SMask) de même taille : elle devient la couche alpha.
  const masque = d.lookup(N("SMask"));
  let sansTransparence = false;
  if (masque instanceof PDFRawStream) {
    sansTransparence = true;
    const ml = (masque.dict.lookup(N("Width")) as PDFNumber | undefined)?.asNumber();
    const mh = (masque.dict.lookup(N("Height")) as PDFNumber | undefined)?.asNumber();
    if (ml === l && mh === h && !filtres(masque.dict).some((f) => f === N("DCTDecode") || f === N("JPXDecode"))) {
      try {
        const alpha = decodePDFRawStream(masque).decode();
        if (alpha.length >= l * h) {
          for (let i = 0; i < l * h; i++) rgba[i * 4 + 3] = alpha[i];
          sansTransparence = false;
        }
      } catch {
        // masque illisible : l'image reste opaque
      }
    }
  }
  return { rgba, sansTransparence };
}

/** Empreinte rapide (FNV-1a) : la même image rangée deux fois sous deux noms n'est extraite qu'une fois. */
function empreinte(octets: Uint8Array | Uint8ClampedArray): string {
  let h = 0x811c9dc5;
  // Tout le contenu jusqu'à 16 Mo ; au-delà, un échantillon régulier (une très grande image décodée).
  const pas = Math.max(1, Math.floor(octets.length / 16_000_000));
  for (let i = 0; i < octets.length; i += pas) {
    h ^= octets[i];
    h = Math.imul(h, 0x01000193);
  }
  return `${octets.length}:${(h >>> 0).toString(36)}`;
}

/** Un JPEG en couleurs d'imprimerie (CMJN) ? */
function enCmjn(doc: PDFDocument, d: PDFDict): boolean {
  const cs = d.lookup(N("ColorSpace"));
  if (cs === N("DeviceCMYK")) return true;
  if (cs instanceof PDFArray && cs.lookup(0) === N("ICCBased")) {
    const flux = cs.lookup(1);
    const n = flux instanceof PDFStream ? flux.dict.lookup(N("N")) : undefined;
    return n instanceof PDFNumber && n.asNumber() === 4;
  }
  return false;
}

/** Les images XObject utilisées par une page, y compris dans ses dessins (formulaires XObject) imbriqués. */
function refsDImages(doc: PDFDocument, ressources: PDFDict | undefined, vus: Set<string>, profondeur = 0): PDFRef[] {
  if (!ressources || profondeur > 6) return [];
  const xo = ressources.lookup(N("XObject"));
  if (!(xo instanceof PDFDict)) return [];
  const refs: PDFRef[] = [];
  for (const [, v] of xo.entries()) {
    if (!(v instanceof PDFRef) || vus.has(v.toString())) continue;
    vus.add(v.toString());
    const o = doc.context.lookup(v);
    if (!(o instanceof PDFStream)) continue;
    const sous = o.dict.lookup(N("Subtype"));
    if (sous === N("Image")) refs.push(v);
    else if (sous === N("Form")) refs.push(...refsDImages(doc, o.dict.lookup(N("Resources")) as PDFDict | undefined, vus, profondeur + 1));
  }
  return refs;
}

/**
 * Les pages (indices à partir de 0) qui portent une grande image (un scan, une photo de document) :
 * leur texte, s'il y en a, ne dit pas tout ce qu'on voit. Rien n'est décodé, seules les tailles comptent.
 */
export function pagesAvecGrandeImage(doc: PDFDocument, pixelsMin = 300_000): Set<number> {
  const resultat = new Set<number>();
  doc.getPages().forEach((page, i) => {
    for (const ref of refsDImages(doc, page.node.Resources(), new Set())) {
      const flux = doc.context.lookup(ref);
      if (!(flux instanceof PDFStream)) continue;
      const l = (flux.dict.lookup(N("Width")) as PDFNumber | undefined)?.asNumber() ?? 0;
      const h = (flux.dict.lookup(N("Height")) as PDFNumber | undefined)?.asNumber() ?? 0;
      if (l * h >= pixelsMin) {
        resultat.add(i);
        break;
      }
    }
  });
  return resultat;
}

/**
 * Les images des pages données (numéros à partir de 1), chacune une seule fois, dans l'ordre des
 * pages. `ignorees` : images trouvées mais dans un format que le navigateur ne sait pas restituer
 * (fax CCITT, JBIG2, CMJN sans perte…).
 */
export function imagesDesPages(doc: PDFDocument, pages: number[]): { images: ImageTrouvee[]; ignorees: number } {
  const masques = masquesDImages(doc);
  const vus = new Set<string>();
  const empreintes = new Set<string>();
  const images: ImageTrouvee[] = [];
  let ignorees = 0;
  const garder = (im: ImageTrouvee, contenu: Uint8Array | Uint8ClampedArray) => {
    const e = empreinte(contenu);
    if (empreintes.has(e)) return;
    empreintes.add(e);
    images.push(im);
  };
  const toutes = doc.getPages();
  for (const n of pages) {
    const page = toutes[n - 1];
    if (!page) continue;
    for (const ref of refsDImages(doc, page.node.Resources(), vus)) {
      if (masques.has(ref.toString())) continue;
      const flux = doc.context.lookup(ref);
      if (!(flux instanceof PDFRawStream)) continue;
      const d = flux.dict;
      if (d.lookup(N("ImageMask"))) continue;
      const l = (d.lookup(N("Width")) as PDFNumber | undefined)?.asNumber() ?? 0;
      const h = (d.lookup(N("Height")) as PDFNumber | undefined)?.asNumber() ?? 0;
      if (l < COTE_MIN || h < COTE_MIN) continue;
      const dernier = filtres(d).at(-1);
      try {
        if (dernier === N("DCTDecode") || dernier === N("JPXDecode")) {
          const octets = octetsBruts(doc, flux, true);
          const commun = { ref: ref.toString(), page: n, largeur: l, hauteur: h, cmjn: enCmjn(doc, d), sansTransparence: d.has(N("SMask")) };
          garder(dernier === N("DCTDecode") ? { ...commun, genre: "jpeg", octets } : { ...commun, genre: "jpx", octets }, octets);
        } else {
          const lu = pixels(doc, flux, l, h);
          if (lu) garder({ ref: ref.toString(), page: n, largeur: l, hauteur: h, genre: "pixels", rgba: lu.rgba, sansTransparence: lu.sansTransparence }, lu.rgba);
          else ignorees++;
        }
      } catch {
        ignorees++;
      }
    }
  }
  return { images, ignorees };
}
