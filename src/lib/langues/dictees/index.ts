import { refusPremium } from "@/lib/client/premium";
import type { Niveau } from "../types";

/*
 * Les dictées numérotées : 20 par niveau, chacune un petit texte de 8 phrases (anglais, traduction)
 * et le piège d'orthographe à surveiller. Fabriquées par scripts/langues/dictees/ (consignes,
 * contrôle, construction), rangées hors du dossier public (donnees/langues/dictees/) : la liste
 * (numéro et titre) se charge librement, le texte d'une dictée seulement à son ouverture, après
 * vérification des droits Premium.
 */

export type DicteeNumerotee = { n: number; titre: string; piege: string; phrases: [en: string, fr: string][] };
/** Ce que la liste montre de chaque dictée. */
export type TitreDictee = { n: number; titre: string };

export const DICTEES_PAR_NIVEAU = 20;

/** Refus Premium : la fenêtre Premium s'est ouverte, il n'y a rien d'autre à afficher. */
export class DicteeReservee extends Error {
  constructor() {
    super("Cette dictée fait partie de l'accès Premium.");
    this.name = "DicteeReservee";
  }
}

const chargees = new Map<Niveau, Promise<TitreDictee[]>>();

/** Les dictées d'un niveau (numéros et titres) ; une seule demande par visite. */
export function chargerDictees(niveau: Niveau): Promise<TitreDictee[]> {
  let p = chargees.get(niveau);
  if (!p) {
    p = fetch(`/api/langues/dictees/${niveau}`, { credentials: "same-origin" }).then(async (r) => {
      if (!r.ok) throw new Error("Les dictées n'ont pas pu se charger.");
      const l = (await r.json()) as unknown;
      return Array.isArray(l) ? (l as TitreDictee[]) : [];
    });
    p.catch(() => chargees.delete(niveau));
    chargees.set(niveau, p);
  }
  return p;
}

/** Le texte d'une dictée numérotée (le serveur compte l'ouverture si la partie est limitée). */
export async function chargerDictee(niveau: Niveau, n: number): Promise<DicteeNumerotee> {
  const r = await fetch(`/api/langues/dictees/${niveau}/${n}`, { credentials: "same-origin", cache: "no-store" });
  if (await refusPremium(r, "truchement.dictees")) throw new DicteeReservee();
  if (r.status === 404) throw new Error(`La dictée n° ${n} du niveau ${niveau} n'existe pas.`);
  if (!r.ok) throw new Error("La dictée n'a pas pu se charger. Vérifie ta connexion.");
  return (await r.json()) as DicteeNumerotee;
}

/** Les six phrases d'une dictée surprise, tirées par le serveur. */
export async function chargerSurprise(niveau: Niveau): Promise<{ en: string; fr: string }[]> {
  const r = await fetch(`/api/langues/dictees/${niveau}/surprise`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (await refusPremium(r, "truchement.dictee-surprise")) throw new DicteeReservee();
  if (!r.ok) throw new Error("Les phrases n'ont pas pu se charger. Vérifie ta connexion.");
  const v = (await r.json()) as { phrases?: { en: string; fr: string }[] };
  return Array.isArray(v.phrases) ? v.phrases : [];
}

/** Le record d'une dictée numérotée (le suivi garde le meilleur score de chaque série). */
export const serieDicteeNumero = (niveau: Niveau, n: number) => `d:${niveau}:${n}`;
