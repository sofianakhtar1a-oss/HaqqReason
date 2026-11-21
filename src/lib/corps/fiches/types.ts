/*
 * L'Écorché — les fiches enrichies : ce qu'il faut savoir de chaque structure, sous une forme que le site peut
 * afficher et interroger. Elles sont rédigées lot par lot (scripts/corps/donnees/fiches/CONSIGNES.md), recoupées
 * sur au moins deux références, contrôlées (valider_fiches.py), puis réunies par couche (07_fiches.py).
 */
import type { Action } from "../mouvement/gestes";

export type Attache = { texte: string; os?: string[] };

export type FicheMuscle = {
  resume: string;
  origine: Attache[];
  terminaison: Attache[];
  /** La phrase de synthèse (elle sert d'indice : elle ne nomme pas le muscle). */
  action: string;
  /** Toutes les actions, une par couple articulation-mouvement (vocabulaire.json). */
  actions: Action[];
  synergistes?: string[];
  antagonistes?: string[];
  innervation: { nerf?: string | null; texte: string; racines: string[] };
  vascularisation: { texte: string; arteres?: string[] };
  palpation?: string;
  test?: string;
  atteinte: string;
  clinique?: string;
  memo: string;
  variantes?: string;
  divergences?: string;
  sources: string[];
};

export type FicheArtere = {
  resume: string;
  provenance: { artere?: string | null; texte: string };
  trajet: string;
  /** Dans l'ordre où elles naissent. */
  branches?: { artere?: string | null; texte: string }[];
  terminaison: string;
  territoire: { texte: string; structures?: string[] };
  rapports?: string;
  pouls?: { ou: string };
  anastomoses?: string;
  clinique: string;
  memo: string;
  variantes?: string;
  divergences?: string;
  sources: string[];
};

export type FicheOs = {
  resume: string;
  sorte: "long" | "court" | "plat" | "irregulier" | "sesamoide" | "cartilage" | "dent" | "groupe";
  articulations?: { os?: string; nom: string; type?: string }[];
  reliefs?: { nom: string; role: string }[];
  foramens?: { nom: string; contenu: string }[];
  ossification?: string;
  palpation?: string;
  clinique: string;
  memo: string;
  variantes?: string;
  divergences?: string;
  sources: string[];
};

export type FicheTendon = {
  resume: string;
  muscles?: string[];
  attache: string;
  role: string;
  rapports?: string;
  reflexe?: { nom: string; racines: string[] };
  palpation?: string;
  clinique?: string;
  memo?: string;
  variantes?: string;
  divergences?: string;
  /** Vrai quand la fiche est tirée de celle du muscle (un tendon qui n'a pas de nom propre). */
  derive?: boolean;
  sources: string[];
};

export type FichesDe = { muscle: FicheMuscle; artere: FicheArtere; os: FicheOs; tendon: FicheTendon };
export type CoucheAFiches = keyof FichesDe;
export type Fiche = FicheMuscle | FicheArtere | FicheOs | FicheTendon;
export type Source = { titre: string; url: string };
export type Recueil<C extends CoucheAFiches = CoucheAFiches> = { sources: Record<string, Source>; fiches: Record<string, FichesDe[C]> };
