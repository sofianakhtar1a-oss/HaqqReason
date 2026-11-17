/*
 * Vérifier une réponse écrite avec bienveillance : majuscules, accents, ponctuation et articles
 * ne comptent pas ; une petite faute de frappe est acceptée (« presque ») et signalée.
 * Plusieurs réponses sont admises quand l'attendu les sépare par « / », « , » ou « ; ».
 */

export type Resultat = "juste" | "presque" | "faux";

const ARTICLES = /^(the|a|an|to|le|la|les|l'|un|une|des|du|de|se|s')\s+/;

export function normaliser(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9' -]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(ARTICLES, "")
    .replace(/^l'/, "")
    .trim();
}

/** Distance d'édition où l'inversion de deux lettres voisines ne compte que pour une faute. */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
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

export const variantes = (attendu: string) => attendu.split(/\s*[/;,]\s*/).map(normaliser).filter(Boolean);

export function verifier(reponse: string, attendu: string): Resultat {
  const r = normaliser(reponse);
  if (!r) return "faux";
  let meilleur: Resultat = "faux";
  for (const v of variantes(attendu)) {
    if (r === v) return "juste";
    const tolerance = v.length >= 8 ? 2 : v.length >= 4 ? 1 : 0;
    if (tolerance && distance(r, v) <= tolerance) meilleur = "presque";
  }
  return meilleur;
}
