/*
 * Le Portulan : les couleurs des drapeaux, ramenées à neuf couleurs qu'on sait nommer.
 * Partagé par le script de construction (scripts/monde/construire.mjs, qui l'importe tel quel),
 * le navigateur (« quelle couleur manque ? », « colorie ce drapeau ») et le serveur qui juge.
 * Rien d'autre que du TypeScript effaçable : Node le lit sans compilation.
 */

export const COULEURS = ["rouge", "bordeaux", "orange", "jaune", "vert", "bleu", "bleu-ciel", "blanc", "noir"] as const;
export type Couleur = (typeof COULEURS)[number];

/** La teinte qu'on montre pour chaque couleur (pastilles, coloriage). */
export const PALETTE: Record<Couleur, string> = {
  rouge: "#c8202f",
  bordeaux: "#6e1a37",
  orange: "#f58220",
  jaune: "#fcd116",
  vert: "#009a44",
  bleu: "#1554a8",
  "bleu-ciel": "#7ab8e6",
  blanc: "#ffffff",
  noir: "#111111",
};

export const NOMS_COULEURS: Record<Couleur, string> = {
  rouge: "Rouge",
  bordeaux: "Bordeaux",
  orange: "Orange",
  jaune: "Jaune",
  vert: "Vert",
  bleu: "Bleu",
  "bleu-ciel": "Bleu ciel",
  blanc: "Blanc",
  noir: "Noir",
};

type Lab = [number, number, number];

function lab(r: number, g: number, b: number): Lab {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** « #fc0 », « #ffcc00 », « rgb(255, 204, 0) » → [255, 204, 0] (null si illisible). */
export function lireCouleur(c: string): [number, number, number] | null {
  const s = c.trim().toLowerCase();
  let m = /^#([0-9a-f]{3})$/.exec(s);
  if (m) return [0, 1, 2].map((i) => parseInt(m![1][i] + m![1][i], 16)) as [number, number, number];
  m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(s);
  if (m) return [0, 2, 4].map((i) => parseInt(m![1].slice(i, i + 2), 16)) as [number, number, number];
  m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  const noms: Record<string, [number, number, number]> = { black: [0, 0, 0], white: [255, 255, 255], red: [255, 0, 0], blue: [0, 0, 255], green: [0, 128, 0], yellow: [255, 255, 0] };
  return noms[s] ?? null;
}

const REPERES = COULEURS.map((n) => [n, lab(...(lireCouleur(PALETTE[n]) as [number, number, number]))] as const);

/** La couleur nommée la plus proche (à l'œil : dans l'espace Lab). */
export function nomCouleur(r: number, g: number, b: number): Couleur {
  const l = lab(r, g, b);
  let meilleur: Couleur = "noir";
  let d = Infinity;
  for (const [n, x] of REPERES) {
    const e = (l[0] - x[0]) ** 2 + (l[1] - x[1]) ** 2 + (l[2] - x[2]) ** 2;
    if (e < d) {
      d = e;
      meilleur = n;
    }
  }
  return meilleur;
}

/** Même chose depuis une écriture CSS (null si ce n'est pas une couleur simple). */
export function nomDeCss(c: string): Couleur | null {
  const v = lireCouleur(c);
  return v ? nomCouleur(...v) : null;
}
