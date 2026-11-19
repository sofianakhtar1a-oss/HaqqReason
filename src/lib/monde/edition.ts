import type { Recit } from "./types";

/*
 * Ce que le créateur règle depuis son atelier, tel que le Portulan le reçoit (navigateur et
 * serveur) : corrections des fiches, pays du jour choisis, population à jour, nouveautés.
 */

export const CHAMPS_FICHE = ["devise", "hymne", "auteurs", "independance", "fete", "drapeau", "etymologie", "anecdote"] as const;
export type ChampFiche = (typeof CHAMPS_FICHE)[number];
export const estChampFiche = (x: string): x is ChampFiche => (CHAMPS_FICHE as readonly string[]).includes(x);
export const NOMS_CHAMPS: Record<ChampFiche, string> = {
  devise: "Devise",
  hymne: "Hymne",
  auteurs: "Auteurs de l'hymne",
  independance: "Indépendance (ou statut)",
  fete: "Fête nationale",
  drapeau: "Histoire du drapeau",
  etymologie: "Origine du nom",
  anecdote: "Le savais-tu ?",
};

export type FichesEditees = Record<string, Partial<Record<ChampFiche, string>>>;
export type PaysChoisis = Record<string, { code: string; anecdote?: string }>;
export type Populations = { maj: string; source: string; valeurs: Record<string, [population: number, annee: number]> };
export type Nouveaute = { id: string; le: string; titre: string; texte: string };
export type EditionPortulan = { fiches: FichesEditees; jour: PaysChoisis; population: Populations | null; nouveautes: Nouveaute[] };

export const MESURES_VITESSE = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;
export type MesureVitesse = (typeof MESURES_VITESSE)[number];
export const estMesureVitesse = (x: unknown): x is MesureVitesse => typeof x === "string" && (MESURES_VITESSE as readonly string[]).includes(x);

/** Un récit, avec les corrections du créateur par-dessus. */
export function recitCorrige(recit: Recit | undefined, corrections: Partial<Record<ChampFiche, string>> | undefined): Recit | undefined {
  if (!corrections || !Object.keys(corrections).length) return recit;
  return { ...(recit ?? {}), ...corrections };
}

/** Les nouveautés d'origine : celles du créateur passent devant, les plus récentes d'abord. */
export const NOUVEAUTES_ORIGINE: readonly Nouveaute[] = [
  { id: "langues", le: "2026-11-19", titre: "Le Portulan en anglais et en arabe", texte: "Mes réglages → La langue : toute l'interface passe en anglais, ou en arabe, de droite à gauche. Les noms des pays et des capitales suivent." },
  { id: "pays-publics", le: "2026-11-19", titre: "Une page pour chaque pays", texte: "Chaque pays a sa page ouverte à tous, à partager : capitale, drapeau, chiffres, devise, hymne et histoire du drapeau." },
  { id: "hors-ligne", le: "2026-11-19", titre: "Jouer sans réseau", texte: "Mes réglages → Hors ligne : Le Portulan se garde sur l'appareil, drapeaux et cartes compris, et s'installe comme une application." },
  { id: "confort", le: "2026-11-18", titre: "Sons, ambiance et accessibilité", texte: "Des sons discrets, l'ambiance de la mer, un mode daltonien, plus de contraste, un texte plus grand, une police pour la dyslexie et deux fois plus de temps." },
  { id: "social", le: "2026-11-17", titre: "Amis, duels à distance, salons et classes", texte: "Un code ami, des duels joués chacun à son tour, des salons jusqu'à huit joueurs et des classes pour les enseignants." },
];

export function toutesNouveautes(du: readonly Nouveaute[]): Nouveaute[] {
  const vus = new Set(du.map((n) => n.id));
  return [...du, ...NOUVEAUTES_ORIGINE.filter((n) => !vus.has(n.id))].sort((a, b) => b.le.localeCompare(a.le));
}
