import type { Exercice, Lecon, Niveau, Section } from "../types";

/**
 * L'entraînement des leçons : au moins vingt exercices corrigés par leçon, en plus du défi.
 * Un fichier par section et par niveau, chargé seulement quand on ouvre une leçon de ce niveau.
 * Les fichiers sont fabriqués par scripts/langues/entrainement/ (consignes, contrôle, rangement).
 */

type Lot = Record<string, Exercice[]>;
const lot = (m: { default: unknown }) => m.default as Lot;

const FICHIERS: Record<Section["id"], Record<Niveau, () => Promise<Lot>>> = {
  conjugaison: {
    A1: () => import("./conjugaison-a1.json").then(lot),
    A2: () => import("./conjugaison-a2.json").then(lot),
    B1: () => import("./conjugaison-b1.json").then(lot),
    B2: () => import("./conjugaison-b2.json").then(lot),
    C1: () => import("./conjugaison-c1.json").then(lot),
    C2: () => import("./conjugaison-c2.json").then(lot),
  },
  grammaire: {
    A1: () => import("./grammaire-a1.json").then(lot),
    A2: () => import("./grammaire-a2.json").then(lot),
    B1: () => import("./grammaire-b1.json").then(lot),
    B2: () => import("./grammaire-b2.json").then(lot),
    C1: () => import("./grammaire-c1.json").then(lot),
    C2: () => import("./grammaire-c2.json").then(lot),
  },
};

/** Les exercices d'entraînement d'une leçon (liste vide si elle n'en a pas encore). */
export async function chargerEntrainement(section: Section["id"], lecon: Pick<Lecon, "id" | "niveau">): Promise<Exercice[]> {
  const fichier = await FICHIERS[section][lecon.niveau]();
  return fichier[lecon.id] ?? [];
}

/** Tous les exercices d'un niveau d'une section, rangés par leçon (examens, carnet d'erreurs). */
export const chargerNiveau = (section: Section["id"], niveau: Niveau) => FICHIERS[section][niveau]();

/** Pour les tests. */
export const fichiersEntrainement = (section: Section["id"]) => FICHIERS[section];
