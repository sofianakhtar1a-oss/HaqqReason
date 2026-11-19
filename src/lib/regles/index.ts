import { CONJUGAISON_A } from "./conjugaison-a";
import { CONJUGAISON_B } from "./conjugaison-b";
import { CONJUGAISON_C } from "./conjugaison-c";
import { CONJUGAISON_PLUS } from "./conjugaison-plus";
import { GRAMMAIRE_A } from "./grammaire-a";
import { GRAMMAIRE_B } from "./grammaire-b";
import { GRAMMAIRE_C } from "./grammaire-c";
import { GRAMMAIRE_PLUS } from "./grammaire-plus";
import type { Ajout, Lecon, Niveau, Section } from "./types";

/**
 * Le parcours complet : les leçons d'origine, et les leçons ajoutées chacune à sa place logique
 * (juste après la leçon qu'elle prolonge). Si une place est introuvable, la leçon va à la fin
 * de son niveau : le parcours reste dans l'ordre A1 → C2 (tests/test-regles.mts le vérifie).
 */
export function inserer(base: Lecon[], ajouts: Ajout[]): Lecon[] {
  const parcours = [...base];
  for (const { apres, lecon } of ajouts) {
    if (parcours.some((l) => l.id === lecon.id)) continue;
    let i = parcours.findIndex((l) => l.id === apres);
    if (i < 0) for (let j = 0; j < parcours.length; j++) if (parcours[j].niveau === lecon.niveau) i = j;
    parcours.splice(i + 1, 0, lecon);
  }
  return parcours;
}

export const SECTIONS: Section[] = [
  {
    id: "conjugaison",
    nom: "Conjugaison",
    univers: "La Machine à voyager dans le temps",
    accroche: "En anglais, le verbe voyage grâce à des moteurs : do, be, have, will. Prends les commandes : trois époques, quatre façons de voir l'action, et chaque passager règle la machine.",
    heros: "⏳",
    grades: { A1: "Passenger", A2: "Cadet", B1: "Pilot", B2: "Captain", C1: "Commander", C2: "Master of Time" },
    lecons: inserer([...CONJUGAISON_A, ...CONJUGAISON_B, ...CONJUGAISON_C], CONJUGAISON_PLUS),
  },
  {
    id: "grammaire",
    nom: "Grammaire",
    univers: "La Cité des mots",
    accroche: "Dans la Cité anglaise, chaque mot a sa place, ses amis et ses pièges pour les francophones. Deviens détective : chaque règle est une enquête, chaque erreur un indice.",
    heros: "🏙️",
    grades: { A1: "Newcomer", A2: "Rookie Detective", B1: "Detective", B2: "Inspector", C1: "Chief Inspector", C2: "Guardian of the City" },
    lecons: inserer([...GRAMMAIRE_A, ...GRAMMAIRE_B, ...GRAMMAIRE_C], GRAMMAIRE_PLUS),
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
