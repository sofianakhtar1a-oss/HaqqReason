/*
 * Traces : examiner et retirer les métadonnées qui trahissent une personne ou un lieu
 * (position GPS, auteur, numéro de série, société, historique des révisions…).
 *
 * Pur : aucune API du navigateur (pas de DOM, pas de canvas), donc utilisable aussi sous Node.
 * Le nettoyage est sans perte chaque fois que c'est possible : les octets de l'image, du son
 * ou du texte ne sont jamais ré-encodés, seules les enveloppes de métadonnées sont retirées.
 */
import { strFromU8, strToU8, unzipSync, unzlibSync, zipSync, type Zippable } from "fflate";
import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName, PDFNumber, PDFRef, PDFStream, PDFString } from "@cantoo/pdf-lib";
import { PdfProtege } from "./erreurs";

export type Trace = { cle: string; libelle: string; valeur: string; sensible?: boolean };
export type Examen = { format: string; traces: Trace[]; remarques: string[]; nettoyable: boolean };

export const FORMATS_NETTOYABLES: string[] = ["jpg", "png", "webp", "pdf", "mp3", "docx", "xlsx", "pptx", "odt", "ods", "odp"];

// ---------------------------------------------------------------- outils communs

const trace = (cle: string, libelle: string, valeur: string, sensible = false): Trace => (sensible ? { cle, libelle, valeur, sensible: true } : { cle, libelle, valeur });
const deux = (n: number) => String(n).padStart(2, "0");

function latin1(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}
function utf8(b: Uint8Array): string {
  try {
    return new TextDecoder("utf-8").decode(b);
  } catch {
    return latin1(b);
  }
}
/** UTF-16 décodé à la main : évite de dépendre des encodages gérés par TextDecoder. */
function utf16(b: Uint8Array, petitBoutiste: boolean): string {
  let s = "";
  for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode(petitBoutiste ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1]);
  return s;
}
function concat(morceaux: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const m of morceaux) n += m.length;
  const r = new Uint8Array(n);
  let p = 0;
  for (const m of morceaux) {
    r.set(m, p);
    p += m.length;
  }
  return r;
}
const commence = (o: Uint8Array, debut: number, signature: string) => {
  if (debut < 0 || debut + signature.length > o.length) return false;
  for (let i = 0; i < signature.length; i++) if (o[debut + i] !== signature.charCodeAt(i)) return false;
  return true;
};
const u16be = (o: Uint8Array, p: number) => (o[p] << 8) | o[p + 1];
const u32be = (o: Uint8Array, p: number) => ((o[p] << 24) | (o[p + 1] << 16) | (o[p + 2] << 8) | o[p + 3]) >>> 0;
const u32le = (o: Uint8Array, p: number) => (o[p] | (o[p + 1] << 8) | (o[p + 2] << 16) | (o[p + 3] << 24)) >>> 0;
const syncsafe = (o: Uint8Array, p: number) => ((o[p] & 0x7f) << 21) | ((o[p + 1] & 0x7f) << 14) | ((o[p + 2] & 0x7f) << 7) | (o[p + 3] & 0x7f);

function dateFr(a: string, m: string, j: string, h?: string, mi?: string): string {
  return `${j}/${m}/${a}` + (h !== undefined && mi !== undefined ? ` ${h}:${mi}` : "");
}
/** « 2025:03:12 14:02:33 » → « 12/03/2025 14:02 » ; autre forme : renvoyée telle quelle. */
function dateExif(s: string): string {
  const m = /^(\d{4})[:-](\d{2})[:-](\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(s.trim());
  return m && m[1] !== "0000" ? dateFr(m[1], m[2], m[3], m[4], m[5]) : s.trim();
}
/** Dates ISO 8601 (« 2025-03-12T14:02:33Z »). */
const dateIso = dateExif;
/** « D:20250312140233+01'00' » → « 12/03/2025 14:02 ». */
function datePdf(s: string): string {
  const m = /^(?:D:)?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(s.trim());
  if (!m) return s.trim();
  return dateFr(m[1], m[2] ?? "01", m[3] ?? "01", m[4] ?? undefined, m[4] !== undefined ? (m[5] ?? "00") : undefined);
}
function dureeLisible(secondes: number): string {
  const h = Math.floor(secondes / 3600);
  const m = Math.floor((secondes % 3600) / 60);
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  return m > 0 ? `${m} min` : "moins d'une minute";
}
const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

function entites(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(Math.min(parseInt(h, 16), 0x10ffff)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Math.min(parseInt(d, 10), 0x10ffff)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
const echapperRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Texte du premier élément de nom local donné, quel que soit son préfixe de namespace. */
function elementXml(xml: string, nomLocal: string): string | undefined {
  const n = echapperRe(nomLocal);
  const m = new RegExp(`<(?:[\\w.-]+:)?${n}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?${n}\\s*>`).exec(xml);
  if (!m) return undefined;
  const t = entites(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "")).trim();
  return t === "" ? undefined : t;
}
function attributXml(attrs: string, nom: string): string | undefined {
  const m = new RegExp(`(?:^|\\s)${echapperRe(nom)}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attrs);
  return m ? entites(m[1] ?? m[2] ?? "") : undefined;
}

// ---------------------------------------------------------------- TIFF / EXIF

type ValeurTiff = { type: number; compte: number; dat: Uint8Array; pb: boolean };
const TAILLE_TYPE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

const lire16 = (t: Uint8Array, p: number, pb: boolean) => (pb ? t[p] | (t[p + 1] << 8) : (t[p] << 8) | t[p + 1]);
const lire32 = (t: Uint8Array, p: number, pb: boolean) => (pb ? u32le(t, p) : u32be(t, p));

function lireIfd(t: Uint8Array, off: number, pb: boolean): Map<number, ValeurTiff> {
  const m = new Map<number, ValeurTiff>();
  if (off < 8 || off + 2 > t.length) return m;
  const n = Math.min(lire16(t, off, pb), 512);
  for (let i = 0; i < n; i++) {
    const e = off + 2 + i * 12;
    if (e + 12 > t.length) break;
    const tag = lire16(t, e, pb);
    const type = lire16(t, e + 2, pb);
    const compte = lire32(t, e + 4, pb);
    const taille = (TAILLE_TYPE[type] ?? 0) * compte;
    if (!taille || compte > 1_000_000) continue;
    const d = taille > 4 ? lire32(t, e + 8, pb) : e + 8;
    if (d + taille > t.length) continue;
    m.set(tag, { type, compte, dat: t.subarray(d, d + taille), pb });
  }
  return m;
}
const asciiTiff = (v?: ValeurTiff): string | undefined => {
  if (!v || v.type !== 2) return undefined;
  const fin = v.dat.indexOf(0);
  const s = latin1(fin >= 0 ? v.dat.subarray(0, fin) : v.dat).trim();
  return s === "" ? undefined : s;
};
const entierTiff = (v?: ValeurTiff, i = 0): number | undefined => {
  if (!v) return undefined;
  if (v.type === 3 && v.dat.length >= 2 * (i + 1)) return lire16(v.dat, 2 * i, v.pb);
  if (v.type === 4 && v.dat.length >= 4 * (i + 1)) return lire32(v.dat, 4 * i, v.pb);
  if ((v.type === 1 || v.type === 7) && v.dat.length > i) return v.dat[i];
  return undefined;
};
const rationnelTiff = (v: ValeurTiff | undefined, i: number): number | undefined => {
  if (!v || (v.type !== 5 && v.type !== 10) || v.dat.length < 8 * (i + 1)) return undefined;
  const num = lire32(v.dat, 8 * i, v.pb);
  const den = lire32(v.dat, 8 * i + 4, v.pb);
  if (den === 0) return undefined;
  if (v.type === 10) return (num | 0) / (den | 0);
  return num / den;
};
const decimaleFr = (x: number, n = 5) => x.toFixed(n).replace(".", ",");

type LectureTiff = { traces: Trace[]; orientation: number | undefined; gps: boolean };

function lireTiff(t: Uint8Array): LectureTiff | null {
  if (t.length < 12) return null;
  const pb = t[0] === 0x49 && t[1] === 0x49;
  if (!pb && !(t[0] === 0x4d && t[1] === 0x4d)) return null;
  if (lire16(t, 2, pb) !== 42) return null;
  const ifd0 = lireIfd(t, lire32(t, 4, pb), pb);
  const ptrExif = entierTiff(ifd0.get(0x8769));
  const ptrGps = entierTiff(ifd0.get(0x8825));
  const exif = ptrExif ? lireIfd(t, ptrExif, pb) : new Map<number, ValeurTiff>();
  const gps = ptrGps ? lireIfd(t, ptrGps, pb) : new Map<number, ValeurTiff>();
  const traces: Trace[] = [];
  const ajouter = (cle: string, libelle: string, v: string | undefined, sensible = false, date = false) => {
    if (v) traces.push(trace(cle, libelle, date ? dateExif(v) : v, sensible));
  };
  ajouter("appareil", "Appareil", asciiTiff(ifd0.get(0x010f)));
  ajouter("modele", "Modèle", asciiTiff(ifd0.get(0x0110)));
  ajouter("logiciel", "Logiciel", asciiTiff(ifd0.get(0x0131)));
  ajouter("modifie", "Modifiée le", asciiTiff(ifd0.get(0x0132)), false, true);
  ajouter("prise", "Prise le", asciiTiff(exif.get(0x9003)), false, true);
  ajouter("auteur", "Auteur", asciiTiff(ifd0.get(0x013b)), true);
  ajouter("droits", "Droits", asciiTiff(ifd0.get(0x8298)));
  ajouter("description", "Description", asciiTiff(ifd0.get(0x010e)));
  ajouter("objectif", "Objectif", asciiTiff(exif.get(0xa434)));
  ajouter("serie", "Numéro de série de l'appareil", asciiTiff(exif.get(0xa431)), true);
  ajouter("proprietaire", "Propriétaire de l'appareil", asciiTiff(exif.get(0xa430)), true);

  let aGps = false;
  const dms = (v: ValeurTiff | undefined) => {
    const d = rationnelTiff(v, 0);
    const m = rationnelTiff(v, 1);
    const s = rationnelTiff(v, 2);
    return d === undefined || m === undefined || s === undefined ? undefined : d + m / 60 + s / 3600;
  };
  const lat = dms(gps.get(2));
  const lon = dms(gps.get(4));
  if (lat !== undefined && lon !== undefined && isFinite(lat) && isFinite(lon)) {
    const refLat = (asciiTiff(gps.get(1)) ?? "N").toUpperCase().startsWith("S") ? "S" : "N";
    const refLon = (asciiTiff(gps.get(3)) ?? "E").toUpperCase().startsWith("W") ? "O" : "E";
    traces.push(trace("gps", "Position GPS", `${decimaleFr(Math.abs(lat))} ${refLat}, ${decimaleFr(Math.abs(lon))} ${refLon}`, true));
    aGps = true;
  }
  const alt = rationnelTiff(gps.get(6), 0);
  if (alt !== undefined && isFinite(alt)) {
    const sous = entierTiff(gps.get(5)) === 1;
    traces.push(trace("altitude", "Altitude", `${Math.round(sous ? -alt : alt)} m`, true));
    aGps = true;
  }
  return { traces, orientation: entierTiff(ifd0.get(0x0112)), gps: aGps };
}

/** Exif brut (avec ou sans le préfixe « Exif\0\0 »). */
function lireExifBrut(b: Uint8Array): LectureTiff | null {
  return lireTiff(commence(b, 0, "Exif\0\0") ? b.subarray(6) : b);
}

/** Valeurs lisibles d'un paquet XMP, repérées par expressions régulières. */
function tracesXmp(xml: string): Trace[] {
  const r: Trace[] = [];
  const outil = /<xmp:CreatorTool>([^<]*)</.exec(xml) ?? /xmp:CreatorTool="([^"]*)"/.exec(xml);
  if (outil && outil[1].trim()) r.push(trace("xmp-outil", "Créé avec", entites(outil[1]).trim()));
  const bloc = /<dc:creator>([\s\S]*?)<\/dc:creator>/.exec(xml);
  if (bloc) {
    const noms: string[] = [];
    const re = /<rdf:li[^>]*>([^<]*)<\/rdf:li>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(bloc[1])) && noms.length < 20) if (m[1].trim()) noms.push(entites(m[1]).trim());
    if (noms.length) r.push(trace("xmp-auteur", "Auteur", noms.join(", "), true));
  }
  return r;
}

// ---------------------------------------------------------------- JPEG

type SegJpeg = { m: number; debut: number; fin: number };

function segmenterJpeg(o: Uint8Array): { segs: SegJpeg[]; finImage: number; aEoi: boolean } {
  if (o.length < 4 || o[0] !== 0xff || o[1] !== 0xd8) throw new Error("Ce fichier n'est pas un JPEG valide.");
  const segs: SegJpeg[] = [];
  let p = 2;
  let finImage = o.length;
  let aEoi = false;
  let garde = 0;
  while (p + 1 < o.length && garde++ < 200000) {
    if (o[p] !== 0xff) {
      finImage = p; // octets parasites : ce qui suit n'appartient plus à l'image
      break;
    }
    const m = o[p + 1];
    if (m === 0xff) {
      p++; // octet de remplissage
      continue;
    }
    if (m === 0xd9) {
      finImage = p + 2;
      aEoi = true;
      break;
    }
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) {
      segs.push({ m, debut: p, fin: p + 2 });
      p += 2;
      continue;
    }
    if (p + 4 > o.length) {
      finImage = p;
      break;
    }
    const L = u16be(o, p + 2);
    if (L < 2) {
      finImage = p;
      break;
    }
    let fin = p + 2 + L;
    if (fin > o.length) {
      segs.push({ m, debut: p, fin: o.length });
      break;
    }
    if (m === 0xda) {
      // Données entropiques : jusqu'au prochain marqueur (≠ 0x00 et ≠ RSTn).
      let q = fin;
      while (q + 1 < o.length) {
        if (o[q] === 0xff) {
          const b = o[q + 1];
          if (b === 0 || (b >= 0xd0 && b <= 0xd7)) q += 2;
          else if (b === 0xff) q++;
          else break;
        } else q++;
      }
      if (q + 1 >= o.length) q = o.length;
      fin = q;
    }
    segs.push({ m, debut: p, fin });
    p = fin;
  }
  return { segs, finImage, aEoi };
}

const XMP_NS = "http://ns.adobe.com/xap/1.0/\0";
const charge = (o: Uint8Array, s: SegJpeg) => o.subarray(s.debut + 4, s.fin);

function examinerJpeg(o: Uint8Array): Examen {
  const ex: Examen = { format: "jpg", traces: [], remarques: [], nettoyable: true };
  const { segs, finImage } = segmenterJpeg(o);
  const gpsPresent = { v: false };
  for (const s of segs) {
    const d = s.m >= 0xe0 && s.m <= 0xef ? charge(o, s) : null;
    if (s.m === 0xe1 && d) {
      if (commence(d, 0, "Exif\0\0")) {
        const l = lireExifBrut(d);
        if (l) {
          ex.traces.push(...l.traces);
          if (l.gps) gpsPresent.v = true;
        }
      } else if (commence(d, 0, XMP_NS)) {
        ex.traces.push(trace("xmp", "Données XMP", "présentes"));
        ex.traces.push(...tracesXmp(utf8(d.subarray(XMP_NS.length))));
      }
    } else if (s.m === 0xed && d && commence(d, 0, "Photoshop 3.0")) {
      ex.traces.push(trace("iptc", "Données IPTC", "présentes"));
    } else if (s.m === 0xfe) {
      const t = latin1(o.subarray(s.debut + 4, s.fin)).replace(/\0+$/, "").trim();
      if (t) ex.traces.push(trace("commentaire", "Commentaire", t.length > 200 ? t.slice(0, 200) + "…" : t));
    }
  }
  const reste = o.length - finImage;
  if (reste > 4) ex.remarques.push(`${pluriel(reste, "octet", "octets")} de données ajoutées après l'image (miniature, seconde image, données du fabricant) seront supprimés.`);
  return ex;
}

/** Segment Exif minimal ne contenant que l'orientation (TIFF big-endian, une seule entrée). */
function segmentOrientation(orientation: number): Uint8Array {
  const tiff = [0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, 0, 0, 0, 0];
  const donnees = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const L = donnees.length + 2;
  return new Uint8Array([0xff, 0xe1, L >> 8, L & 0xff, ...donnees]);
}

function nettoyerJpeg(o: Uint8Array, ex: Examen): { octets: Uint8Array; remarques: string[] } {
  const { segs, aEoi } = segmenterJpeg(o);
  let orientation: number | undefined;
  for (const s of segs) {
    if (s.m === 0xe1) {
      const d = charge(o, s);
      if (commence(d, 0, "Exif\0\0")) {
        const l = lireExifBrut(d);
        if (l?.orientation && orientation === undefined) orientation = l.orientation;
      }
    }
  }
  const sortie: Uint8Array[] = [o.subarray(0, 2)];
  let orientationEcrite = orientation === undefined || orientation === 1 || orientation < 1 || orientation > 8;
  const ecrireOrientation = () => {
    if (!orientationEcrite) {
      sortie.push(segmentOrientation(orientation as number));
      orientationEcrite = true;
    }
  };
  for (const s of segs) {
    let garder = true;
    if (s.m === 0xfe) garder = false;
    else if (s.m >= 0xe1 && s.m <= 0xef && s.m !== 0xee) {
      // APP2 reste seulement s'il porte le profil colorimétrique ; APP14 (Adobe) sert aux couleurs.
      garder = s.m === 0xe2 && commence(charge(o, s), 0, "ICC_PROFILE\0");
    }
    if (s.m !== 0xe0) ecrireOrientation();
    if (garder) sortie.push(o.subarray(s.debut, s.fin));
  }
  ecrireOrientation();
  if (aEoi) sortie.push(new Uint8Array([0xff, 0xd9]));
  const remarques: string[] = [];
  if (ex.traces.some((t) => t.cle === "gps")) remarques.push("La position GPS a été retirée.");
  if (orientation !== undefined && orientation !== 1) remarques.push("L'orientation de la photo a été conservée pour qu'elle reste à l'endroit.");
  return { octets: concat(sortie), remarques };
}

// ---------------------------------------------------------------- PNG

const SIGNATURE_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
type ChunkPng = { type: string; debut: number; fin: number };

function chunksPng(o: Uint8Array): ChunkPng[] {
  if (o.length < 8 || SIGNATURE_PNG.some((b, i) => o[i] !== b)) throw new Error("Ce fichier n'est pas un PNG valide.");
  const r: ChunkPng[] = [];
  let p = 8;
  while (p + 12 <= o.length && r.length < 100000) {
    const L = u32be(o, p);
    const fin = p + 12 + L;
    if (fin > o.length) break;
    r.push({ type: latin1(o.subarray(p + 4, p + 8)), debut: p, fin });
    p = fin;
  }
  return r;
}
const LIBELLES_PNG: Record<string, [string, string, boolean]> = {
  author: ["auteur", "Auteur", true],
  copyright: ["droits", "Droits", false],
  "creation time": ["creation", "Créé le", false],
  software: ["logiciel", "Logiciel", false],
  description: ["description", "Description", false],
  comment: ["commentaire", "Commentaire", false],
  title: ["titre", "Titre", false],
  source: ["source", "Source", false],
};
function inflaterSur(b: Uint8Array): Uint8Array | null {
  if (b.length > 8_000_000) return null;
  try {
    return unzlibSync(b);
  } catch {
    return null;
  }
}
function tracePngTexte(mot: string, valeur: string): Trace | null {
  if (mot === "XML:com.adobe.xmp") return trace("xmp", "Données XMP", "présentes");
  const t = valeur.replace(/\0+$/, "").trim();
  if (!t) return null;
  const connu = LIBELLES_PNG[mot.toLowerCase()];
  const court = t.length > 200 ? t.slice(0, 200) + "…" : t;
  return connu ? trace(connu[0], connu[1], court, connu[2]) : trace("texte-" + mot, mot, court);
}

function examinerPng(o: Uint8Array): Examen {
  const ex: Examen = { format: "png", traces: [], remarques: [], nettoyable: true };
  for (const c of chunksPng(o)) {
    const d = o.subarray(c.debut + 8, c.fin - 4);
    let t: Trace | null = null;
    if (c.type === "tEXt") {
      const z = d.indexOf(0);
      if (z > 0) t = tracePngTexte(latin1(d.subarray(0, z)), latin1(d.subarray(z + 1)));
    } else if (c.type === "zTXt") {
      const z = d.indexOf(0);
      if (z > 0 && d[z + 1] === 0) {
        const v = inflaterSur(d.subarray(z + 2));
        t = tracePngTexte(latin1(d.subarray(0, z)), v ? utf8(v) : "(texte compressé)");
      }
    } else if (c.type === "iTXt") {
      const z = d.indexOf(0);
      if (z > 0 && z + 3 < d.length) {
        const compresse = d[z + 1] === 1;
        let p = z + 3;
        const z2 = d.indexOf(0, p); // fin de l'étiquette de langue
        const z3 = z2 >= 0 ? d.indexOf(0, z2 + 1) : -1; // fin du mot-clé traduit
        if (z2 >= 0 && z3 >= 0) {
          p = z3 + 1;
          const brut = d.subarray(p);
          const v = compresse ? inflaterSur(brut) : brut;
          t = tracePngTexte(utf8(d.subarray(0, z)), v ? utf8(v) : "(texte compressé)");
        }
      }
    } else if (c.type === "tIME" && d.length >= 7) {
      t = trace("modifie", "Modifiée le", dateFr(String(u16be(d, 0)), deux(d[2]), deux(d[3]), deux(d[4]), deux(d[5])));
    } else if (c.type === "eXIf") {
      const l = lireExifBrut(d);
      if (l) ex.traces.push(...l.traces);
    }
    if (t) ex.traces.push(t);
  }
  return ex;
}
function nettoyerPng(o: Uint8Array, ex: Examen): { octets: Uint8Array; remarques: string[] } {
  const retirer = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);
  const sortie: Uint8Array[] = [o.subarray(0, 8)];
  const chunks = chunksPng(o);
  for (const c of chunks) if (!retirer.has(c.type)) sortie.push(o.subarray(c.debut, c.fin));
  const dernier = chunks.length ? chunks[chunks.length - 1].fin : 8;
  void dernier; // les octets après IEND (hors chunk valide) sont volontairement écartés
  const remarques: string[] = [];
  if (ex.traces.some((t) => t.cle === "gps")) remarques.push("La position GPS a été retirée.");
  return { octets: concat(sortie), remarques };
}

// ---------------------------------------------------------------- WebP

type ChunkWebp = { id: string; debut: number; donnees: number; taille: number; fin: number };
function chunksWebp(o: Uint8Array): ChunkWebp[] {
  if (o.length < 12 || !commence(o, 0, "RIFF") || !commence(o, 8, "WEBP")) throw new Error("Ce fichier n'est pas un WebP valide.");
  const r: ChunkWebp[] = [];
  let p = 12;
  while (p + 8 <= o.length && r.length < 100000) {
    const taille = u32le(o, p + 4);
    const donnees = p + 8;
    const finDonnees = Math.min(donnees + taille, o.length);
    const fin = Math.min(finDonnees + (taille & 1), o.length);
    r.push({ id: latin1(o.subarray(p, p + 4)), debut: p, donnees, taille: finDonnees - donnees, fin });
    p = fin;
  }
  return r;
}
function examinerWebp(o: Uint8Array): Examen {
  const ex: Examen = { format: "webp", traces: [], remarques: [], nettoyable: true };
  for (const c of chunksWebp(o)) {
    const d = o.subarray(c.donnees, c.donnees + c.taille);
    if (c.id === "EXIF") {
      const l = lireExifBrut(d);
      if (l) ex.traces.push(...l.traces);
    } else if (c.id === "XMP ") {
      ex.traces.push(trace("xmp", "Données XMP", "présentes"));
      ex.traces.push(...tracesXmp(utf8(d)));
    }
  }
  return ex;
}
function nettoyerWebp(o: Uint8Array, ex: Examen): { octets: Uint8Array; remarques: string[] } {
  const sortie: Uint8Array[] = [];
  for (const c of chunksWebp(o)) {
    if (c.id === "EXIF" || c.id === "XMP ") continue;
    const morceau = o.slice(c.debut, c.fin);
    if (c.id === "VP8X" && morceau.length > 8) morceau[8] &= ~(0x08 | 0x04); // drapeaux EXIF et XMP
    sortie.push(morceau);
  }
  const corps = concat(sortie);
  const entete = new Uint8Array(12);
  entete.set(o.subarray(0, 12));
  const taille = corps.length + 4;
  entete[4] = taille & 0xff;
  entete[5] = (taille >>> 8) & 0xff;
  entete[6] = (taille >>> 16) & 0xff;
  entete[7] = (taille >>> 24) & 0xff;
  const remarques: string[] = [];
  if (ex.traces.some((t) => t.cle === "gps")) remarques.push("La position GPS a été retirée.");
  return { octets: concat([entete, corps]), remarques };
}

// ---------------------------------------------------------------- MP3

type EtiquetteId3 = { taille: number; version: number; drapeaux: number };
function enteteId3(o: Uint8Array, debut: number): EtiquetteId3 | null {
  if (!commence(o, debut, "ID3") || debut + 10 > o.length) return null;
  const version = o[debut + 3];
  if (version < 2 || version > 4 || o[debut + 6] > 0x7f || o[debut + 7] > 0x7f || o[debut + 8] > 0x7f || o[debut + 9] > 0x7f) return null;
  const drapeaux = o[debut + 5];
  const taille = 10 + syncsafe(o, debut + 6) + (version === 4 && drapeaux & 0x10 ? 10 : 0);
  return { taille: Math.min(taille, o.length - debut), version, drapeaux };
}
function texteId3(enc: number, b: Uint8Array): string {
  let s: string;
  if (enc === 1 || enc === 2) {
    let pb = enc === 1;
    let d = b;
    if (b.length >= 2 && b[0] === 0xff && b[1] === 0xfe) {
      pb = true;
      d = b.subarray(2);
    } else if (b.length >= 2 && b[0] === 0xfe && b[1] === 0xff) {
      pb = false;
      d = b.subarray(2);
    } else if (enc === 1) pb = true;
    s = utf16(d, pb);
  } else if (enc === 3) s = utf8(b);
  else s = latin1(b);
  return s.replace(/﻿/g, "");
}
const premierNul = (s: string) => {
  const i = s.indexOf("\0");
  return i >= 0 ? s.slice(0, i) : s;
};

const ID3_TEXTE: Record<string, [string, string]> = {
  TIT2: ["titre", "Titre"],
  TT2: ["titre", "Titre"],
  TPE1: ["artiste", "Artiste"],
  TP1: ["artiste", "Artiste"],
  TALB: ["album", "Album"],
  TAL: ["album", "Album"],
  TYER: ["annee", "Année"],
  TDRC: ["annee", "Année"],
  TYE: ["annee", "Année"],
  TSSE: ["encode", "Encodé avec"],
  TSS: ["encode", "Encodé avec"],
  TENC: ["encode", "Encodé avec"],
  TEN: ["encode", "Encodé avec"],
};

function tracesId3v2(o: Uint8Array, debut: number, et: EtiquetteId3): Trace[] {
  const r: Trace[] = [];
  const v22 = et.version === 2;
  const tailleEntete = v22 ? 6 : 10;
  let p = debut + 10;
  const fin = debut + et.taille - (et.version === 4 && et.drapeaux & 0x10 ? 10 : 0);
  if (et.drapeaux & 0x40 && !v22 && p + 4 <= fin) {
    // En-tête étendu : on le saute.
    const t = et.version === 4 ? syncsafe(o, p) : u32be(o, p) + 4;
    p += Math.max(0, t);
  }
  const vus = new Set<string>();
  let garde = 0;
  while (p + tailleEntete <= fin && garde++ < 5000) {
    if (o[p] === 0) break; // remplissage
    const id = latin1(o.subarray(p, p + (v22 ? 3 : 4)));
    const t = v22 ? (o[p + 3] << 16) | (o[p + 4] << 8) | o[p + 5] : et.version === 4 ? syncsafe(o, p + 4) : u32be(o, p + 4);
    const d0 = p + tailleEntete;
    if (!/^[A-Z0-9]{3,4}$/.test(id) || t < 0 || d0 + t > fin) break;
    const d = o.subarray(d0, d0 + t);
    p = d0 + t;
    const texte = ID3_TEXTE[id];
    if (texte && d.length > 1) {
      const v = premierNul(texteId3(d[0], d.subarray(1))).trim();
      if (v && !vus.has(texte[0])) {
        vus.add(texte[0]);
        r.push(trace(texte[0], texte[1], v));
      }
    } else if ((id === "COMM" || id === "COM") && d.length > 4) {
      const brut = texteId3(d[0], d.subarray(4));
      const i = brut.indexOf("\0");
      const v = (i >= 0 ? brut.slice(i + 1) : brut).replace(/\0+$/, "").trim();
      if (v) r.push(trace("commentaire", "Commentaire", v.length > 200 ? v.slice(0, 200) + "…" : v));
    } else if (id === "APIC" || id === "PIC") {
      r.push(trace("pochette", "Image de pochette", `présente (${Math.max(1, Math.round(t / 1024))} Ko)`));
    } else if (id === "PRIV") {
      if (!vus.has("priv")) {
        vus.add("priv");
        r.push(trace("priv", "Données privées", "présentes"));
      }
    } else if (id === "GEOB") {
      r.push(trace("geob", "Objet incorporé", "présent"));
    } else if (id === "WXXX") {
      r.push(trace("lien", "Lien web", "présent"));
    }
  }
  return r;
}

function id3v1(o: Uint8Array): { debut: number; taille: number } | null {
  if (o.length >= 128 && commence(o, o.length - 128, "TAG") && !commence(o, o.length - 128, "TAG+")) {
    const etendu = o.length >= 355 && commence(o, o.length - 355, "TAG+");
    return { debut: o.length - (etendu ? 355 : 128), taille: etendu ? 355 : 128 };
  }
  return null;
}
function ape(o: Uint8Array, fin: number): { debut: number } | null {
  if (fin < 32 || !commence(o, fin - 32, "APETAGEX")) return null;
  const taille = u32le(o, fin - 32 + 12); // taille de l'étiquette, pied inclus, en-tête exclu
  const drapeaux = u32le(o, fin - 32 + 20);
  const total = taille + (drapeaux & 0x80000000 ? 32 : 0);
  if (taille < 32 || total > fin) return null;
  return { debut: fin - total };
}

function examinerMp3(o: Uint8Array): Examen {
  const ex: Examen = { format: "mp3", traces: [], remarques: [], nettoyable: true };
  const et = enteteId3(o, 0);
  if (et) ex.traces.push(...tracesId3v2(o, 0, et));
  const v1 = id3v1(o);
  if (v1) {
    const champ = (a: number, b: number) =>
      latin1(o.subarray(v1.debut + a, v1.debut + b))
        .replace(/\0[\s\S]*$/, "")
        .trim();
    const [titre, artiste, album, annee, comm] = [champ(3, 33), champ(33, 63), champ(63, 93), champ(93, 97), champ(97, 127)];
    const deja = new Set(ex.traces.map((t) => t.cle));
    const ajout = (cle: string, lib: string, v: string) => {
      if (v && !deja.has(cle)) ex.traces.push(trace(cle, lib, v));
    };
    ajout("titre", "Titre", titre);
    ajout("artiste", "Artiste", artiste);
    ajout("album", "Album", album);
    ajout("annee", "Année", annee);
    ajout("commentaire", "Commentaire", comm);
    if (![titre, artiste, album, annee, comm].some(Boolean)) ex.traces.push(trace("id3v1", "Étiquette ID3v1", "présente"));
  }
  const finAudio = v1 ? v1.debut : o.length;
  if (ape(o, finAudio)) ex.traces.push(trace("ape", "Étiquette APE", "présente"));
  return ex;
}
function nettoyerMp3(o: Uint8Array): { octets: Uint8Array; remarques: string[] } {
  let debut = 0;
  for (let i = 0; i < 16; i++) {
    const et = enteteId3(o, debut);
    if (!et) break;
    debut += et.taille;
  }
  let fin = o.length;
  const v1 = id3v1(o);
  if (v1) fin = v1.debut;
  const a = ape(o, fin);
  if (a && a.debut >= debut) fin = a.debut;
  return { octets: o.slice(debut, Math.max(debut, fin)), remarques: [] };
}

// ---------------------------------------------------------------- PDF

const CLES_INFO: Record<string, [string, boolean]> = {
  Title: ["Titre", false],
  Author: ["Auteur", true],
  Subject: ["Sujet", false],
  Keywords: ["Mots-clés", false],
  Creator: ["Créé avec", false],
  Producer: ["Produit par", false],
  CreationDate: ["Créé le", false],
  ModDate: ["Modifié le", false],
};

async function ouvrirPdf(o: Uint8Array): Promise<{ doc: PDFDocument; dechiffre: boolean }> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(o, { updateMetadata: false, ignoreEncryption: true });
  } catch (e) {
    throw new Error("Ce PDF n'a pas pu être lu : " + (e instanceof Error ? e.message : "fichier abîmé") + ".");
  }
  if (!doc.isEncrypted) return { doc, dechiffre: false };
  try {
    // Les PDF « à restrictions » s'ouvrent avec un mot de passe utilisateur vide.
    return { doc: await PDFDocument.load(o, { updateMetadata: false, password: "" }), dechiffre: true };
  } catch {
    throw new PdfProtege();
  }
}

function dictDe(obj: unknown): PDFDict | undefined {
  if (obj instanceof PDFStream) return obj.dict;
  if (obj instanceof PDFDict) return obj;
  return undefined;
}
function texteObjetPdf(doc: PDFDocument, brut: unknown): string {
  const v = doc.context.lookup(brut as never) as unknown;
  if (v instanceof PDFString || v instanceof PDFHexString) return v.decodeText();
  if (v instanceof PDFName) return v.decodeText();
  if (v instanceof PDFNumber) return String(v.asNumber());
  return v === undefined || v === null ? "" : String(v);
}
function compterEof(o: Uint8Array): number {
  const sig = [0x25, 0x25, 0x45, 0x4f, 0x46];
  let n = 0;
  const limite = o.length - sig.length;
  for (let i = 0; i <= limite; i++) {
    if (o[i] !== 0x25) continue;
    let ok = true;
    for (let k = 1; k < sig.length; k++)
      if (o[i + k] !== sig[k]) {
        ok = false;
        break;
      }
    if (ok) n++;
  }
  return n;
}
const CLE_META = PDFName.of("Metadata");
const CLE_PIECE = PDFName.of("PieceInfo");
const CLE_TYPE = PDFName.of("Type");
const CLE_SUBTYPE = PDFName.of("Subtype");

function nomDe(d: PDFDict, cle: PDFName): string | undefined {
  const v = d.get(cle);
  return v instanceof PDFName ? v.decodeText() : undefined;
}

async function examinerPdf(o: Uint8Array): Promise<Examen> {
  const ex: Examen = { format: "pdf", traces: [], remarques: [], nettoyable: true };
  let ouvert: { doc: PDFDocument; dechiffre: boolean };
  try {
    ouvert = await ouvrirPdf(o);
  } catch (e) {
    if (e instanceof PdfProtege) {
      ex.nettoyable = false;
      ex.remarques.push("Ce PDF est protégé par un mot de passe : déverrouille-le d'abord.");
    } else {
      ex.nettoyable = false;
      ex.remarques.push(e instanceof Error ? e.message : "Ce PDF n'a pas pu être lu.");
    }
    return ex;
  }
  const { doc } = ouvert;
  const ctx = doc.context;
  const info = trouverInfo(doc)?.dict;
  if (info) {
    for (const [k, v] of info.entries()) {
      const nom = k.decodeText();
      let valeur = texteObjetPdf(doc, v).replace(/\0/g, "").trim();
      if (!valeur) continue;
      if (nom === "CreationDate" || nom === "ModDate") valeur = datePdf(valeur);
      const connu = CLES_INFO[nom];
      ex.traces.push(connu ? trace(nom.toLowerCase(), connu[0], valeur, connu[1]) : trace("info-" + nom, nom, valeur));
    }
  }
  let xmp = 0;
  let piece = 0;
  let commentaires = 0;
  for (const [, obj] of ctx.enumerateIndirectObjects()) {
    const d = dictDe(obj);
    if (!d) continue;
    if (d.has(CLE_META)) xmp++;
    if (d.has(CLE_PIECE)) piece++;
    const st = nomDe(d, CLE_SUBTYPE);
    if ((st === "Text" || st === "FreeText" || st === "Popup") && d.has(PDFName.of("Rect"))) commentaires++;
  }
  if (xmp > 0) ex.traces.push(trace("xmp", "Données XMP", xmp > 1 ? `présentes (${xmp} emplacements)` : "présentes"));
  if (piece > 0) ex.traces.push(trace("pieceinfo", "Données privées d'application", "présentes"));
  const versions = compterEof(o) - 1;
  if (versions > 0) ex.remarques.push(`Ce PDF garde ${pluriel(versions, "version antérieure", "versions antérieures")} de son contenu (mises à jour incrémentales) : le nettoyage ${versions > 1 ? "les supprime" : "la supprime"}.`);
  if (commentaires > 0) ex.remarques.push(`Ce PDF contient ${pluriel(commentaires, "annotation de commentaire", "annotations de commentaire")} (notes, zones de texte) : elles ne sont pas retirées.`);
  return ex;
}

/** Références atteignables depuis la racine du catalogue. */
function atteignables(doc: PDFDocument): Set<string> | null {
  const ctx = doc.context;
  const racine = ctx.trailerInfo.Root;
  if (!(racine instanceof PDFRef)) return null;
  const vus = new Set<string>();
  const pile: PDFRef[] = [racine];
  const visiter = (v: unknown, profondeur: number) => {
    if (profondeur > 64) return;
    if (v instanceof PDFRef) pile.push(v);
    else if (v instanceof PDFStream) visiter(v.dict, profondeur + 1);
    else if (v instanceof PDFDict) for (const x of v.values()) visiter(x, profondeur + 1);
    else if (v instanceof PDFArray) for (const x of v.asArray()) visiter(x, profondeur + 1);
  };
  let garde = 0;
  while (pile.length && garde++ < 5_000_000) {
    const r = pile.pop() as PDFRef;
    if (vus.has(r.tag)) continue;
    vus.add(r.tag);
    visiter(ctx.lookup(r), 0);
  }
  return vus;
}

const CLES_INFO_CONNUES = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate"].map((k) => PDFName.of(k));

/**
 * Dictionnaire Info du document. Dans certains PDF chiffrés dont le flux XRef est mal relu,
 * le trailer ne le désigne plus : on retrouve alors l'objet orphelin qui en a la forme.
 */
function trouverInfo(doc: PDFDocument): { ref?: PDFRef; dict: PDFDict } | undefined {
  const ctx = doc.context;
  const brut = ctx.trailerInfo.Info;
  const direct = brut ? ctx.lookup(brut) : undefined;
  if (direct instanceof PDFDict) return { ref: brut instanceof PDFRef ? brut : undefined, dict: direct };
  const vus = atteignables(doc);
  if (!vus) return undefined;
  for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
    if (vus.has(ref.tag) || !(obj instanceof PDFDict) || obj.has(CLE_TYPE)) continue;
    if (CLES_INFO_CONNUES.some((k) => obj.has(k))) return { ref, dict: obj };
  }
  return undefined;
}

/** Supprime tout objet devenu inaccessible (anciennes versions, flux XMP orphelins, XRef, Info…). */
function purgerOrphelins(doc: PDFDocument) {
  const vus = atteignables(doc);
  if (!vus) return;
  for (const [ref] of doc.context.enumerateIndirectObjects()) if (!vus.has(ref.tag)) doc.context.delete(ref);
}

async function nettoyerPdf(o: Uint8Array, ex: Examen): Promise<{ octets: Uint8Array; remarques: string[] }> {
  const { doc, dechiffre } = await ouvrirPdf(o);
  const ctx = doc.context;
  const pages = doc.getPageCount();
  if (dechiffre) {
    // Ce qui ne servait qu'au chiffrement : flux XRef, dictionnaire /Encrypt.
    for (const [ref, obj] of ctx.enumerateIndirectObjects()) {
      const d = dictDe(obj);
      if (d && (nomDe(d, CLE_TYPE) === "XRef" || nomDe(d, PDFName.of("Filter")) === "Standard" || d.has(PDFName.of("Encrypt")))) ctx.delete(ref);
    }
    ctx.trailerInfo.Encrypt = undefined;
  }
  // Retrait du dictionnaire Info (le fichier ne doit plus rien porter, pas même un Producer).
  const info = trouverInfo(doc);
  if (info?.ref) ctx.delete(info.ref);
  ctx.trailerInfo.Info = undefined;
  // Métadonnées XMP et données privées d'application, où qu'elles soient.
  for (const [, obj] of ctx.enumerateIndirectObjects()) {
    const d = dictDe(obj);
    if (!d) continue;
    for (const cle of [CLE_META, CLE_PIECE]) {
      const v = d.get(cle);
      if (v instanceof PDFRef) ctx.delete(v);
      if (v !== undefined) d.delete(cle);
    }
  }
  purgerOrphelins(doc);
  const octets = await doc.save({ useObjectStreams: true, addDefaultPage: false, updateFieldAppearances: false });
  // Vérification : le résultat doit se relire, avec le même nombre de pages.
  const relu = await PDFDocument.load(octets, { updateMetadata: false });
  if (relu.getPageCount() !== pages) throw new Error("Le nettoyage du PDF a échoué : le nombre de pages a changé.");
  const remarques: string[] = [];
  if (dechiffre) remarques.push("Les restrictions du PDF (impression, copie…) ont été levées par le nettoyage.");
  void ex;
  return { octets, remarques };
}

// ---------------------------------------------------------------- ZIP : OOXML et OpenDocument

const DEJA_COMPRESSES = /\.(jpe?g|png|gif|webp|mp3|mp4|m4a|mov|zip|gz|docx|xlsx|pptx|odt|ods|odp|woff2?)$/i;

function dezipper(o: Uint8Array): Record<string, Uint8Array> {
  try {
    return unzipSync(o);
  } catch {
    throw new Error("Ce fichier n'est pas un document valide (archive ZIP illisible).");
  }
}
/** Ré-assemble l'archive en gardant l'ordre d'origine ; `premier` est placé en tête. */
function rezipper(entrees: Record<string, Uint8Array>, premier: string | undefined, mimetypeStocke: boolean): Uint8Array {
  const noms = Object.keys(entrees);
  if (premier && noms.includes(premier)) noms.splice(noms.indexOf(premier), 1);
  const ordre = premier && entrees[premier] !== undefined ? [premier, ...noms] : noms;
  const zip: Zippable = {};
  const date = new Date(1980, 0, 1, 0, 0, 0); // date fixe : ne révèle pas le moment du nettoyage
  for (const nom of ordre) {
    const stocke = (mimetypeStocke && nom === "mimetype") || DEJA_COMPRESSES.test(nom) || nom.endsWith("/");
    zip[nom] = [entrees[nom], { level: stocke ? 0 : 6, mtime: date }];
  }
  return zipSync(zip);
}
const lireTexte = (e: Record<string, Uint8Array>, nom: string) => (e[nom] ? strFromU8(e[nom]) : undefined);

function racineXml(xml: string, nomLocal: string): { prefixe: string; attrs: string } | null {
  const m = new RegExp(`<((?:[\\w.-]+:)?${echapperRe(nomLocal)})((?:\\s[^>]*?)?)\\s*/?>`).exec(xml);
  return m ? { prefixe: m[1], attrs: m[2] } : null;
}

function ajouterElements(ex: Examen, xml: string, defs: [string, string, string, boolean?][], transformer?: (cle: string, v: string) => string) {
  for (const [local, cle, libelle, sensible] of defs) {
    let v = elementXml(xml, local);
    if (!v) continue;
    if (transformer) v = transformer(cle, v);
    if (v) ex.traces.push(trace(cle, libelle, v, !!sensible));
  }
}

function examinerOoxml(o: Uint8Array, format: string): Examen {
  const ex: Examen = { format, traces: [], remarques: [], nettoyable: true };
  const e = dezipper(o);
  const noms = Object.keys(e);
  const core = lireTexte(e, "docProps/core.xml");
  if (core) {
    ajouterElements(
      ex,
      core,
      [
        ["creator", "auteur", "Auteur", true],
        ["lastModifiedBy", "derniere-modification-par", "Dernière modification par", true],
        ["title", "titre", "Titre"],
        ["subject", "sujet", "Sujet"],
        ["keywords", "mots-cles", "Mots-clés"],
        ["description", "description", "Description"],
        ["category", "categorie", "Catégorie"],
        ["contentStatus", "statut", "Statut du contenu"],
        ["revision", "revision", "Nombre de révisions"],
        ["lastPrinted", "imprime", "Imprimé le"],
        ["created", "cree", "Créé le"],
        ["modified", "modifie", "Modifié le"],
      ],
      (cle, v) => (cle === "imprime" || cle === "cree" || cle === "modifie" ? dateIso(v) : v),
    );
  }
  const app = lireTexte(e, "docProps/app.xml");
  if (app) {
    ajouterElements(
      ex,
      app,
      [
        ["Company", "societe", "Société", true],
        ["Manager", "responsable", "Responsable", true],
        ["Template", "modele", "Modèle de document"],
        ["TotalTime", "temps", "Temps d'édition"],
        ["Application", "application", "Application"],
        ["AppVersion", "version", "Version de l'application"],
        ["HyperlinkBase", "base-liens", "Base des liens"],
      ],
      (cle, v) => {
        if (cle !== "temps") return v;
        const min = parseInt(v, 10);
        return isFinite(min) && min > 0 ? dureeLisible(min * 60) : "";
      },
    );
  }
  const perso = lireTexte(e, "docProps/custom.xml");
  if (perso) {
    const re = /<property\b([^>]*)>([\s\S]*?)<\/property>/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(perso)) && n++ < 200) {
      const nom = attributXml(m[1], "name");
      const v = entites(m[2].replace(/<[^>]+>/g, "")).trim();
      if (nom) ex.traces.push(trace("perso-" + nom, nom, v || "(vide)"));
    }
  }
  // Ce qui n'est pas retiré, mais que l'on signale.
  let commentaires = 0;
  let suivies = 0;
  for (const nom of noms) {
    if (format === "docx" && nom === "word/comments.xml") commentaires += (strFromU8(e[nom]).match(/<w:comment\s/g) ?? []).length;
    else if (format === "xlsx" && /^xl\/comments[^/]*\.xml$/.test(nom)) commentaires += (strFromU8(e[nom]).match(/<comment\s/g) ?? []).length;
    else if (format === "xlsx" && /^xl\/threadedComments\//.test(nom)) commentaires += (strFromU8(e[nom]).match(/<threadedComment\s/g) ?? []).length;
    else if (format === "pptx" && /^ppt\/comments\/[^/]+\.xml$/.test(nom)) commentaires += (strFromU8(e[nom]).match(/<(?:\w+:)?cm\s/g) ?? []).length;
  }
  if (format === "docx") {
    const doc = lireTexte(e, "word/document.xml");
    if (doc) suivies = (doc.match(/<w:(?:ins|del)\s/g) ?? []).length;
  }
  if (commentaires > 0) ex.remarques.push(`Ce document contient ${pluriel(commentaires, "commentaire", "commentaires")} avec le nom de leurs auteurs : ils ne sont pas retirés, supprime-les dans l'application avant de l'envoyer.`);
  else if (format === "pptx" && e["ppt/commentAuthors.xml"]) ex.remarques.push("Ce document contient une liste d'auteurs de commentaires : elle n'est pas retirée.");
  if (suivies > 0) ex.remarques.push("Ce document contient des modifications suivies : accepte-les ou refuse-les dans Word avant de l'envoyer.");
  const gens = lireTexte(e, "word/people.xml");
  if (gens) {
    const noms2 = [...gens.matchAll(/w15:author="([^"]*)"/g)].map((m) => entites(m[1])).filter(Boolean);
    if (noms2.length) ex.remarques.push(`La liste des personnes ayant relu ce document (${noms2.slice(0, 5).join(", ")}${noms2.length > 5 ? "…" : ""}) est conservée dans le fichier.`);
  }
  if (noms.some((n) => /^docProps\/thumbnail\./i.test(n))) ex.remarques.push("Le fichier contient une miniature de son contenu : elle n'est pas retirée.");
  return ex;
}

const NS_CORE = 'xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
const ENTETE_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function nettoyerOoxml(o: Uint8Array): { octets: Uint8Array; remarques: string[] } {
  const e = dezipper(o);
  if (e["docProps/core.xml"]) {
    const r = racineXml(strFromU8(e["docProps/core.xml"]), "coreProperties");
    const nom = r ? r.prefixe : "cp:coreProperties";
    const attrs = r ? r.attrs : " " + NS_CORE;
    e["docProps/core.xml"] = strToU8(`${ENTETE_XML}<${nom}${attrs}/>`);
  }
  if (e["docProps/app.xml"]) {
    const xml = strFromU8(e["docProps/app.xml"]);
    const re = /<(?:[\w.-]+:)?(Company|Manager|Template|TotalTime|HyperlinkBase)\b[^>]*?(?:\/>|>[\s\S]*?<\/(?:[\w.-]+:)?\1\s*>)/g;
    e["docProps/app.xml"] = strToU8(xml.replace(re, ""));
  }
  if (e["docProps/custom.xml"]) {
    const xml = strFromU8(e["docProps/custom.xml"]);
    const r = racineXml(xml, "Properties");
    e["docProps/custom.xml"] = strToU8(`${ENTETE_XML}<${r ? r.prefixe : "Properties"}${r ? r.attrs : ' xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"'}/>`);
  }
  return { octets: rezipper(e, "[Content_Types].xml", false), remarques: [] };
}

function secondes(duree: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(duree.trim());
  if (!m) return 0;
  return (+(m[1] ?? 0)) * 86400 + (+(m[2] ?? 0)) * 3600 + (+(m[3] ?? 0)) * 60 + Math.floor(+(m[4] ?? 0));
}

function examinerOdf(o: Uint8Array, format: string): Examen {
  const ex: Examen = { format, traces: [], remarques: [], nettoyable: true };
  const e = dezipper(o);
  const meta = lireTexte(e, "meta.xml");
  if (meta) {
    ajouterElements(
      ex,
      meta,
      [
        ["initial-creator", "auteur-initial", "Auteur initial", true],
        ["creator", "derniere-modification-par", "Dernière modification par", true],
        ["creation-date", "cree", "Créé le"],
        ["date", "modifie", "Modifié le"],
        ["editing-cycles", "revision", "Nombre de révisions"],
        ["editing-duration", "duree", "Temps d'édition"],
        ["generator", "generateur", "Créé avec"],
        ["title", "titre", "Titre"],
        ["subject", "sujet", "Sujet"],
        ["keyword", "mots-cles", "Mots-clés"],
        ["description", "description", "Description"],
        ["printed-by", "imprime-par", "Imprimé par", true],
      ],
      (cle, v) => {
        if (cle === "cree" || cle === "modifie") return dateIso(v);
        if (cle === "duree") {
          const s = secondes(v);
          return s > 0 ? dureeLisible(s) : "";
        }
        return v;
      },
    );
    const re = /<(?:[\w.-]+:)?user-defined\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[\w.-]+:)?user-defined\s*>)/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(meta)) && n++ < 200) {
      const nom = attributXml(m[1], "meta:name");
      if (nom) ex.traces.push(trace("perso-" + nom, nom, entites((m[2] ?? "").replace(/<[^>]+>/g, "")).trim() || "(vide)"));
    }
    const modele = /<(?:[\w.-]+:)?template\b([^>]*)/.exec(meta);
    if (modele) {
      const lien = attributXml(modele[1], "xlink:title") || attributXml(modele[1], "xlink:href");
      if (lien) ex.traces.push(trace("modele", "Modèle de document", lien));
    }
  }
  if (Object.keys(e).includes("Thumbnails/thumbnail.png")) ex.remarques.push("Le fichier contient une miniature de sa première page : elle n'est pas retirée.");
  return ex;
}
function nettoyerOdf(o: Uint8Array): { octets: Uint8Array; remarques: string[] } {
  const e = dezipper(o);
  if (e["meta.xml"]) {
    const xml = strFromU8(e["meta.xml"]);
    const r = racineXml(xml, "document-meta") ?? /<(office:document-meta)((?:\s[^>]*?)?)\s*\/?>/.exec(xml)?.slice(1, 3);
    const nom = r ? (Array.isArray(r) ? r[0] : r.prefixe) : "office:document-meta";
    const attrs = r ? (Array.isArray(r) ? r[1] : r.attrs) : ' xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" office:version="1.2"';
    const pref = nom.includes(":") ? nom.slice(0, nom.indexOf(":") + 1) : "";
    e["meta.xml"] = strToU8(`<?xml version="1.0" encoding="UTF-8"?>\n<${nom}${attrs}><${pref}meta/></${nom}>`);
  }
  return { octets: rezipper(e, "mimetype", true), remarques: [] };
}

// ---------------------------------------------------------------- interface publique

const NON_PRIS_EN_CHARGE = (format: string): Examen => ({
  format,
  traces: [],
  remarques: ["Ce format n'a pas de traces connues : il n'est pas pris en charge par cet outil."],
  nettoyable: false,
});

export async function examiner(octets: Uint8Array, format: string, nom?: string): Promise<Examen> {
  void nom;
  if (!FORMATS_NETTOYABLES.includes(format)) return NON_PRIS_EN_CHARGE(format);
  try {
    switch (format) {
      case "jpg":
        return examinerJpeg(octets);
      case "png":
        return examinerPng(octets);
      case "webp":
        return examinerWebp(octets);
      case "mp3":
        return examinerMp3(octets);
      case "pdf":
        return await examinerPdf(octets);
      case "docx":
      case "xlsx":
      case "pptx":
        return examinerOoxml(octets, format);
      default:
        return examinerOdf(octets, format);
    }
  } catch (e) {
    return { format, traces: [], remarques: ["Ce fichier n'a pas pu être analysé : " + (e instanceof Error ? e.message : "contenu inattendu")], nettoyable: false };
  }
}

export async function nettoyer(octets: Uint8Array, format: string, nom?: string): Promise<{ octets: Uint8Array; retirees: number; remarques: string[] }> {
  void nom;
  if (!FORMATS_NETTOYABLES.includes(format)) throw new Error(`Le format « ${format} » n'est pas pris en charge : aucune trace connue à retirer.`);
  if (format === "pdf") {
    const ex = await examinerPdf(octets);
    const r = await nettoyerPdf(octets, ex); // lève PdfProtege si mot de passe
    return { octets: r.octets, retirees: ex.traces.length, remarques: [...ex.remarques, ...r.remarques] };
  }
  const ex = await examiner(octets, format);
  if (!ex.nettoyable) throw new Error(ex.remarques[0] ?? "Ce fichier ne peut pas être nettoyé.");
  let r: { octets: Uint8Array; remarques: string[] };
  switch (format) {
    case "jpg":
      r = nettoyerJpeg(octets, ex);
      break;
    case "png":
      r = nettoyerPng(octets, ex);
      break;
    case "webp":
      r = nettoyerWebp(octets, ex);
      break;
    case "mp3":
      r = nettoyerMp3(octets);
      break;
    case "docx":
    case "xlsx":
    case "pptx":
      r = nettoyerOoxml(octets);
      break;
    default:
      r = nettoyerOdf(octets);
  }
  return { octets: r.octets, retirees: ex.traces.length, remarques: [...ex.remarques, ...r.remarques] };
}
