/*
 * L'Alambic — les outils du studio, leurs familles, et ce que chacun sait recevoir.
 *
 * Sert au menu (outils regroupés), à « Continuer avec… » (le résultat d'un outil passe à un autre
 * d'un clic) et à la recherche « Que veux-tu faire ? ». Pur : testé dans tests/test-alambic-studio.mts.
 */
import { extensionDe, format, FORMATS } from "./formats";
import { destinations } from "./graphe";

export type Outil =
  | "convertir"
  | "fusionner"
  | "decouper"
  | "proteger"
  | "transcrire"
  | "organiser"
  | "alleger"
  | "filigraner"
  | "signer"
  | "deverrouiller"
  | "nettoyer"
  | "reconnaitre"
  | "masquer";

/** Tous les outils, dans l'ordre d'origine (le créateur peut les renommer, les déplacer, les masquer). */
export const TOUS_LES_OUTILS: Outil[] = [
  "convertir",
  "fusionner",
  "decouper",
  "proteger",
  "transcrire",
  "organiser",
  "alleger",
  "filigraner",
  "signer",
  "deverrouiller",
  "masquer",
  "nettoyer",
  "reconnaitre",
];

export const estOutil = (x: string): x is Outil => (TOUS_LES_OUTILS as string[]).includes(x);

export type Groupe = "transformer" | "pages" | "securite";

/** Les trois familles du menu. */
export const GROUPES: { id: Groupe; nom: string }[] = [
  { id: "transformer", nom: "Transformer" },
  { id: "pages", nom: "Pages et PDF" },
  { id: "securite", nom: "Sécurité" },
];

export const GROUPE_DE: Record<Outil, Groupe> = {
  convertir: "transformer",
  alleger: "transformer",
  reconnaitre: "transformer",
  transcrire: "transformer",
  fusionner: "pages",
  decouper: "pages",
  organiser: "pages",
  filigraner: "pages",
  signer: "pages",
  proteger: "securite",
  deverrouiller: "securite",
  masquer: "securite",
  nettoyer: "securite",
};

/** Range les outils par famille, en gardant l'ordre choisi par le créateur à l'intérieur de chacune. */
export function parGroupes<T extends { id: Outil }>(outils: T[]): { groupe: (typeof GROUPES)[number]; outils: T[] }[] {
  return GROUPES.map((groupe) => ({ groupe, outils: outils.filter((o) => GROUPE_DE[o.id] === groupe.id) })).filter((g) => g.outils.length > 0);
}

const IMAGES = new Set(["png", "jpg", "webp", "gif", "bmp", "tiff", "ico", "svg", "heic", "avif"]);
const DOCUMENTS = new Set(["docx", "odt", "rtf", "txt", "md", "html", "epub"]);
/** Documents bureautiques rangés en ZIP : Word, Excel, PowerPoint, OpenDocument, EPUB. */
export const BUREAUTIQUE = new Set(["docx", "xlsx", "pptx", "odt", "ods", "odp", "epub"]);
const TOUS_FORMATS = FORMATS.map((f) => f.id);

/** Le format « bureautique » d'un fichier, même quand le catalogue ne le connaît pas (PowerPoint, tableur OpenDocument). */
export function bureautique(id: string, nom = ""): string | null {
  if (BUREAUTIQUE.has(id)) return id;
  const ext = extensionDe(nom);
  return id === "zip" && BUREAUTIQUE.has(ext) ? ext : null;
}

const famille = (id: string) => (FORMATS.some((f) => f.id === id) ? format(id).famille : null);
const sonOuVideo = (id: string) => id !== "avi" && (famille(id) === "audio" || famille(id) === "video");

/** L'outil sait-il travailler sur ce fichier ? `id` : format reconnu ; `nom` : nom du fichier. */
export function accepte(outil: Outil, id: string, nom = ""): boolean {
  switch (outil) {
    case "convertir":
      return FORMATS.some((f) => f.id === id) && destinations(id, TOUS_FORMATS).length > 0;
    case "fusionner":
      return id === "pdf" || IMAGES.has(id) || DOCUMENTS.has(id);
    case "decouper":
      return id === "pdf" || sonOuVideo(id);
    case "proteger":
      return true;
    case "transcrire":
      return sonOuVideo(id);
    case "organiser":
      return id === "pdf";
    case "alleger":
      return id === "pdf" || ["jpg", "png", "webp", "bmp", "tiff", "heic", "avif"].includes(id) || sonOuVideo(id) || bureautique(id, nom) !== null;
    case "filigraner":
      return id === "pdf" || ["png", "jpg", "webp", "bmp", "tiff", "gif", "heic", "avif"].includes(id);
    case "signer":
      return id === "pdf" || ["png", "jpg", "webp", "heic", "avif"].includes(id);
    case "deverrouiller":
      return id === "pdf" || id === "zip";
    case "nettoyer":
      return ["jpg", "png", "webp", "pdf", "mp3"].includes(id) || bureautique(id, nom) !== null;
    case "reconnaitre":
      return id === "pdf" || ["png", "jpg", "webp", "bmp", "tiff", "gif", "heic", "avif"].includes(id);
    case "masquer":
      return id === "pdf" || ["png", "jpg", "webp", "heic", "avif"].includes(id);
  }
}
