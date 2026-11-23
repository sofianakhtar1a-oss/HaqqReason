import type { Niveau } from "../types";

/*
 * Les dictées numérotées : 20 par niveau, chacune un petit texte de 8 phrases (anglais, traduction)
 * et le piège d'orthographe à surveiller. Fabriquées par scripts/langues/dictees/ (consignes,
 * contrôle, construction) ; chaque niveau est un fichier à part, chargé quand on l'ouvre.
 */

export type DicteeNumerotee = { n: number; titre: string; piege: string; phrases: [en: string, fr: string][] };

export const DICTEES_PAR_NIVEAU = 20;

const CHARGEURS: Record<Niveau, () => Promise<{ default: unknown }>> = {
  A1: () => import("./A1.json"),
  A2: () => import("./A2.json"),
  B1: () => import("./B1.json"),
  B2: () => import("./B2.json"),
  C1: () => import("./C1.json"),
  C2: () => import("./C2.json"),
};

const chargees = new Map<Niveau, Promise<DicteeNumerotee[]>>();

/** Les dictées d'un niveau ; une seule demande par visite. */
export function chargerDictees(niveau: Niveau): Promise<DicteeNumerotee[]> {
  let p = chargees.get(niveau);
  if (!p) {
    p = CHARGEURS[niveau]().then((m) => (Array.isArray(m.default) ? (m.default as DicteeNumerotee[]) : []));
    p.catch(() => chargees.delete(niveau));
    chargees.set(niveau, p);
  }
  return p;
}

/** Le record d'une dictée numérotée (le suivi garde le meilleur score de chaque série). */
export const serieDicteeNumero = (niveau: Niveau, n: number) => `d:${niveau}:${n}`;
