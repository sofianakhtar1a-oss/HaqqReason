/*
 * L'Alambic — la carte des conversions.
 *
 * Pour chaque paire (source, destination), dit si la conversion se fait ici, dans le navigateur,
 * avec quel moteur, et ce qu'elle garde. Une conversion impossible a toujours une raison lisible :
 * le sélecteur montre tous les formats, mais n'en propose que ceux qui donneront un vrai fichier.
 *
 * Pur : testé dans tests/test-logique.mts.
 */
import { format, type Famille } from "./formats";

export type Moteur =
  | "document" // texte riche : Word, ODT, RTF, TXT, MD, HTML, EPUB, PDF
  | "pdf-images" // chaque page d'un PDF devient une image
  | "images-pdf" // une image devient une page de PDF
  | "donnees" // tableaux et structures
  | "image" // pixels
  | "media" // son et vidéo (WebCodecs)
  | "video-gif" // une vidéo devient un GIF animé
  | "archive"; // compresser, extraire, changer d'archive

export type Verdict =
  | { possible: true; moteur: Moteur; fidelite: "fidele" | "partielle"; note?: string }
  | { possible: false; raison: string };

/** Ce que le navigateur sait encoder (détecté à l'ouverture de la page ; tout vrai par défaut). */
export type Capacites = { aac: boolean; opus: boolean; h264: boolean; vp9: boolean };
export const CAPACITES_PAR_DEFAUT: Capacites = { aac: true, opus: true, h264: true, vp9: true };

const LECTURE_DOC = new Set(["docx", "odt", "rtf", "txt", "md", "html", "epub", "pdf"]);
const ECRITURE_DOC = new Set(["docx", "odt", "rtf", "txt", "md", "html", "epub", "pdf"]);
const DONNEES = new Set(["xlsx", "csv", "json", "xml", "yaml", "sql"]);
const IMAGES_LUES = new Set(["png", "jpg", "webp", "gif", "bmp", "ico", "svg", "tiff"]);
const IMAGES_ECRITES = new Set(["png", "jpg", "webp", "gif", "bmp", "tiff", "ico"]);
const VIDEO = new Set(["mp4", "webm", "mov", "mkv"]);
const STRUCTURES = new Set(["json", "yaml", "xml"]);

const AVI = "Les navigateurs ne savent ni lire ni écrire l'AVI : il ne se convertit pas ici. Sur ordinateur, VLC ou HandBrake le font.";

/** Raisons des impossibilités entre familles : elles disent pourquoi, pas seulement « non ». */
const ENTRE_FAMILLES: Partial<Record<`${Famille}>${Famille}`, string>> = {
  "document>image": "Un texte ne devient une image qu'en passant par le PDF : convertis-le d'abord en PDF.",
  "document>audio": "Un texte ne contient pas de son.",
  "document>video": "Un texte ne contient pas d'images animées.",
  "document>donnees": "Un texte suivi n'a pas de lignes ni de colonnes à mettre dans un tableau.",
  "donnees>image": "Un tableau de données n'est pas une image.",
  "donnees>audio": "Des données ne contiennent pas de son.",
  "donnees>video": "Des données ne contiennent pas d'images animées.",
  "image>audio": "Une image ne contient pas de son.",
  "image>video": "Une seule image ne fait pas une vidéo.",
  "image>donnees": "Une image n'a pas de lignes ni de colonnes de données.",
  "audio>image": "Un son ne contient pas d'image.",
  "audio>document": "Transformer la parole en texte demande une transcription, que ce studio ne fait pas.",
  "audio>donnees": "Un son n'a pas de lignes ni de colonnes de données.",
  "audio>video": "Un son seul ne fait pas une vidéo : il n'y a aucune image à montrer.",
  "video>document": "Transformer une vidéo en texte demande une transcription, que ce studio ne fait pas.",
  "video>donnees": "Une vidéo n'a pas de lignes ni de colonnes de données.",
  "archive>document": "Une archive contient des fichiers : extrais-la d'abord (en choisissant ZIP ou TAR), puis convertis-les un par un.",
  "archive>donnees": "Une archive contient des fichiers : extrais-la d'abord, puis convertis-les un par un.",
  "archive>image": "Une archive contient des fichiers : extrais-la d'abord, puis convertis-les un par un.",
  "archive>audio": "Une archive contient des fichiers : extrais-la d'abord, puis convertis-les un par un.",
  "archive>video": "Une archive contient des fichiers : extrais-la d'abord, puis convertis-les un par un.",
};

export function verdict(source: string, cible: string, capacites: Capacites = CAPACITES_PAR_DEFAUT): Verdict {
  if (source === cible) return { possible: false, raison: "C'est déjà le format du fichier." };
  if (source === "avi" || cible === "avi") return { possible: false, raison: AVI };

  const fs = format(source).famille;
  const fc = format(cible).famille;

  // Compresser : tout fichier peut entrer dans une archive.
  if (fc === "archive") {
    if (fs === "archive") return { possible: true, moteur: "archive", fidelite: "fidele", note: cible === "zip" ? "Les mêmes fichiers, dans une archive ZIP." : "Les mêmes fichiers, dans une autre archive." };
    return { possible: true, moteur: "archive", fidelite: "fidele", note: "Le fichier est rangé et compressé, sans aucune modification." };
  }

  // Documents
  if (fs === "document" && fc === "document") {
    if (!LECTURE_DOC.has(source) || !ECRITURE_DOC.has(cible)) return { possible: false, raison: "Cette conversion n'est pas prise en charge." };
    if (source === "pdf") return { possible: true, moteur: "document", fidelite: "partielle", note: "Le texte du PDF est repris ; sa mise en page, ses images et ses colonnes ne le sont pas." };
    if (cible === "pdf") return { possible: true, moteur: "document", fidelite: "partielle", note: "Titres, paragraphes, listes, gras, italique et tableaux sont repris ; les images ne le sont pas. Pour l'arabe, passe par Le Calame et imprime en PDF." };
    if (cible === "txt") return { possible: true, moteur: "document", fidelite: "partielle", note: "Le texte est gardé, la mise en forme disparaît." };
    if (source === "txt") return { possible: true, moteur: "document", fidelite: "fidele", note: "Chaque bloc de texte devient un paragraphe." };
    return { possible: true, moteur: "document", fidelite: "fidele", note: "Titres, paragraphes, listes, gras, italique, liens et tableaux sont repris ; les images ne le sont pas." };
  }
  if (source === "pdf" && fc === "image") {
    if (!IMAGES_ECRITES.has(cible) || cible === "ico") return { possible: false, raison: cible === "svg" ? "Une page de PDF rendue en pixels ne devient pas un dessin vectoriel." : "Choisis PNG, JPEG ou WebP pour les pages d'un PDF." };
    return { possible: true, moteur: "pdf-images", fidelite: "fidele", note: "Chaque page devient une image ; plusieurs pages sont livrées dans un ZIP." };
  }

  // Images
  if (fs === "image" && fc === "image") {
    if (cible === "svg") return { possible: false, raison: "Une image en pixels ne devient pas un dessin vectoriel : il faudrait la redessiner." };
    if (!IMAGES_LUES.has(source) || !IMAGES_ECRITES.has(cible)) return { possible: false, raison: "Cette conversion n'est pas prise en charge." };
    const notes: string[] = [];
    if (source === "gif") notes.push("Pour un GIF animé, seule la première image est gardée.");
    if (cible === "jpg") notes.push("La transparence devient blanche.");
    if (cible === "gif") notes.push("Les couleurs sont réduites à 256.");
    if (cible === "ico") notes.push("L'image est ramenée à 256 × 256 au plus.");
    if (source === "svg") notes.push("Le dessin est rendu en pixels, à sa taille d'origine (ou 1024 px).");
    return { possible: true, moteur: "image", fidelite: notes.length && (source === "gif" || cible === "gif") ? "partielle" : "fidele", note: notes.join(" ") || "L'image est reprise telle quelle." };
  }
  if (fs === "image" && cible === "pdf") return { possible: true, moteur: "images-pdf", fidelite: "fidele", note: "L'image occupe une page à sa taille. Pour en réunir plusieurs, utilise « Fusionner »." };

  // Données
  if (fs === "donnees" && fc === "donnees") {
    if (!DONNEES.has(source) || !DONNEES.has(cible)) return { possible: false, raison: "Cette conversion n'est pas prise en charge." };
    if (STRUCTURES.has(source) && STRUCTURES.has(cible)) return { possible: true, moteur: "donnees", fidelite: "fidele", note: "Toute la structure est gardée, même imbriquée." };
    if (STRUCTURES.has(source)) return { possible: true, moteur: "donnees", fidelite: "fidele", note: "Une liste d'objets devient un tableau ; les objets imbriqués sont aplatis en colonnes « parent.enfant »." };
    if (source === "xlsx") return { possible: true, moteur: "donnees", fidelite: "fidele", note: cible === "csv" ? "Chaque feuille devient un CSV (plusieurs feuilles : réunies dans un ZIP) ; les formules donnent leur valeur calculée." : "Chaque feuille est reprise ; les formules donnent leur valeur calculée." };
    return { possible: true, moteur: "donnees", fidelite: "fidele", note: "Chaque ligne est reprise, avec ses en-têtes de colonnes." };
  }
  if (fs === "donnees" && fc === "document") {
    if (["md", "html", "docx", "pdf", "odt"].includes(cible)) return { possible: true, moteur: "donnees", fidelite: "fidele", note: "Les données sont présentées en tableau." };
    return { possible: false, raison: "Choisis Word, PDF, Markdown, page web ou OpenDocument pour présenter des données en tableau." };
  }

  // Son et vidéo
  if (fs === "audio" && fc === "audio") {
    const manque = codecManquant(cible, capacites);
    if (manque) return { possible: false, raison: manque };
    return { possible: true, moteur: "media", fidelite: "fidele", note: cible === "wav" || cible === "flac" ? "Sans perte par rapport au fichier d'origine." : "Bonne qualité, réglable." };
  }
  if (fs === "video" && fc === "video") {
    if (!VIDEO.has(source) || !VIDEO.has(cible)) return { possible: false, raison: "Cette conversion n'est pas prise en charge." };
    const manque = codecManquant(cible, capacites);
    if (manque) return { possible: false, raison: manque };
    return { possible: true, moteur: "media", fidelite: "fidele", note: "Image et son sont repris ; quand le format le permet, ils sont recopiés sans réencodage, donc sans perte et très vite." };
  }
  if (fs === "video" && fc === "audio") {
    const manque = codecManquant(cible, capacites);
    if (manque) return { possible: false, raison: manque };
    return { possible: true, moteur: "media", fidelite: "fidele", note: "Seule la bande-son est gardée." };
  }
  if (fs === "video" && cible === "gif") return { possible: true, moteur: "video-gif", fidelite: "partielle", note: "Les 15 premières secondes (ou l'extrait choisi dans « Découper »), sans le son, à 480 px de large." };
  if (fs === "video" && fc === "image") return { possible: false, raison: "Choisis GIF pour faire une image animée d'une vidéo." };

  const raison = ENTRE_FAMILLES[`${fs}>${fc}`];
  return { possible: false, raison: raison ?? "Ces deux formats n'ont rien en commun à convertir." };
}

function codecManquant(cible: string, c: Capacites): string | null {
  if ((cible === "aac" || cible === "m4a") && !c.aac) return "Ton navigateur ne sait pas produire de l'AAC. Chrome, Edge ou Safari le font ; sinon choisis MP3 ou OGG.";
  if ((cible === "mp4" || cible === "mov") && !c.h264) return "Ton navigateur ne sait pas produire de vidéo H.264. Chrome, Edge ou Safari le font ; sinon choisis WebM.";
  if ((cible === "webm" || cible === "mkv") && !c.vp9 && !c.h264) return "Ton navigateur ne sait pas encoder de vidéo.";
  if (cible === "ogg" && !c.opus) return "Ton navigateur ne sait pas produire d'Opus ; choisis MP3 ou WAV.";
  return null;
}

/** Les destinations possibles d'un format source, dans l'ordre du catalogue. */
export function destinations(source: string, tous: string[], capacites?: Capacites): string[] {
  return tous.filter((c) => verdict(source, c, capacites).possible);
}

/** Destination proposée par défaut, la plus utile pour chaque format. */
const PREFERENCES: Record<string, string[]> = {
  pdf: ["docx", "png", "txt"],
  docx: ["pdf", "odt", "md"],
  odt: ["docx", "pdf"],
  rtf: ["docx", "pdf"],
  txt: ["docx", "pdf"],
  md: ["docx", "pdf", "html"],
  html: ["pdf", "docx", "md"],
  epub: ["pdf", "docx"],
  xlsx: ["csv", "json"],
  csv: ["xlsx", "json"],
  json: ["xlsx", "csv", "yaml"],
  xml: ["json", "xlsx"],
  yaml: ["json"],
  sql: ["xlsx", "csv"],
  png: ["jpg", "webp", "pdf"],
  jpg: ["png", "webp", "pdf"],
  webp: ["png", "jpg"],
  svg: ["png"],
  gif: ["png", "webp"],
  bmp: ["png", "jpg"],
  tiff: ["png", "jpg", "pdf"],
  ico: ["png"],
  mp3: ["wav", "m4a"],
  wav: ["mp3", "flac"],
  ogg: ["mp3"],
  flac: ["mp3", "wav"],
  aac: ["mp3"],
  m4a: ["mp3"],
  mp4: ["mp3", "webm", "gif"],
  webm: ["mp4", "mp3"],
  mov: ["mp4"],
  mkv: ["mp4"],
  zip: ["tar"],
  tar: ["zip"],
  gz: ["zip"],
};

export function destinationParDefaut(source: string, tous: string[], capacites?: Capacites): string | null {
  for (const c of PREFERENCES[source] ?? []) if (verdict(source, c, capacites).possible) return c;
  return destinations(source, tous, capacites)[0] ?? null;
}
