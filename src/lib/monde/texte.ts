import { PAYS } from "./donnees";
import type { Pays } from "./types";

/*
 * Les réponses écrites : sans se soucier des accents, des majuscules, des tirets ni de
 * « Saint » écrit « St ». Une petite faute de frappe passe (« presque »), sauf si ce qui est
 * écrit ressemble davantage à un autre pays (ou à une autre capitale) : « Irak » n'est pas « Iran ».
 */

export type Jugement = "juste" | "presque" | "faux";

export function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[’'`´ʼ\-–—.,;:()/_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(le|la|les|l|el) /, "")
    .replace(/\bst\b/g, "saint")
    .replace(/\bste\b/g, "sainte")
    .replace(/\s/g, "");
}

/** Distance de Damerau-Levenshtein (une inversion de deux lettres compte pour une faute). */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cout);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const tolerance = (n: number) => (n >= 9 ? 2 : n >= 4 ? 1 : 0);

/** Toutes les formes acceptées, déjà normalisées, pour chaque pays (noms) et chaque capitale. */
const formesNoms = new Map<string, string[]>(PAYS.map((p) => [p.code, [...new Set(p.noms.map(normaliser))]]));
const formesCapitales = new Map<string, string[]>(PAYS.filter((p) => p.capitale).map((p) => [p.code, [...new Set([p.capitale!, ...(p.capitales ?? [])].map(normaliser))]]));

export function comparer(saisie: string, cible: string, formes: Map<string, string[]>): Jugement {
  const s = normaliser(saisie);
  if (!s) return "faux";
  const attendues = formes.get(cible) ?? [];
  if (attendues.includes(s)) return "juste";
  // Ce qui est écrit est exactement un autre pays (ou une autre capitale) : faux.
  for (const [code, f] of formes) if (code !== cible && f.includes(s)) return "faux";
  const ici = Math.min(...attendues.map((a) => distance(s, a)));
  if (ici > tolerance(s.length)) return "faux";
  // Plus proche d'un autre que de la bonne réponse (ou à égalité) : on ne devine pas.
  for (const [code, f] of formes) {
    if (code === cible) continue;
    for (const a of f) if (Math.abs(a.length - s.length) <= ici && distance(s, a) <= ici) return "faux";
  }
  return "presque";
}

export const jugerNom = (saisie: string, p: Pays): Jugement => comparer(saisie, p.code, formesNoms);
export const jugerCapitale = (saisie: string, p: Pays): Jugement => comparer(saisie, p.code, formesCapitales);
