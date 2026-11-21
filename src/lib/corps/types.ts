/*
 * L'Écorché — la forme des données : les pièces du modèle 3D (ce qu'on voit et touche) et les éléments
 * à apprendre (ce qu'on nomme). Un élément peut avoir plusieurs pièces : le biceps gauche et le droit,
 * ses deux chefs ; un ensemble réunit plusieurs éléments (les cinq vertèbres lombaires, les vraies côtes…).
 */

import type { V3 } from "./vec";

/** Les couches que l'on apprend, de la charpente aux organes. */
export type Couche = "os" | "muscle" | "tendon" | "ligament" | "artere" | "veine" | "nerf" | "viscere" | "encephale" | "lymphe";
export const COUCHES: readonly Couche[] = ["os", "muscle", "tendon", "ligament", "artere", "veine", "nerf", "viscere", "encephale", "lymphe"];

/**
 * Les calques du moteur : une couche, ou une enveloppe qu'on ne montre pas d'office (les fascias couvrent les
 * muscles comme une peau, la plèvre cache les poumons), ou les surfaces d'insertion des muscles sur les os.
 */
export type Calque = Couche | "fascia" | "gaine" | "bourse" | "enveloppe" | "insertion";

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

  /* ---------- Ce que donnent les modèles (Z-Anatomy, TA2) ---------- */

  /** Le nom officiel français (Terminologia Anatomica 2), quand le nom usuel en diffère. */
  officiel?: string;
  /** Le numéro TA2. */
  ta2?: string;
  /** Ce que c'est, dans sa couche : cartilage, dent, aponévrose, rétinaculum, capsule, ménisque, bourse… */
  nature?: string;
  /** Une structure que tout le monde n'a pas. */
  inconstant?: boolean;
  /** L'ensemble auquel il appartient (une vertèbre lombaire → les vertèbres lombaires). */
  ensemble?: string;
  /** Pour un ensemble : ses membres. */
  membres?: string[];
  /** Construite ou tracée par L'Écorché d'après ses voisines (les atlas ne l'ont pas). */
  construit?: boolean;
  /** En bref : ce qu'elle est, d'où elle vient, ce qu'elle fait (pour une structure construite sans fiche). */
  resume?: string;
  /** Le nombre de chefs ou de parties modélisés. */
  chefs?: number;
  /** Muscles : le nerf (identifiant), la loge, la famille d'action, les os d'origine et de terminaison (identifiants). */
  nerf?: string;
  loge?: string;
  famille?: string;
  tendineux?: boolean;
  origines?: string[];
  terminaisons?: string[];
  /** Muscles et tendons : 0 superficiel, 1 intermédiaire, 2 profond. */
  profondeur?: number;
  /** L'article qui convient au nom : « le », « la », « l' », « les ». */
  art?: string;
  /** Un tendon porté par le maillage de son muscle (une zone), et non par une pièce à part. */
  zone?: boolean;
  /** Une fiche née d'une règle (« Tendon du … ») : pas de nom latin officiel. */
  genere?: boolean;
  /**
   * Un voile : une structure qui couvre ce qu'on vient voir (le platysma devant le cou, la gaine devant le droit de
   * l'abdomen). On ne la montre qu'avec ce calque, ou quand c'est elle qu'on étudie.
   */
  voile?: "fascia" | "gaine" | "bourse" | "enveloppe";
};

/** Une structure de la scène : une pièce d'un côté du corps, avec le numéro qui la désigne dans le moteur. */
export type StructureScene = {
  id: number;
  cle: string;
  /** L'élément qu'elle représente (vide pour une surface d'insertion). */
  element: string;
  couche: Couche;
  calque: Calque;
  profondeur: 0 | 1 | 2;
  cote: "g" | "d" | null;
  centre: V3;
  rayon: number;
  /** Le nom de la pièce quand il diffère de celui de l'élément (un chef, une partie). */
  nom?: string;
  /** Une couleur propre (les viscères), en hexadécimal. */
  couleur?: string;
  /** Une zone d'une pièce (le tendon d'un muscle) : son code, et le numéro de la pièce qui la porte. */
  zone?: number;
  de?: number;
  /** Le segment du squelette que la pièce suit le plus (pour accrocher une étiquette quand le corps bouge). */
  segment?: number;
  /** Pour un muscle : les deux bouts de la pièce, dans le repère où elle est rangée (côté gauche pour une paire). */
  origine?: V3;
  terminaison?: V3;
};
