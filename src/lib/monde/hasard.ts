/*
 * Un hasard reproductible : la même graine donne toujours les mêmes questions.
 * C'est ce qui permet à deux joueurs d'un duel (et au serveur qui les arbitre)
 * de voir exactement les mêmes questions, sans les échanger.
 */

export type Hasard = () => number;

/** Mulberry32 : rapide, 32 bits, suffisant pour mélanger des questions. */
export function hasard(graine: number): Hasard {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Une graine dérivée (la question n° i d'une partie), indépendante des autres. */
export function deriver(graine: number, i: number): number {
  let h = (graine ^ Math.imul(i + 1, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function melanger<T>(liste: readonly T[], h: Hasard): T[] {
  const t = [...liste];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(h() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

export function choisir<T>(liste: readonly T[], h: Hasard): T {
  return liste[Math.floor(h() * liste.length)];
}

/** Une graine neuve (32 bits). */
export function nouvelleGraine(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}
