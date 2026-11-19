import { CATEGORIES, type CategorieId } from "./categories";
import { PAYS } from "./donnees";

/*
 * Les quinze niveaux de chaque catégorie, du mousse à l'Atlas (le titan qui porte le monde,
 * et le nom que Mercator donna au premier recueil de cartes).
 *
 * Chaque niveau compte 20 questions et 3 cœurs. Les pays de la catégorie sont rangés du plus
 * connu au moins connu, puis partagés : 20 au premier niveau, les autres à parts égales.
 * À partir du deuxième niveau, quelques pays déjà vus reviennent (révision) pour faire 20.
 */

export const NB_NIVEAUX = 15;
export const QUESTIONS_PAR_NIVEAU = 20;
export const COEURS = 3;

export type Grade = { n: number; nom: string; devise: string };

export const GRADES: readonly Grade[] = [
  { n: 1, nom: "Mousse", devise: "Premier pas sur le pont." },
  { n: 2, nom: "Matelot", devise: "Les cordages n'ont plus de secret pour toi." },
  { n: 3, nom: "Vigie", devise: "Rien n'échappe à ton regard." },
  { n: 4, nom: "Timonier", devise: "Tu tiens la barre." },
  { n: 5, nom: "Pilote", devise: "Tu connais les passes et les écueils." },
  { n: 6, nom: "Cartographe", devise: "Le monde prend forme sous ta plume." },
  { n: 7, nom: "Navigateur", devise: "Les étoiles te guident." },
  { n: 8, nom: "Capitaine", devise: "Le navire est à toi." },
  { n: 9, nom: "Explorateur", devise: "Au-delà des cartes connues." },
  { n: 10, nom: "Géographe", devise: "Tu lis le monde comme un livre." },
  { n: 11, nom: "Ambassadeur", devise: "Chaque nation t'ouvre ses portes." },
  { n: 12, nom: "Amiral", devise: "Une flotte entière te suit." },
  { n: 13, nom: "Découvreur", devise: "Les terres lointaines te répondent." },
  { n: 14, nom: "Cosmographe", devise: "Tu dessines le monde entier." },
  { n: 15, nom: "Atlas", devise: "Le monde repose sur tes épaules." },
];

/** Les pays de chaque niveau, pour une catégorie (calculé une fois). */
const cache = new Map<CategorieId, string[][]>();

export function niveauxDe(categorie: CategorieId): string[][] {
  const deja = cache.get(categorie);
  if (deja) return deja;
  const def = CATEGORIES[categorie];
  const ordre = PAYS.filter(def.eligible)
    .slice()
    .sort((a, b) => def.rang(a) - def.rang(b) || a.rang - b.rang)
    .map((p) => p.code);
  const niveaux: string[][] = [ordre.slice(0, QUESTIONS_PAR_NIVEAU)];
  const reste = ordre.slice(QUESTIONS_PAR_NIVEAU);
  const parts = NB_NIVEAUX - 1;
  let debut = 0;
  for (let i = 0; i < parts; i++) {
    const taille = Math.floor(reste.length / parts) + (i < reste.length % parts ? 1 : 0);
    niveaux.push(reste.slice(debut, debut + taille));
    debut += taille;
  }
  cache.set(categorie, niveaux);
  return niveaux;
}

/** Le niveau (1 à 15) où un pays est appris, dans une catégorie (0 : hors catégorie). */
export function niveauDuPays(categorie: CategorieId, code: string): number {
  const i = niveauxDe(categorie).findIndex((n) => n.includes(code));
  return i + 1;
}

/** Tous les pays d'une catégorie, du plus connu au moins connu. */
export const ordreDe = (categorie: CategorieId): string[] => niveauxDe(categorie).flat();

export const grade = (n: number): Grade => GRADES[Math.min(Math.max(n, 1), NB_NIVEAUX) - 1];

/** Les étoiles d'une partie terminée : 3 sans faute, 2 avec une faute, 1 avec deux. */
export const etoilesPour = (fautes: number): 0 | 1 | 2 | 3 => (fautes <= 0 ? 3 : fautes === 1 ? 2 : fautes === 2 ? 1 : 0);
