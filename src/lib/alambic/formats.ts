/*
 * L'Alambic — catalogue des formats.
 * Pur : ni navigateur, ni réseau. Testé dans tests/test-logique.mts.
 */

export type Famille = "document" | "donnees" | "image" | "audio" | "video" | "archive";

export type Format = {
  id: string;
  nom: string;
  famille: Famille;
  extensions: string[];
  mime: string;
  /** Une phrase, pour le sélecteur. */
  aide: string;
};

export const FAMILLES: { id: Famille; nom: string; aide: string }[] = [
  { id: "document", nom: "Documents", aide: "Textes et livres" },
  { id: "donnees", nom: "Tableurs et données", aide: "Tableaux, listes, structures" },
  { id: "image", nom: "Images", aide: "Photos, captures, icônes" },
  { id: "audio", nom: "Audio", aide: "Sons, cours, récitations" },
  { id: "video", nom: "Vidéo", aide: "Films et enregistrements" },
  { id: "archive", nom: "Archives", aide: "Plusieurs fichiers en un" },
];

const f = (id: string, nom: string, famille: Famille, extensions: string[], mime: string, aide: string): Format => ({ id, nom, famille, extensions, mime, aide });

export const FORMATS: Format[] = [
  f("pdf", "PDF", "document", ["pdf"], "application/pdf", "Mise en page figée, lisible partout"),
  f("docx", "Word", "document", ["docx"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Microsoft Word, LibreOffice, Google Docs"),
  f("odt", "OpenDocument", "document", ["odt"], "application/vnd.oasis.opendocument.text", "LibreOffice Writer"),
  f("rtf", "RTF", "document", ["rtf"], "application/rtf", "Texte mis en forme, très ancien et universel"),
  f("txt", "Texte brut", "document", ["txt", "text"], "text/plain", "Le texte seul, sans mise en forme"),
  f("md", "Markdown", "document", ["md", "markdown"], "text/markdown", "Texte léger, titres et listes"),
  f("html", "Page web", "document", ["html", "htm"], "text/html", "S'ouvre dans n'importe quel navigateur"),
  f("epub", "Livre numérique", "document", ["epub"], "application/epub+zip", "Liseuses, Apple Livres, Google Play Livres"),

  f("xlsx", "Excel", "donnees", ["xlsx"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Microsoft Excel, LibreOffice Calc"),
  f("csv", "CSV", "donnees", ["csv"], "text/csv", "Tableau en texte, lu par tous les tableurs"),
  f("json", "JSON", "donnees", ["json"], "application/json", "Données structurées des applications"),
  f("xml", "XML", "donnees", ["xml"], "application/xml", "Données balisées"),
  f("yaml", "YAML", "donnees", ["yaml", "yml"], "application/yaml", "Données lisibles par un humain"),
  f("sql", "SQL", "donnees", ["sql"], "application/sql", "Instructions pour une base de données"),

  f("png", "PNG", "image", ["png"], "image/png", "Sans perte, garde la transparence"),
  f("jpg", "JPEG", "image", ["jpg", "jpeg"], "image/jpeg", "Photos, fichiers légers"),
  f("webp", "WebP", "image", ["webp"], "image/webp", "Moderne et très léger"),
  f("svg", "SVG", "image", ["svg"], "image/svg+xml", "Dessin vectoriel, net à toutes les tailles"),
  f("gif", "GIF", "image", ["gif"], "image/gif", "256 couleurs, compatible partout"),
  f("bmp", "BMP", "image", ["bmp"], "image/bmp", "Image brute, non compressée"),
  f("tiff", "TIFF", "image", ["tif", "tiff"], "image/tiff", "Impression et numérisation"),
  f("ico", "ICO", "image", ["ico"], "image/x-icon", "Icône de site ou d'application"),

  f("mp3", "MP3", "audio", ["mp3"], "audio/mpeg", "Le plus répandu"),
  f("wav", "WAV", "audio", ["wav"], "audio/wav", "Sans compression, qualité studio"),
  f("ogg", "OGG", "audio", ["ogg", "oga", "opus"], "audio/ogg", "Libre, très bonne qualité"),
  f("flac", "FLAC", "audio", ["flac"], "audio/flac", "Sans perte, compressé"),
  f("aac", "AAC", "audio", ["aac"], "audio/aac", "Son de qualité, léger"),
  f("m4a", "M4A", "audio", ["m4a"], "audio/mp4", "Apple, iPhone, iTunes"),

  f("mp4", "MP4", "video", ["mp4", "m4v"], "video/mp4", "Lu partout : téléphones, ordinateurs, réseaux"),
  f("webm", "WebM", "video", ["webm"], "video/webm", "Le format libre du web"),
  f("mov", "MOV", "video", ["mov", "qt"], "video/quicktime", "Apple, iPhone"),
  f("mkv", "MKV", "video", ["mkv"], "video/x-matroska", "Plusieurs pistes et sous-titres"),
  f("avi", "AVI", "video", ["avi"], "video/x-msvideo", "Ancien format de Windows"),

  f("zip", "ZIP", "archive", ["zip"], "application/zip", "S'ouvre partout d'un double clic"),
  f("tar", "TAR", "archive", ["tar"], "application/x-tar", "Archive Linux et macOS"),
  f("gz", "TAR.GZ", "archive", ["gz", "tgz"], "application/gzip", "Archive compressée Linux et macOS"),
];

const PAR_ID = new Map(FORMATS.map((x) => [x.id, x]));
export function format(id: string): Format {
  const x = PAR_ID.get(id);
  if (!x) throw new Error(`Format inconnu : ${id}`);
  return x;
}

/** Formats que le studio manipule sans les convertir (Nettoyer, Alléger, Déverrouiller…). */
const HORS_CATALOGUE: Record<string, { nom: string; famille: Famille }> = {
  pptx: { nom: "PowerPoint", famille: "document" },
  ods: { nom: "Classeur OpenDocument", famille: "donnees" },
  odp: { nom: "Présentation OpenDocument", famille: "document" },
};

/** Nom lisible d'un format, même hors du catalogue de conversion ; « Fichier » s'il est inconnu. */
export function nomDuFormat(id: string): string {
  return PAR_ID.get(id)?.nom ?? HORS_CATALOGUE[id]?.nom ?? (id ? id.toUpperCase() : "Fichier");
}

/** Famille d'un format, même hors du catalogue (les inconnus sont rangés avec les archives). */
export function familleDuFormat(id: string): Famille {
  return PAR_ID.get(id)?.famille ?? HORS_CATALOGUE[id]?.famille ?? "archive";
}

export function famille(id: Famille) {
  return FAMILLES.find((x) => x.id === id)!;
}

/** Extension du nom de fichier (en minuscules), avec « tar.gz » reconnu comme un tout. */
export function extensionDe(nom: string): string {
  const bas = nom.toLowerCase();
  if (bas.endsWith(".tar.gz")) return "gz";
  const i = bas.lastIndexOf(".");
  return i < 0 ? "" : bas.slice(i + 1);
}

function commence(octets: Uint8Array, ...valeurs: number[]): boolean {
  return valeurs.every((v, i) => octets[i] === v);
}
function ascii(octets: Uint8Array, debut: number, fin: number): string {
  return String.fromCharCode(...octets.slice(debut, fin));
}

/**
 * Reconnaît le format d'un fichier : d'abord par son contenu (les premiers octets), puis par son nom.
 * `entrees` : pour un ZIP, la liste de ses fichiers internes (distingue Word, Excel, OpenDocument, EPUB).
 */
export function detecter(nom: string, octets: Uint8Array, entrees?: string[]): string | null {
  const ext = extensionDe(nom);
  const parExtension = FORMATS.find((x) => x.extensions.includes(ext))?.id ?? null;

  if (commence(octets, 0x25, 0x50, 0x44, 0x46)) return "pdf";
  if (commence(octets, 0x89, 0x50, 0x4e, 0x47)) return "png";
  if (commence(octets, 0xff, 0xd8, 0xff)) return "jpg";
  if (ascii(octets, 0, 4) === "GIF8") return "gif";
  if (commence(octets, 0x42, 0x4d) && parExtension === "bmp") return "bmp";
  if (commence(octets, 0x49, 0x49, 0x2a, 0x00) || commence(octets, 0x4d, 0x4d, 0x00, 0x2a)) return "tiff";
  if (commence(octets, 0x00, 0x00, 0x01, 0x00)) return "ico";
  if (ascii(octets, 0, 4) === "RIFF") {
    const type = ascii(octets, 8, 12);
    if (type === "WEBP") return "webp";
    if (type === "WAVE") return "wav";
    if (type === "AVI ") return "avi";
  }
  if (ascii(octets, 0, 4) === "fLaC") return "flac";
  if (ascii(octets, 0, 4) === "OggS") return "ogg";
  if (ascii(octets, 0, 3) === "ID3" || (octets[0] === 0xff && (octets[1] & 0xe6) === 0xe2)) return parExtension === "aac" ? "aac" : "mp3";
  if (octets[0] === 0xff && (octets[1] & 0xf6) === 0xf0) return "aac";
  if (commence(octets, 0x1a, 0x45, 0xdf, 0xa3)) return parExtension === "mkv" ? "mkv" : parExtension === "webm" ? "webm" : ascii(octets, 0, 64).includes("webm") ? "webm" : "mkv";
  if (ascii(octets, 4, 8) === "ftyp") {
    const marque = ascii(octets, 8, 12);
    if (marque.startsWith("qt")) return "mov";
    if (marque.startsWith("M4A") || parExtension === "m4a") return "m4a";
    return parExtension === "mov" ? "mov" : "mp4";
  }
  if (ascii(octets, 4, 8) === "moov" || ascii(octets, 4, 8) === "mdat" || ascii(octets, 4, 8) === "wide") return parExtension === "mov" ? "mov" : "mp4";
  if (commence(octets, 0x1f, 0x8b)) return "gz";
  if (ascii(octets, 257, 262) === "ustar") return "tar";
  if (commence(octets, 0x50, 0x4b, 0x03, 0x04) || commence(octets, 0x50, 0x4b, 0x05, 0x06)) {
    const e = entrees ?? [];
    if (e.includes("word/document.xml")) return "docx";
    if (e.includes("xl/workbook.xml")) return "xlsx";
    if (e.includes("mimetype") && ascii(octets, 30, 38) === "mimetype") {
      const debut = ascii(octets, 38, 80);
      if (debut.startsWith("application/epub+zip")) return "epub";
      if (debut.startsWith("application/vnd.oasis.opendocument.text")) return "odt";
    }
    if (e.includes("META-INF/container.xml")) return "epub";
    if (e.includes("content.xml") && parExtension === "odt") return "odt";
    return parExtension && ["docx", "xlsx", "odt", "epub"].includes(parExtension) ? parExtension : "zip";
  }
  if (ascii(octets, 0, 5) === "{\\rtf") return "rtf";

  // Formats texte : l'extension décide, puis quelques indices.
  if (parExtension) return parExtension;
  const debut = new TextDecoder().decode(octets.slice(0, 2048)).trimStart();
  if (/^<svg[\s>]/i.test(debut) || /^<\?xml[^>]*>\s*(<!--[\s\S]*?-->\s*)*<svg/i.test(debut)) return "svg";
  if (/^<!doctype html|^<html/i.test(debut)) return "html";
  if (debut.startsWith("<?xml") || /^<[a-z_][\w.-]*[\s>]/i.test(debut)) return "xml";
  if (debut.startsWith("{") || debut.startsWith("[")) return "json";
  return "txt";
}

/** Nom du fichier produit : même nom, nouvelle extension. */
export function nomConverti(nom: string, cible: string): string {
  const ext = extensionDe(nom);
  const base = ext === "gz" && nom.toLowerCase().endsWith(".tar.gz") ? nom.slice(0, -7) : ext ? nom.slice(0, -(ext.length + 1)) : nom;
  const suffixe = cible === "gz" ? "tar.gz" : format(cible).extensions[0];
  return `${base || "fichier"}.${suffixe}`;
}

export function tailleLisible(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  const unites = ["Ko", "Mo", "Go", "To"];
  let v = octets / 1024;
  let i = 0;
  while (v >= 1024 && i < unites.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 ? Math.round(v) : v.toFixed(1).replace(".", ",")} ${unites[i]}`;
}
