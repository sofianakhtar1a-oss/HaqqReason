/*
 * L'Écorché — la forme des données : les pièces du modèle 3D (ce qu'on voit et touche) et les éléments
 * à apprendre (ce qu'on nomme). Un élément peut avoir plusieurs pièces : le biceps gauche et le droit,
 * les cinq vertèbres lombaires, les trois parties du sternum…
 */

import type { Maillage } from "./geometrie";
import type { V3 } from "./vec";

export type Couche = "os" | "muscle" | "tendon" | "artere";

export type RegionId = "tete" | "cou" | "thorax" | "abdomen" | "dos" | "bassin" | "epaule" | "bras" | "avant-bras" | "main" | "hanche" | "cuisse" | "jambe" | "pied";

export const REGIONS: { id: RegionId; nom: string; grande: "tete-cou" | "tronc" | "membre-sup" | "membre-inf" }[] = [
  { id: "tete", nom: "La tête", grande: "tete-cou" },
  { id: "cou", nom: "Le cou", grande: "tete-cou" },
  { id: "thorax", nom: "Le thorax", grande: "tronc" },
  { id: "abdomen", nom: "L'abdomen", grande: "tronc" },
  { id: "dos", nom: "Le dos", grande: "tronc" },
  { id: "bassin", nom: "Le bassin", grande: "tronc" },
  { id: "epaule", nom: "L'épaule", grande: "membre-sup" },
  { id: "bras", nom: "Le bras", grande: "membre-sup" },
  { id: "avant-bras", nom: "L'avant-bras", grande: "membre-sup" },
  { id: "main", nom: "La main", grande: "membre-sup" },
  { id: "hanche", nom: "La hanche", grande: "membre-inf" },
  { id: "cuisse", nom: "La cuisse", grande: "membre-inf" },
  { id: "jambe", nom: "La jambe", grande: "membre-inf" },
  { id: "pied", nom: "Le pied", grande: "membre-inf" },
];

export const GRANDES_REGIONS = [
  { id: "tete-cou", nom: "Tête et cou" },
  { id: "tronc", nom: "Tronc" },
  { id: "membre-sup", nom: "Membre supérieur" },
  { id: "membre-inf", nom: "Membre inférieur" },
] as const;
export type GrandeRegion = (typeof GRANDES_REGIONS)[number]["id"];

/** Une pièce du modèle : un maillage, une couche, l'élément qu'elle représente. */
export type Piece = {
  cle: string;
  element: string;
  couche: Couche;
  maillage: Maillage;
  /** Pour les muscles : 0 superficiel, 1 intermédiaire, 2 profond (la profondeur de dissection). */
  profondeur: 0 | 1 | 2;
  cote: "g" | "d" | null;
  /** Une teinte propre et permanente (le cartilage, bleuté), [r, g, b, force] en 0-255. */
  teinte?: [number, number, number, number];
};

export type SorteOs = "long" | "court" | "plat" | "irregulier" | "sesamoide";

/** Un élément à apprendre. */
export type Element = {
  id: string;
  couche: Couche;
  /** Le nom usuel (nomenclature française actuelle). */
  nom: string;
  /** Les autres réponses écrites acceptées (anciens noms, variantes). */
  noms?: string[];
  latin: string;
  anglais: string;
  region: RegionId;
  /** Du plus connu (0) au plus pointu. */
  rang: number;
  /** Combien il y en a (les côtes : 24, les vertèbres lombaires : 5…), si plus de deux. */
  nombre?: number;
  /** Pair (un de chaque côté) ou impair (sur la ligne médiane). */
  pair: boolean;
  /** Muscles. */
  action?: string;
  origine?: string;
  terminaison?: string;
  innervation?: string;
  /** Os. */
  sorte?: SorteOs;
  /** Les os avec lesquels il s'articule (identifiants). */
  articulations?: string[];
  /** Artères : celle dont elle naît, et ce qu'elle irrigue. */
  provenance?: string;
  territoire?: string;
  /** Tendons : le muscle qui le prolonge, l'os où il s'attache. */
  muscle?: string;
  attache?: string;
  /** Une phrase qui aide à retenir. */
  memo?: string;
  /** Une anecdote, une histoire, un fait clinique. */
  anecdote?: string;
};

/** Ce que le moteur reçoit : les pièces rangées par couche, prêtes à être dessinées. */
export type StructureScene = { id: number; cle: string; element: string; couche: Couche; profondeur: 0 | 1 | 2; cote: "g" | "d" | null; centre: V3; rayon: number; teinte?: [number, number, number, number] };
