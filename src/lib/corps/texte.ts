/*
 * L'Écorché — juger une réponse écrite : sans accents ni majuscules, sans les petits mots de tête
 * (le, la, muscle, os, artère…), au singulier ; une lettre de travers passe (« presque »), et les
 * anciens noms (omoplate, rotule, péroné, couturier…) sont acceptés comme le latin.
 */

import { ELEMENTS } from "./catalogue";
import type { Couche, Element } from "./types";

export type Jugement = "juste" | "presque" | "faux";

const ARTICLES = new Set(["le", "la", "les", "l", "un", "une", "des"]);
/** Les mots qui disent le genre de structure, en français, en latin et en abrégé : on peut les omettre (« deltoïde » pour « muscle deltoïde »). */
const GENRES: Record<string, Couche> = {
  muscle: "muscle", muscles: "muscle", m: "muscle", mm: "muscle", musculus: "muscle", musculi: "muscle",
  os: "os", ossa: "os",
  artere: "artere", arteres: "artere", a: "artere", aa: "artere", arteria: "artere", arteriae: "artere",
  veine: "veine", veines: "veine", v: "veine", vv: "veine", vena: "veine", venae: "veine",
  nerf: "nerf", nerfs: "nerf", n: "nerf", nn: "nerf", nervus: "nerf", nervi: "nerf",
  ligament: "ligament", ligaments: "ligament", lig: "ligament", ligamentum: "ligament", ligamenta: "ligament",
  tendon: "tendon", tendons: "tendon",
};

function mots(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[’'`´-]/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}
// Le singulier : « vertèbres lombaires » vaut « vertèbre lombaire ».
const singulier = (l: string[]) => l.map((m) => (m.length > 3 && /[sx]$/.test(m) ? m.slice(0, -1) : m)).join(" ");

/** Sans accents ni majuscules, au singulier, sans l'article ni le mot de genre en tête (pour chercher et comparer). */
export function normaliser(s: string): string {
  const l = mots(s);
  while (l.length > 1 && (ARTICLES.has(l[0]) || l[0] in GENRES)) l.shift();
  return singulier(l);
}

/** Une réponse écrite : sa forme entière (sans l'article), sa forme sans mot de genre, et ce mot s'il y en a un. */
function lireReponse(s: string): { entiere: string; reduite: string; genre: Couche | null } {
  const l = mots(s);
  while (l.length > 1 && ARTICLES.has(l[0])) l.shift();
  const entiere = singulier(l);
  let genre: Couche | null = null;
  while (l.length > 1 && l[0] in GENRES) genre = GENRES[l.shift()!];
  return { entiere, reduite: singulier(l), genre };
}

/** La distance d'édition (Levenshtein), plafonnée pour aller vite. */
export function ecart(a: string, b: string, plafond = 3): number {
  if (Math.abs(a.length - b.length) > plafond) return plafond + 1;
  let prec = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cour = [i];
    let min = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prec[j] + 1, cour[j - 1] + 1, prec[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cour.push(v);
      if (v < min) min = v;
    }
    if (min > plafond) return plafond + 1;
    prec = cour;
  }
  return prec[b.length];
}

/** Les écritures d'une structure : ses noms entiers (français, anciens noms, officiel, latin) et les mêmes sans le mot de genre. */
function formes(e: Element): { entieres: string[]; reduites: string[] } {
  const noms = [e.nom, ...(e.noms ?? []), e.officiel ?? "", e.latin].filter(Boolean).map(lireReponse);
  return { entieres: [...new Set(noms.map((n) => n.entiere))], reduites: [...new Set(noms.map((n) => n.reduite))] };
}

/** Les écritures acceptées pour une structure (pour un indice, une aide). */
export function formesAcceptees(e: Element): string[] {
  const f = formes(e);
  return [...new Set([...f.entieres, ...f.reduites])];
}

let toutes: { id: string; entieres: string[] }[] | null = null;
const formesDeTous = () => (toutes ??= ELEMENTS.map((x) => ({ id: x.id, entieres: formes(x).entieres })));

/**
 * Juger un nom écrit. Le mot de genre peut manquer (« fémorale » pour l'artère fémorale qu'on montre), mais s'il est
 * écrit il doit être le bon : « veine fémorale » ne vaut pas pour l'artère.
 */
export function jugerNom(e: Element, reponse: string): Jugement {
  const r = lireReponse(reponse);
  if (!r.reduite) return "faux";
  const f = formes(e);
  if (f.entieres.includes(r.entiere)) return "juste";
  const genreJuste = r.genre === null || r.genre === e.couche;
  if (genreJuste && f.reduites.includes(r.reduite)) return "juste";
  // Le nom exact d'une autre structure n'est jamais « presque » juste (biceps et triceps, par exemple).
  const autres = formesDeTous().filter((x) => x.id !== e.id);
  if (autres.some((x) => x.entieres.includes(r.entiere))) return "faux";
  if (!genreJuste) return "faux";
  let meilleur = Infinity;
  for (const g of [...f.entieres, ...f.reduites]) {
    const tolere = g.length >= 12 ? 2 : g.length >= 5 ? 1 : 0;
    if (!tolere) continue;
    for (const essai of [r.entiere, r.reduite]) {
      const d = ecart(essai, g, tolere);
      if (d <= tolere) meilleur = Math.min(meilleur, d);
    }
  }
  if (meilleur === Infinity) return "faux";
  // Et si la faute ressemble davantage à une autre structure, c'est elle qu'on a voulu dire.
  for (const x of autres) for (const g of x.entieres) if (ecart(r.entiere, g, meilleur) < meilleur) return "faux";
  return "presque";
}
