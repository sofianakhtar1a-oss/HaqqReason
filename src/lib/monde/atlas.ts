import { DRAPEAUX_URL, PAYS } from "./donnees";
import type { ContinentId, Pays } from "./types";

/*
 * Le Portulan : retrouver un pays, nommer un continent, écrire un nombre à la française.
 * Partagé par le navigateur et le serveur (aucune dépendance au DOM).
 */

export const PAR_CODE: ReadonlyMap<string, Pays> = new Map(PAYS.map((p) => [p.code, p]));

export function pays(code: string): Pays {
  const p = PAR_CODE.get(code);
  if (!p) throw new Error(`Pays inconnu : ${code}`);
  return p;
}

export const CONTINENTS: readonly { id: ContinentId; nom: string; court: string }[] = [
  { id: "afrique", nom: "Afrique", court: "Afrique" },
  { id: "amerique-nord", nom: "Amérique du Nord", court: "Am. du Nord" },
  { id: "amerique-sud", nom: "Amérique du Sud", court: "Am. du Sud" },
  { id: "asie", nom: "Asie", court: "Asie" },
  { id: "europe", nom: "Europe", court: "Europe" },
  { id: "oceanie", nom: "Océanie", court: "Océanie" },
  { id: "antarctique", nom: "Antarctique", court: "Antarctique" },
];
export const NOM_CONTINENT = Object.fromEntries(CONTINENTS.map((c) => [c.id, c.nom])) as Record<ContinentId, string>;

/** Les continents « justes » pour un pays (le principal, et ceux à cheval). */
export const continentsDe = (p: Pays): ContinentId[] => [p.continent, ...(p.continents ?? [])];

export const urlDrapeau = (p: Pays) => `${DRAPEAUX_URL}${p.drapeau}.svg`;

/** « Capitale » pour un État, « chef-lieu » pour un territoire. */
export const motCapitale = (p: Pays) => (p.statut === "territoire" ? "Chef-lieu" : "Capitale");

export const monnaiePrincipale = (p: Pays) => p.monnaies[0] ?? null;

// L'espace insécable ordinaire : toutes les polices du site l'ont (pas toujours l'espace fine).
const espaceFine = "\u00a0";
const fr = (x: string) => x.replace(/[\u202f\u2009]/g, "\u00a0");
const formateurEntier = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const formateurDecimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const entier = { format: (n: number) => fr(formateurEntier.format(n)) };
const decimal = { format: (n: number) => fr(formateurDecimal.format(n)) };

/** 68 720 337 → « 68,7 millions » ; 5 400 → « 5 400 » ; 1,45 milliard. */
export function formatPopulation(n: number | null): string {
  if (n === null) return "Pas d'habitants permanents";
  if (n >= 1e9) return `${decimal.format(n / 1e9)}${espaceFine}milliard${n >= 2e9 ? "s" : ""}`;
  if (n >= 1e6) return `${decimal.format(n / 1e6)}${espaceFine}million${n >= 2e6 ? "s" : ""}`;
  return `${entier.format(n)} habitant${n > 1 ? "s" : ""}`;
}

export function formatNombre(n: number): string {
  return entier.format(n);
}

/** 551 695 → « 551 695 km² » ; 0,44 → « 0,44 km² ». */
export function formatSuperficie(km2: number | null): string {
  if (km2 === null) return "Inconnue";
  if (km2 < 10) return `${fr(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(km2))}${espaceFine}km²`;
  return `${entier.format(Math.round(km2))}${espaceFine}km²`;
}

export const LIBELLES_STATUT: Record<Pays["statut"], string> = {
  etat: "État membre de l'ONU",
  observateur: "État observateur de l'ONU",
  partiel: "Reconnaissance partielle",
  territoire: "Territoire",
};

/** Le pays du jour : le même pour tout le monde, un jour donné (heure de Paris). */
export function paysDuJour(jour: string): Pays {
  const candidats = PAYS.filter((p) => p.quiz && p.capitale);
  let h = 2166136261;
  for (const c of jour) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return candidats[Math.abs(h) % candidats.length];
}

/** La date du jour à Paris (AAAA-MM-JJ), la même que celle de la base de données. */
export function jourDeParis(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
