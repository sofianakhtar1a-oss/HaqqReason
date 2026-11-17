/**
 * Formes et limites des contributions, partagées entre le serveur et le navigateur.
 * Ce module ne touche ni à la base ni à la session : il peut être chargé partout.
 */

export type TypeContribution = "idee" | "argument" | "site";
/** Pour « Amélioration du site » : une idée de fonctionnalité ou un bug. */
export type NatureSite = "fonctionnalite" | "bug";
export type StatutContribution = "en_attente" | "publiee" | "refusee" | "masquee";

/** Ce qu'un lecteur voit d'une contribution. */
export type ContributionPublique = {
  id: string;
  type: TypeContribution;
  nature: NatureSite | "";
  pseudo: string;
  titre: string;
  texte: string;
  created_at: string;
  bloc: { slug: string; titre: string; accent: string } | null;
  article: { id: string; titre: string } | null;
  /** Les réponses du créateur, montrées sous une contribution publiée. */
  reponses: MessageContribution[];
};

export type MessageContribution = { id: string; auteur: "createur" | "lecteur"; texte: string; lu: boolean; created_at: string };

/** Ce que le créateur voit en plus. */
export type ContributionCreateur = ContributionPublique & {
  statut: StatutContribution;
  motif: string;
  signalements: number;
  /** Le créateur a-t-il ouvert cette contribution et ses derniers messages ? */
  lue: boolean;
  /** Toute la conversation, réponses du lecteur comprises. */
  messages: MessageContribution[];
  /** L'auteur peut-il lire les réponses (il a gardé son jeton) ? */
  suivie: boolean;
  derniere_activite: string;
};

/** Ce que l'auteur voit de sa propre contribution, dans « Mes messages ». */
export type ContributionSuivie = {
  jeton: string;
  id: string;
  type: TypeContribution;
  nature: NatureSite | "";
  titre: string;
  texte: string;
  statut: StatutContribution;
  created_at: string;
  messages: MessageContribution[];
};

export const LIMITES_CONTRIBUTION = {
  titre: 160,
  texte: 4000,
  pseudo: 40,
  titreMin: 5,
  texteMin: 20,
  /** Envois acceptés depuis une même adresse, par heure puis par jour. */
  parHeure: 3,
  parJour: 10,
} as const;

/** Au bout de ce nombre de signalements, la contribution quitte la vue publique. */
export const SIGNALEMENTS_AVANT_MASQUAGE = 3;

export const NOM_TYPE: Record<TypeContribution, string> = {
  idee: "Idée de sujet",
  argument: "Argument proposé",
  site: "Amélioration du site",
};

export const NOM_NATURE: Record<NatureSite, string> = {
  fonctionnalite: "Idée de fonctionnalité",
  bug: "Bug signalé",
};

/** Messages d'une conversation : longueur et cadence pour le lecteur. */
export const LIMITES_MESSAGE = { texte: 4000, parHeure: 10 } as const;

/** Nombre de conversations qu'un navigateur peut suivre. */
export const SUIVIS_MAX = 50;

export const LIBELLE_STATUT: Record<StatutContribution, string> = {
  en_attente: "En attente",
  publiee: "Publiée",
  refusee: "Refusée par le filtre",
  masquee: "Masquée",
};
