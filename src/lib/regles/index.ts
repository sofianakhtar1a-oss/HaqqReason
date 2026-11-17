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
    accroche: "En anglais, le verbe voyage grâce à des moteurs : do, be, have, will. Prends les commandes : trois époques, quatre façons de voir l'action, et chaque passager règle la machine.",
    heros: "⏳",
    grades: { A1: "Passenger", A2: "Cadet", B1: "Pilot", B2: "Captain", C1: "Commander", C2: "Master of Time" },
    lecons: [...CONJUGAISON_A, ...CONJUGAISON_B, ...CONJUGAISON_C],
  },
  {
    id: "grammaire",
    nom: "Grammaire",
    univers: "La Cité des mots",
    accroche: "Dans la Cité anglaise, chaque mot a sa place, ses amis et ses pièges pour les francophones. Deviens détective : chaque règle est une enquête, chaque erreur un indice.",
    heros: "🏙️",
    grades: { A1: "Newcomer", A2: "Rookie Detective", B1: "Detective", B2: "Inspector", C1: "Chief Inspector", C2: "Guardian of the City" },
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
