/**
 * Formes et limites des contributions, partagées entre le serveur et le navigateur.
 * Ce module ne touche ni à la base ni à la session : il peut être chargé partout.
 */

export type TypeContribution = "idee" | "argument";
export type StatutContribution = "en_attente" | "publiee" | "refusee" | "masquee";

/** Ce qu'un lecteur voit d'une contribution. */
export type ContributionPublique = {
  id: string;
  type: TypeContribution;
  pseudo: string;
  titre: string;
  texte: string;
  created_at: string;
  bloc: { slug: string; titre: string; accent: string } | null;
  article: { id: string; titre: string } | null;
};

/** Ce que le créateur voit en plus. */
export type ContributionCreateur = ContributionPublique & {
  statut: StatutContribution;
  motif: string;
  signalements: number;
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

export const LIBELLE_STATUT: Record<StatutContribution, string> = {
  en_attente: "En attente",
  publiee: "Publiée",
  refusee: "Refusée par le filtre",
  masquee: "Masquée",
};
