import { PAYS } from "./donnees";
import type { Pays } from "./types";

/*
 * Le Portulan : les cinq catégories et toutes les façons de poser une question.
 *
 * Une question = ce qu'on montre (l'invite) + ce qu'on doit trouver (la réponse).
 * Le drapeau donné, on cherche le nom ; le nom donné, on cherche le drapeau ; un pays
 * colorié sur le globe, on cherche son nom, son drapeau, ou on l'écrit ; etc.
 */

export type CategorieId = "drapeaux" | "capitales" | "cartes" | "continents" | "monnaies";
export type ModeJeu = CategorieId | "melange";

export type TypeQuestion =
  | "drapeau-nom"
  | "nom-drapeau"
  | "drapeau-ecrit"
  | "pays-capitale"
  | "capitale-pays"
  | "drapeau-capitale"
  | "capitale-drapeau"
  | "capitale-ecrit"
  | "carte-nom"
  | "carte-drapeau"
  | "carte-ecrit"
  | "silhouette-nom"
  | "nom-carte"
  | "pays-continent"
  | "drapeau-continent"
  | "continent-pays"
  | "pays-monnaie"
  | "monnaie-pays"
  | "drapeau-monnaie";

export type Invite = "drapeau" | "nom" | "capitale" | "carte" | "silhouette" | "monnaie" | "continent";
export type SorteReponse = "nom" | "drapeau" | "capitale" | "continent" | "monnaie" | "ecrit" | "clic";

export type DefType = {
  id: TypeQuestion;
  categorie: CategorieId;
  /** Le nom de la méthode, dans le choix avant une partie. */
  libelle: string;
  /** La consigne affichée au-dessus de la question. */
  consigne: string;
  invite: Invite;
  reponse: SorteReponse;
  /** Pour une réponse écrite : ce qu'on écrit. */
  ecrit?: "nom" | "capitale";
  /** Le pays peut-il être la réponse de cette question ? */
  eligible: (p: Pays) => boolean;
};

const enQuiz = (p: Pays) => p.quiz;
const avecDrapeau = (p: Pays) => p.quiz && p.drapeauPropre;
const avecCapitale = (p: Pays) => p.quiz && p.capitale !== null;
const surContinent = (p: Pays) => p.quiz && p.continent !== "antarctique";
const avecMonnaie = (p: Pays) => p.quiz && p.quizMonnaie;

/** Une monnaie qui n'appartient qu'à un seul pays du jeu (on peut alors demander « qui l'utilise ? »). */
const usages = new Map<string, number>();
for (const p of PAYS) if (p.quiz) for (const m of p.monnaies) usages.set(m.code, (usages.get(m.code) ?? 0) + 1);
export const monnaieUnique = (p: Pays) => avecMonnaie(p) && usages.get(p.monnaies[0].code) === 1;

export const TYPES: Record<TypeQuestion, DefType> = {
  "drapeau-nom": { id: "drapeau-nom", categorie: "drapeaux", libelle: "Drapeau → pays", consigne: "À quel pays est ce drapeau ?", invite: "drapeau", reponse: "nom", eligible: avecDrapeau },
  "nom-drapeau": { id: "nom-drapeau", categorie: "drapeaux", libelle: "Pays → drapeau", consigne: "Trouve son drapeau", invite: "nom", reponse: "drapeau", eligible: avecDrapeau },
  "drapeau-ecrit": { id: "drapeau-ecrit", categorie: "drapeaux", libelle: "Drapeau → nom à écrire", consigne: "Écris le nom de ce pays", invite: "drapeau", reponse: "ecrit", ecrit: "nom", eligible: avecDrapeau },
  "pays-capitale": { id: "pays-capitale", categorie: "capitales", libelle: "Pays → capitale", consigne: "Quelle est sa capitale ?", invite: "nom", reponse: "capitale", eligible: avecCapitale },
  "capitale-pays": { id: "capitale-pays", categorie: "capitales", libelle: "Capitale → pays", consigne: "De quel pays est-ce la capitale ?", invite: "capitale", reponse: "nom", eligible: avecCapitale },
  "drapeau-capitale": { id: "drapeau-capitale", categorie: "capitales", libelle: "Drapeau → capitale", consigne: "Quelle est la capitale de ce pays ?", invite: "drapeau", reponse: "capitale", eligible: (p) => avecCapitale(p) && p.drapeauPropre },
  "capitale-drapeau": { id: "capitale-drapeau", categorie: "capitales", libelle: "Capitale → drapeau", consigne: "Trouve le drapeau de son pays", invite: "capitale", reponse: "drapeau", eligible: (p) => avecCapitale(p) && p.drapeauPropre },
  "capitale-ecrit": { id: "capitale-ecrit", categorie: "capitales", libelle: "Pays → capitale à écrire", consigne: "Écris sa capitale", invite: "nom", reponse: "ecrit", ecrit: "capitale", eligible: avecCapitale },
  "carte-nom": { id: "carte-nom", categorie: "cartes", libelle: "Carte → pays", consigne: "Quel est ce pays ?", invite: "carte", reponse: "nom", eligible: enQuiz },
  "carte-drapeau": { id: "carte-drapeau", categorie: "cartes", libelle: "Carte → drapeau", consigne: "Trouve le drapeau de ce pays", invite: "carte", reponse: "drapeau", eligible: avecDrapeau },
  "carte-ecrit": { id: "carte-ecrit", categorie: "cartes", libelle: "Carte → nom à écrire", consigne: "Écris le nom de ce pays", invite: "carte", reponse: "ecrit", ecrit: "nom", eligible: enQuiz },
  "silhouette-nom": { id: "silhouette-nom", categorie: "cartes", libelle: "Silhouette → pays", consigne: "À qui est cette silhouette ?", invite: "silhouette", reponse: "nom", eligible: (p) => p.quiz && p.carte && (p.superficie ?? 0) >= 2500 },
  "nom-carte": { id: "nom-carte", categorie: "cartes", libelle: "Pays → le situer sur le globe", consigne: "Touche ce pays sur le globe", invite: "nom", reponse: "clic", eligible: (p) => p.quiz && p.carte && (p.superficie ?? 0) >= 9000 },
  "pays-continent": { id: "pays-continent", categorie: "continents", libelle: "Pays → continent", consigne: "Sur quel continent ?", invite: "nom", reponse: "continent", eligible: surContinent },
  "drapeau-continent": { id: "drapeau-continent", categorie: "continents", libelle: "Drapeau → continent", consigne: "De quel continent vient ce drapeau ?", invite: "drapeau", reponse: "continent", eligible: (p) => surContinent(p) && p.drapeauPropre },
  "continent-pays": { id: "continent-pays", categorie: "continents", libelle: "Continent → pays", consigne: "Lequel se trouve sur ce continent ?", invite: "continent", reponse: "nom", eligible: (p) => surContinent(p) && !p.continents },
  "pays-monnaie": { id: "pays-monnaie", categorie: "monnaies", libelle: "Pays → monnaie", consigne: "Quelle est sa monnaie ?", invite: "nom", reponse: "monnaie", eligible: avecMonnaie },
  "monnaie-pays": { id: "monnaie-pays", categorie: "monnaies", libelle: "Monnaie → pays", consigne: "Quel pays l'utilise ?", invite: "monnaie", reponse: "nom", eligible: monnaieUnique },
  "drapeau-monnaie": { id: "drapeau-monnaie", categorie: "monnaies", libelle: "Drapeau → monnaie", consigne: "Quelle monnaie dans ce pays ?", invite: "drapeau", reponse: "monnaie", eligible: (p) => avecMonnaie(p) && p.drapeauPropre },
};
export const TOUS_LES_TYPES = Object.keys(TYPES) as TypeQuestion[];

export type DefCategorie = {
  id: CategorieId;
  nom: string;
  /** Une phrase, sous le nom. */
  texte: string;
  /** Les pays de la catégorie (ceux qu'on doit apprendre). */
  eligible: (p: Pays) => boolean;
  /** L'ordre de difficulté propre à la catégorie. */
  rang: (p: Pays) => number;
  /** Les méthodes, par palier de niveaux : 1 à 5, 6 à 10, 11 à 15 (chaque palier garde les précédentes). */
  paliers: [TypeQuestion[], TypeQuestion[], TypeQuestion[]];
};

export const CATEGORIES: Record<CategorieId, DefCategorie> = {
  drapeaux: {
    id: "drapeaux",
    nom: "Drapeaux",
    texte: "Reconnaître le drapeau de chaque pays, et le pays de chaque drapeau.",
    eligible: avecDrapeau,
    rang: (p) => p.rang,
    paliers: [["drapeau-nom", "nom-drapeau"], [], ["drapeau-ecrit"]],
  },
  capitales: {
    id: "capitales",
    nom: "Capitales",
    texte: "Toutes les capitales, dans les deux sens, avec ou sans drapeau.",
    eligible: avecCapitale,
    rang: (p) => p.rangCapitale,
    paliers: [["pays-capitale", "capitale-pays"], ["drapeau-capitale", "capitale-drapeau"], ["capitale-ecrit"]],
  },
  cartes: {
    id: "cartes",
    nom: "Cartes",
    texte: "Un pays s'allume sur le globe : son nom, son drapeau, sa silhouette.",
    eligible: enQuiz,
    rang: (p) => p.rangCarte,
    paliers: [["carte-nom", "carte-drapeau"], ["silhouette-nom"], ["carte-ecrit", "nom-carte"]],
  },
  continents: {
    id: "continents",
    nom: "Continents",
    texte: "Ranger chaque pays sur son continent.",
    eligible: surContinent,
    rang: (p) => p.rang,
    paliers: [["pays-continent"], ["drapeau-continent", "continent-pays"], []],
  },
  monnaies: {
    id: "monnaies",
    nom: "Monnaies",
    texte: "L'euro, le yen, le dirham, le franc CFA… et toutes les autres.",
    eligible: avecMonnaie,
    rang: (p) => p.rang,
    paliers: [["pays-monnaie"], ["drapeau-monnaie", "monnaie-pays"], []],
  },
};
export const IDS_CATEGORIES = Object.keys(CATEGORIES) as CategorieId[];

/** Les méthodes de la catégorie ouvertes à un niveau donné (1 à 15). */
export function typesDuNiveau(categorie: CategorieId, niveau: number): TypeQuestion[] {
  const [a, b, c] = CATEGORIES[categorie].paliers;
  return niveau <= 5 ? a : niveau <= 10 ? [...a, ...b] : [...a, ...b, ...c];
}

/** Toutes les méthodes d'une catégorie (pour le choix libre). */
export const typesDe = (categorie: CategorieId): TypeQuestion[] => CATEGORIES[categorie].paliers.flat();
