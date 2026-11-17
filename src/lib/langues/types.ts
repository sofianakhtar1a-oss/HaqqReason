/* Le Truchement : vocabulaire commun (données, moteur, interface, tests). */

export type Niveau = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Nature = "nom" | "verbe" | "adjectif" | "adverbe" | "expression" | "préposition" | "pronom" | "conjonction";

/** Un mot ou une expression d'un thème. */
export type Entree = {
  id: string;
  en: string;
  fr: string;
  nature: Nature;
  niveau: Niveau;
  /** Prononciation en alphabet phonétique international. */
  api: string;
  exEn: string;
  exFr: string;
};

export type Theme = { id: string; nom: string; description: string; icone: string; entrees: Entree[] };

/** Ce qu'un exercice manipule : une entrée de thème ou un mot du dictionnaire personnel. */
export type Element = {
  id: string;
  en: string;
  fr: string;
  nature?: string;
  api?: string;
  exEn?: string;
  exFr?: string;
  /** Forme exacte du mot dans la phrase d'exemple (pour le texte à trous). */
  forme?: string;
};

/* ---------- Répétition espacée ---------- */

export type EtatCarte = "nouveau" | "apprentissage" | "revision" | "reapprentissage";
/** 1 : à revoir · 2 : difficile · 3 : bien · 4 : facile. */
export type Note = 1 | 2 | 3 | 4;

export type Carte = {
  id: string;
  etat: EtatCarte;
  stabilite: number;
  difficulte: number;
  /** Prochaine révision (millisecondes). */
  echeance: number;
  derniere?: number;
  reps: number;
  oublis: number;
  /** Étape d'apprentissage en cours (minutes). */
  pas: number;
};

/* ---------- Dictionnaire personnel ---------- */

export type OrigineMot =
  | { type: "video"; titre: string; ref: string; t: number }
  | { type: "pdf"; titre: string; ref: string; page: number }
  | { type: "theme"; titre: string; ref: string }
  | { type: "manuel"; titre: string };

export type MotPerso = {
  id: string;
  en: string;
  fr: string;
  nature?: string;
  lemme?: string;
  /** Phrase où le mot a été rencontré, et sa traduction. */
  phrase?: string;
  phraseFr?: string;
  /** Forme exacte du mot dans la phrase. */
  forme?: string;
  passage?: boolean;
  origine: OrigineMot;
  ajouteLe: number;
};

/** Les six niveaux du Cadre européen (CECRL), du plus simple au plus avancé. */
export const NIVEAUX: Niveau[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
