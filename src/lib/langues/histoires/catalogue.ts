import { refusPremium } from "@/lib/client/premium";
import type { Exercice } from "@/lib/regles/types";
import type { Niveau } from "../types";
import donnees from "./catalogue.json";
import type { Glose } from "./texte";

/*
 * La bibliothèque des histoires : les fiches (titre, niveau, résumé, taille), toujours présentes,
 * et le texte de chaque histoire (donnees/langues/histoires/<id>.json, servi par
 * /api/langues/histoires/<id> après vérification des droits Premium), chargé quand on l'ouvre.
 * Fabriquées par scripts/langues/histoires/ (consignes, contrôle, construction).
 */

export type FicheHistoire = {
  id: string;
  titre: string;
  titreFr: string;
  auteur: string;
  annee?: number;
  niveau: Niveau;
  genre: string;
  resume: string;
  source?: string;
  pages: number;
  mots: number;
  minutes: number;
  chapitres: number;
  version: string;
};

/** Une phrase : l'anglais, sa traduction, et pour chaque mot le rang de sa glose (null : ponctuation seule). */
export type PhraseHistoire = [en: string, fr: string, g: (number | null)[]];
/** Une page : son titre de chapitre éventuel (anglais, français), ses paragraphes, ses mots clés. */
export type PageHistoire = { t?: string; tf?: string; p: PhraseHistoire[][]; m: number[] };

export type Histoire = Omit<FicheHistoire, "pages" | "minutes" | "chapitres" | "version"> & {
  v: number;
  gloses: Glose[];
  /** Les gloses générales des mots-outils. */
  o?: number[];
  pages: PageHistoire[];
  questions: Exercice[];
};

export const HISTOIRES = donnees as FicheHistoire[];
export const ficheHistoire = (id: string) => HISTOIRES.find((h) => h.id === id);

const chargees = new Map<string, Promise<Histoire>>();

/** Refus Premium : l'histoire est réservée, ou les essais gratuits de la période sont utilisés. */
export class HistoireReservee extends Error {
  constructor() {
    super("Cette histoire fait partie de l'accès Premium.");
    this.name = "HistoireReservee";
  }
}

/** Le texte d'une histoire ; une seule demande par visite (puis le cache du navigateur prend le relais). */
export function chargerHistoire(id: string): Promise<Histoire> {
  const fiche = ficheHistoire(id);
  if (!fiche) return Promise.reject(new Error("Cette histoire n'existe pas."));
  let p = chargees.get(id);
  if (!p) {
    p = fetch(`/api/langues/histoires/${encodeURIComponent(id)}?v=${fiche.version}`, { credentials: "same-origin" }).then(async (r) => {
      // Réservée : la fenêtre Premium s'ouvre (elle dit pourquoi et quand les essais reviennent).
      if (await refusPremium(r)) throw new HistoireReservee();
      if (!r.ok) throw new Error("L'histoire n'a pas pu se charger. Vérifie ta connexion.");
      return (await r.json()) as Histoire;
    });
    p.catch(() => chargees.delete(id));
    chargees.set(id, p);
  }
  return p;
}
