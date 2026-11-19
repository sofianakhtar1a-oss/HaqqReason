import { continentsDe, CONTINENTS, NOM_CONTINENT, PAR_CODE, pays } from "./atlas";
import { avecLangue, CATEGORIES, CATEGORIES_CLASSIQUES, type CategorieId, type ModeJeu, MONNAIES_PARTAGEES, REPONSES_LIBRES, TYPES, type TypeQuestion, typesDuNiveau, villesSures } from "./categories";
import { COULEURS } from "./couleurs";
import { distanceKm, ecartHoraire } from "./geo";
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
  /** Pour « continent → pays » et l'intrus : le continent montré. */
  continent?: ContinentId;
  options: Option[];
  /** L'identifiant de la bonne option (ou le code du pays, pour écrire ou toucher le globe). */
  attendu: string;
  /** 2, 4 ou 6 choix (0 : réponse écrite, sur le globe, coloriage ou rangement). */
  nb: number;
  /** Ce qu'on montre en mots : une ville, une langue, des habitants, un sommet, un code, une monnaie partagée… */
  texte?: string;
  /** Le pays montré dans une proposition à juger (vrai ou faux). */
  montre?: string;
  /** La couleur cachée du drapeau. */
  couleur?: string;
  /** La silhouette tournée (en degrés) et/ou vue dans un miroir. */
  rotation?: number;
  miroir?: boolean;
  /** Les quatre pays à ranger. */
  codes?: string[];
  /** L'écart avec l'heure de Paris, en minutes (questions d'heure). */
  ecart?: number;
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
  // Un drapeau montré ou proposé : jamais deux drapeaux identiques ou presque (la France et la Guyane hissent le même).
  const drapeaux = d === "drapeau" || sorte === "drapeau";
  const ok = (p: Pays) => p.code !== cible.code && !vus.has(valeur(p, d)) && !exclus(p) && !(drapeaux && [cible, ...choisis].some((q) => sosies(q.code, p.code)));
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

/* ---------- Les questions des nouvelles catégories et des nouvelles formes ---------- */

const formatHeure = (minutes: number): string => {
  const jour = Math.floor(minutes / 1440);
  const m = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mn = m % 60;
  const heure = `${h}\u00a0h${mn ? `\u00a0${String(mn).padStart(2, "0")}` : ""}`;
  return jour < 0 ? `${heure}, la veille` : jour > 0 ? `${heure}, le lendemain` : heure;
};
/** L'heure qu'il est quelque part quand il est midi à Paris. */
export const heureQuandMidi = (ecart: number) => formatHeure(12 * 60 + ecart);
const ecartDe = (p: Pays): number | null => (p.fuseau ? ecartHoraire(p.fuseau) : null);

/** Des faux choix en mots : on part de pays proches, et on garde ce qu'ils ont de différent. */
function leurresTexte(cible: Pays, n: number, h: Hasard, niveau: number, valeur: (p: Pays) => string | null | undefined, interdit: (v: string) => boolean): string[] {
  const vus = new Set<string>();
  const sortie: string[] = [];
  const prendre = (p: Pays) => {
    const v = valeur(p);
    if (!v || interdit(v) || vus.has(v)) return;
    vus.add(v);
    sortie.push(v);
  };
  for (const p of fauxPays(cible, n * 3, h, niveau, "nom", "texte", (x) => !valeur(x))) {
    prendre(p);
    if (sortie.length >= n) return sortie;
  }
  for (const p of melanger(PAYS.filter((x) => x.quiz), h)) {
    prendre(p);
    if (sortie.length >= n) break;
  }
  return sortie;
}

/** Des pays (montrés par leur nom) parmi lesquels un seul est juste. */
function choixPays(cible: Pays, juste: Pays, nb: number, h: Hasard, niveau: number, exclus: (p: Pays) => boolean): { options: Option[]; attendu: string } {
  const faux = fauxPays(juste, nb - 1, h, niveau, "nom", "texte", (p) => p.code === cible.code || p.code === juste.code || exclus(p));
  const options = melanger([juste, ...faux].map((p) => ({ id: p.code, code: p.code, texte: p.nom })), h);
  return { options, attendu: juste.code };
}

function questionTexte(type: TypeQuestion, cible: Pays, nb: number, h: Hasard, niveau: number, juste: string, valeur: (p: Pays) => string | null | undefined, interdit: (v: string) => boolean, extra: Partial<Question> = {}): Question {
  const leurres = leurresTexte(cible, nb - 1, h, niveau, valeur, (v) => v === juste || interdit(v));
  const options = melanger([juste, ...leurres].map((v) => ({ id: v, texte: v })), h);
  return { type, cible: cible.code, options, attendu: juste, nb: options.length, ...extra };
}

/** Quatre pays de populations (ou de superficies) bien distinctes, dont la cible est la plus grande. */
function quatreComparables(cible: Pays, h: Hasard, niveau: number, mesure: (p: Pays) => number): Pays[] | null {
  const v = mesure(cible);
  // Plus le niveau monte, plus les écarts se resserrent.
  const bas = niveau <= 5 ? 0.05 : niveau <= 10 ? 0.2 : 0.4;
  const pool = PAYS.filter((p) => p.quiz && p.code !== cible.code && mesure(p) > 0 && mesure(p) < v * 0.93 && mesure(p) > v * bas);
  const proches = pool.filter((p) => p.continent === cible.continent);
  const choisis: Pays[] = [];
  for (const p of [...melanger(proches, h), ...melanger(pool, h)]) {
    if (choisis.includes(p)) continue;
    // Pas deux valeurs trop proches (on doit pouvoir les ranger sans hésiter sur les arrondis).
    if (choisis.some((q) => Math.abs(mesure(q) - mesure(p)) / Math.max(mesure(q), mesure(p)) < 0.07)) continue;
    choisis.push(p);
    if (choisis.length === 3) break;
  }
  return choisis.length === 3 ? [cible, ...choisis] : null;
}
const habitants = (p: Pays) => p.population ?? 0;
const surface = (p: Pays) => p.superficie ?? 0;

/**
 * Les nouvelles façons de poser une question. Renvoie undefined pour les méthodes d'origine
 * (fabriquer s'en charge), null si la question est impossible pour ce pays.
 */
function fabriquerAutre(type: TypeQuestion, cible: Pays, ctx: Contexte, h: Hasard): Question | null | undefined {
  const code = cible.code;
  const niveau = ctx.niveau;
  const nb = ctx.nb ?? nbChoix(niveau, h);
  switch (type) {
    case "drapeau-gris":
    case "drapeau-devoile":
    case "silhouette-tournee": {
      const d: Dimension = "nom";
      const faux = fauxPays(cible, nb - 1, h, niveau, d, type === "silhouette-tournee" ? "carte" : "drapeau");
      const options = melanger([cible, ...faux].map((p) => ({ id: p.code, code: p.code, texte: p.nom })), h);
      const extra: Partial<Question> = type === "silhouette-tournee" ? (h() < 0.4 ? { miroir: true, rotation: choisir([0, 90, 180], h) } : { rotation: choisir([90, 180, 270], h) }) : {};
      return { type, cible: code, options, attendu: code, nb: options.length, ...extra };
    }
    case "drapeau-vrai-faux": {
      // Une fois sur deux, le bon drapeau ; sinon un drapeau qui lui ressemble.
      const vrai = h() < 0.5;
      const autre = vrai ? cible : (fauxPays(cible, 1, h, Math.max(niveau, 8), "drapeau", "drapeau")[0] ?? cible);
      return { type, cible: code, montre: autre.code, options: [{ id: `vrai:${autre.code}`, texte: "Vrai" }, { id: `faux:${autre.code}`, texte: "Faux" }], attendu: `${autre.code === code ? "vrai" : "faux"}:${autre.code}`, nb: 2 };
    }
    case "capitale-vrai-faux": {
      const vrai = h() < 0.5;
      const autre = vrai ? cible : (fauxPays(cible, 1, h, Math.max(niveau, 8), "capitale", "texte")[0] ?? cible);
      const juste = (autre.capitale ?? "").toLowerCase() === (cible.capitale ?? "").toLowerCase();
      return { type, cible: code, montre: autre.code, options: [{ id: `vrai:${autre.code}`, texte: "Vrai" }, { id: `faux:${autre.code}`, texte: "Faux" }], attendu: `${juste ? "vrai" : "faux"}:${autre.code}`, nb: 2 };
    }
    case "drapeau-couleur": {
      const siennes = cible.couleurs ?? [];
      // On cache l'une des deux couleurs les plus présentes (elles couvrent de grandes formes).
      const cachee = choisir(siennes.slice(0, 2), h);
      const autres = melanger(
        COULEURS.filter((c) => !siennes.includes(c)),
        h,
      ).slice(0, 3);
      const options = melanger([cachee, ...autres].map((c) => ({ id: c, texte: c })), h);
      return { type, cible: code, couleur: cachee, options, attendu: cachee, nb: options.length };
    }
    case "drapeau-colorie":
      return cible.coloriage ? { type, cible: code, options: [], attendu: cible.coloriage.join(","), nb: 0 } : null;
    case "drapeau-puzzle":
      return cible.decoupe ? { type, cible: code, options: [], attendu: "0,1,2,3,4,5", nb: 0 } : null;
    case "continent-intrus": {
      // Un continent qui n'est pas le sien, et trois pays qui y sont tout entiers.
      const autres = CONTINENTS.filter((c) => c.id !== "antarctique" && !continentsDe(cible).includes(c.id));
      const continent = choisir(autres, h).id;
      const pool = PAYS.filter((p) => p.quiz && p.continent === continent && !p.continents && p.code !== code);
      const ecart = 30 + niveau * 8;
      const notoires = pool.filter((p) => Math.abs(p.rang - cible.rang) <= ecart);
      const trois = melanger(notoires.length >= 3 ? notoires : pool, h).slice(0, 3);
      if (trois.length < 3) return null;
      const options = melanger([cible, ...trois].map((p) => ({ id: p.code, code: p.code, texte: p.nom })), h);
      return { type, cible: code, continent, options, attendu: code, nb: 4 };
    }
    case "monnaie-intrus": {
      // Une monnaie partagée que la cible n'utilise pas, et trois pays qui l'utilisent.
      const siennes = new Set(cible.monnaies.map((m) => m.code));
      const possibles = MONNAIES_PARTAGEES.filter((m) => !siennes.has(m));
      const proches = possibles.filter((m) => PAYS.some((p) => p.quiz && p.continent === cible.continent && p.monnaies[0]?.code === m));
      const monnaie = choisir(proches.length ? proches : possibles, h);
      if (!monnaie) return null;
      const usagers = PAYS.filter((p) => p.quiz && p.code !== code && p.monnaies[0]?.code === monnaie);
      const trois = melanger(usagers, h).slice(0, 3);
      if (trois.length < 3) return null;
      const options = melanger([cible, ...trois].map((p) => ({ id: p.code, code: p.code, texte: p.nom })), h);
      return { type, cible: code, texte: monnaie, options, attendu: code, nb: 4 };
    }
    case "pays-gentile":
      return questionTexte(type, cible, nb, h, niveau, cible.gentile![0], (p) => p.gentile?.[0], () => false);
    case "gentile-pays": {
      const { options, attendu } = choixPays(cible, cible, nb, h, niveau, (p) => !p.gentile || p.gentile[0] === cible.gentile![0]);
      return { type, cible: code, texte: cible.gentile![0], options, attendu, nb: options.length };
    }
    case "pays-langue": {
      const juste = choisir(cible.langues, h);
      return questionTexte(type, cible, nb, h, niveau, juste, (p) => (avecLangue(p) ? p.langues.find((l) => !cible.langues.includes(l)) : undefined), (v) => cible.langues.includes(v));
    }
    case "langue-pays": {
      // La langue la moins partagée de la cible (le khmer plutôt que l'anglais).
      const parts = cible.langues.map((l) => [l, PAYS.filter((p) => p.quiz && p.langues.includes(l)).length] as const).sort((a, b) => a[1] - b[1]);
      const langue = niveau > 10 ? choisir(parts, h)[0] : parts[0][0];
      const { options, attendu } = choixPays(cible, cible, nb, h, niveau, (p) => p.langues.includes(langue) || !avecLangue(p));
      return { type, cible: code, texte: langue, options, attendu, nb: options.length };
    }
    case "ville-pays": {
      const sures = villesSures(cible);
      const ville = niveau <= 5 ? sures[0] : choisir(sures, h);
      const { options, attendu } = choixPays(cible, cible, nb, h, niveau, () => false);
      return { type, cible: code, texte: ville, options, attendu, nb: options.length };
    }
    case "pays-ville": {
      const sures = villesSures(cible);
      const juste = niveau <= 5 ? sures[0] : choisir(sures, h);
      return questionTexte(type, cible, nb, h, niveau, juste, (p) => villesSures(p)[0], (v) => (cible.villes ?? []).includes(v));
    }
    case "sommet-pays": {
      const { options, attendu } = choixPays(cible, cible, nb, h, niveau, (p) => p.sommet?.[0] === cible.sommet![0]);
      return { type, cible: code, texte: cible.sommet![0], options, attendu, nb: options.length };
    }
    case "pays-sommet":
      return questionTexte(type, cible, nb, h, niveau, cible.sommet![0], (p) => p.sommet?.[0], () => false);
    case "fleuve-pays": {
      const { options, attendu } = choixPays(cible, cible, nb, h, niveau, (p) => p.fleuve?.[0] === cible.fleuve![0]);
      return { type, cible: code, texte: cible.fleuve![0], options, attendu, nb: options.length };
    }
    case "pays-fleuve":
      return questionTexte(type, cible, nb, h, niveau, cible.fleuve![0], (p) => p.fleuve?.[0], () => false);
    case "pays-conduite":
      return { type, cible: code, options: [{ id: "gauche", texte: "À gauche" }, { id: "droite", texte: "À droite" }], attendu: cible.conduite!, nb: 2 };
    case "tld-pays": {
      const { options, attendu } = choixPays(cible, cible, nb, h, niveau, (p) => p.tld === cible.tld);
      return { type, cible: code, texte: cible.tld, options, attendu, nb: options.length };
    }
    case "indicatif-pays": {
      const { options, attendu } = choixPays(cible, cible, nb, h, niveau, (p) => p.indicatif === cible.indicatif);
      return { type, cible: code, texte: cible.indicatif, options, attendu, nb: options.length };
    }
    case "pays-indicatif":
      return questionTexte(type, cible, nb, h, niveau, cible.indicatif!, (p) => p.indicatif, () => false);
    case "pays-iso": {
      // Plus haut, des codes qui commencent par la même lettre.
      const meme = niveau > 10 ? (v: string) => v[0] !== cible.iso3[0] : () => false;
      const q = questionTexte(type, cible, nb, h, niveau, cible.iso3, (p) => p.iso3, (v) => meme(v));
      return q.options.length >= nb ? q : questionTexte(type, cible, nb, h, niveau, cible.iso3, (p) => p.iso3, () => false);
    }
    case "fuseau-heure": {
      const ecart = ecartDe(cible);
      if (ecart === null) return null;
      const autres = [...new Set(PAYS.filter((p) => p.quiz && p.fuseau).map((p) => ecartDe(p)!))].filter((e) => e !== ecart);
      // Les faux choix : des heures proches d'abord (une, deux, trois heures d'écart).
      const proches = autres.sort((a, b) => Math.abs(a - ecart) - Math.abs(b - ecart)).slice(0, niveau <= 5 ? 10 : 6);
      const faux = melanger(proches, h).slice(0, nb - 1);
      const options = melanger([ecart, ...faux].map((e) => ({ id: String(e), texte: heureQuandMidi(e) })), h);
      return { type, cible: code, ecart, options, attendu: String(ecart), nb: options.length };
    }
    case "heure-pays": {
      const ecart = ecartDe(cible);
      if (ecart === null) return null;
      const { options, attendu } = choixPays(cible, cible, nb, h, niveau, (p) => !p.fuseau || ecartDe(p) === ecart);
      return { type, cible: code, ecart, options, attendu, nb: options.length };
    }
    case "voisin-de": {
      const voisin = PAR_CODE.get(choisir(cible.voisins, h))!;
      const faux = fauxPays(cible, nb - 1, h, Math.max(niveau, 6), "nom", "carte", (p) => p.code === voisin.code || cible.voisins.includes(p.code));
      const options = melanger([voisin, ...faux].map((p) => ({ id: p.code, code: p.code, texte: p.nom })), h);
      return { type, cible: code, options, attendu: voisin.code, nb: options.length };
    }
    case "pas-voisin": {
      const trois = melanger(cible.voisins, h)
        .slice(0, 3)
        .map((c) => PAR_CODE.get(c)!);
      const intrus = fauxPays(cible, 1, h, Math.max(niveau, 8), "nom", "carte", (p) => cible.voisins.includes(p.code))[0];
      if (!intrus || trois.length < 3) return null;
      const options = melanger([intrus, ...trois].map((p) => ({ id: p.code, code: p.code, texte: p.nom })), h);
      return { type, cible: code, options, attendu: intrus.code, nb: 4 };
    }
    case "nb-voisins": {
      const n = cible.voisins.length;
      const autour = [n - 2, n - 1, n + 1, n + 2, n + 3].filter((k) => k >= 1 && k !== n);
      const faux = melanger(autour, h).slice(0, 3);
      const options = [n, ...faux].sort((a, b) => a - b).map((k) => ({ id: String(k), texte: String(k) }));
      return { type, cible: code, options, attendu: String(n), nb: options.length };
    }
    case "plus-peuple":
    case "plus-grand": {
      const quatre = quatreComparables(cible, h, niveau, type === "plus-peuple" ? habitants : surface);
      if (!quatre) return null;
      const options = melanger(quatre.map((p) => ({ id: p.code, code: p.code, texte: p.nom })), h);
      return { type, cible: code, options, attendu: code, nb: 4 };
    }
    case "classer-population":
    case "classer-superficie": {
      const mesure = type === "classer-population" ? habitants : surface;
      const quatre = quatreComparables(cible, h, Math.min(niveau, 8), mesure);
      if (!quatre) return null;
      const ordre = [...quatre].sort((a, b) => mesure(b) - mesure(a)).map((p) => p.code);
      return { type, cible: code, codes: melanger(quatre, h).map((p) => p.code), options: [], attendu: ordre.join(","), nb: 0 };
    }
    default:
      return undefined;
  }
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
  /** Une question de duel : seulement les méthodes d'origine. */
  duel?: boolean;
};

const nbChoix = (niveau: number, h: Hasard): 4 | 6 => (niveau <= 5 ? 4 : niveau <= 10 ? (h() < 0.5 ? 6 : 4) : 6);

/** Les méthodes possibles pour ce pays dans ce contexte (au moins une si le pays est dans la catégorie). */
export function typesPossibles(code: string, ctx: Contexte): TypeQuestion[] {
  const p = pays(code);
  return ctx.types.filter((t) => TYPES[t].eligible(p) && !(ctx.qcmSeulement && REPONSES_LIBRES.includes(TYPES[t].reponse)) && !(ctx.duel && TYPES[t].duel === false));
}

export function fabriquer(graine: number, code: string, ctx: Contexte, typeImpose?: TypeQuestion): Question | null {
  const h = hasard(graine);
  const possibles = typeImpose ? [typeImpose] : typesPossibles(code, ctx);
  if (!possibles.length) return null;
  const premier = possibles.length === 1 ? possibles[0] : choisir(possibles, h);
  // Si la méthode tirée ne marche pas pour ce pays (quatre pays à comparer introuvables…), on essaie les autres.
  for (const type of [premier, ...possibles.filter((t) => t !== premier)]) {
    const q = fabriquerType(type, code, ctx, h);
    if (q) return q;
  }
  return null;
}

function fabriquerType(type: TypeQuestion, code: string, ctx: Contexte, h: Hasard): Question | null {
  const def = TYPES[type];
  const cible = pays(code);
  if (!def.eligible(cible)) return null;

  if (def.reponse === "ecrit" || def.reponse === "clic" || def.reponse === "placer") return { type, cible: code, options: [], attendu: code, nb: 0 };
  const nouvelle = fabriquerAutre(type, cible, ctx, h);
  if (nouvelle !== undefined) return nouvelle;

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
  const autre = juger2(type, cible, reponse);
  if (autre) return autre;
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

/** La distance sous laquelle une capitale posée sur le globe est juste (puis « presque »). */
export const PLACER_JUSTE = 300;
export const PLACER_PRESQUE = 800;

/** L'arbitrage des nouvelles méthodes (null : celles d'origine, jugées plus haut). */
function juger2(type: TypeQuestion, cible: Pays, reponse: string): Jugement | null {
  const bon = (x: boolean): Jugement => (x ? "juste" : "faux");
  const choisi = PAR_CODE.get(reponse);
  switch (type) {
    case "drapeau-vrai-faux":
    case "capitale-vrai-faux": {
      const [verdict, montre] = reponse.split(":");
      const m = PAR_CODE.get(montre ?? "");
      if (!m || (verdict !== "vrai" && verdict !== "faux")) return "faux";
      const vrai = type === "drapeau-vrai-faux" ? m.drapeau === cible.drapeau : (m.capitale ?? "").toLowerCase() === (cible.capitale ?? "").toLowerCase();
      return bon((verdict === "vrai") === vrai);
    }
    case "drapeau-couleur":
      return bon((cible.couleurs ?? []).includes(reponse));
    case "drapeau-colorie": {
      const attendu = cible.coloriage ?? [];
      const donne = reponse.split(",");
      if (!attendu.length || donne.length !== attendu.length) return "faux";
      const erreurs = attendu.filter((c, i) => donne[i] !== c).length;
      return erreurs === 0 ? "juste" : erreurs === 1 && attendu.length >= 3 ? "presque" : "faux";
    }
    case "drapeau-puzzle": {
      // La pièce posée à chaque place : juste si chaque place reçoit une pièce identique à la sienne.
      const ordre = reponse.split(",").map(Number);
      const d = cible.decoupe ?? "";
      if (d.length !== 6 || ordre.length !== 6 || new Set(ordre).size !== 6 || ordre.some((k) => !Number.isInteger(k) || k < 0 || k > 5)) return "faux";
      return bon(ordre.every((k, place) => d[k] === d[place]));
    }
    case "capitale-placer": {
      const [lat, lon] = reponse.split(",").map(Number);
      if (!cible.capLatLng || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return "faux";
      const d = distanceKm([lat, lon], cible.capLatLng);
      return d <= PLACER_JUSTE ? "juste" : d <= PLACER_PRESQUE ? "presque" : "faux";
    }
    case "continent-intrus":
    case "monnaie-intrus":
    case "plus-peuple":
    case "plus-grand":
    case "langue-pays":
    case "ville-pays":
      return bon(reponse === cible.code);
    case "pays-gentile":
      return bon(reponse === cible.gentile?.[0]);
    case "gentile-pays":
      return bon(Boolean(choisi?.gentile && choisi.gentile[0] === cible.gentile?.[0]));
    case "pays-langue":
      return bon(cible.langues.includes(reponse));
    case "pays-ville":
      return bon((cible.villes ?? []).includes(reponse));
    case "sommet-pays":
      return bon(Boolean(choisi?.sommet && choisi.sommet[0] === cible.sommet?.[0]));
    case "pays-sommet":
      return bon(reponse === cible.sommet?.[0]);
    case "fleuve-pays":
      return bon(Boolean(choisi?.fleuve && choisi.fleuve[0] === cible.fleuve?.[0]));
    case "pays-fleuve":
      return bon(reponse === cible.fleuve?.[0]);
    case "pays-conduite":
      return bon(reponse === cible.conduite);
    case "tld-pays":
      return bon(Boolean(choisi?.tld && choisi.tld === cible.tld));
    case "pays-indicatif":
      return bon(reponse === cible.indicatif);
    case "indicatif-pays":
      return bon(Boolean(choisi?.indicatif && choisi.indicatif === cible.indicatif));
    case "pays-iso":
      return bon(reponse === cible.iso3);
    case "fuseau-heure":
      return bon(cible.fuseau !== undefined && Number(reponse) === ecartHoraire(cible.fuseau));
    case "heure-pays":
      return bon(Boolean(choisi?.fuseau && cible.fuseau && ecartHoraire(choisi.fuseau) === ecartHoraire(cible.fuseau)));
    case "voisin-de":
      return bon(cible.voisins.includes(reponse));
    case "pas-voisin":
      return bon(Boolean(choisi) && reponse !== cible.code && !cible.voisins.includes(reponse));
    case "nb-voisins":
      return bon(Number(reponse) === cible.voisins.length);
    case "classer-population":
    case "classer-superficie": {
      const codes = reponse.split(",");
      const liste = codes.map((c) => PAR_CODE.get(c));
      if (codes.length !== 4 || new Set(codes).size !== 4 || liste.some((p) => !p?.quiz) || !codes.includes(cible.code)) return "faux";
      const mesure = (p: Pays) => (type === "classer-population" ? p.population : p.superficie) ?? 0;
      return bon(liste.every((p, i) => i === 0 || mesure(liste[i - 1]!) > mesure(p!)));
    }
    default:
      return null;
  }
}

/* ---------- Les parties ---------- */

/**
 * Une partie de niveau : les pays du niveau, complétés jusqu'à 20 par des pays déjà vus
 * (ceux que le joueur choisit de revoir), dans un ordre mêlé.
 */
export function partieDeNiveau(o: { categorie: CategorieId; niveau: number; graine: number; methode?: TypeQuestion | null; revision?: string[]; difficulte?: "facile" | "normal" | "difficile" }): Question[] {
  const nouveaux = niveauxDe(o.categorie)[o.niveau - 1] ?? [];
  // La difficulté des faux choix (et leur nombre) : plus éloignés en « facile », plus ressemblants en « difficile ».
  const niveauChoix = o.difficulte === "facile" ? Math.max(1, o.niveau - 5) : o.difficulte === "difficile" ? Math.min(15, o.niveau + 5) : o.niveau;
  const ctx: Contexte = { types: o.methode ? [o.methode] : typesDuNiveau(o.categorie, o.niveau), niveau: niveauChoix };
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
  const sortie = ordre.map((c, i) => fabriquer(deriver(o.graine, i), c, ctx)).filter((q): q is Question => q !== null);
  // Une question impossible (rare) : un autre pays de la catégorie prend sa place.
  if (sortie.length < QUESTIONS_PAR_NIVEAU) {
    const pris = new Set(sortie.map((q) => q.cible));
    let i = QUESTIONS_PAR_NIVEAU;
    for (const c of ordreDe(o.categorie)) {
      if (sortie.length >= QUESTIONS_PAR_NIVEAU) break;
      if (pris.has(c)) continue;
      const q = fabriquer(deriver(o.graine, i++), c, ctx);
      if (q) {
        sortie.push(q);
        pris.add(c);
      }
    }
  }
  return sortie;
}

/** Pour les modes rapides et les révisions : une question sur un pays donné, d'une catégorie donnée. */
export function questionSur(graine: number, categorie: CategorieId, code: string, niveau: number, qcmSeulement = false, duel = false): Question | null {
  return fabriquer(graine, code, { types: typesDuNiveau(categorie, niveau), niveau, qcmSeulement, duel });
}

/** Le « tour du monde » : une question au hasard, d'une catégorie au hasard, jusqu'au niveau donné. */
export function questionMelangee(graine: number, niveauMax: number, qcmSeulement = true): Question | null {
  const h = hasard(graine);
  for (let essai = 0; essai < 6; essai++) {
    const categorie = choisir(CATEGORIES_CLASSIQUES, h);
    const niveaux = niveauxDe(categorie).slice(0, Math.max(1, niveauMax));
    const code = choisir(niveaux.flat(), h);
    const niveau = 1 + Math.floor(h() * Math.max(1, niveauMax));
    // Les méthodes d'origine seulement : les records de l'éclair et du sans-faute restent comparables.
    const q = questionSur(Math.floor(h() * 4294967296), categorie, code, Math.min(niveau, 15), qcmSeulement, true);
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
    const categorie: CategorieId = mode === "melange" ? choisir(CATEGORIES_CLASSIQUES, hi) : mode;
    // Des pays des dix premiers niveaux : un duel se gagne sur ce que l'on sait, pas sur l'obscur.
    const codes = niveauxDe(categorie).slice(0, 10).flat();
    const code = choisir(codes, h);
    if (vus.has(code)) continue;
    const q = fabriquer(deriver(g, 7), code, { types: typesDuNiveau(categorie, 10), niveau: 6, nb: 4, qcmSeulement: true, duel: true });
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
