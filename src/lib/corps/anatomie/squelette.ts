/*
 * L'Écorché — le squelette, os par os (côté gauche, puis son miroir pour le droit).
 * Repère : mètres ; y vers le haut depuis le sol, x vers la gauche du sujet, z vers l'avant.
 * Position anatomique : debout, bras le long du corps légèrement écartés, paumes vers l'avant.
 */

import { type Maillage, ellipsoide, finir, fusion, olive, partager, symetrique, tube } from "../geometrie";
import type { Piece } from "../types";
import { type V3, borne, lisse, melange } from "../vec";

const CARTILAGE: [number, number, number, number] = [176, 204, 222, 120];

export type Ajouteur = {
  pair: (cle: string, element: string, m: Maillage, o?: { teinte?: Piece["teinte"] }) => void;
  impair: (cle: string, element: string, m: Maillage, o?: { teinte?: Piece["teinte"] }) => void;
};

export function ajouteur(liste: Piece[], couche: Piece["couche"], profondeur: Piece["profondeur"] = 0): Ajouteur {
  return {
    pair: (cle, element, m, o = {}) => {
      const g = finir(m);
      liste.push({ cle: `${cle}:g`, element, couche, maillage: g, profondeur, cote: "g", teinte: o.teinte });
      liste.push({ cle: `${cle}:d`, element, couche, maillage: symetrique(g), profondeur, cote: "d", teinte: o.teinte });
    },
    impair: (cle, element, m, o = {}) => {
      liste.push({ cle, element, couche, maillage: finir(m), profondeur, cote: null, teinte: o.teinte });
    },
  };
}

/** Interpolation linéaire par morceaux d'une table [x, y] (x croissants). */
export function table(points: [number, number][], x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const [x0, y0] = points[i - 1];
      const [x1, y1] = points[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

/* ---------------------------------------------------------------- le rachis */

/** Profondeur (z) du corps des vertèbres selon la hauteur : lordose cervicale, cyphose dorsale, lordose lombaire. */
const RACHIS: [number, number][] = [
  [0.99, -0.048],
  [1.028, -0.04],
  [1.062, -0.036],
  [1.128, -0.045],
  [1.188, -0.06],
  [1.24, -0.072],
  [1.32, -0.077],
  [1.4, -0.064],
  [1.463, -0.045],
  [1.508, -0.03],
  [1.558, -0.022],
];
export const zRachis = (y: number) => table(RACHIS, y);

export const VERTEBRES: { id: string; y: number; sorte: "c" | "t" | "l"; element: string }[] = [
  ...[1.558, 1.54, 1.524, 1.508, 1.493, 1.478, 1.463].map((y, i) => ({ id: `c${i + 1}`, y, sorte: "c" as const, element: i === 0 ? "atlas" : i === 1 ? "axis" : i === 6 ? "c7" : "vertebres-cervicales" })),
  ...[1.445, 1.424, 1.402, 1.38, 1.357, 1.334, 1.31, 1.286, 1.262, 1.238, 1.213, 1.188].map((y, i) => ({ id: `t${i + 1}`, y, sorte: "t" as const, element: "vertebres-thoraciques" })),
  ...[1.16, 1.128, 1.095, 1.062, 1.028].map((y, i) => ({ id: `l${i + 1}`, y, sorte: "l" as const, element: "vertebres-lombaires" })),
];

function vertebre(y: number, sorte: "c" | "t" | "l", rang: number, id: string): Maillage {
  const z = zRachis(y);
  const k = sorte === "c" ? rang / 6 : sorte === "t" ? rang / 11 : rang / 4;
  const corps = sorte === "c" ? { rx: 0.0105, rz: 0.0078, h: 0.0105 } : sorte === "t" ? { rx: 0.012 + k * 0.005, rz: 0.011 + k * 0.004, h: 0.015 + k * 0.004 } : { rx: 0.019 + k * 0.002, rz: 0.015 + k * 0.001, h: 0.022 + k * 0.002 };
  const morceaux: Maillage[] = [];
  const arcZ = z - corps.rz - 0.007;
  if (id !== "c1") {
    morceaux.push(
      tube(
        [
          [0, y - corps.h / 2, z],
          [0, y + corps.h / 2, z],
        ],
        { tour: 16, anneaux: 5, rayon: (t) => corps.rx * (0.93 + 0.07 * Math.abs(t - 0.5) * 2), ovale: corps.rz / corps.rx, indice: [1, 0, 0] },
      ),
    );
  }
  // L'arc postérieur (pédicules et lames) : un anneau derrière le corps.
  const rArc = sorte === "c" ? (id === "c1" ? 0.016 : 0.0085) : sorte === "t" ? 0.0075 : 0.0085;
  morceaux.push(
    tube(
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return [Math.sin(a) * rArc * 1.15, y, arcZ + Math.cos(a) * rArc] as V3;
      }),
      { boucle: true, tour: 8, anneaux: 24, rayon: sorte === "l" ? 0.0035 : 0.0028 },
    ),
  );
  // Le processus épineux : court et bifide au cou, long et incliné au dos, large aux lombes.
  const long = sorte === "c" ? (id === "c7" ? 0.03 : 0.017) : sorte === "t" ? 0.032 : 0.027;
  const chute = sorte === "t" ? 0.022 * (1 - Math.abs(k - 0.45)) : sorte === "c" ? 0.006 : 0.002;
  if (id !== "c1")
    morceaux.push(
      tube(
        [
          [0, y, arcZ - rArc * 0.8],
          [0, y - chute * 0.6, arcZ - rArc - long * 0.55],
          [0, y - chute, arcZ - rArc - long],
        ],
        { tour: 8, anneaux: 8, rayon: (t) => (sorte === "l" ? 0.0058 : 0.0034) * (1 - t * 0.35), ovale: sorte === "l" ? 0.5 : 0.75, indice: [0, 1, 0] },
      ),
    );
  // Les processus transverses.
  const large = sorte === "c" ? (id === "c1" ? 0.036 : 0.022) : sorte === "t" ? 0.027 - k * 0.006 : 0.03;
  for (const s of [1, -1])
    morceaux.push(
      tube(
        [
          [s * rArc * 0.9, y, arcZ + 0.002],
          [s * large * 0.7, y + 0.001, arcZ - (sorte === "t" ? 0.006 : 0.001)],
          [s * large, y, arcZ - (sorte === "t" ? 0.012 : 0.002)],
        ],
        { tour: 8, anneaux: 7, rayon: (t) => (sorte === "l" ? 0.0042 : 0.0033) * (1 - t * 0.3) },
      ),
    );
  // L'axis porte la dent (l'odontoïde) qui monte dans l'anneau de l'atlas.
  if (id === "c2")
    morceaux.push(
      tube(
        [
          [0, y + corps.h / 2, z],
          [0, y + corps.h / 2 + 0.014, z + 0.001],
        ],
        { tour: 10, anneaux: 5, rayon: (t) => 0.0048 * (1 - t * 0.5) },
      ),
    );
  return fusion(...morceaux);
}

/* ---------------------------------------------------------------- le crâne */

function crane(pieces: Piece[]) {
  const os = ajouteur(pieces, "os");
  const F = finir;
  const c: V3 = [0, 1.648, -0.012];
  const [ax, ay, az] = [0.074, 0.086, 0.099];
  const bosse = (d: number, r: number) => (d >= r ? 0 : 0.5 + 0.5 * Math.cos((d / r) * Math.PI));
  const coque = ellipsoide(c, [ax, 0, 0], [0, ay, 0], [0, 0, az], {
    tour: 96,
    meridiens: 60,
    deformer: (p) => {
      let [x, y, z] = p;
      const ny = (y - c[1]) / ay;
      const nz = (z - c[2]) / az;
      // Le front plus droit, la base aplatie, les tempes un peu creusées.
      if (nz > 0.2 && ny > -0.2) z -= 0.012 * lisse(0.2, 0.9, nz) * lisse(0.9, 0.2, ny);
      if (ny < -0.55) y += (ny + 0.55) * -0.012;
      if (Math.abs(x) > 0.05 && ny < 0.2 && ny > -0.5 && nz > -0.3 && nz < 0.4) x *= 0.94;
      // Les orbites : deux creux sous le front.
      for (const s of [1, -1]) {
        const d = Math.hypot((x - s * 0.033) / 1.08, (y - 1.626) * 1.12);
        if (z > c[2] + 0.03) z -= 0.042 * Math.pow(bosse(d, 0.02), 0.7) * lisse(c[2] + 0.03, c[2] + 0.07, z);
      }
      // L'ouverture du nez (osseuse : sans cartilage), en poire.
      const dn = Math.hypot(x * (y < 1.592 ? 1.25 : 1.9), (y - 1.593) * 0.8);
      if (z > c[2] + 0.055) z -= 0.024 * Math.pow(bosse(dn, 0.014), 0.7);
      return [x, y, z];
    },
  });
  // Les normales de la coque entière : les sutures ne se voient pas comme des arêtes.
  finir(coque);
  const morceaux = partager(coque, ([x, y, z]) => {
    const nx = x / ax;
    const ny = (y - c[1]) / ay;
    const nz = (z - c[2]) / az;
    const cote = x >= 0 ? "g" : "d";
    if (Math.abs(x) < 0.0105 && y > 1.598 && y < 1.626 && nz > 0.78) return "nasal";
    if (ny < -0.24 && nz > 0.42 && Math.abs(nx) < 0.6) return "maxillaire";
    if (ny < -0.06 && nz > 0.3 && Math.abs(nx) >= 0.48) return `zygomatique-${cote}`;
    if (nz > 0.3 - 0.06 * ny) return "frontal";
    if (nz < -0.62 || (nz < -0.36 && ny < -0.12)) return "occipital";
    if (Math.abs(nx) > 0.55 && ny < 0.14 && nz > -0.62 && nz < 0.36) return nz > 0.12 && ny > -0.5 ? `sphenoide-${cote}` : `temporal-${cote}`;
    if (ny < -0.45) return "sphenoide-base";
    return `parietal-${cote}`;
  });
  const prendre = (nom: string) => morceaux.get(nom) ?? ellipsoide(c, [0.001, 0, 0], [0, 0.001, 0], [0, 0, 0.001]);
  // Les dents, sur l'arcade du maxillaire et de la mandibule.
  const arcade = (y: number, centreZ: number, demiLarge: number, profond: number, haut: number) =>
    fusion(
      ...Array.from({ length: 14 }, (_, i) => {
        const a = ((i + 0.5) / 14 - 0.5) * Math.PI * 1.15;
        const x = demiLarge * Math.sin(a);
        const z = centreZ + profond * Math.cos(a);
        const molaire = Math.abs(a) > 0.75;
        return F(ellipsoide([x, y, z], [molaire ? 0.0042 : 0.003, 0, 0], [0, haut, 0], [0, 0, molaire ? 0.0045 : 0.0028], { tour: 8, meridiens: 6 }));
      }),
    );
  // Les rebords des orbites (arcade sourcilière en haut) : ce qui dessine le regard du crâne.
  const rebord = (s: number, haut: boolean) =>
    F(
      tube(
        Array.from({ length: 9 }, (_, i) => {
          const a = (haut ? 0.05 : 1.05) * Math.PI + (i / 8) * 0.9 * Math.PI;
          return [s * 0.033 + Math.cos(a) * 0.021, 1.626 + Math.sin(a) * 0.0185, c[2] + az * 0.86 - 0.012 + (haut ? 0.006 : 0) - Math.abs(Math.cos(a)) * 0.014] as V3;
        }),
        { tour: 8, anneaux: 14, rayon: (t) => (haut ? 0.0048 : 0.0036) * (0.75 + 0.25 * Math.sin(t * Math.PI)) },
      ),
    );
  os.impair("frontal", "frontal", fusion(prendre("frontal"), rebord(1, true), rebord(-1, true)));
  os.impair("occipital", "occipital", prendre("occipital"));
  os.impair("nasal", "os-nasaux", prendre("nasal"));
  os.impair(
    "maxillaire",
    "maxillaire",
    fusion(prendre("maxillaire"), F(ellipsoide([0, 1.578, 0.05], [0.027, 0, 0], [0, 0.011, 0], [0, 0, 0.018], { tour: 22, meridiens: 12 })), arcade(1.566, 0.036, 0.026, 0.04, 0.0052)),
  );
  os.impair("sphenoide-base", "sphenoide", fusion(prendre("sphenoide-base"), prendre("sphenoide-g"), prendre("sphenoide-d")));
  // Pariétaux, temporaux, zygomatiques : pairs, mais déjà découpés des deux côtés.
  for (const [cote, s] of [
    ["g", 1],
    ["d", -1],
  ] as const) {
    const arc = F(
      tube(
        [
          [s * 0.052, 1.602, 0.058],
          [s * 0.064, 1.6, 0.03],
          [s * 0.067, 1.6, 0.0],
        ],
        { tour: 8, anneaux: 10, rayon: 0.0042, ovale: 0.55, indice: [0, 1, 0] },
      ),
    );
    const mastoide = F(ellipsoide([s * 0.057, 1.582, -0.03], [0.007, 0, 0], [0, 0.011, 0], [0, 0, 0.008], { tour: 10, meridiens: 8 }));
    const pommette = fusion(F(ellipsoide([s * 0.046, 1.604, 0.058], [0.012, 0, 0], [0, 0.0085, 0], [0, 0, 0.007], { tour: 14, meridiens: 10 })), rebord(s, false));
    pieces.push({ cle: `parietal:${cote}`, element: "parietal", couche: "os", maillage: finir(prendre(`parietal-${cote}`)), profondeur: 0, cote });
    pieces.push({ cle: `temporal:${cote}`, element: "temporal", couche: "os", maillage: finir(fusion(prendre(`temporal-${cote}`), mastoide)), profondeur: 0, cote });
    pieces.push({ cle: `zygomatique:${cote}`, element: "zygomatique", couche: "os", maillage: finir(fusion(prendre(`zygomatique-${cote}`), arc, pommette)), profondeur: 0, cote });
  }
  // La mandibule : un fer à cheval, ses deux branches montantes et ses dents.
  const branche = (s: number): V3[] => [
    [s * 0.051, 1.596, -0.008],
    [s * 0.05, 1.576, -0.003],
    [s * 0.047, 1.551, -0.002],
    [s * 0.04, 1.54, 0.03],
    [s * 0.02, 1.533, 0.066],
  ];
  const corpsMandibule = F(tube([...branche(1), [0, 1.53, 0.078], ...branche(-1).reverse()], {
    tour: 12,
    anneaux: 46,
    rayon: (t) => 0.0105 + 0.002 * Math.abs(Math.cos(t * Math.PI * 2)),
    ovale: 0.42,
    indice: [0, 1, 0],
  }));
  const coronoides = [1, -1].map((s) =>
    F(tube(
      [
        [s * 0.047, 1.572, 0.006],
        [s * 0.047, 1.598, 0.017],
      ],
      { tour: 8, anneaux: 5, rayon: (t) => 0.005 * (1 - t * 0.6), ovale: 0.5 },
    )),
  );
  os.impair("mandibule", "mandibule", fusion(corpsMandibule, ...coronoides, arcade(1.553, 0.034, 0.024, 0.038, 0.005)));
  // L'os hyoïde, suspendu dans le cou.
  os.impair(
    "hyoide",
    "hyoide",
    tube(
      [
        [0.021, 1.5, 0.018],
        [0.012, 1.497, 0.036],
        [0, 1.496, 0.042],
        [-0.012, 1.497, 0.036],
        [-0.021, 1.5, 0.018],
      ],
      { tour: 8, anneaux: 16, rayon: 0.0028 },
    ),
  );
}

/* ---------------------------------------------------------------- le thorax */

/** Les côtes, de la 1re à la 12e : demi-largeur, demi-profondeur, centre (z), descente, fin (angle depuis l'avant). */
const COTES: [number, number, number, number, number][] = [
  [0.058, 0.048, 0.016, 0.026, 36],
  [0.085, 0.068, 0.006, 0.05, 31],
  [0.102, 0.08, 0.0, 0.07, 30],
  [0.115, 0.09, -0.004, 0.085, 32],
  [0.124, 0.097, -0.006, 0.095, 35],
  [0.13, 0.102, -0.007, 0.1, 40],
  [0.133, 0.104, -0.008, 0.105, 45],
  [0.133, 0.104, -0.01, 0.1, 56],
  [0.13, 0.102, -0.012, 0.095, 66],
  [0.125, 0.098, -0.014, 0.09, 76],
  [0.114, 0.09, -0.016, 0.07, 96],
  [0.099, 0.08, -0.02, 0.05, 116],
];

/** Le devant du sternum selon la hauteur. */
export const zSternum = (y: number) => 0.07 + ((1.44 - y) / (1.44 - 1.25)) * 0.033;
const SURSTERNUM = [1.425, 1.398, 1.372, 1.346, 1.318, 1.29, 1.272];

export function pointCote(i: number, phi: number): V3 {
  const [A, B, zc, descente, fin] = COTES[i];
  const v = VERTEBRES[7 + i];
  const debut = 155;
  const avance = borne((debut - phi) / (debut - fin), 0, 1);
  const y = v.y - 0.004 - descente * Math.pow(avance, 1.25);
  const a = (phi * Math.PI) / 180;
  return [A * Math.sin(a), y, zc + B * Math.cos(a)];
}

function thorax(pieces: Piece[]) {
  const os = ajouteur(pieces, "os");
  const finsCartilages: V3[][] = [];
  for (let i = 0; i < 12; i++) {
    const v = VERTEBRES[7 + i];
    const z = zRachis(v.y);
    const fin = COTES[i][4];
    const arc = Array.from({ length: 12 }, (_, k) => pointCote(i, 155 - ((155 - fin) * k) / 11));
    const points: V3[] = [[0.015, v.y + 0.002, z - 0.002], [0.038, v.y - 0.001, z - 0.022], ...arc];
    const cote = tube(points, { tour: 10, anneaux: 40, rayon: (t) => (i === 0 ? 0.0068 : 0.0058) * (1 - 0.25 * t * (i >= 10 ? 1 : 0)), ovale: i === 0 ? 0.6 : 0.42, indice: [0, 1, 0] });
    os.pair(`cote-${i + 1}`, i < 7 ? "cotes-vraies" : i < 10 ? "fausses-cotes" : "cotes-flottantes", cote);
    // Les cartilages costaux : jusqu'au sternum (côtes 1 à 7), ou au cartilage du dessus (8 à 10).
    const bout = arc[arc.length - 1];
    if (i < 7) {
      const ys = SURSTERNUM[i];
      const chemin: V3[] = [bout, melange(bout, [0.016, ys, zSternum(ys) - 0.004], 0.5), [0.016, ys, zSternum(ys) - 0.004]];
      chemin[1][1] += i >= 5 ? 0.012 : 0;
      finsCartilages.push(chemin);
      os.pair(`cartilage-${i + 1}`, "cartilages-costaux", tube(chemin, { tour: 8, anneaux: 12, rayon: 0.0048, ovale: 0.55, indice: [0, 1, 0] }), { teinte: CARTILAGE });
    } else if (i < 10) {
      const dessus = finsCartilages[finsCartilages.length - 1];
      const cible = melange(dessus[0], dessus[1], 0.65);
      const chemin: V3[] = [bout, [bout[0] - 0.012, (bout[1] + cible[1]) / 2 - 0.004, bout[2] + 0.01], cible];
      finsCartilages.push(chemin);
      os.pair(`cartilage-${i + 1}`, "cartilages-costaux", tube(chemin, { tour: 8, anneaux: 10, rayon: 0.0042, ovale: 0.55, indice: [0, 1, 0] }), { teinte: CARTILAGE });
    }
  }
  // Le sternum : manubrium, corps, processus xiphoïde.
  const plaque = (y0: number, y1: number, large: (t: number) => number, epais = 0.32) =>
    tube(
      [
        [0, y0, zSternum(y0)],
        [0, y1, zSternum(y1)],
      ],
      { tour: 14, anneaux: 10, rayon: (t) => large(t), ovale: epais, indice: [1, 0, 0] },
    );
  os.impair(
    "manubrium",
    "sternum",
    plaque(1.443, 1.4, (t) => 0.026 - 0.009 * t),
  );
  os.impair(
    "corps-sternum",
    "sternum",
    plaque(1.399, 1.274, (t) => 0.014 + 0.004 * Math.sin(t * Math.PI)),
  );
  os.impair(
    "xiphoide",
    "sternum",
    plaque(1.273, 1.243, (t) => 0.008 * (1 - t * 0.7), 0.45),
  );
  // Le rachis, vertèbre par vertèbre, puis le sacrum et le coccyx.
  VERTEBRES.forEach((v, i) => {
    const rang = v.sorte === "c" ? i : v.sorte === "t" ? i - 7 : i - 19;
    os.impair(`vertebre-${v.id}`, v.element, vertebre(v.y, v.sorte, rang, v.id));
  });
  os.impair(
    "sacrum",
    "sacrum",
    fusion(
      tube(
        [
          [0, 0.998, -0.046],
          [0, 0.96, -0.062],
          [0, 0.925, -0.078],
          [0, 0.895, -0.086],
        ],
        { tour: 16, anneaux: 16, rayon: (t) => 0.052 - 0.038 * t, ovale: (t) => 0.42 + 0.2 * t, indice: [1, 0, 0] },
      ),
      ...[0, 1, 2, 3].map((k) => {
        const y = 0.985 - k * 0.022;
        return tube(
          [
            [0, y, -0.06 - k * 0.007],
            [0, y - 0.004, -0.072 - k * 0.007],
          ],
          { tour: 8, anneaux: 4, rayon: 0.004 },
        );
      }),
    ),
  );
  os.impair(
    "coccyx",
    "coccyx",
    tube(
      [
        [0, 0.893, -0.087],
        [0, 0.876, -0.086],
        [0, 0.862, -0.079],
      ],
      { tour: 10, anneaux: 8, rayon: (t) => 0.011 - 0.008 * t, ovale: 0.6, indice: [1, 0, 0] },
    ),
  );
}

/* ---------------------------------------------------------------- le membre supérieur */

/** Repères du membre supérieur gauche (le droit en est le miroir). */
export const BRAS = {
  epaule: [0.172, 1.408, -0.022] as V3,
  coude: [0.214, 1.118, -0.012] as V3,
  poignet: [0.256, 0.842, 0.009] as V3,
  acromion: [0.174, 1.451, -0.026] as V3,
};

/** Les cinq rayons de la main gauche (du pouce au petit doigt) : métacarpien et longueurs des phalanges. */
export const DOIGTS: { base: V3; tete: V3; longueurs: number[]; rayon: number }[] = [
    { base: [0.279, 0.808, 0.018], tete: [0.297, 0.772, 0.036], longueurs: [0.03, 0.022], rayon: 0.0052 },
    { base: [0.268, 0.801, 0.013], tete: [0.273, 0.739, 0.02], longueurs: [0.04, 0.024, 0.017], rayon: 0.0048 },
    { base: [0.258, 0.8, 0.012], tete: [0.258, 0.736, 0.019], longueurs: [0.045, 0.028, 0.019], rayon: 0.0049 },
    { base: [0.248, 0.801, 0.011], tete: [0.244, 0.739, 0.018], longueurs: [0.042, 0.027, 0.018], rayon: 0.0045 },
    { base: [0.24, 0.802, 0.01], tete: [0.23, 0.744, 0.016], longueurs: [0.033, 0.02, 0.016], rayon: 0.0041 },
  ];

/** La direction d'un doigt (le pouce part en avant et en dehors). */
export const directionDoigt = (n: number): V3 => (n === 0 ? [0.33, -0.86, 0.38] : [0.0, -0.995, 0.09]);

/** Les phalanges d'un doigt : [début, fin] de chacune. */
export function phalangesDoigt(n: number): [V3, V3][] {
  const d = DOIGTS[n];
  const dir = directionDoigt(n);
  let depart = d.tete;
  return d.longueurs.map((L, k) => {
    const arrivee: V3 = [depart[0] + dir[0] * L, depart[1] + dir[1] * L, depart[2] + dir[2] * L + (n === 0 ? 0 : 0.001 * k)];
    const seg: [V3, V3] = [depart, arrivee];
    depart = [arrivee[0] + dir[0] * 0.0015, arrivee[1] + dir[1] * 0.0015, arrivee[2] + dir[2] * 0.0015];
    return seg;
  });
}

function membreSuperieur(pieces: Piece[]) {
  const os = ajouteur(pieces, "os");
  os.pair(
    "clavicule",
    "clavicule",
    tube(
      [
        [0.021, 1.447, 0.071],
        [0.065, 1.455, 0.074],
        [0.12, 1.458, 0.04],
        [0.163, 1.452, -0.008],
      ],
      { tour: 10, anneaux: 26, rayon: (t) => 0.0058 + 0.0035 * Math.pow(Math.abs(t - 0.45) * 2, 2), ovale: 0.75 },
    ),
  );
  // La scapula : une lame triangulaire sur le dos du thorax, son épine, l'acromion, la coracoïde, la glène.
  const lame = (() => {
    const bord = (u: number, v: number): V3 => {
      // u : de l'angle supérieur (0) à l'angle inférieur (1) ; v : du bord médial (0) au bord latéral (1).
      const med: V3 = melange([0.078, 1.43, -0.113], [0.083, 1.282, -0.11], u);
      const lat: V3 = u < 0.25 ? melange([0.152, 1.405, -0.052], [0.142, 1.375, -0.07], u * 4) : melange([0.142, 1.375, -0.07], [0.09, 1.28, -0.108], (u - 0.25) / 0.75);
      const p = melange(med, lat, v);
      p[2] -= 0.01 * Math.sin(v * Math.PI) * (1 - u * 0.4);
      return p;
    };
    const m = tube(
      Array.from({ length: 9 }, (_, k) => bord(k / 8, 0.5)),
      { tour: 4, anneaux: 3, rayon: 0.001 },
    );
    m.p = [];
    m.n = [];
    m.i = [];
    m.uv = [];
    const [nu, nv] = [16, 12];
    for (const face of [0, 1])
      for (let a = 0; a < nu; a++)
        for (let b = 0; b < nv; b++) {
          const p = bord(a / (nu - 1), b / (nv - 1));
          const e = face === 0 ? -0.0028 : 0.0028;
          m.p.push(p[0], p[1], p[2] + e);
          m.uv.push(a / (nu - 1), b / (nv - 1));
        }
    const id = (f: number, a: number, b: number) => f * nu * nv + a * nv + b;
    for (let a = 0; a < nu - 1; a++)
      for (let b = 0; b < nv - 1; b++) {
        m.i.push(id(0, a, b), id(0, a, b + 1), id(0, a + 1, b), id(0, a + 1, b), id(0, a, b + 1), id(0, a + 1, b + 1));
        m.i.push(id(1, a, b), id(1, a + 1, b), id(1, a, b + 1), id(1, a + 1, b), id(1, a + 1, b + 1), id(1, a, b + 1));
      }
    for (let a = 0; a < nu - 1; a++)
      for (const b of [0, nv - 1]) {
        const s = b === 0;
        if (s) m.i.push(id(0, a, b), id(0, a + 1, b), id(1, a, b), id(1, a, b), id(0, a + 1, b), id(1, a + 1, b));
        else m.i.push(id(0, a, b), id(1, a, b), id(0, a + 1, b), id(1, a, b), id(1, a + 1, b), id(0, a + 1, b));
      }
    for (let b = 0; b < nv - 1; b++)
      for (const a of [0, nu - 1]) {
        const s = a === 0;
        if (s) m.i.push(id(0, a, b), id(1, a, b), id(0, a, b + 1), id(1, a, b), id(1, a, b + 1), id(0, a, b + 1));
        else m.i.push(id(0, a, b), id(0, a, b + 1), id(1, a, b), id(1, a, b), id(0, a, b + 1), id(1, a, b + 1));
      }
    return m;
  })();
  const epine = tube(
    [
      [0.08, 1.392, -0.122],
      [0.12, 1.418, -0.122],
      [0.155, 1.44, -0.09],
      [0.172, 1.452, -0.045],
    ],
    { tour: 10, anneaux: 20, rayon: (t) => 0.0045 + 0.002 * t, ovale: 0.55, indice: [0, 1, 0] },
  );
  const acromion = ellipsoide([0.174, 1.451, -0.026], [0.012, 0, 0], [0, 0.0045, 0], [0, 0, 0.018], { tour: 12, meridiens: 8 });
  const glene = ellipsoide([0.155, 1.408, -0.03], [0.004, 0, 0], [0, 0.017, 0], [0, 0, 0.012], { tour: 12, meridiens: 8 });
  const coracoide = tube(
    [
      [0.138, 1.428, -0.045],
      [0.142, 1.436, -0.015],
      [0.15, 1.428, 0.012],
    ],
    { tour: 8, anneaux: 10, rayon: (t) => 0.0055 - 0.0015 * t },
  );
  os.pair("scapula", "scapula", fusion(lame, epine, acromion, glene, coracoide));
  // L'humérus : tête, tubercules, diaphyse, palette humérale et épicondyles.
  os.pair(
    "humerus",
    "humerus",
    fusion(
      ellipsoide([0.175, 1.414, -0.022], [0.021, 0, 0], [0, 0.022, 0], [0, 0, 0.021], { tour: 16, meridiens: 12 }),
      ellipsoide([0.192, 1.406, -0.008], [0.011, 0, 0], [0, 0.013, 0], [0, 0, 0.011], { tour: 12, meridiens: 8 }),
      tube(
        [
          [0.185, 1.395, -0.016],
          [0.196, 1.3, -0.013],
          [0.207, 1.2, -0.012],
          [0.213, 1.14, -0.013],
        ],
        { tour: 14, anneaux: 24, rayon: (t) => 0.0105 + 0.006 * lisse(0.25, 0, t) + 0.004 * lisse(0.8, 1, t), ovale: (t) => 1 - 0.3 * lisse(0.7, 1, t), indice: [1, 0, 0] },
      ),
      olive([0.188, 1.12, -0.015], [0.242, 1.12, -0.012], 0.012, 0.0115, [0, 1, 0]),
    ),
  );
  // Le radius (en dehors, côté pouce) et l'ulna (en dedans), avant-bras en supination.
  os.pair(
    "radius",
    "radius",
    fusion(
      tube(
        [
          [0.231, 1.112, -0.006],
          [0.231, 1.097, -0.005],
        ],
        { tour: 14, anneaux: 4, rayon: 0.0105 },
      ),
      tube(
        [
          [0.231, 1.097, -0.004],
          [0.236, 1.06, 0.0],
          [0.252, 0.95, 0.008],
          [0.262, 0.87, 0.011],
        ],
        { tour: 12, anneaux: 24, rayon: (t) => 0.0062 + 0.003 * t + 0.004 * lisse(0.85, 1, t), ovale: 0.8 },
      ),
      olive([0.25, 0.85, 0.011], [0.282, 0.846, 0.011], 0.0095, 0.0085, [0, 1, 0]),
    ),
  );
  os.pair(
    "ulna",
    "ulna",
    fusion(
      tube(
        [
          [0.205, 1.142, -0.032],
          [0.204, 1.12, -0.026],
          [0.206, 1.1, -0.016],
          [0.218, 1.0, -0.009],
          [0.234, 0.885, -0.002],
          [0.239, 0.853, 0.0],
        ],
        { tour: 12, anneaux: 30, rayon: (t) => 0.0062 + 0.006 * lisse(0.2, 0, t) - 0.002 * t, ovale: 0.8 },
      ),
      ellipsoide([0.239, 0.85, 0.0], [0.0068, 0, 0], [0, 0.006, 0], [0, 0, 0.0068], { tour: 10, meridiens: 8 }),
    ),
  );
  // Le carpe : deux rangées de quatre os.
  const carpe: [string, V3, [number, number, number]][] = [
    ["scaphoide", [0.272, 0.83, 0.014], [0.0095, 0.0068, 0.006]],
    ["lunatum", [0.259, 0.831, 0.012], [0.0075, 0.007, 0.0068]],
    ["triquetrum", [0.246, 0.828, 0.008], [0.0068, 0.006, 0.006]],
    ["pisiforme", [0.244, 0.827, 0.019], [0.0042, 0.0045, 0.0042]],
    ["os-trapeze", [0.28, 0.812, 0.017], [0.0072, 0.0065, 0.0065]],
    ["trapezoide", [0.27, 0.81, 0.014], [0.0055, 0.006, 0.0058]],
    ["capitatum", [0.259, 0.809, 0.012], [0.0068, 0.0092, 0.0068]],
    ["hamatum", [0.246, 0.81, 0.011], [0.0068, 0.008, 0.0065]],
  ];
  for (const [nom, c, r] of carpe) os.pair(nom, nom, ellipsoide(c, [r[0], 0, 0], [0, r[1], 0], [0, 0, r[2]], { tour: 12, meridiens: 8 }));
  // Les métacarpiens et les phalanges.
  const doigts = DOIGTS;
  const nomsPhal = ["phalanges-proximales", "phalanges-moyennes", "phalanges-distales"];
  doigts.forEach((d, n) => {
    os.pair(`metacarpien-${n + 1}`, "metacarpiens", tube([d.base, d.tete], { tour: 10, anneaux: 10, rayon: (t) => d.rayon * (0.72 + 0.28 * Math.abs(t - 0.5) * 2) }));
    let depart = d.tete;
    const dir = n === 0 ? ([0.33, -0.86, 0.38] as V3) : ([0.0, -0.995, 0.09] as V3);
    d.longueurs.forEach((L, k) => {
      const arrivee: V3 = [depart[0] + dir[0] * L, depart[1] + dir[1] * L, depart[2] + dir[2] * L + (n === 0 ? 0 : 0.001 * k)];
      const element = n === 0 && k === 1 ? "phalanges-distales" : nomsPhal[k];
      os.pair(`phalange-${n + 1}-${k + 1}`, element, tube([depart, arrivee], { tour: 9, anneaux: 7, rayon: (t) => d.rayon * (0.85 - 0.12 * k) * (0.7 + 0.3 * Math.abs(t - 0.5) * 2) }));
      depart = [arrivee[0] + dir[0] * 0.0015, arrivee[1] + dir[1] * 0.0015, arrivee[2] + dir[2] * 0.0015];
    });
  });
}

/* ---------------------------------------------------------------- le bassin et le membre inférieur */

export const JAMBE = {
  hanche: [0.088, 0.915, 0.022] as V3,
  genou: [0.097, 0.515, -0.004] as V3,
  cheville: [0.1, 0.075, 0.0] as V3,
};

/** Les cinq rayons du pied gauche (de l'hallux au petit orteil) : base et tête des métatarsiens. */
export const RAYONS_PIED: [V3, V3][] = [
    [
      [0.082, 0.04, 0.072],
      [0.088, 0.019, 0.134],
    ],
    [
      [0.096, 0.045, 0.071],
      [0.103, 0.017, 0.142],
    ],
    [
      [0.106, 0.042, 0.069],
      [0.116, 0.016, 0.138],
    ],
    [
      [0.116, 0.038, 0.065],
      [0.128, 0.016, 0.131],
    ],
    [
      [0.126, 0.033, 0.06],
      [0.14, 0.016, 0.122],
    ],
  ];

/** Les phalanges d'un orteil : [début, fin] de chacune. */
export function phalangesOrteil(n: number): [V3, V3][] {
  const tete = RAYONS_PIED[n][1];
  const longueurs = n === 0 ? [0.026, 0.02] : [0.02 - n * 0.002, 0.009, 0.008];
  let depart: V3 = [tete[0] + 0.001, tete[1] - 0.001, tete[2] + 0.004];
  return longueurs.map((L) => {
    const arrivee: V3 = [depart[0] + 0.12 * L, depart[1] - 0.18 * L, depart[2] + 0.97 * L];
    const seg: [V3, V3] = [depart, arrivee];
    depart = [arrivee[0] + 0.0004, arrivee[1] - 0.0004, arrivee[2] + 0.0018];
    return seg;
  });
}

function membreInferieur(pieces: Piece[]) {
  const os = ajouteur(pieces, "os");
  // L'os coxal : l'ilium (l'aile), l'ischium, le pubis, réunis autour de l'acétabulum.
  const aile = (() => {
    const crete: V3[] = [
      [0.118, 0.985, 0.07],
      [0.142, 1.03, 0.045],
      [0.148, 1.062, 0.005],
      [0.122, 1.068, -0.04],
      [0.075, 1.035, -0.075],
      [0.045, 0.995, -0.078],
    ];
    const bas: V3[] = [
      [0.098, 0.94, 0.042],
      [0.104, 0.935, 0.02],
      [0.1, 0.932, 0.0],
      [0.09, 0.935, -0.025],
      [0.068, 0.95, -0.05],
      [0.05, 0.968, -0.06],
    ];
    const lignes = [crete, crete.map((p, i) => melange(p, bas[i], 0.5).map((x, j) => (j === 0 ? x + 0.01 : x)) as V3), bas];
    const m = tube([[0, 0, 0] as V3, [0, 0.01, 0] as V3], { rayon: 0.001, tour: 3, anneaux: 2 });
    m.p = [];
    m.n = [];
    m.i = [];
    m.uv = [];
    const nu = 18;
    const nv = 10;
    const ligne = (l: V3[]) => Array.from({ length: nu }, (_, k) => {
      const t = (k / (nu - 1)) * (l.length - 1);
      const a = Math.floor(Math.min(t, l.length - 1.0001));
      return melange(l[a], l[a + 1], t - a);
    });
    const L = lignes.map(ligne);
    for (const face of [0, 1])
      for (let k = 0; k < nu; k++)
        for (let j = 0; j < nv; j++) {
          const v = j / (nv - 1);
          const p = v < 0.5 ? melange(L[0][k], L[1][k], v * 2) : melange(L[1][k], L[2][k], (v - 0.5) * 2);
          const e = face === 0 ? 0.004 : -0.004;
          // La face externe regarde en dehors et un peu en arrière.
          m.p.push(p[0] + e * 0.9, p[1], p[2] - e * 0.3);
          m.uv.push(k / (nu - 1), v);
        }
    const id = (f: number, k: number, j: number) => f * nu * nv + k * nv + j;
    for (let k = 0; k < nu - 1; k++)
      for (let j = 0; j < nv - 1; j++) {
        m.i.push(id(0, k, j), id(0, k + 1, j), id(0, k, j + 1), id(0, k + 1, j), id(0, k + 1, j + 1), id(0, k, j + 1));
        m.i.push(id(1, k, j), id(1, k, j + 1), id(1, k + 1, j), id(1, k + 1, j), id(1, k, j + 1), id(1, k + 1, j + 1));
      }
    for (let k = 0; k < nu - 1; k++) m.i.push(id(0, k, 0), id(1, k, 0), id(0, k + 1, 0), id(1, k, 0), id(1, k + 1, 0), id(0, k + 1, 0));
    return fusion(
      m,
      tube(crete, { tour: 8, anneaux: 30, rayon: 0.0055 }),
      tube([L[0][nu - 1], L[2][nu - 1]], { tour: 8, anneaux: 6, rayon: 0.005 }),
      tube([L[0][0], L[2][0]], { tour: 8, anneaux: 6, rayon: 0.005 }),
    );
  })();
  const acetabulum = tube(
    Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return [0.098 - 0.006 * Math.cos(a), 0.915 + 0.024 * Math.sin(a), 0.022 + 0.024 * Math.cos(a)] as V3;
    }),
    { boucle: true, tour: 10, anneaux: 30, rayon: 0.0075 },
  );
  os.pair("ilium", "ilium", fusion(aile, acetabulum));
  os.pair(
    "ischium",
    "ischium",
    fusion(
      tube(
        [
          [0.09, 0.9, -0.004],
          [0.078, 0.87, -0.022],
          [0.064, 0.848, -0.034],
        ],
        { tour: 12, anneaux: 12, rayon: (t) => 0.011 + 0.003 * t },
      ),
      tube(
        [
          [0.062, 0.846, -0.03],
          [0.05, 0.842, -0.006],
          [0.036, 0.848, 0.024],
        ],
        { tour: 10, anneaux: 12, rayon: 0.0062, ovale: 0.6 },
      ),
    ),
  );
  os.pair(
    "pubis",
    "pubis",
    fusion(
      tube(
        [
          [0.082, 0.915, 0.044],
          [0.05, 0.905, 0.062],
          [0.016, 0.888, 0.072],
        ],
        { tour: 10, anneaux: 14, rayon: 0.0075, ovale: 0.7 },
      ),
      olive([0.012, 0.872, 0.072], [0.012, 0.9, 0.072], 0.0075, 0.009, [1, 0, 0]),
      tube(
        [
          [0.014, 0.868, 0.068],
          [0.026, 0.855, 0.05],
          [0.036, 0.848, 0.026],
        ],
        { tour: 10, anneaux: 10, rayon: 0.0058, ovale: 0.65 },
      ),
    ),
  );
  // Le fémur : tête, col, grand et petit trochanters, diaphyse, condyles.
  os.pair(
    "femur",
    "femur",
    fusion(
      ellipsoide([0.09, 0.915, 0.022], [0.0215, 0, 0], [0, 0.0215, 0], [0, 0, 0.0215], { tour: 16, meridiens: 12 }),
      tube(
        [
          [0.098, 0.912, 0.02],
          [0.13, 0.895, 0.012],
        ],
        { tour: 12, anneaux: 6, rayon: 0.0125, ovale: 0.8 },
      ),
      ellipsoide([0.155, 0.902, -0.004], [0.016, 0, 0], [0, 0.021, 0], [0, 0, 0.017], { tour: 14, meridiens: 10 }),
      ellipsoide([0.118, 0.852, -0.012], [0.008, 0, 0], [0, 0.009, 0], [0, 0, 0.008], { tour: 10, meridiens: 8 }),
      tube(
        [
          [0.148, 0.89, 0.002],
          [0.135, 0.8, 0.008],
          [0.118, 0.68, 0.006],
          [0.104, 0.57, -0.002],
          [0.098, 0.54, -0.008],
        ],
        { tour: 14, anneaux: 30, rayon: (t) => 0.0135 + 0.006 * lisse(0.15, 0, t) + 0.006 * lisse(0.8, 1, t), ovale: (t) => 1 - 0.2 * lisse(0.75, 1, t), indice: [1, 0, 0] },
      ),
      olive([0.072, 0.522, 0.0], [0.072, 0.522, -0.035], 0.012, 0.022, [1, 0, 0]),
      olive([0.12, 0.522, 0.0], [0.12, 0.522, -0.034], 0.012, 0.021, [1, 0, 0]),
    ),
  );
  os.pair("patella", "patella", ellipsoide([0.098, 0.533, 0.035], [0.021, 0, 0], [0, 0.025, 0], [0, 0, 0.0095], { tour: 16, meridiens: 12 }));
  // Le tibia (en dedans, porteur) et la fibula (en dehors, grêle).
  os.pair(
    "tibia",
    "tibia",
    fusion(
      olive([0.068, 0.497, -0.002], [0.128, 0.495, -0.006], 0.022, 0.016, [0, 0, 1]),
      ellipsoide([0.1, 0.465, 0.022], [0.007, 0, 0], [0, 0.01, 0], [0, 0, 0.005], { tour: 10, meridiens: 8 }),
      tube(
        [
          [0.098, 0.48, 0.004],
          [0.094, 0.38, 0.006],
          [0.088, 0.24, 0.004],
          [0.083, 0.13, 0.0],
          [0.082, 0.098, 0.0],
        ],
        { tour: 3, anneaux: 30, rayon: (t) => 0.0145 + 0.012 * lisse(0.18, 0, t) + 0.006 * lisse(0.85, 1, t), ovale: 0.92 },
      ),
      tube(
        [
          [0.082, 0.105, 0.0],
          [0.082, 0.086, 0.0],
        ],
        { tour: 14, anneaux: 4, rayon: 0.019, ovale: 0.8 },
      ),
      ellipsoide([0.068, 0.08, 0.004], [0.006, 0, 0], [0, 0.012, 0], [0, 0, 0.009], { tour: 10, meridiens: 8 }),
    ),
  );
  os.pair(
    "fibula",
    "fibula",
    fusion(
      ellipsoide([0.134, 0.465, -0.022], [0.009, 0, 0], [0, 0.011, 0], [0, 0, 0.009], { tour: 10, meridiens: 8 }),
      tube(
        [
          [0.134, 0.46, -0.02],
          [0.131, 0.3, -0.018],
          [0.127, 0.12, -0.013],
          [0.126, 0.085, -0.012],
        ],
        { tour: 10, anneaux: 26, rayon: 0.0062, ovale: 0.85 },
      ),
      ellipsoide([0.127, 0.074, -0.012], [0.007, 0, 0], [0, 0.015, 0], [0, 0, 0.009], { tour: 10, meridiens: 8 }),
    ),
  );
  // Le pied : tarse, métatarsiens, orteils (un peu tournés vers le dehors).
  const tarse: [string, V3, [number, number, number]][] = [
    ["talus", [0.1, 0.066, 0.004], [0.017, 0.012, 0.021]],
    ["naviculaire", [0.088, 0.056, 0.039], [0.014, 0.008, 0.0075]],
    ["cuboide", [0.119, 0.039, 0.039], [0.011, 0.01, 0.014]],
    ["cuneiforme-medial", [0.081, 0.046, 0.058], [0.0075, 0.011, 0.011]],
    ["cuneiforme-intermediaire", [0.094, 0.05, 0.057], [0.0062, 0.009, 0.0085]],
    ["cuneiforme-lateral", [0.106, 0.047, 0.056], [0.0068, 0.0095, 0.0095]],
  ];
  for (const [nom, c, r] of tarse) os.pair(nom, nom.startsWith("cuneiforme") ? "cuneiformes" : nom, ellipsoide(c, [r[0], 0, 0], [0, r[1], 0], [0, 0, r[2]], { tour: 12, meridiens: 9 }));
  os.pair(
    "calcaneus",
    "calcaneus",
    tube(
      [
        [0.104, 0.052, 0.012],
        [0.1, 0.04, -0.025],
        [0.096, 0.03, -0.058],
      ],
      { tour: 14, anneaux: 14, rayon: (t) => 0.016 + 0.006 * lisse(0.4, 1, t), ovale: 1.25, indice: [0, 1, 0] },
    ),
  );
  const rayons = RAYONS_PIED;
  rayons.forEach(([base, tete], n) => {
    os.pair(`metatarsien-${n + 1}`, "metatarsiens", tube([base, tete], { tour: 10, anneaux: 10, rayon: (t) => (n === 0 ? 0.0078 : 0.005) * (0.72 + 0.28 * Math.abs(t - 0.5) * 2) }));
    const longueurs = n === 0 ? [0.026, 0.02] : [0.02 - n * 0.002, 0.009, 0.008];
    let depart: V3 = [tete[0] + 0.001, tete[1] - 0.001, tete[2] + 0.004];
    longueurs.forEach((L, k) => {
      const arrivee: V3 = [depart[0] + 0.12 * L, depart[1] - 0.18 * L, depart[2] + 0.97 * L];
      const element = k === 0 ? "phalanges-pied" : k === longueurs.length - 1 ? "phalanges-pied" : "phalanges-pied";
      os.pair(`phalange-pied-${n + 1}-${k + 1}`, element, tube([depart, arrivee], { tour: 8, anneaux: 6, rayon: (n === 0 ? 0.0072 : 0.0042) * (0.9 - 0.1 * k) }));
      depart = [arrivee[0] + 0.0004, arrivee[1] - 0.0004, arrivee[2] + 0.0018];
    });
  });
}

/** Tout le squelette. */
export function squelette(): Piece[] {
  const pieces: Piece[] = [];
  crane(pieces);
  thorax(pieces);
  membreSuperieur(pieces);
  membreInferieur(pieces);
  return pieces;
}
