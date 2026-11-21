/*
 * Les mots d'une phrase d'histoire : le découpage est le même à la fabrication (gloses préparées
 * d'avance) et dans la liseuse (le mot touché), pour que chaque mot retrouve sa glose.
 */

/** Les mots d'une phrase, tels qu'affichés (avec leur ponctuation). */
export const motsDe = (phrase: string) => phrase.split(/\s+/).filter(Boolean);

/** Un mot à traduire : il contient au moins une lettre (pas un tiret seul, pas un nombre). */
export const estMot = (mot: string) => /\p{L}/u.test(mot);

/** La clé d'un mot : en minuscules, apostrophes droites, sans la ponctuation qui l'entoure. */
export const cleMot = (mot: string) =>
  mot
    .normalize("NFC")
    .replace(/[’‘ʼ]/g, "'")
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .toLowerCase();

/** Glose : le sens dans la phrase, la forme de dictionnaire, la nature, le sens de base (mot fléchi). */
export type Glose = [sens: string, lemme: string, nature: string, base?: string];

export const NATURES_GLOSE: Record<string, string> = {
  n: "nom",
  v: "verbe",
  a: "adjectif",
  d: "adverbe",
  p: "pronom",
  r: "préposition",
  c: "conjonction",
  t: "déterminant",
  x: "particule",
  np: "nom propre",
};

/** Le nombre de mots d'un texte (ceux qui ont une lettre). */
export const compterMots = (texte: string) => motsDe(texte).filter(estMot).length;
