import { CONJUGAISON_A } from "./conjugaison-a";
import { CONJUGAISON_B } from "./conjugaison-b";
import { CONJUGAISON_C } from "./conjugaison-c";
import { GRAMMAIRE_A } from "./grammaire-a";
import { GRAMMAIRE_B } from "./grammaire-b";
import { GRAMMAIRE_C } from "./grammaire-c";
import type { Niveau, Section } from "./types";

export const SECTIONS: Section[] = [
  {
    id: "conjugaison",
    nom: "Conjugaison",
    univers: "La Machine à voyager dans le temps",
    accroche: "Le verbe est le seul mot qui voyage dans le temps. Prends les commandes : chaque temps est une époque, chaque passager change son costume.",
    heros: "⏳",
    grades: { A1: "Passager du temps", A2: "Apprenti pilote", B1: "Pilote", B2: "Capitaine", C1: "Commandant", C2: "Maître du temps" },
    lecons: [...CONJUGAISON_A, ...CONJUGAISON_B, ...CONJUGAISON_C],
  },
  {
    id: "grammaire",
    nom: "Grammaire",
    univers: "La Cité des mots",
    accroche: "Dans la Cité, chaque mot a un métier, des amis et des pièges. Deviens détective : chaque règle est une enquête, chaque erreur un indice.",
    heros: "🏙️",
    grades: { A1: "Habitant de la Cité", A2: "Détective débutant", B1: "Enquêteur", B2: "Inspecteur", C1: "Commissaire", C2: "Gardien de la Cité" },
    lecons: [...GRAMMAIRE_A, ...GRAMMAIRE_B, ...GRAMMAIRE_C],
  },
];

export const NOMS_NIVEAUX: Record<Niveau, string> = {
  A1: "Premiers pas",
  A2: "Les bases solides",
  B1: "En autonomie",
  B2: "Avec aisance",
  C1: "La maîtrise",
  C2: "L'excellence",
};

export const sectionDe = (id: string) => SECTIONS.find((s) => s.id === id);
