import { continentsDe, CONTINENTS, NOM_CONTINENT, PAR_CODE, pays } from "./atlas";
import { CATEGORIES, IDS_CATEGORIES, type CategorieId, type ModeJeu, TYPES, type TypeQuestion, typesDuNiveau } from "./categories";
import { PAYS } from "./donnees";
import { choisir, deriver, type Hasard, hasard, melanger } from "./hasard";
import { niveauxDe, ordreDe, QUESTIONS_PAR_NIVEAU } from "./niveaux";
import { jugerCapitale, jugerNom, type Jugement } from "./texte";
import type { ContinentId, Pays } from "./types";

/*
 * Le moteur des questions, commun au navigateur et au serveur.
 *
 *   • Une question se fabrique à partir d'une graine : la même graine donne la même question,
 *     avec les mêmes faux choix, dans le même ordre (les duels en dépendent).
 *   • Les faux choix se resserrent avec le niveau : au début, des pays aussi connus que la
 *     réponse ; plus loin, des voisins, des pays de la même région, des drapeaux qui se ressemblent.
 *   • juger() ne dépend que du type, du pays visé et de la réponse : le serveur peut l'arbitrer
 *     sans connaître la question entière.
 */

export type Option = {
  /** Ce qu'on renvoie en choisissant : un code de pays, un continent ou une monnaie. */
  id: string;
  /** Le pays dont on montre le drapeau, le nom ou la capitale. */
  code?: string;
  /** Le texte du choix (nom, capitale, continent, monnaie). */
  texte?: string;
  continent?: ContinentId;
};

export type Question = {
  type: TypeQuestion;
  cible: string;
  /** Pour « continent → pays » : le continent montré. */
  continent?: ContinentId;
  options: Option[];
  /** L'identifiant de la bonne option (ou le code du pays, pour écrire ou toucher le globe). */
  attendu: string;
  /** 4 ou 6 choix (0 : réponse écrite ou sur le globe). */
  nb: number;
};

/* ---------- Ressemblances ---------- */

const teintes = new Map(
  PAYS.map((p) => {
    const t = p.teinte;
    const v: number[] = [];
    for (let i = 0; i + 1 < t.length; i += 2) v.push(parseInt(t.slice(i, i + 2), 16));
    return [p.code, v] as const;
  }),
);
/** Écart de couleurs entre deux drapeaux (0 : identiques). */
export function ecartDrapeaux(a: string, b: string): number {
  const x = teintes.get(a);
  const y = teintes.get(b);
  if (!x || !y || x.length !== y.length) return 9999;
  let s = 0;
  for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i]);
  return s / x.length;
}

/** Drapeaux quasi identiques : jamais proposés ensemble. */
const SOSIES: [string, string][] = [
  ["td", "ro"],
  ["id", "mc"],
  ["no", "sj"],
];
const sosies = (a: string, b: string) => SOSIES.some(([x, y]) => (x === a && y === b) || (x === b && y === a)) || ecartDrapeaux(a, b) < 4;

/* ---------- Les faux choix ---------- */

type Dimension = "nom" | "drapeau" | "capitale";

/** Deux pays qui afficheraient la même chose (même capitale, même drapeau) ne peuvent pas être proposés ensemble. */
function valeur(p: Pays, d: Dimension): string {
  if (d === "capitale") return (p.capitale ?? "").toLowerCase();
  if (d === "drapeau") return p.drapeau;
  return p.nom.toLowerCase();
}

function candidatsPour(d: Dimension): Pays[] {
  return PAYS.filter((p) => p.quiz && (d === "drapeau" ? p.drapeauPropre : d === "capitale" ? p.capitale !== null : true));
}
const CANDIDATS: Record<Dimension, Pays[]> = { nom: candidatsPour("nom"), drapeau: candidatsPour("drapeau"), capitale: candidatsPour("capitale") };

/** 0 au début, 1 au plus difficile : la part de faux choix « proches » de la réponse. */
const proximite = (niveau: number) => (niveau <= 3 ? 0.15 : niveau <= 6 ? 0.35 : niveau <= 10 ? 0.6 : 0.85);

function proches(cible: Pays, d: Dimension, sorte: "carte" | "drapeau" | "texte"): Pays[] {
  const pool = CANDIDATS[d];
  if (sorte === "drapeau") {
    return pool
      .filter((p) => p.code !== cible.code)
      .map((p) => [p, ecartDrapeaux(cible.code, p.code)] as const)
      .sort((a, b) => a[1] - b[1] || a[0].rang - b[0].rang)
      .slice(0, 14)
      .map(([p]) => p);
  }
  const voisins = sorte === "carte" ? cible.voisins.map((c) => PAR_CODE.get(c)).filter((p): p is Pays => Boolean(p && pool.includes(p))) : [];
  const region = pool.filter((p) => p.code !== cible.code && p.sousRegion === cible.sousRegion);
  const continent = pool.filter((p) => p.code !== cible.code && p.continent === cible.continent);
  return [...new Set([...voisins, ...region, ...(region.length < 6 ? continent : [])])];
}

/**
 * Choisit n faux choix pour un pays. Au début, des pays d'une notoriété voisine ; plus le niveau
 * monte, plus ils ressemblent à la réponse (même région, voisins, drapeaux aux mêmes couleurs).
 */
function fauxPays(cible: Pays, n: number, h: Hasard, niveau: number, d: Dimension, sorte: "carte" | "drapeau" | "texte", exclus: (p: Pays) => boolean = () => false): Pays[] {
  const choisis: Pays[] = [];
  const vus = new Set([valeur(cible, d)]);
  const ok = (p: Pays) => p.code !== cible.code && !vus.has(valeur(p, d)) && !exclus(p) && !(d === "drapeau" && [cible, ...choisis].some((q) => sosies(q.code, p.code)));
  const prendre = (liste: Pays[]) => {
    const libres = liste.filter(ok);
    if (!libres.length) return false;
    const p = choisir(libres, h);
    choisis.push(p);
    vus.add(valeur(p, d));
    return true;
  };
  const voisinage = proches(cible, d, sorte);
  // La notoriété : des pays classés pas trop loin de la réponse.
  const ecart = 30 + niveau * 6;
  const notoires = CANDIDATS[d].filter((p) => Math.abs(p.rang - cible.rang) <= ecart);
  const p = proximite(niveau);
  let garde = 0;
  while (choisis.length < n && garde++ < 60) {
    if (h() < p && prendre(voisinage)) continue;
    if (prendre(notoires)) continue;
    if (!prendre(CANDIDATS[d])) break;
  }
  return choisis;
}

/** Toutes les monnaies apprises (la principale de chaque pays), sans doublon. */
const MONNAIES = [...new Map(PAYS.filter((p) => p.quiz && p.quizMonnaie).map((p) => [p.monnaies[0].code, p.monnaies[0]])).values()];

/* ---------- Une question ---------- */

export type Contexte = {
  /** Les méthodes permises (une seule si le joueur l'a choisie). */
  types: TypeQuestion[];
  /** 1 à 15 : règle la difficulté des faux choix et le nombre de choix. */
  niveau: number;
  /** Imposer 4 ou 6 choix (duels : toujours 4). */
  nb?: 4 | 6;
  /** Pas de réponse écrite ni de globe à toucher (duels, contre-la-montre). */
  qcmSeulement?: boolean;
};

const nbChoix = (niveau: number, h: Hasard): 4 | 6 => (niveau <= 5 ? 4 : niveau <= 10 ? (h() < 0.5 ? 6 : 4) : 6);

/** Les méthodes possibles pour ce pays dans ce contexte (au moins une si le pays est dans la catégorie). */
export function typesPossibles(code: string, ctx: Contexte): TypeQuestion[] {
  const p = pays(code);
  return ctx.types.filter((t) => TYPES[t].eligible(p) && !(ctx.qcmSeulement && (TYPES[t].reponse === "ecrit" || TYPES[t].reponse === "clic")));
}

export function fabriquer(graine: number, code: string, ctx: Contexte, typeImpose?: TypeQuestion): Question | null {
  const h = hasard(graine);
  const possibles = typeImpose ? [typeImpose] : typesPossibles(code, ctx);
  if (!possibles.length) return null;
  const type = possibles.length === 1 ? possibles[0] : choisir(possibles, h);
  const def = TYPES[type];
  const cible = pays(code);
  if (!def.eligible(cible)) return null;

  if (def.reponse === "ecrit" || def.reponse === "clic") return { type, cible: code, options: [], attendu: code, nb: 0 };

  const nb = ctx.nb ?? nbChoix(ctx.niveau, h);
  const sorte = def.invite === "carte" || def.invite === "silhouette" ? "carte" : def.reponse === "drapeau" || def.invite === "drapeau" ? "drapeau" : "texte";

  if (def.reponse === "continent") {
    const justes = continentsDe(cible);
    const libres = CONTINENTS.filter((c) => c.id !== "antarctique" && !justes.includes(c.id));
    // Un pays à cheval sur deux continents n'a que quatre faux choix possibles : on en montre trois.
    const autres = melanger(libres, h).slice(0, libres.length >= nb - 1 ? nb - 1 : 3);
    const options = melanger([{ id: cible.continent, texte: NOM_CONTINENT[cible.continent], continent: cible.continent }, ...autres.map((c) => ({ id: c.id, texte: c.nom, continent: c.id }))], h);
    return { type, cible: code, options, attendu: cible.continent, nb: options.length };
  }

  if (def.reponse === "monnaie") {
    const a = cible.monnaies[0];
    const siennes = new Set(cible.monnaies.map((m) => m.code));
    const noms = new Set([a.nom.toLowerCase()]);
    // Les faux choix : les monnaies des pays proches d'abord (même région), puis d'ailleurs.
    const sources = fauxPays(cible, 12, h, ctx.niveau, "nom", sorte, (p) => !p.quizMonnaie || siennes.has(p.monnaies[0].code));
    const leurres: Option[] = [];
    for (const p of sources) {
      const m = p.monnaies[0];
      if (siennes.has(m.code) || noms.has(m.nom.toLowerCase())) continue;
      noms.add(m.nom.toLowerCase());
      leurres.push({ id: m.code, texte: m.nom });
      if (leurres.length === nb - 1) break;
    }
    // Pas assez de monnaies différentes autour : on complète avec celles du reste du monde.
    for (const m of melanger(MONNAIES, h)) {
      if (leurres.length >= nb - 1) break;
      if (siennes.has(m.code) || noms.has(m.nom.toLowerCase())) continue;
      noms.add(m.nom.toLowerCase());
      leurres.push({ id: m.code, texte: m.nom });
    }
    const options = melanger([{ id: a.code, texte: a.nom }, ...leurres], h);
    return { type, cible: code, options, attendu: a.code, nb: options.length };
  }

  if (type === "continent-pays") {
    // On montre un continent ; un seul des pays proposés s'y trouve.
    const continent = cible.continent;
    const faux = fauxPays(cible, nb - 1, h, Math.min(ctx.niveau, 5), "nom", "texte", (p) => continentsDe(p).includes(continent) || p.continent === "antarctique");
    const options = melanger([cible, ...faux].map((p) => ({ id: p.code, code: p.code, texte: p.nom })), h);
    return { type, cible: code, continent, options, attendu: code, nb: options.length };
  }

  // Le reste : on choisit parmi des pays (montrés par leur nom, leur drapeau ou leur capitale).
  const d: Dimension = def.reponse === "drapeau" ? "drapeau" : def.reponse === "capitale" ? "capitale" : "nom";
  const exclus =
    type === "monnaie-pays"
      ? (p: Pays) => p.monnaies.some((m) => m.code === cible.monnaies[0].code)
      : def.invite === "capitale"
        ? (p: Pays) => (p.capitale ?? "").toLowerCase() === (cible.capitale ?? "").toLowerCase()
        : () => false;
  const faux = fauxPays(cible, nb - 1, h, ctx.niveau, d, sorte, exclus);
  const texte = (p: Pays) => (d === "capitale" ? p.capitale! : d === "nom" ? p.nom : undefined);
  const options = melanger([cible, ...faux].map((p) => ({ id: p.code, code: p.code, ...(texte(p) ? { texte: texte(p) } : {}) })), h);
  return { type, cible: code, options, attendu: code, nb: options.length };
}

/* ---------- Juger une réponse (le serveur fait de même) ---------- */

export function juger(type: TypeQuestion, code: string, reponse: string): Jugement {
  const cible = PAR_CODE.get(code);
  if (!cible || typeof reponse !== "string") return "faux";
  const def = TYPES[type];
  if (!def) return "faux";
  switch (def.reponse) {
    case "ecrit":
      return def.ecrit === "capitale" ? jugerCapitale(reponse, cible) : jugerNom(reponse, cible);
    case "continent":
      return continentsDe(cible).includes(reponse as ContinentId) ? "juste" : "faux";
    case "monnaie":
      return cible.monnaies.some((m) => m.code === reponse) ? "juste" : "faux";
    default: {
      if (reponse === code) return "juste";
      const choisi = PAR_CODE.get(reponse);
      if (!choisi) return "faux";
      if (type === "continent-pays") return continentsDe(choisi).includes(cible.continent) ? "juste" : "faux";
      if (type === "monnaie-pays") return choisi.monnaies.some((m) => m.code === cible.monnaies[0]?.code) ? "juste" : "faux";
      return "faux";
    }
  }
}

/* ---------- Les parties ---------- */

/**
 * Une partie de niveau : les pays du niveau, complétés jusqu'à 20 par des pays déjà vus
 * (ceux que le joueur choisit de revoir), dans un ordre mêlé.
 */
export function partieDeNiveau(o: { categorie: CategorieId; niveau: number; graine: number; methode?: TypeQuestion | null; revision?: string[] }): Question[] {
  const nouveaux = niveauxDe(o.categorie)[o.niveau - 1] ?? [];
  const ctx: Contexte = { types: o.methode ? [o.methode] : typesDuNiveau(o.categorie, o.niveau), niveau: o.niveau };
  const dejaVus = new Set(nouveaux);
  const revision = (o.revision ?? []).filter((c) => !dejaVus.has(c) && PAR_CODE.has(c));
  const codes = [...nouveaux, ...revision].filter((c) => typesPossibles(c, ctx).length > 0);
  // Une méthode imposée peut écarter des pays (une silhouette trop petite…) : on complète avec les niveaux d'avant.
  if (codes.length < QUESTIONS_PAR_NIVEAU) {
    for (const c of ordreDe(o.categorie)) {
      if (codes.length >= QUESTIONS_PAR_NIVEAU) break;
      if (!codes.includes(c) && typesPossibles(c, ctx).length > 0) codes.push(c);
    }
  }
  const h = hasard(o.graine);
  const ordre = melanger(codes.slice(0, Math.max(QUESTIONS_PAR_NIVEAU, nouveaux.length)), h).slice(0, QUESTIONS_PAR_NIVEAU);
  return ordre.map((c, i) => fabriquer(deriver(o.graine, i), c, ctx)).filter((q): q is Question => q !== null);
}

/** Pour les modes rapides et les révisions : une question sur un pays donné, d'une catégorie donnée. */
export function questionSur(graine: number, categorie: CategorieId, code: string, niveau: number, qcmSeulement = false): Question | null {
  return fabriquer(graine, code, { types: typesDuNiveau(categorie, niveau), niveau, qcmSeulement });
}

/** Le « tour du monde » : une question au hasard, d'une catégorie au hasard, jusqu'au niveau donné. */
export function questionMelangee(graine: number, niveauMax: number, qcmSeulement = true): Question | null {
  const h = hasard(graine);
  for (let essai = 0; essai < 6; essai++) {
    const categorie = choisir(IDS_CATEGORIES, h);
    const niveaux = niveauxDe(categorie).slice(0, Math.max(1, niveauMax));
    const code = choisir(niveaux.flat(), h);
    const niveau = 1 + Math.floor(h() * Math.max(1, niveauMax));
    const q = questionSur(Math.floor(h() * 4294967296), categorie, code, Math.min(niveau, 15), qcmSeulement);
    if (q) return q;
  }
  return null;
}

/* ---------- Les duels : dix questions, les mêmes pour les deux joueurs ---------- */

export const QUESTIONS_PAR_DUEL = 10;

export function questionsDuel(graine: number, mode: ModeJeu): Question[] {
  const h = hasard(graine);
  const sortie: Question[] = [];
  const vus = new Set<string>();
  for (let i = 0; sortie.length < QUESTIONS_PAR_DUEL && i < 80; i++) {
    const g = deriver(graine, i);
    const hi = hasard(g);
    const categorie: CategorieId = mode === "melange" ? choisir(IDS_CATEGORIES, hi) : mode;
    // Des pays des dix premiers niveaux : un duel se gagne sur ce que l'on sait, pas sur l'obscur.
    const codes = niveauxDe(categorie).slice(0, 10).flat();
    const code = choisir(codes, h);
    if (vus.has(code)) continue;
    const q = fabriquer(deriver(g, 7), code, { types: typesDuNiveau(categorie, 10), niveau: 6, nb: 4, qcmSeulement: true });
    if (!q) continue;
    vus.add(code);
    sortie.push(q);
  }
  return sortie;
}

/** La catégorie d'une question (pour la progression). */
export const categorieDe = (type: TypeQuestion): CategorieId => TYPES[type].categorie;

/** La consigne et le nom de la méthode, pour l'écran. */
export const consigne = (q: Question): string => (q.type === "continent-pays" && q.continent ? `Lequel se trouve en ${NOM_CONTINENT[q.continent]} ?` : TYPES[q.type].consigne);

export { CATEGORIES };
