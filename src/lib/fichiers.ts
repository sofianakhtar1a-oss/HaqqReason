/** Types de fichiers acceptés et petits outils. Module partagé entre le serveur et le navigateur. */

export type Famille = "pdf" | "image" | "document";

export const TYPES_FICHIERS: Record<string, { extension: string; libelle: string; famille: Famille }> = {
  "application/pdf": { extension: "pdf", libelle: "PDF", famille: "pdf" },
  "image/jpeg": { extension: "jpg", libelle: "Image JPEG", famille: "image" },
  "image/png": { extension: "png", libelle: "Image PNG", famille: "image" },
  "image/webp": { extension: "webp", libelle: "Image WebP", famille: "image" },
  "image/gif": { extension: "gif", libelle: "Image GIF", famille: "image" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { extension: "docx", libelle: "Document Word", famille: "document" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { extension: "xlsx", libelle: "Classeur Excel", famille: "document" },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { extension: "pptx", libelle: "Présentation PowerPoint", famille: "document" },
  "application/vnd.oasis.opendocument.text": { extension: "odt", libelle: "Document OpenDocument", famille: "document" },
  "application/epub+zip": { extension: "epub", libelle: "Livre numérique EPUB", famille: "document" },
  "text/plain": { extension: "txt", libelle: "Texte", famille: "document" },
};

/** 50 Mo : limite par fichier de l'offre gratuite de Supabase. */
export const TAILLE_MAX = 50 * 1024 * 1024;

/** Type déduit de l'extension (les navigateurs ne renseignent pas toujours le type). */
export function typeDepuisNom(nom: string, typeDeclare: string): string | null {
  if (TYPES_FICHIERS[typeDeclare]) return typeDeclare;
  const extension = nom.split(".").pop()?.toLowerCase();
  const alias: Record<string, string> = { jpeg: "jpg" };
  const cherchee = alias[extension ?? ""] ?? extension;
  return Object.entries(TYPES_FICHIERS).find(([, t]) => t.extension === cherchee)?.[0] ?? null;
}

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

/**
 * Vérifie le TYPE RÉEL d'un fichier d'après ses premiers octets (sa « signature »),
 * pour qu'un fichier piégé ne puisse pas se faire passer pour un PDF ou une image.
 */
export function signatureValide(octets: Uint8Array, typeMime: string): boolean {
  const debut = (...valeurs: number[]) => valeurs.every((v, i) => octets[i] === v);
  const texte = (depart: number, chaine: string) => [...chaine].every((c, i) => octets[depart + i] === c.charCodeAt(0));
  switch (typeMime) {
    case "application/pdf":
      return texte(0, "%PDF-");
    case "image/png":
      return debut(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    case "image/jpeg":
      return debut(0xff, 0xd8, 0xff);
    case "image/gif":
      return texte(0, "GIF87a") || texte(0, "GIF89a");
    case "image/webp":
      return texte(0, "RIFF") && texte(8, "WEBP");
    case "text/plain":
      // Du texte ne contient pas d'octet nul.
      return octets.length > 0 && !octets.includes(0);
    default:
      // Word, Excel, PowerPoint, OpenDocument et EPUB sont des archives ZIP.
      return debut(0x50, 0x4b, 0x03, 0x04);
  }
}
