/**
 * Réglages du site, modifiables depuis « Paramètres » (espace créateur).
 * Les bornes définies ici sont la référence : le serveur refuse toute valeur hors de ces listes.
 * Ce module est partagé entre le serveur et le navigateur ; il ne touche pas à la base.
 */

export type Reglages = {
  /** Minutes d'inactivité avant la déconnexion automatique du créateur. */
  inactivite_minutes: number;
  /** Durée maximale d'une session, même en restant actif (heures). */
  session_max_heures: number;
  /** La session ne vaut que pour le navigateur qui s'est connecté. */
  lier_appareil: boolean;
  /** Taille maximale d'un fichier envoyé (Mo). */
  taille_max_mo: number;
};

export const REGLAGES_PAR_DEFAUT: Reglages = {
  inactivite_minutes: 30,
  session_max_heures: 12,
  lier_appareil: true,
  taille_max_mo: 50,
};

/** Choix proposés dans la page Paramètres. Toute autre valeur est refusée par le serveur. */
export const CHOIX = {
  inactivite_minutes: [5, 10, 15, 30, 60, 120, 240, 480],
  session_max_heures: [1, 2, 4, 8, 12, 24, 72],
  taille_max_mo: [5, 10, 25, 50, 100, 250, 500, 1000],
} as const;

/** Au-delà, il faut un forfait Supabase payant : l'offre gratuite plafonne à 50 Mo par fichier. */
export const TAILLE_GRATUITE_MO = 50;

export const LIBELLES: Record<keyof Reglages, string> = {
  inactivite_minutes: "Déconnexion automatique après inactivité",
  session_max_heures: "Durée maximale d'une session",
  lier_appareil: "Session liée à l'appareil",
  taille_max_mo: "Taille maximale d'un fichier",
};

export function libelleDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const heures = minutes / 60;
  return heures === 1 ? "1 heure" : `${heures} heures`;
}

export function libelleHeures(heures: number): string {
  if (heures === 1) return "1 heure";
  if (heures % 24 === 0) {
    const jours = heures / 24;
    return jours === 1 ? "1 jour" : `${jours} jours`;
  }
  return `${heures} heures`;
}

/** Ramène des valeurs quelconques (base de données, formulaire) à des réglages sûrs. */
export function nettoyerReglages(brut: unknown): Reglages {
  const o = (brut ?? {}) as Record<string, unknown>;
  const dansLaListe = <T extends number>(valeur: unknown, liste: readonly T[], defaut: T): T => {
    const n = Number(valeur);
    return liste.includes(n as T) ? (n as T) : defaut;
  };
  return {
    inactivite_minutes: dansLaListe(o.inactivite_minutes, CHOIX.inactivite_minutes, REGLAGES_PAR_DEFAUT.inactivite_minutes),
    session_max_heures: dansLaListe(o.session_max_heures, CHOIX.session_max_heures, REGLAGES_PAR_DEFAUT.session_max_heures),
    lier_appareil: o.lier_appareil === undefined ? REGLAGES_PAR_DEFAUT.lier_appareil : o.lier_appareil === true || o.lier_appareil === "true" || o.lier_appareil === "on",
    taille_max_mo: dansLaListe(o.taille_max_mo, CHOIX.taille_max_mo, REGLAGES_PAR_DEFAUT.taille_max_mo),
  };
}
