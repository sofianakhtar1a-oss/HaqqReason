/*
 * Ce qu'un compte peut ranger sur le serveur. Ces plafonds protègent l'hébergement gratuit :
 * ils sont larges pour un usage normal (des centaines de documents), et se règlent ici.
 */

/** Les familles de données rangées par compte. Tout autre nom est refusé. */
export const MAGASINS = [
  "calame-documents",
  "calame-fichiers",
  "calame-preferences",
  "calame-journal",
  "calame-bibliotheque",
  "calame-versions",
  "regles",
  "regles-suivi",
  "langues-cartes",
  "langues-dictionnaire",
  "langues-journal",
  "langues-medias",
  "langues-documents",
  "transcriptions",
  "reprise",
  "favoris",
  "reglages",
  "monde",
  "corps",
] as const;
export type NomMagasin = (typeof MAGASINS)[number];

/** Poids maximal d'un seul objet (un document, une transcription…), en octets de JSON. */
export const OBJET_MAX = 3_000_000;
/** Poids total des données d'un compte. */
export const PLAFOND_DONNEES = 60_000_000;
/** Un fichier joint (image, PDF) plus lourd reste sur l'appareil où il a été ajouté. */
export const FICHIER_MAX = 20_000_000;
/** Poids total des fichiers joints d'un compte. */
export const PLAFOND_FICHIERS = 150_000_000;
/** Nombre d'écritures acceptées dans un seul envoi. */
export const LOT_MAX = 200;
/** Poids d'une réponse de lecture : la suite se redemande. */
export const REPONSE_MAX = 2_500_000;
