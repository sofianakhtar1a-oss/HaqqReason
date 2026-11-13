/**
 * Moteur de logique propositionnelle et syllogistique (sans dépendance, partagé serveur / navigateur).
 *
 * Syntaxe acceptée pour les formules :
 *   variables : une lettre majuscule (P, Q, R…) éventuellement suivie de chiffres (P1, Q2)
 *   négation : ¬  ~  !  non
 *   et : ∧  &  et          ou : ∨  |  ou          ou exclusif : ⊕  xor
 *   implication : →  ->  =>  implique             équivalence : ↔  <->  <=>  ssi
 *   constantes : ⊤ (vrai)  ⊥ (faux) ; parenthèses ( )
 * Priorités : ¬ > ∧ > ∨, ⊕ > → > ↔ ; l'implication est associative à droite.
 */

export type Formule =
  | { t: "var"; nom: string }
  | { t: "const"; v: boolean }
  | { t: "non"; a: Formule }
  | { t: "et" | "ou" | "xor" | "imp" | "eq"; a: Formule; b: Formule };

export type Valuation = Record<string, boolean>;

type Jeton = { type: "var" | "op" | "par" | "const"; valeur: string; pos: number };

const MOTS: Record<string, string> = { non: "¬", et: "∧", ou: "∨", xor: "⊕", implique: "→", ssi: "↔", vrai: "⊤", faux: "⊥" };
const SYMBOLES: [string, string][] = [
  ["<->", "↔"],
  ["<=>", "↔"],
  ["->", "→"],
  ["=>", "→"],
  ["¬", "¬"],
  ["~", "¬"],
  ["!", "¬"],
  ["∧", "∧"],
  ["&", "∧"],
  ["∨", "∨"],
  ["|", "∨"],
  ["⊕", "⊕"],
  ["→", "→"],
  ["⇒", "→"],
  ["↔", "↔"],
  ["⇔", "↔"],
  ["⊤", "⊤"],
  ["⊥", "⊥"],
];

export class ErreurFormule extends Error {
  position: number;
  constructor(message: string, position: number) {
    super(message);
    this.position = position;
  }
}

function decouper(source: string): Jeton[] {
  const jetons: Jeton[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === "(" || c === ")") {
      jetons.push({ type: "par", valeur: c, pos: i });
      i++;
      continue;
    }
    const symbole = SYMBOLES.find(([s]) => source.startsWith(s, i));
    if (symbole) {
      jetons.push(symbole[1] === "⊤" || symbole[1] === "⊥" ? { type: "const", valeur: symbole[1], pos: i } : { type: "op", valeur: symbole[1], pos: i });
      i += symbole[0].length;
      continue;
    }
    const mot = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9_]*/.exec(source.slice(i));
    if (mot) {
      const m = mot[0];
      const bas = m.toLowerCase();
      if (Object.hasOwn(MOTS, bas)) {
        const v = MOTS[bas];
        jetons.push(v === "⊤" || v === "⊥" ? { type: "const", valeur: v, pos: i } : { type: "op", valeur: v, pos: i });
      } else if (/^[A-Z][0-9]*$/.test(m)) {
        jetons.push({ type: "var", valeur: m, pos: i });
      } else {
        throw new ErreurFormule(`« ${m} » n'est pas reconnu. Utilise une lettre majuscule (P, Q, R…) pour chaque proposition.`, i);
      }
      i += m.length;
      continue;
    }
    throw new ErreurFormule(`Caractère « ${c} » non reconnu.`, i);
  }
  return jetons;
}

/** Analyse une formule ; lève ErreurFormule avec un message en français si elle est mal écrite. */
export function analyser(source: string): Formule {
  const texte = source.trim();
  if (!texte) throw new ErreurFormule("Formule vide.", 0);
  if (texte.length > 500) throw new ErreurFormule("Formule trop longue (500 caractères au plus).", 500);
  const jetons = decouper(texte);
  let k = 0;
  const voir = () => jetons[k];
  const prendre = (op: string) => {
    if (voir()?.type === "op" && voir().valeur === op) {
      k++;
      return true;
    }
    return false;
  };

  const equivalence = (): Formule => {
    let g = implication();
    while (prendre("↔")) g = { t: "eq", a: g, b: implication() };
    return g;
  };
  const implication = (): Formule => {
    const g = ouExclusif();
    if (prendre("→")) return { t: "imp", a: g, b: implication() };
    return g;
  };
  const ouExclusif = (): Formule => {
    let g = disjonction();
    while (prendre("⊕")) g = { t: "xor", a: g, b: disjonction() };
    return g;
  };
  const disjonction = (): Formule => {
    let g = conjonction();
    while (prendre("∨")) g = { t: "ou", a: g, b: conjonction() };
    return g;
  };
  const conjonction = (): Formule => {
    let g = negation();
    while (prendre("∧")) g = { t: "et", a: g, b: negation() };
    return g;
  };
  const negation = (): Formule => {
    if (prendre("¬")) return { t: "non", a: negation() };
    return atome();
  };
  const atome = (): Formule => {
    const j = voir();
    if (!j) throw new ErreurFormule("La formule se termine trop tôt.", texte.length);
    if (j.type === "var") {
      k++;
      return { t: "var", nom: j.valeur };
    }
    if (j.type === "const") {
      k++;
      return { t: "const", v: j.valeur === "⊤" };
    }
    if (j.type === "par" && j.valeur === "(") {
      k++;
      const f = equivalence();
      if (voir()?.valeur !== ")") throw new ErreurFormule("Parenthèse fermante manquante.", voir()?.pos ?? texte.length);
      k++;
      return f;
    }
    throw new ErreurFormule(`« ${j.valeur} » est mal placé.`, j.pos);
  };

  const resultat = equivalence();
  if (k < jetons.length) throw new ErreurFormule(`« ${jetons[k].valeur} » est en trop ou mal placé.`, jetons[k].pos);
  return resultat;
}

export function evaluer(f: Formule, v: Valuation): boolean {
  switch (f.t) {
    case "var":
      return v[f.nom] ?? false;
    case "const":
      return f.v;
    case "non":
      return !evaluer(f.a, v);
    case "et":
      return evaluer(f.a, v) && evaluer(f.b, v);
    case "ou":
      return evaluer(f.a, v) || evaluer(f.b, v);
    case "xor":
      return evaluer(f.a, v) !== evaluer(f.b, v);
    case "imp":
      return !evaluer(f.a, v) || evaluer(f.b, v);
    case "eq":
      return evaluer(f.a, v) === evaluer(f.b, v);
  }
}

export function variablesDe(formules: Formule[]): string[] {
  const vues = new Set<string>();
  const visiter = (f: Formule) => {
    if (f.t === "var") vues.add(f.nom);
    else if (f.t === "non") visiter(f.a);
    else if (f.t !== "const") {
      visiter(f.a);
      visiter(f.b);
    }
  };
  formules.forEach(visiter);
  return [...vues].sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
}

const PRIORITE: Record<Formule["t"], number> = { eq: 1, imp: 2, xor: 3, ou: 4, et: 5, non: 6, var: 7, const: 7 };
const SIGNE: Record<string, string> = { et: "∧", ou: "∨", xor: "⊕", imp: "→", eq: "↔" };

/** Écriture normalisée avec les symboles logiques. */
export function ecrire(f: Formule, parent = 0): string {
  let s: string;
  if (f.t === "var") s = f.nom;
  else if (f.t === "const") s = f.v ? "⊤" : "⊥";
  else if (f.t === "non") s = `¬${ecrire(f.a, PRIORITE.non)}`;
  else s = `${ecrire(f.a, PRIORITE[f.t] + (f.t === "imp" ? 1 : 0))} ${SIGNE[f.t]} ${ecrire(f.b, PRIORITE[f.t] + (f.t === "imp" ? 0 : 1))}`;
  return PRIORITE[f.t] < parent ? `(${s})` : s;
}

/** Toutes les valuations possibles (2^n), dans l'ordre classique des tables de vérité (V avant F). */
export function* valuations(noms: string[]): Generator<Valuation> {
  const n = noms.length;
  for (let i = 0; i < 2 ** n; i++) {
    const v: Valuation = {};
    noms.forEach((nom, j) => {
      v[nom] = ((i >> (n - 1 - j)) & 1) === 0;
    });
    yield v;
  }
}

export const MAX_VARIABLES_TABLE = 6;
export const MAX_VARIABLES_CALCUL = 14;

export type LigneTable = { valuation: Valuation; resultats: boolean[] };

export function tableDeVerite(formules: Formule[]): { variables: string[]; lignes: LigneTable[] } {
  const variables = variablesDe(formules);
  if (variables.length > MAX_VARIABLES_TABLE) return { variables, lignes: [] };
  const lignes: LigneTable[] = [];
  for (const v of valuations(variables)) lignes.push({ valuation: v, resultats: formules.map((f) => evaluer(f, v)) });
  return { variables, lignes };
}

export type Statut = "tautologie" | "contradiction" | "contingente";

export function statutFormule(f: Formule): Statut {
  let vrai = false;
  let faux = false;
  for (const v of valuations(variablesDe([f]))) {
    if (evaluer(f, v)) vrai = true;
    else faux = true;
    if (vrai && faux) return "contingente";
  }
  return vrai ? "tautologie" : "contradiction";
}

/** La conclusion découle-t-elle des prémisses ? Sinon, renvoie un contre-exemple. */
export function validite(premisses: Formule[], conclusion: Formule): { valide: boolean; contreExemple?: Valuation; premissesIncoherentes: boolean } {
  const noms = variablesDe([...premisses, conclusion]);
  if (noms.length > MAX_VARIABLES_CALCUL) throw new ErreurFormule(`Trop de propositions différentes (${MAX_VARIABLES_CALCUL} au plus).`, 0);
  let unModele = false;
  for (const v of valuations(noms)) {
    if (premisses.every((p) => evaluer(p, v))) {
      unModele = true;
      if (!evaluer(conclusion, v)) return { valide: false, contreExemple: v, premissesIncoherentes: false };
    }
  }
  return { valide: true, premissesIncoherentes: !unModele };
}

/** Les affirmations peuvent-elles être vraies ensemble ? Sinon, les plus petits groupes incompatibles. */
export function coherence(formules: Formule[]): { coherent: boolean; exemple?: Valuation; conflits: number[][] } {
  const noms = variablesDe(formules);
  if (noms.length > MAX_VARIABLES_CALCUL) throw new ErreurFormule(`Trop de propositions différentes (${MAX_VARIABLES_CALCUL} au plus).`, 0);
  const satisfiable = (indices: number[]): Valuation | null => {
    const sous = indices.map((i) => formules[i]);
    for (const v of valuations(variablesDe(sous))) if (sous.every((f) => evaluer(f, v))) return v;
    return null;
  };
  const tous = formules.map((_, i) => i);
  const exemple = satisfiable(tous);
  if (exemple) return { coherent: true, exemple, conflits: [] };
  // Plus petits sous-ensembles incohérents (formules peu nombreuses : recherche exhaustive).
  const conflits: number[][] = [];
  if (formules.length <= 10) {
    for (let taille = 1; taille <= formules.length && conflits.length < 5; taille++) {
      const combiner = (debut: number, choix: number[]) => {
        if (conflits.length >= 5) return;
        if (choix.length === taille) {
          if (!conflits.some((c) => c.every((i) => choix.includes(i))) && !satisfiable(choix)) conflits.push([...choix]);
          return;
        }
        for (let i = debut; i < formules.length; i++) combiner(i + 1, [...choix, i]);
      };
      combiner(0, []);
    }
  }
  return { coherent: false, conflits };
}

// ----------------------------------------------------------------------
// Syllogismes catégoriques (Aristote)
// ----------------------------------------------------------------------

export type Quantite = "A" | "E" | "I" | "O";
export type Proposition = { quantite: Quantite; sujet: "S" | "M" | "P"; predicat: "S" | "M" | "P" };

export const QUANTITES: { cle: Quantite; libelle: string; modele: string }[] = [
  { cle: "A", libelle: "Universelle affirmative", modele: "Tout {s} est {p}" },
  { cle: "E", libelle: "Universelle négative", modele: "Aucun {s} n'est {p}" },
  { cle: "I", libelle: "Particulière affirmative", modele: "Quelque {s} est {p}" },
  { cle: "O", libelle: "Particulière négative", modele: "Quelque {s} n'est pas {p}" },
];

/** Régions du diagramme de Venn à 3 termes : bit 0 = S, bit 1 = M, bit 2 = P. */
const TERMES = { S: 1, M: 2, P: 4 } as const;

function satisfait(p: Proposition, habitees: boolean[]): boolean {
  const s = TERMES[p.sujet];
  const q = TERMES[p.predicat];
  const regions = (dans: number, hors: number) => habitees.some((h, r) => h && (r & dans) === dans && (r & hors) === 0);
  switch (p.quantite) {
    case "A":
      return !regions(s, q); // aucun s hors de p
    case "E":
      return !regions(s | q, 0); // aucun s dans p
    case "I":
      return regions(s | q, 0);
    case "O":
      return regions(s, q);
  }
}

export function syllogismeValide(majeure: Proposition, mineure: Proposition, conclusion: Proposition, importationExistentielle: boolean): { valide: boolean; figure: number | null; mode: string } {
  for (let masque = 0; masque < 256; masque++) {
    const habitees = Array.from({ length: 8 }, (_, r) => ((masque >> r) & 1) === 1);
    if (importationExistentielle) {
      const nonVide = (t: number) => habitees.some((h, r) => h && (r & t) === t);
      if (!nonVide(1) || !nonVide(2) || !nonVide(4)) continue;
    }
    if (satisfait(majeure, habitees) && satisfait(mineure, habitees) && !satisfait(conclusion, habitees)) return { valide: false, ...forme(majeure, mineure, conclusion) };
  }
  return { valide: true, ...forme(majeure, mineure, conclusion) };
}

function forme(majeure: Proposition, mineure: Proposition, conclusion: Proposition): { figure: number | null; mode: string } {
  const mode = `${majeure.quantite}${mineure.quantite}${conclusion.quantite}`;
  const mMaj = majeure.sujet === "M" ? "sujet" : majeure.predicat === "M" ? "predicat" : null;
  const mMin = mineure.sujet === "M" ? "sujet" : mineure.predicat === "M" ? "predicat" : null;
  let figure: number | null = null;
  if (mMaj === "sujet" && mMin === "predicat") figure = 1;
  else if (mMaj === "predicat" && mMin === "predicat") figure = 2;
  else if (mMaj === "sujet" && mMin === "sujet") figure = 3;
  else if (mMaj === "predicat" && mMin === "sujet") figure = 4;
  return { figure, mode };
}

/** Noms traditionnels des modes valides (mnémoniques médiévaux). */
export const NOMS_MODES: Record<string, string> = {
  "1-AAA": "Barbara",
  "1-EAE": "Celarent",
  "1-AII": "Darii",
  "1-EIO": "Ferio",
  "1-AAI": "Barbari",
  "1-EAO": "Celaront",
  "2-EAE": "Cesare",
  "2-AEE": "Camestres",
  "2-EIO": "Festino",
  "2-AOO": "Baroco",
  "2-EAO": "Cesaro",
  "2-AEO": "Camestrop",
  "3-AAI": "Darapti",
  "3-IAI": "Disamis",
  "3-AII": "Datisi",
  "3-EAO": "Felapton",
  "3-OAO": "Bocardo",
  "3-EIO": "Ferison",
  "4-AAI": "Bramantip",
  "4-AEE": "Camenes",
  "4-IAI": "Dimaris",
  "4-EAO": "Fesapo",
  "4-EIO": "Fresison",
  "4-AEO": "Camenop",
};

/** Inférences classiques reconnues dans une démonstration (pour nommer la règle appliquée). */
export const REGLES = [
  "Prémisse",
  "Hypothèse",
  "Modus ponens",
  "Modus tollens",
  "Syllogisme hypothétique",
  "Syllogisme disjonctif",
  "Simplification",
  "Conjonction",
  "Addition",
  "Dilemme constructif",
  "Double négation",
  "Contraposition",
  "Lois de De Morgan",
  "Réduction à l'absurde",
  "Définition",
  "Autre",
] as const;
