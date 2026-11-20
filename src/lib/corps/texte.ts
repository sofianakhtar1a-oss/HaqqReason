/*
 * L'Écorché — juger une réponse écrite : sans accents ni majuscules, sans les petits mots de tête
 * (le, la, muscle, os, artère…), au singulier ; une lettre de travers passe (« presque »), et les
 * anciens noms (omoplate, rotule, péroné, couturier…) sont acceptés comme le latin.
 */

import { ELEMENTS } from "./catalogue";
import type { Element } from "./types";

export type Jugement = "juste" | "presque" | "faux";

const MOTS_VIDES = new Set(["le", "la", "les", "l", "un", "une", "des", "muscle", "muscles", "m", "mm", "os", "artere", "arteres", "a", "tendon", "tendons"]);

export function normaliser(s: string): string {
  const mots = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[’'`´-]/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  while (mots.length > 1 && MOTS_VIDES.has(mots[0])) mots.shift();
  // Le singulier : « vertèbres lombaires » vaut « vertèbre lombaire ».
  return mots.map((m) => (m.length > 3 && /[sx]$/.test(m) ? m.slice(0, -1) : m)).join(" ");
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

/** Les écritures acceptées pour une structure. */
export function formesAcceptees(e: Element): string[] {
  const latin = e.latin.replace(/^(m|mm|a|aa|arteria|arteriae)\.?\s+/i, "");
  return [...new Set([e.nom, ...(e.noms ?? []), e.latin, latin].map(normaliser).filter(Boolean))];
}

let toutes: { id: string; formes: string[] }[] | null = null;
const formesDeTous = () => (toutes ??= ELEMENTS.map((x) => ({ id: x.id, formes: formesAcceptees(x) })));

export function jugerNom(e: Element, reponse: string): Jugement {
  const r = normaliser(reponse);
  if (!r) return "faux";
  const formes = formesAcceptees(e);
  if (formes.includes(r)) return "juste";
  // Le nom exact d'une autre structure n'est jamais « presque » juste (biceps et triceps, par exemple).
  const autres = formesDeTous().filter((x) => x.id !== e.id);
  if (autres.some((x) => x.formes.includes(r))) return "faux";
  let meilleur = Infinity;
  for (const f of formes) {
    const tolere = f.length >= 12 ? 2 : f.length >= 5 ? 1 : 0;
    if (tolere) meilleur = Math.min(meilleur, ecart(r, f, tolere) <= tolere ? ecart(r, f, tolere) : Infinity);
  }
  if (meilleur === Infinity) return "faux";
  // Et si la faute ressemble davantage à une autre structure, c'est elle qu'on a voulu dire.
  for (const x of autres) for (const g of x.formes) if (ecart(r, g, meilleur) < meilleur) return "faux";
  return "presque";
}
