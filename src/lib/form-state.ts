/** État renvoyé par les formulaires du mode créateur. */
export type EtatFormulaire =
  | { statut: "initial" }
  | { statut: "erreur"; message: string }
  | { statut: "succes"; message?: string; cle?: string };

export const ETAT_INITIAL: EtatFormulaire = { statut: "initial" };
