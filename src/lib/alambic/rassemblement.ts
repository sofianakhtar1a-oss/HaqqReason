/*
 * L'Alambic — « Rassembler » : le texte de tous ses documents, réuni et copié d'un coup.
 * Ici, la part pure (testée dans tests/test-alambic-rassembler.mts) : à quelle famille de lecture
 * appartient un fichier, lesquels ignorer, dans quel ordre les ranger, comment assembler le texte.
 */
import { extensionDe } from "./formats";

/** La façon de lire un fichier. */
export type GenreLecture = "pdf" | "document" | "texte" | "tableur" | "presentation" | "image" | "svg" | "media" | "archive";

const DOCUMENTS = new Set(["docx", "odt", "rtf", "html", "epub"]);
/** Lus tels quels : leur texte est déjà le meilleur rendu (Markdown, CSV, JSON, sous-titres, code…). */
const TEXTES = new Set(["txt", "md", "csv", "json", "xml", "yaml", "sql"]);
const TABLEURS = new Set(["xlsx", "ods"]);
const PRESENTATIONS = new Set(["pptx", "odp"]);
const IMAGES = new Set(["png", "jpg", "webp", "bmp", "tiff", "gif", "heic", "avif"]);
/** Sons et vidéos que le navigateur sait découper pour la transcription (l'AVI ne l'est pas). */
const MEDIAS = new Set(["mp3", "wav", "ogg", "flac", "aac", "m4a", "mp4", "webm", "mov", "mkv"]);
const ARCHIVES = new Set(["zip", "tar", "gz"]);
/** Extensions de fichiers texte que le catalogue des formats ne connaît pas : lues telles quelles. */
const EXTENSIONS_TEXTE = new Set(["text", "log", "srt", "vtt", "tex", "rst", "org", "adoc", "ini", "cfg", "conf", "toml", "tsv", "js", "ts", "jsx", "tsx", "py", "java", "c", "h", "cpp", "cs", "go", "rs", "rb", "php", "css", "scss", "sh", "bat", "ps1", "r", "swift", "kt", "lua", "pl", "htm", "xhtml", "yml", "markdown"]);

/**
 * La famille de lecture d'un fichier, d'après son format reconnu (ou, à défaut, son extension).
 * null : rien à lire dedans (une icône, un AVI…), ou format inconnu qu'on essaiera de lire comme du texte.
 */
export function genreDe(format: string | null, nom: string): GenreLecture | null {
  const ext = extensionDe(nom);
  const f = format === "zip" && (PRESENTATIONS.has(ext) || TABLEURS.has(ext) || DOCUMENTS.has(ext)) ? ext : format;
  if (f === "pdf") return "pdf";
  if (f && DOCUMENTS.has(f)) return "document";
  if (f && TEXTES.has(f)) return "texte";
  if (f && TABLEURS.has(f)) return "tableur";
  if (f && PRESENTATIONS.has(f)) return "presentation";
  if (f && IMAGES.has(f)) return "image";
  if (f === "svg") return "svg";
  if (f && MEDIAS.has(f)) return "media";
  if (f && ARCHIVES.has(f)) return "archive";
  if (EXTENSIONS_TEXTE.has(ext)) return "texte";
  return null;
}

/** Les fichiers du système qui se glissent dans un dossier (aperçus, réglages cachés) : on les laisse. */
export function aIgnorer(nom: string): boolean {
  const base = nom.split("/").pop() ?? nom;
  return base.startsWith(".") || base.startsWith("~$") || /^(thumbs\.db|desktop\.ini|icon\r?)$/i.test(base);
}

/** Un même fichier ajouté deux fois n'apparaît qu'une fois. */
export const cleFichier = (f: { name: string; size: number; lastModified: number }, chemin = "") => `${chemin || f.name}|${f.size}|${f.lastModified}`;

/** L'ordre « naturel » des noms : « page 2 » avant « page 10 », sans tenir compte des majuscules ni des accents. */
export const ordreNaturel = (a: string, b: string) => a.localeCompare(b, "fr", { numeric: true, sensitivity: "base" });

export function compterMots(texte: string): number {
  return texte.split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;
}

/** Nettoie un texte lu : fins de ligne unifiées, espaces de fin retirés, trois lignes vides au plus. */
export function texteNet(texte: string): string {
  return texte
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/\u0000/g, "")
    .trim();
}

export type PieceTexte = { nom: string; texte: string };

/**
 * Le texte de tous les documents, dans l'ordre de la liste. Avec les titres, chaque document est
 * précédé de son nom (et de son rang), pour qu'on s'y retrouve une fois le tout collé ailleurs.
 */
export function texteRassemble(pieces: PieceTexte[], avecTitres: boolean): string {
  const pleines = pieces.filter((p) => p.texte.trim());
  if (!avecTitres) return pleines.map((p) => p.texte.trim()).join("\n\n\n") + (pleines.length ? "\n" : "");
  const total = pleines.length;
  return (
    pleines
      .map((p, i) => {
        const titre = total > 1 ? `Document ${i + 1} sur ${total} : ${p.nom}` : p.nom;
        return `${titre}\n${"=".repeat(Math.min(80, Math.max(12, titre.length)))}\n\n${p.texte.trim()}`;
      })
      .join("\n\n\n") + (total ? "\n" : "")
  );
}

/** Ces octets ressemblent-ils à du texte (pas d'octet nul au début, hors marque UTF-16) ? */
export function ressembleTexte(octets: Uint8Array): boolean {
  if ((octets[0] === 0xff && octets[1] === 0xfe) || (octets[0] === 0xfe && octets[1] === 0xff)) return true;
  const debut = octets.subarray(0, 4096);
  let controles = 0;
  for (const o of debut) {
    if (o === 0) return false;
    if (o < 9 || (o > 13 && o < 32)) controles++;
  }
  return controles <= debut.length * 0.02;
}

/** Décode un fichier texte : UTF-8 (avec ou sans marque), UTF-16, sinon Windows-1252 (vieux fichiers Windows). */
export function decoderTexte(octets: Uint8Array): string {
  if (octets[0] === 0xff && octets[1] === 0xfe) return new TextDecoder("utf-16le").decode(octets.subarray(2));
  if (octets[0] === 0xfe && octets[1] === 0xff) return new TextDecoder("utf-16be").decode(octets.subarray(2));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(octets).replace(/^﻿/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(octets);
  }
}

/** Un tableau en texte : une ligne par rangée, les cellules séparées par des tabulations (se recolle dans un tableur). */
export function texteDeFeuilles(feuilles: { nom: string; colonnes: string[]; lignes: unknown[][] }[]): string {
  const cellule = (v: unknown) => (v === null || v === undefined ? "" : String(v).replace(/[\t\r\n]+/g, " ").trim());
  return feuilles
    .map((f) => {
      const lignes = [f.colonnes, ...f.lignes].map((l) => l.map(cellule).join("\t").replace(/\t+$/, "")).filter((l) => l.trim());
      return feuilles.length > 1 ? `Feuille « ${f.nom} »\n${lignes.join("\n")}` : lignes.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

/** Le texte d'une diapositive PowerPoint (DrawingML) : un paragraphe par ligne, dans l'ordre. */
export function texteDrawingMl(xml: string): string[] {
  const paragraphes: string[] = [];
  for (const p of xml.split(/<a:p[\s>]/).slice(1)) {
    const morceaux = [...p.split("</a:p>")[0].matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map((m) => entites(m[1]));
    const ligne = morceaux.join("").trim();
    if (ligne) paragraphes.push(ligne);
  }
  return paragraphes;
}

function entites(s: string): string {
  return s.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[0-9a-f]+);/gi, (m, e: string) => {
    const k = e.toLowerCase();
    if (k === "lt") return "<";
    if (k === "gt") return ">";
    if (k === "amp") return "&";
    if (k === "quot") return '"';
    if (k === "apos") return "'";
    const n = k.startsWith("#x") ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
  });
}
