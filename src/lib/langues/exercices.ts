/*
 * Composer une séance : les mots à revoir d'abord, puis quelques nouveaux.
 * Le type d'exercice suit la maturité du mot :
 *   - jamais vu : la carte (découverte), puis un choix multiple dans la même séance ;
 *   - en cours : choix multiple ou écoute ;
 *   - appris depuis peu : texte à trous ou choix dans l'autre sens ;
 *   - bien installé : écrire le mot, texte à trous, écoute.
 * Un exercice d'association de paires réunit cinq mots déjà vus.
 * Code pur, avec un tirage aléatoire injectable (pour les tests).
 */
import { estDue } from "./srs";
import type { Carte, Element } from "./types";

export type Exercice =
  | { type: "carte"; cle: string; el: Element }
  | { type: "qcm"; cle: string; el: Element; sens: "en-fr" | "fr-en"; choix: string[]; bonne: string }
  | { type: "paires"; cle: string; els: Element[] }
  | { type: "trou"; cle: string; el: Element; avant: string; apres: string; choix: string[]; bonne: string }
  | { type: "ecriture"; cle: string; el: Element }
  | { type: "ecoute"; cle: string; el: Element; choix: string[]; bonne: string };

export type Alea = () => number;

export function melanger<T>(liste: T[], alea: Alea = Math.random): T[] {
  const t = [...liste];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

/** Trois leurres plausibles : même nature de préférence, jamais un doublon de la bonne réponse. */
export function leurres(el: Element, reserve: Element[], champ: "en" | "fr", alea: Alea, nombre = 3): string[] {
  const bonne = el[champ].toLowerCase();
  const vus = new Set([bonne]);
  const candidats = melanger(
    reserve.filter((x) => x.id !== el.id),
    alea,
  ).sort((a, b) => Number(b.nature === el.nature) - Number(a.nature === el.nature));
  const sortie: string[] = [];
  for (const c of candidats) {
    const v = c[champ];
    if (vus.has(v.toLowerCase())) continue;
    vus.add(v.toLowerCase());
    sortie.push(v);
    if (sortie.length === nombre) break;
  }
  return sortie;
}

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Repère le mot dans sa phrase d'exemple, y compris conjugué ou au pluriel. */
export function trouDans(el: Element): { avant: string; mot: string; apres: string } | null {
  const phrase = el.exEn;
  if (!phrase) return null;
  const essais = [el.forme, el.en.replace(/^to\s+/, "")].filter((x): x is string => Boolean(x));
  for (const essai of essais) {
    const racine = echapper(essai.trim());
    const double = `${racine}${racine.slice(-1)}(?:ed|ing)`;
    const motif = new RegExp(`\\b(${double}|${racine}(?:s|es|ed|d|ing)?|${racine.replace(/e$/, "")}ing|${racine.replace(/y$/, "")}ies|${racine.replace(/y$/, "")}ied)\\b`, "i");
    const m = motif.exec(phrase);
    if (m) return { avant: phrase.slice(0, m.index), mot: m[0], apres: phrase.slice(m.index + m[0].length) };
  }
  return null;
}

type Options = {
  elements: Element[];
  cartes: Map<string, Carte>;
  maintenant: number;
  taille?: number;
  nouveauxMax?: number;
  /** Mots à piocher pour les leurres (par défaut : les éléments eux-mêmes). */
  reserve?: Element[];
  alea?: Alea;
  /** Révision libre : même les mots qui ne sont pas encore dus. */
  libre?: boolean;
};

export function composerSeance(o: Options): Exercice[] {
  const alea = o.alea ?? Math.random;
  const taille = o.taille ?? 12;
  const reserve = o.reserve && o.reserve.length >= 4 ? o.reserve : o.elements;
  const carteDe = (el: Element) => o.cartes.get(el.id);

  const dus = o.elements.filter((el) => estDue(carteDe(el), o.maintenant)).sort((a, b) => carteDe(a)!.echeance - carteDe(b)!.echeance);
  const nouveaux = o.elements.filter((el) => !carteDe(el) || carteDe(el)!.etat === "nouveau");
  const autres = o.libre ? melanger(o.elements.filter((el) => !dus.includes(el) && !nouveaux.includes(el)), alea) : [];
  const nbNouveaux = Math.min(o.nouveauxMax ?? 5, nouveaux.length, Math.max(0, taille - dus.length));
  const choisis = [...dus.slice(0, taille), ...nouveaux.slice(0, nbNouveaux), ...autres].slice(0, taille);

  const qcm = (el: Element, sens: "en-fr" | "fr-en", cle: string): Exercice => {
    const champ = sens === "en-fr" ? "fr" : "en";
    return { type: "qcm", cle, el, sens, bonne: el[champ], choix: melanger([el[champ], ...leurres(el, reserve, champ, alea)], alea) };
  };

  const debut: Exercice[] = [];
  const suite: Exercice[] = [];
  for (const el of choisis) {
    const c = carteDe(el);
    const s = c?.stabilite ?? 0;
    const tirage = alea();
    if (!c || c.etat === "nouveau") {
      // Découverte, puis rappel plus loin dans la séance.
      debut.push({ type: "carte", cle: `${el.id}:carte`, el });
      suite.push(qcm(el, "en-fr", `${el.id}:qcm`));
      continue;
    }
    if (c.etat !== "revision") {
      suite.push(tirage < 0.6 ? qcm(el, "en-fr", `${el.id}:qcm`) : { type: "ecoute", cle: `${el.id}:ecoute`, el, bonne: el.fr, choix: melanger([el.fr, ...leurres(el, reserve, "fr", alea)], alea) });
      continue;
    }
    const trou = trouDans(el);
    if (s < 7) {
      if (trou && tirage < 0.5) suite.push({ type: "trou", cle: `${el.id}:trou`, el, avant: trou.avant, apres: trou.apres, bonne: trou.mot, choix: melanger([trou.mot, ...leurres(el, reserve, "en", alea)], alea) });
      else suite.push(qcm(el, "fr-en", `${el.id}:qcm`));
      continue;
    }
    if (tirage < 0.45) suite.push({ type: "ecriture", cle: `${el.id}:ecriture`, el });
    else if (trou && tirage < 0.8) suite.push({ type: "trou", cle: `${el.id}:trou`, el, avant: trou.avant, apres: trou.apres, bonne: trou.mot, choix: melanger([trou.mot, ...leurres(el, reserve, "en", alea)], alea) });
    else suite.push({ type: "ecoute", cle: `${el.id}:ecoute`, el, bonne: el.fr, choix: melanger([el.fr, ...leurres(el, reserve, "fr", alea)], alea) });
  }

  // Association de paires : cinq mots déjà vus, pour varier le rythme.
  const vus = choisis.filter((el) => carteDe(el) && carteDe(el)!.etat !== "nouveau");
  const melange = melanger(suite, alea);
  if (vus.length >= 5) melange.splice(Math.min(3, melange.length), 0, { type: "paires", cle: `paires:${vus.slice(0, 5).map((e) => e.id).join(",")}`, els: melanger(vus, alea).slice(0, 5) });
  return [...debut, ...melange];
}
