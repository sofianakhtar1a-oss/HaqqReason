import type { Cours, Lecon, Niveau, Section } from "../types";

/**
 * Les explications des leçons, rangées par section et par palier (A1-A2, B1-B2, C1-C2).
 * Chaque fichier n'est chargé que lorsqu'on ouvre une leçon de son palier : le parcours reste léger.
 */

export type Palier = "a" | "b" | "c";
export const palierDe = (niveau: Niveau): Palier => (niveau.startsWith("A") ? "a" : niveau.startsWith("B") ? "b" : "c");

type Fichier = { COURS: Record<string, Cours> };

const FICHIERS: Record<Section["id"], Record<Palier, () => Promise<Fichier>>> = {
  conjugaison: {
    a: () => import("./conjugaison-a"),
    b: () => import("./conjugaison-b"),
    c: () => import("./conjugaison-c"),
  },
  grammaire: {
    a: () => import("./grammaire-a"),
    b: () => import("./grammaire-b"),
    c: () => import("./grammaire-c"),
  },
};

/** L'explication d'une leçon (null si elle n'en a pas encore). */
export async function chargerCours(section: Section["id"], lecon: Pick<Lecon, "id" | "niveau">): Promise<Cours | null> {
  const fichier = await FICHIERS[section][palierDe(lecon.niveau)]();
  return fichier.COURS[lecon.id] ?? null;
}

/** Tous les fichiers d'une section, pour les tests. */
export const fichiersDe = (section: Section["id"]) => FICHIERS[section];
