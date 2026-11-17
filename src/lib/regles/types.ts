import type { TempsId } from "./conjugueur";

/*
 * Une leçon des Règles : quatre étapes, toujours dans le même ordre.
 * 1. Le déclic : une image de la vie de tous les jours, comprise en dix secondes.
 * 2. La démonstration : des phrases colorées qui se construisent sous les yeux.
 * 3. Le défi : des questions où chaque erreur donne un indice.
 * 4. Le secret d'expert : le truc pour ne plus jamais tomber dans le piège.
 *
 * Phrases colorées : [code:texte]. Codes et couleurs :
 * s sujet (vert) · v verbe (corail) · r radical, le corps (azur) · t terminaison, le costume (or)
 * a auxiliaire, le moteur (violet) · p participe (rose) · n nom (azur) · d déterminant (cyan)
 * j adjectif (rose) · c complément (or) · o pronom (cyan) · k mot-lien (violet)
 * x le piège (souligné) · m lettre muette (pâle)
 */

export type Niveau = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const NIVEAUX: Niveau[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type Code = "s" | "v" | "r" | "t" | "a" | "p" | "n" | "d" | "j" | "c" | "o" | "k" | "x" | "m";

/** Question à choix : la première option est la bonne (l'ordre est mélangé à l'écran). */
export type Choix = { q: string; o: string[]; i: string; e: string; io?: Record<string, string> };
/** Question à écrire : plusieurs réponses acceptées. */
export type Ecrire = { q: string; r: string[]; i: string; e: string };
/** Question à toucher : les mots à trouver sont marqués d'une étoile (*chat). */
export type Toucher = { q: string; p: string; i: string; e: string };
export type Question = Choix | Ecrire | Toucher;

export const estChoix = (x: Question): x is Choix => "o" in x;
export const estEcrire = (x: Question): x is Ecrire => "r" in x;

export type Lecon = {
  id: string;
  niveau: Niveau;
  /** Le titre de l'aventure. */
  titre: string;
  /** Le nom de la notion dans un cahier d'école, pour s'y retrouver. */
  notion: string;
  /** Le personnage ou l'objet de l'univers (un ou deux émojis). */
  heros: string;
  declic: {
    /** La scène : quelques émojis qui entrent l'un après l'autre. */
    scene: string;
    /** La métaphore, en une phrase forte. */
    image: string;
    /** Ce qu'elle veut dire, en deux ou trois phrases. */
    sens: string;
  };
  demo: {
    /** Libellés propres à la leçon pour les couleurs utilisées. */
    legende?: Partial<Record<Code, string>>;
    etapes: { p: string; n: string }[];
    /** La Machine à voyager dans le temps, réglée pour la leçon. */
    machine?: { temps: TempsId[]; verbes: string[] };
  };
  defi: Question[];
  secret: { titre: string; texte: string; formule?: string };
};

export type Section = {
  id: "conjugaison" | "grammaire";
  nom: string;
  univers: string;
  accroche: string;
  heros: string;
  grades: Record<Niveau, string>;
  lecons: Lecon[];
};

export const LEGENDE_DEFAUT: Record<Code, string> = {
  s: "le sujet, celui qui agit",
  v: "le verbe, l'action",
  r: "le corps du verbe (radical)",
  t: "son costume (terminaison)",
  a: "le moteur (auxiliaire)",
  p: "le participe",
  n: "le nom",
  d: "le petit mot devant (déterminant)",
  j: "l'adjectif, le mot qui décrit",
  c: "le complément",
  o: "le pronom, le remplaçant",
  k: "le mot-lien",
  x: "le piège",
  m: "la lettre muette",
};
