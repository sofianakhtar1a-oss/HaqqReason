/*
 * Le Calame — les rappels d'écriture : le calcul des heures, sans rien d'autre (module pur, testé).
 * Le serveur passe tous les quarts d'heure et décide, pour chaque compte, si c'est le moment :
 * le rappel du jour à l'heure choisie (dans son fuseau), et l'échéance d'un document la veille.
 */

export type RappelEcriture = {
  /** Le rappel quotidien. */
  actif: boolean;
  /** « HH:MM », à l'heure de l'auteur. */
  heure: string;
  /** Jours de la semaine (0 : dimanche … 6 : samedi). */
  jours: number[];
  /** Prévenir la veille de l'échéance d'un document. */
  veille: boolean;
  /** Fuseau horaire de l'appareil (« Europe/Paris »). */
  fuseau: string;
};

export const RAPPEL_PAR_DEFAUT: RappelEcriture = { actif: false, heure: "18:00", jours: [0, 1, 2, 3, 4, 5, 6], veille: true, fuseau: "" };
export const FUSEAU_PAR_DEFAUT = "Europe/Paris";
/** Au-delà, un rappel manqué (serveur en retard) n'est plus envoyé : il tomberait à contretemps. */
export const RETARD_MAX_MINUTES = 180;

const HEURE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function fuseauValide(fuseau: unknown): string {
  if (typeof fuseau !== "string" || !fuseau || fuseau.length > 64) return FUSEAU_PAR_DEFAUT;
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: fuseau });
    return fuseau;
  } catch {
    return FUSEAU_PAR_DEFAUT;
  }
}

export function nettoyerRappel(brut: unknown): RappelEcriture {
  const o = (brut ?? {}) as Record<string, unknown>;
  const jours = Array.isArray(o.jours) ? [...new Set(o.jours.map(Number).filter((j) => Number.isInteger(j) && j >= 0 && j <= 6))].sort() : RAPPEL_PAR_DEFAUT.jours;
  return {
    actif: o.actif === true,
    heure: typeof o.heure === "string" && HEURE.test(o.heure) ? o.heure : RAPPEL_PAR_DEFAUT.heure,
    jours,
    veille: o.veille === undefined ? true : o.veille === true,
    fuseau: typeof o.fuseau === "string" ? o.fuseau.slice(0, 64) : "",
  };
}

export const minutesDe = (heure: string): number => {
  const m = HEURE.exec(heure);
  return m ? Number(m[1]) * 60 + Number(m[2]) : 18 * 60;
};

/** La date (AAAA-MM-JJ), l'heure en minutes et le jour de la semaine, dans un fuseau donné. */
export function momentLocal(fuseau: string, quand: Date): { jour: string; minutes: number; semaine: number } {
  const parties = new Intl.DateTimeFormat("en-CA", { timeZone: fuseauValide(fuseau), year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(quand);
  const p = (t: string) => parties.find((x) => x.type === t)?.value ?? "";
  const semaine = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p("weekday"));
  return { jour: `${p("year")}-${p("month")}-${p("day")}`, minutes: Number(p("hour")) * 60 + Number(p("minute")), semaine };
}

/** Le lendemain d'une date AAAA-MM-JJ. */
export function lendemain(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Est-ce le moment du rappel quotidien (et pas déjà envoyé aujourd'hui) ? Renvoie le jour local, ou null. */
export function rappelDu(r: RappelEcriture, quand: Date, dejaLe: string | undefined): string | null {
  if (!r.actif || r.jours.length === 0) return null;
  const ici = momentLocal(r.fuseau, quand);
  if (!r.jours.includes(ici.semaine) || dejaLe === ici.jour) return null;
  const ecart = ici.minutes - minutesDe(r.heure);
  return ecart >= 0 && ecart <= RETARD_MAX_MINUTES ? ici.jour : null;
}

/** L'échéance tombe-t-elle demain, et l'heure de prévenir est-elle venue ? */
export function veilleDue(r: RappelEcriture, quand: Date, echeance: string, dejaPour: string | undefined): boolean {
  if (!r.veille || dejaPour === echeance) return false;
  const ici = momentLocal(r.fuseau, quand);
  if (lendemain(ici.jour) !== echeance) return false;
  const ecart = ici.minutes - minutesDe(r.heure);
  // Passé l'heure choisie (même tard dans la soirée) : on prévient tout de même, la veille compte.
  return ecart >= 0;
}

/** Les échéances possibles « demain », tous fuseaux confondus (pour ne lire que les documents concernés). */
export function echeancesCandidates(quand: Date): string[] {
  const jours = new Set<string>();
  for (const decalage of [-14, -12, 0, 12, 14]) {
    const d = new Date(quand.getTime() + decalage * 3600_000);
    jours.add(lendemain(d.toISOString().slice(0, 10)));
  }
  return [...jours];
}
