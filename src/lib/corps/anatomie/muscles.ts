/*
 * L'Écorché — les muscles (côté gauche, puis leur miroir), du plus superficiel (profondeur 0) au plus profond (2).
 * Trois façons de les fabriquer :
 *   • le fuseau, pour les muscles longs (biceps, couturier, jumeaux…), posé dans le repère de son segment ;
 *   • la nappe, pour les muscles larges (trapèze, grand dorsal, pectoral…), drapée sur le tronc ;
 *   • la grille, quand chaque point se calcule (le dentelé autour des côtes, le droit de l'abdomen et ses intersections).
 * Repère : mètres ; y vers le haut, x vers la gauche du sujet, z vers l'avant.
 */

import { type Maillage, fuseau, fusion, nappe, tube } from "../geometrie";
import type { Piece } from "../types";
import { type V3, distance, fois, lisse, melange, moins, plus, unitaire } from "../vec";
import {
  AVANT_BRAS_R,
  BRAS_R,
  CENTRE_CRANE,
  CUISSE_R,
  JAMBE_R,
  type Repere,
  TETE_HUMERUS,
  angleCage,
  cage,
  crane,
  devant,
  horsTronc,
  surTronc,
  tronc,
} from "./reperes";
import { ajouteur, pointCote } from "./squelette";

type Pt = [number, number, number];

/** Un muscle de membre : des points (t, angle, distance) du repère, aplati contre le membre. */
function surMembre(
  rep: Repere,
  pts: Pt[],
  o: { rayon: number; bout?: number; ventre?: number; pointe?: number; ovale?: number; avant?: V3[]; apres?: V3[]; anneaux?: number },
): Maillage {
  const chemin = [...(o.avant ?? []), ...pts.map(([t, a, r]) => rep.point(t, a, r)), ...(o.apres ?? [])];
  const angles = [...(o.avant ?? []).map(() => pts[0][1]), ...pts.map((p) => p[1]), ...(o.apres ?? []).map(() => pts[pts.length - 1][1])];
  const indice = (t: number) => {
    const k = t * (angles.length - 1);
    const i = Math.min(angles.length - 2, Math.max(0, Math.floor(k)));
    const a = angles[i] + (angles[i + 1] - angles[i]) * (k - i);
    return rep.tangente(a);
  };
    // Des ventres pleins, qui se touchent : c'est ce qui donne l'allure d'un écorché (et non d'un faisceau de cordes).
  return fuseau(chemin, { rayon: o.rayon * 1.1, bout: o.bout, ventre: o.ventre, pointe: o.pointe ?? 0.6, ovale: o.ovale ?? 0.7, indice, anneaux: o.anneaux });
}

/** Une nappe dont chaque point est calculé (u en travers des fibres, v le long). */
function grille(f: (u: number, v: number) => V3, o: { epaisseur: number; dedans: V3; nu?: number; nv?: number; ventre?: number; attaches?: number; bords?: number; relief?: (u: number, v: number) => number }): Maillage {
  return nappe({
    origine: [
      [0, 0, 0],
      [1, 0, 0],
    ],
    insertion: [
      [0, 1, 0],
      [1, 1, 0],
    ],
    surface: (_p, u, v) => f(u, v),
    ...o,
  });
}

/** Un anneau aplati contre le visage (orbiculaires). */
function anneau(c: V3, rx: number, ry: number, profondeur: (x: number) => number, rayon: number, ovale: number, debut = 0, fin = 1): Maillage {
  const n = 28;
  const ferme = debut === 0 && fin === 1;
  const pts: V3[] = Array.from({ length: ferme ? n : n + 1 }, (_, i) => {
    const a = (debut + (fin - debut) * (i / (ferme ? n : n))) * Math.PI * 2;
    const x = c[0] + Math.cos(a) * rx;
    return [x, c[1] + Math.sin(a) * ry, c[2] + profondeur(x - c[0])] as V3;
  });
  return tube(pts, {
    boucle: ferme,
    tour: 10,
    anneaux: 48,
    rayon,
    ovale,
    indice: (t) => {
      const a = (debut + (fin - debut) * t) * Math.PI * 2;
      return [Math.cos(a), Math.sin(a), 0];
    },
  });
}

/* ================================================================ la tête */

function tete(pieces: Piece[]) {
  const m0 = ajouteur(pieces, "muscle", 0);
  const m1 = ajouteur(pieces, "muscle", 1);
  // L'occipito-frontal : le ventre frontal sur le front, le ventre occipital derrière (l'aponévrose entre eux est un tendon).
  m0.pair(
    "ventre-frontal",
    "occipito-frontal",
    grille((u, v) => crane(2 + u * 40, -0.03 + v * (0.78 - 0.22 * u * u), 0.0038), { epaisseur: 0.0045, dedans: CENTRE_CRANE, nu: 12, nv: 12, attaches: 0.55 }),
  );
  m0.pair(
    "ventre-occipital",
    "occipito-frontal",
    grille((u, v) => crane(148 + u * 28, -0.28 + v * 0.42, 0.0035), { epaisseur: 0.004, dedans: CENTRE_CRANE, nu: 9, nv: 9, attaches: 0.5 }),
  );
  // Le temporal : un éventail sur la tempe, qui descend jusqu'à l'arcade zygomatique (il plonge ensuite dessous, vers le processus coronoïde).
  m0.pair(
    "muscle-temporal",
    "muscle-temporal",
    grille(
      (u, v) => {
        const azO = 32 + u * 104;
        const nyO = -0.12 + 0.6 * Math.pow(Math.sin(Math.PI * u), 0.8) - 0.16 * u;
        const azF = 58 + 30 * u;
        const nyF = -0.5;
        const w = Math.pow(v, 0.9);
        return crane(azO + (azF - azO) * w, nyO + (nyF - nyO) * w, 0.0042 + 0.0042 * v);
      },
      { epaisseur: 0.0068, dedans: CENTRE_CRANE, nu: 18, nv: 14, ventre: 0.75, attaches: 0.3, bords: 0.5 },
    ),
  );
  // Le masséter : de l'arcade zygomatique à l'angle de la mandibule.
  m0.pair(
    "masseter",
    "masseter",
    nappe({
      origine: [
        [0.05, 1.596, 0.05],
        [0.06, 1.595, 0.03],
        [0.066, 1.595, 0.008],
        [0.067, 1.597, -0.004],
      ],
      milieux: [
        [
          [0.054, 1.568, 0.042],
          [0.064, 1.57, 0.024],
          [0.068, 1.572, 0.006],
          [0.066, 1.576, -0.006],
        ],
      ],
      insertion: [
        [0.045, 1.54, 0.028],
        [0.05, 1.545, 0.012],
        [0.053, 1.552, -0.002],
        [0.056, 1.565, -0.008],
      ],
      epaisseur: 0.011,
      dedans: [0.02, 1.57, 0.01],
      nu: 10,
      nv: 12,
      attaches: 0.45,
    }),
  );
  // Les orbiculaires : de l'œil (autour de l'orbite) et de la bouche (impair, autour des lèvres).
  m0.pair("orbiculaire-oeil", "orbiculaire-oeil", anneau([0.033, 1.626, 0.07], 0.025, 0.022, (dx) => -0.018 * Math.pow(Math.max(0, dx / 0.025), 2) - 0.004 * Math.pow(Math.min(0, dx / 0.025), 2), 0.0068, 0.34));
  m0.impair("orbiculaire-bouche", "orbiculaire-bouche", anneau([0, 1.561, 0.085], 0.026, 0.0135, (dx) => -26 * dx * dx, 0.0072, 0.36));
  // Les muscles du sourire, de la lèvre et du menton.
  m0.pair(
    "grand-zygomatique",
    "grand-zygomatique",
    fuseau(
      [
        [0.053, 1.601, 0.052],
        [0.042, 1.585, 0.068],
        [0.027, 1.566, 0.08],
      ],
      { rayon: 0.0033, bout: 0.0018, ovale: 0.55, indice: [0.6, 0, 0.8] },
    ),
  );
  m0.pair(
    "releveur-levre-superieure",
    "releveur-levre-superieure",
    fuseau(
      [
        [0.026, 1.608, 0.074],
        [0.02, 1.588, 0.083],
        [0.013, 1.572, 0.089],
      ],
      { rayon: 0.0034, bout: 0.0022, ovale: 0.45, indice: [1, 0, 0] },
    ),
  );
  m0.pair(
    "abaisseur-angle-bouche",
    "abaisseur-angle-bouche",
    fuseau(
      [
        [0.036, 1.536, 0.063],
        [0.031, 1.547, 0.073],
        [0.026, 1.557, 0.079],
      ],
      { rayon: 0.0048, bout: 0.002, ventre: 0.25, ovale: 0.45, indice: [1, 0, 0] },
    ),
  );
  m1.pair(
    "buccinateur",
    "buccinateur",
    nappe({
      origine: [
        [0.04, 1.575, 0.03],
        [0.04, 1.551, 0.03],
      ],
      milieux: [
        [
          [0.039, 1.576, 0.052],
          [0.039, 1.55, 0.052],
        ],
      ],
      insertion: [
        [0.028, 1.567, 0.074],
        [0.028, 1.556, 0.074],
      ],
      epaisseur: 0.0055,
      dedans: [0, 1.562, 0.04],
      nu: 8,
      nv: 10,
    }),
  );
}

/* ================================================================ le cou */

function cou(pieces: Piece[]) {
  const m0 = ajouteur(pieces, "muscle", 0);
  const m1 = ajouteur(pieces, "muscle", 1);
  const m2 = ajouteur(pieces, "muscle", 2);
  // Le sterno-cléido-mastoïdien : deux chefs (sternal, claviculaire) qui montent vers la mastoïde.
  m0.pair(
    "scm-sternal",
    "sterno-cleido-mastoidien",
    fuseau(
      [
        [0.009, 1.44, 0.074],
        [0.022, 1.475, 0.062],
        [0.04, 1.52, 0.035],
        [0.052, 1.56, 0.004],
        [0.057, 1.583, -0.022],
      ],
      { rayon: 0.0112, bout: 0.005, ventre: 0.45, ovale: 0.62, indice: [-0.6, 0, 0.8] },
    ),
  );
  m0.pair(
    "scm-claviculaire",
    "sterno-cleido-mastoidien",
    fuseau(
      [
        [0.042, 1.456, 0.071],
        [0.046, 1.49, 0.052],
        [0.051, 1.53, 0.022],
        [0.056, 1.57, -0.012],
      ],
      { rayon: 0.0118, bout: 0.0035, ventre: 0.35, ovale: 0.36, indice: [0.8, 0, 0.6] },
    ),
  );
  // Le trapèze : un grand losange, de l'occiput aux dernières vertèbres thoraciques, jusqu'à la clavicule, l'acromion et l'épine.
  m0.pair(
    "trapeze",
    "trapeze",
    nappe({
      origine: [
        [0.003, 1.605, -0.098],
        [0.003, 1.575, -0.084],
        [0.003, 1.54, -0.079],
        [0.003, 1.5, -0.086],
        [0.003, 1.465, -0.106],
        [0.003, 1.42, -0.129],
        [0.003, 1.36, -0.141],
        [0.003, 1.29, -0.144],
        [0.003, 1.22, -0.136],
        [0.003, 1.185, -0.128],
      ],
      milieux: [
        [
          [0.046, 1.55, -0.062],
          [0.056, 1.52, -0.057],
          [0.069, 1.495, -0.053],
          [0.086, 1.476, -0.064],
          [0.1, 1.462, -0.084],
          [0.1, 1.44, -0.113],
          [0.09, 1.41, -0.137],
          [0.07, 1.36, -0.146],
          [0.055, 1.3, -0.147],
          [0.045, 1.25, -0.141],
        ],
      ],
      insertion: [
        [0.112, 1.465, 0.046],
        [0.131, 1.466, 0.031],
        [0.149, 1.466, 0.012],
        [0.163, 1.464, -0.008],
        [0.177, 1.461, -0.03],
        [0.17, 1.456, -0.056],
        [0.152, 1.445, -0.092],
        [0.126, 1.426, -0.12],
        [0.101, 1.406, -0.131],
        [0.086, 1.396, -0.133],
      ],
      epaisseur: 0.008,
      dedans: [0.04, 1.38, -0.05],
      nu: 26,
      nv: 22,
      attaches: 0.35,
      ventre: 0.4,
      bords: 0.55,
      relief: (u) => 1 + 1.1 * (1 - lisse(0, 0.4, u)),
      surface: (p) => horsTronc(p, 0.006),
    }),
  );
  m1.pair(
    "splenius-tete",
    "splenius-tete",
    nappe({
      origine: [
        [0.004, 1.53, -0.078],
        [0.004, 1.44, -0.112],
      ],
      milieux: [
        [
          [0.026, 1.565, -0.079],
          [0.042, 1.51, -0.078],
        ],
      ],
      insertion: [
        [0.032, 1.604, -0.082],
        [0.055, 1.588, -0.042],
      ],
      epaisseur: 0.0075,
      dedans: [0, 1.52, -0.03],
      nu: 8,
      nv: 12,
    }),
  );
  m1.pair(
    "elevateur-scapula",
    "elevateur-scapula",
    fuseau(
      [
        [0.03, 1.555, -0.026],
        [0.05, 1.51, -0.05],
        [0.07, 1.466, -0.08],
        [0.08, 1.432, -0.108],
      ],
      { rayon: 0.0078, bout: 0.0035, ventre: 0.5 },
    ),
  );
  m1.pair(
    "scalene-anterieur",
    "scalene-anterieur",
    fuseau(
      [
        [0.026, 1.52, -0.012],
        [0.036, 1.475, 0.008],
        [0.046, 1.426, 0.034],
      ],
      { rayon: 0.0056, bout: 0.0025 },
    ),
  );
  m1.pair(
    "scalene-moyen",
    "scalene-moyen",
    fuseau(
      [
        [0.03, 1.54, -0.026],
        [0.046, 1.49, -0.016],
        [0.057, 1.433, 0.006],
      ],
      { rayon: 0.0064, bout: 0.0028 },
    ),
  );
  m0.pair(
    "sterno-hyoidien",
    "sterno-hyoidien",
    fuseau(
      [
        [0.01, 1.438, 0.064],
        [0.011, 1.47, 0.06],
        [0.009, 1.496, 0.046],
      ],
      { rayon: 0.0045, bout: 0.003, ovale: 0.42, indice: [1, 0, 0] },
    ),
  );
  m1.pair(
    "sterno-thyroidien",
    "sterno-thyroidien",
    fuseau(
      [
        [0.013, 1.44, 0.058],
        [0.017, 1.468, 0.054],
        [0.019, 1.49, 0.046],
      ],
      { rayon: 0.0062, bout: 0.004, ovale: 0.4, indice: [1, 0, 0] },
    ),
  );
  m0.pair(
    "omo-hyoidien",
    "omo-hyoidien",
    fuseau(
      [
        [0.112, 1.44, -0.07],
        [0.075, 1.452, -0.012],
        [0.042, 1.468, 0.03],
        [0.025, 1.485, 0.044],
        [0.014, 1.497, 0.042],
      ],
      { rayon: 0.0033, bout: 0.0022, ventre: 0.3, pointe: 0.4 },
    ),
  );
  m2.pair(
    "semi-epineux-tete",
    "semi-epineux-tete",
    fuseau(
      [
        [0.016, 1.43, -0.1],
        [0.018, 1.48, -0.083],
        [0.019, 1.53, -0.075],
        [0.022, 1.6, -0.092],
      ],
      { rayon: 0.011, bout: 0.005, ventre: 0.55, ovale: 0.6, indice: [1, 0, 0] },
    ),
  );
  m1.pair(
    "digastrique-anterieur",
    "digastrique",
    fuseau(
      [
        [0.008, 1.533, 0.066],
        [0.016, 1.51, 0.042],
        [0.021, 1.501, 0.028],
      ],
      { rayon: 0.0036, bout: 0.0018 },
    ),
  );
  m1.pair(
    "digastrique-posterieur",
    "digastrique",
    fuseau(
      [
        [0.05, 1.578, -0.03],
        [0.036, 1.54, -0.006],
        [0.023, 1.503, 0.02],
      ],
      { rayon: 0.0036, bout: 0.0018 },
    ),
  );
}

/* ================================================================ le tronc, en avant */

/** Le diaphragme : un dôme sous les côtes (le centre est tendineux : voir les tendons). */
export function pointDiaphragme(u: number, v: number): V3 {
  const a = (-170 + u * 340) * (Math.PI / 180);
  const c = Math.cos(a);
  const bord: V3 = [0.122 * Math.sin(a), 1.2 + 0.04 * c, -0.012 + (c > 0 ? 0.085 : 0.07) * c];
  const h: [number, number] = [bord[0] * (1 - v), bord[2] + (-0.006 - bord[2]) * v];
  const x = h[0];
  const sommet = 1.28 + 0.016 * Math.exp(-(((x + 0.055) / 0.045) ** 2)) + 0.009 * Math.exp(-(((x - 0.055) / 0.045) ** 2));
  const y = bord[1] + (sommet - bord[1]) * Math.pow(Math.sin((v * Math.PI) / 2), 0.55);
  return [x, y, h[1]];
}

function troncAvant(pieces: Piece[]) {
  const m0 = ajouteur(pieces, "muscle", 0);
  const m1 = ajouteur(pieces, "muscle", 1);
  const m2 = ajouteur(pieces, "muscle", 2);
  // Le grand pectoral : de la clavicule, du sternum et des cartilages jusqu'à la crête du tubercule majeur.
  m0.pair(
    "grand-pectoral",
    "grand-pectoral",
    nappe({
      origine: [
        [0.098, 1.461, 0.066],
        [0.062, 1.458, 0.075],
        [0.03, 1.451, 0.077],
        [0.008, 1.43, 0.081],
        [0.006, 1.39, 0.089],
        [0.006, 1.35, 0.096],
        [0.008, 1.3, 0.102],
        [0.026, 1.265, 0.105],
        [0.05, 1.25, 0.104],
        [0.076, 1.245, 0.098],
      ],
      milieux: [
        [
          [0.136, 1.44, 0.058],
          [0.126, 1.43, 0.078],
          [0.112, 1.415, 0.093],
          [0.102, 1.396, 0.104],
          [0.097, 1.372, 0.111],
          [0.097, 1.347, 0.114],
          [0.102, 1.322, 0.114],
          [0.112, 1.302, 0.108],
          [0.126, 1.302, 0.09],
          [0.14, 1.307, 0.07],
        ],
      ],
      insertion: [
        [0.19, 1.392, 0.006],
        [0.197, 1.338, 0.002],
      ],
      epaisseur: 0.014,
      dedans: [0.05, 1.33, -0.02],
      nu: 24,
      nv: 22,
      ventre: 0.6,
      attaches: 0.3,
      surface: (p, _u, v) => melange(surTronc(p, 0.006), horsTronc(p, 0.006), lisse(0.55, 0.92, v)),
    }),
  );
  m1.pair(
    "petit-pectoral",
    "petit-pectoral",
    nappe({
      origine: [
        [0.074, 1.386, 0.086],
        [0.085, 1.356, 0.09],
        [0.094, 1.326, 0.089],
      ],
      insertion: [[0.149, 1.428, 0.012]],
      epaisseur: 0.008,
      dedans: [0.05, 1.37, 0.0],
      nu: 10,
      nv: 14,
      surface: (p) => horsTronc(p, 0.002),
    }),
  );
  // Le dentelé antérieur : neuf digitations sur les côtes, qui contournent le thorax jusqu'au bord médial de la scapula.
  const angleSup: V3 = [0.079, 1.43, -0.106];
  const angleInf: V3 = [0.086, 1.288, -0.104];
  m0.pair(
    "dentele-anterieur",
    "dentele-anterieur",
    grille(
      (u, v) => {
        const i = u * 8;
        const i0 = Math.floor(Math.min(7.999, i));
        const phiO = 58 - 6 * u;
        const o = melange(pointCote(i0, phiO), pointCote(i0 + 1, phiO), i - i0);
        const s = melange(angleSup, angleInf, Math.pow(u, 0.55));
        const phiS = angleCage(s);
        const phi = phiO + (phiS - phiO) * v;
        const y = o[1] + (s[1] - o[1]) * lisse(0, 1, v);
        const p = cage(phi, y, 0.009 + 0.004 * Math.sin(Math.PI * v));
        return melange(p, s, lisse(0.7, 1, v));
      },
      {
        epaisseur: 0.01,
        dedans: [0, 1.32, -0.01],
        nu: 40,
        nv: 18,
        attaches: 0.5,
        relief: (u, v) => 1 - (1 - lisse(0, 0.45, v)) * 0.75 * Math.pow(Math.abs(Math.cos(Math.PI * u * 8.5)), 3),
      },
    ),
  );
  // Le droit de l'abdomen et ses trois intersections tendineuses (les « tablettes »).
  m0.pair(
    "droit-abdomen",
    "droit-abdomen",
    grille(
      (u, v) => {
        const y = 0.903 + v * 0.365;
        const large = 0.021 + 0.05 * lisse(0, 0.85, v);
        const x = 0.0045 + u * large;
        const p = devant(x, y, 0.006);
        const bas = 1 - lisse(0, 0.12, v);
        return [p[0], p[1], p[2] * (1 - bas) + 0.08 * bas];
      },
      {
        epaisseur: 0.012,
        dedans: [0.03, 1.08, -0.05],
        nu: 10,
        nv: 40,
        attaches: 0.6,
        ventre: 0.55,
        relief: (_u, v) => 1 - 0.5 * [0.47, 0.67, 0.85].reduce((s, c) => s + Math.exp(-(((v - c) / 0.022) ** 2)), 0),
      },
    ),
  );
  // L'oblique externe : des côtes basses vers la ligne blanche (par son aponévrose) et la crête iliaque.
  m0.pair(
    "oblique-externe",
    "oblique-externe",
    grille(
      (u, v) => {
        const thetaO = 56 + 50 * u;
        const yO = 1.315 - 0.18 * u;
        const [thetaF, yF] = u < 0.72 ? [28 + 14 * (u / 0.72), 1.245 - 0.18 * (u / 0.72)] : [48 + 50 * ((u - 0.72) / 0.28), 1.035 + 0.02 * ((u - 0.72) / 0.28)];
        return tronc(thetaO + (thetaF - thetaO) * v, yO + (yF - yO) * v, 0.004);
      },
      {
        epaisseur: 0.009,
        dedans: [0, 1.15, -0.01],
        nu: 30,
        nv: 16,
        attaches: 0.55,
        relief: (u, v) => 1 - (1 - lisse(0, 0.3, v)) * 0.6 * Math.pow(Math.abs(Math.cos(Math.PI * u * 7.5)), 3),
      },
    ),
  );
  m1.pair(
    "oblique-interne",
    "oblique-interne",
    grille(
      (u, v) => {
        const thetaO = 104 - 82 * u;
        const yO = 1.04 - 0.07 * u * u;
        const thetaF = 92 - 60 * u;
        const yF = 1.19 - 0.12 * u;
        return tronc(thetaO + (thetaF - thetaO) * v, yO + (yF - yO) * v, -0.001);
      },
      { epaisseur: 0.008, dedans: [0, 1.1, -0.01], nu: 18, nv: 14, attaches: 0.5 },
    ),
  );
  m2.pair(
    "transverse-abdomen",
    "transverse-abdomen",
    grille((u, v) => tronc(108 - 76 * v, 0.98 + 0.25 * u, -0.006), { epaisseur: 0.005, dedans: [0, 1.1, -0.01], nu: 14, nv: 14, attaches: 0.55 }),
  );
  // Les intercostaux : la paroi musclée entre les côtes.
  m2.pair(
    "intercostaux",
    "intercostaux",
    grille(
      (u, v) => {
        const phi = 24 + 132 * u;
        const i = v * 10;
        const i0 = Math.floor(Math.min(9.999, i));
        return melange(pointCote(i0, phi), pointCote(i0 + 1, phi), i - i0);
      },
      { epaisseur: 0.004, dedans: [0, 1.3, -0.01], nu: 24, nv: 44, attaches: 0.8 },
    ),
  );
  m2.impair("diaphragme", "diaphragme", grille(pointDiaphragme, { epaisseur: 0.004, dedans: [0, 1.05, -0.01], nu: 40, nv: 12, attaches: 0.7 }));
  // Le carré des lombes, le grand psoas et l'iliaque (l'ilio-psoas).
  m2.pair(
    "carre-lombes",
    "carre-lombes",
    nappe({
      origine: [
        [0.03, 1.035, -0.055],
        [0.075, 1.045, -0.062],
      ],
      insertion: [
        [0.03, 1.18, -0.066],
        [0.062, 1.17, -0.078],
      ],
      epaisseur: 0.012,
      dedans: [0.05, 1.1, 0.02],
      nu: 8,
      nv: 12,
    }),
  );
  m2.pair(
    "grand-psoas",
    "grand-psoas",
    fuseau(
      [
        [0.022, 1.175, -0.042],
        [0.032, 1.1, -0.032],
        [0.045, 1.02, -0.015],
        [0.068, 0.955, 0.02],
        [0.088, 0.91, 0.04],
        [0.108, 0.87, 0.012],
        [0.118, 0.855, -0.006],
      ],
      { rayon: 0.017, bout: 0.006, ventre: 0.4, ovale: 0.85, anneaux: 34 },
    ),
  );
  m2.pair(
    "iliaque",
    "iliaque",
    nappe({
      origine: [
        [0.06, 1.04, -0.035],
        [0.1, 1.055, 0.0],
        [0.128, 1.03, 0.04],
        [0.12, 0.99, 0.064],
      ],
      milieux: [
        [
          [0.068, 0.99, -0.008],
          [0.09, 0.99, 0.012],
          [0.108, 0.975, 0.036],
          [0.11, 0.952, 0.054],
        ],
      ],
      insertion: [[0.105, 0.877, 0.016]],
      epaisseur: 0.012,
      dedans: [0.16, 0.98, -0.02],
      nu: 12,
      nv: 14,
    }),
  );
}

/* ================================================================ le tronc, en arrière, et l'épaule */

function troncArriere(pieces: Piece[]) {
  const m0 = ajouteur(pieces, "muscle", 0);
  const m1 = ajouteur(pieces, "muscle", 1);
  const m2 = ajouteur(pieces, "muscle", 2);
  // Le grand dorsal : du bas du dos (par le fascia thoraco-lombaire) et de la crête iliaque jusqu'au sillon de l'humérus.
  m0.pair(
    "grand-dorsal",
    "grand-dorsal",
    nappe({
      origine: [
        [0.01, 1.31, -0.141],
        [0.026, 1.25, -0.139],
        [0.046, 1.19, -0.129],
        [0.07, 1.13, -0.116],
        [0.1, 1.09, -0.096],
        [0.126, 1.066, -0.066],
        [0.142, 1.078, -0.034],
        [0.147, 1.12, -0.01],
      ],
      milieux: [
        [
          [0.1, 1.33, -0.14],
          [0.12, 1.3, -0.128],
          [0.135, 1.27, -0.108],
          [0.145, 1.245, -0.083],
          [0.151, 1.23, -0.058],
          [0.154, 1.232, -0.034],
          [0.155, 1.245, -0.014],
          [0.156, 1.26, 0.0],
        ],
      ],
      insertion: [
        [0.182, 1.365, -0.013],
        [0.19, 1.39, 0.002],
      ],
      epaisseur: 0.009,
      dedans: [0.05, 1.2, -0.02],
      nu: 26,
      nv: 24,
      ventre: 0.55,
      attaches: 0.4,
      relief: (u) => 0.85 + 0.55 * lisse(0.55, 1, u),
      surface: (p, _u, v) => melange(surTronc(p, 0.006), horsTronc(p, 0.006), lisse(0.6, 0.92, v)),
    }),
  );
  // Les rhomboïdes : du rachis au bord médial de la scapula, sous le trapèze.
  m1.pair(
    "petit-rhomboide",
    "petit-rhomboide",
    nappe({
      origine: [
        [0.004, 1.468, -0.1],
        [0.004, 1.448, -0.108],
      ],
      milieux: [
        [
          [0.042, 1.455, -0.114],
          [0.042, 1.43, -0.12],
        ],
      ],
      insertion: [
        [0.079, 1.428, -0.119],
        [0.08, 1.398, -0.124],
      ],
      epaisseur: 0.007,
      dedans: [0.04, 1.42, -0.05],
      nu: 6,
      nv: 12,
    }),
  );
  m1.pair(
    "grand-rhomboide",
    "grand-rhomboide",
    nappe({
      origine: [
        [0.004, 1.44, -0.112],
        [0.004, 1.35, -0.132],
      ],
      milieux: [
        [
          [0.044, 1.42, -0.124],
          [0.046, 1.33, -0.138],
        ],
      ],
      insertion: [
        [0.081, 1.388, -0.125],
        [0.086, 1.292, -0.119],
      ],
      epaisseur: 0.0075,
      dedans: [0.04, 1.36, -0.05],
      nu: 10,
      nv: 12,
    }),
  );
  // La coiffe des rotateurs : supra-épineux, infra-épineux, petit rond, subscapulaire ; et le grand rond.
  m1.pair(
    "supra-epineux",
    "supra-epineux",
    fuseau(
      [
        [0.085, 1.421, -0.112],
        [0.115, 1.43, -0.106],
        [0.145, 1.437, -0.086],
        [0.166, 1.441, -0.056],
        [0.187, 1.431, -0.03],
      ],
      { rayon: 0.0115, bout: 0.0045, ventre: 0.4, ovale: 0.75, indice: [0, 1, 0] },
    ),
  );
  m0.pair(
    "infra-epineux",
    "infra-epineux",
    nappe({
      origine: [
        [0.082, 1.386, -0.121],
        [0.083, 1.34, -0.119],
        [0.086, 1.296, -0.117],
      ],
      milieux: [
        [
          [0.125, 1.396, -0.123],
          [0.127, 1.35, -0.115],
          [0.116, 1.31, -0.115],
        ],
      ],
      insertion: [[0.189, 1.408, -0.036]],
      epaisseur: 0.013,
      dedans: [0.12, 1.35, -0.06],
      nu: 14,
      nv: 16,
      ventre: 0.4,
    }),
  );
  m1.pair(
    "petit-rond",
    "petit-rond",
    fuseau(
      [
        [0.13, 1.356, -0.09],
        [0.155, 1.376, -0.073],
        [0.18, 1.395, -0.047],
        [0.191, 1.402, -0.033],
      ],
      { rayon: 0.0078, bout: 0.0035 },
    ),
  );
  m0.pair(
    "grand-rond",
    "grand-rond",
    fuseau(
      [
        [0.09, 1.296, -0.117],
        [0.12, 1.316, -0.103],
        [0.15, 1.34, -0.073],
        [0.172, 1.36, -0.037],
        [0.185, 1.371, -0.009],
      ],
      { rayon: 0.0135, bout: 0.005, ventre: 0.4, ovale: 0.7 },
    ),
  );
  m2.pair(
    "subscapulaire",
    "subscapulaire",
    nappe({
      origine: [
        [0.082, 1.425, -0.1],
        [0.086, 1.29, -0.097],
      ],
      milieux: [
        [
          [0.125, 1.41, -0.079],
          [0.116, 1.32, -0.088],
        ],
      ],
      insertion: [[0.176, 1.405, -0.004]],
      epaisseur: 0.011,
      dedans: [0.12, 1.36, -0.13],
      nu: 12,
      nv: 14,
    }),
  );
  // Les érecteurs du rachis : trois colonnes de chaque côté (épineux, longissimus, ilio-costal).
  m1.pair(
    "epineux",
    "epineux",
    fuseau(
      [
        [0.011, 1.2, -0.112],
        [0.011, 1.28, -0.128],
        [0.011, 1.36, -0.128],
        [0.011, 1.43, -0.108],
      ],
      { rayon: 0.0068, bout: 0.0035, ovale: 0.8 },
    ),
  );
  m1.pair(
    "longissimus",
    "longissimus",
    fuseau(
      [
        [0.028, 0.99, -0.078],
        [0.032, 1.07, -0.096],
        [0.032, 1.16, -0.106],
        [0.03, 1.25, -0.118],
        [0.027, 1.34, -0.123],
        [0.024, 1.43, -0.101],
      ],
      { rayon: 0.016, bout: 0.005, ventre: 0.28, pointe: 1.1, ovale: 0.75, anneaux: 34, indice: [1, 0, 0] },
    ),
  );
  m1.pair(
    "ilio-costal",
    "ilio-costal",
    fuseau(
      [
        [0.05, 1.01, -0.072],
        [0.056, 1.1, -0.092],
        [0.058, 1.19, -0.105],
        [0.056, 1.28, -0.11],
        [0.052, 1.37, -0.108],
        [0.045, 1.45, -0.09],
      ],
      { rayon: 0.013, bout: 0.004, ventre: 0.28, pointe: 1.1, ovale: 0.7, anneaux: 34, indice: [1, 0, 0] },
    ),
  );
}

/* ================================================================ la hanche */

function hanche(pieces: Piece[]) {
  const m0 = ajouteur(pieces, "muscle", 0);
  const m1 = ajouteur(pieces, "muscle", 1);
  const m2 = ajouteur(pieces, "muscle", 2);
  m0.pair(
    "grand-fessier",
    "grand-fessier",
    nappe({
      origine: [
        [0.08, 1.035, -0.083],
        [0.05, 0.995, -0.09],
        [0.035, 0.955, -0.097],
        [0.02, 0.905, -0.097],
      ],
      milieux: [
        [
          [0.108, 1.02, -0.094],
          [0.084, 0.98, -0.104],
          [0.07, 0.938, -0.108],
          [0.06, 0.882, -0.104],
        ],
        [
          [0.138, 0.988, -0.07],
          [0.126, 0.95, -0.088],
          [0.114, 0.9, -0.093],
          [0.104, 0.848, -0.085],
        ],
      ],
      insertion: [
        [0.156, 0.93, -0.024],
        [0.159, 0.89, -0.022],
        [0.154, 0.85, -0.02],
        [0.143, 0.8, -0.014],
      ],
      epaisseur: 0.024,
      dedans: [0.08, 0.93, -0.03],
      nu: 18,
      nv: 22,
      ventre: 0.45,
      attaches: 0.35,
    }),
  );
  m1.pair(
    "moyen-fessier",
    "moyen-fessier",
    nappe({
      origine: [
        [0.125, 1.0, 0.066],
        [0.146, 1.04, 0.036],
        [0.153, 1.062, 0.0],
        [0.131, 1.067, -0.04],
        [0.096, 1.042, -0.07],
      ],
      milieux: [
        [
          [0.155, 0.99, 0.042],
          [0.166, 1.012, 0.012],
          [0.167, 1.002, -0.02],
          [0.152, 0.996, -0.05],
          [0.127, 0.982, -0.07],
        ],
      ],
      insertion: [[0.161, 0.926, -0.002]],
      epaisseur: 0.021,
      dedans: [0.09, 1.0, -0.01],
      nu: 16,
      nv: 16,
      ventre: 0.4,
    }),
  );
  m2.pair(
    "petit-fessier",
    "petit-fessier",
    nappe({
      origine: [
        [0.13, 0.99, 0.052],
        [0.146, 1.022, 0.0],
        [0.122, 1.022, -0.04],
      ],
      milieux: [
        [
          [0.151, 0.976, 0.032],
          [0.159, 0.986, -0.004],
          [0.142, 0.98, -0.03],
        ],
      ],
      insertion: [[0.158, 0.926, 0.008]],
      epaisseur: 0.012,
      dedans: [0.09, 0.98, 0.0],
      nu: 12,
      nv: 12,
    }),
  );
  m0.pair(
    "tenseur-fascia-lata",
    "tenseur-fascia-lata",
    fuseau(
      [
        [0.122, 0.99, 0.069],
        [0.141, 0.95, 0.057],
        [0.156, 0.905, 0.037],
        [0.163, 0.86, 0.022],
      ],
      { rayon: 0.0125, bout: 0.0055, ventre: 0.5, ovale: 0.6, indice: [0.7, 0, 0.7] },
    ),
  );
  m2.pair(
    "piriforme",
    "piriforme",
    fuseau(
      [
        [0.025, 0.975, -0.066],
        [0.06, 0.96, -0.071],
        [0.11, 0.94, -0.046],
        [0.15, 0.926, -0.016],
      ],
      { rayon: 0.0098, bout: 0.0035, ventre: 0.4 },
    ),
  );
}

/* ================================================================ le membre supérieur */

function membreSuperieur(pieces: Piece[]) {
  const m0 = ajouteur(pieces, "muscle", 0);
  const m1 = ajouteur(pieces, "muscle", 1);
  const m2 = ajouteur(pieces, "muscle", 2);
  const B = BRAS_R;
  const A = AVANT_BRAS_R;
  // Le deltoïde : un capuchon sur l'épaule, de la clavicule, de l'acromion et de l'épine jusqu'à la tubérosité deltoïdienne.
  const anneauDeltoide = (centre: V3, r: number, dy: number): V3[] =>
    [-8, 24, 56, 90, 124, 158, 192].map((a) => [centre[0] + r * Math.sin((a * Math.PI) / 180), centre[1] + dy, centre[2] + r * Math.cos((a * Math.PI) / 180)] as V3);
  m0.pair(
    "deltoide",
    "deltoide",
    nappe({
      origine: [
        [0.122, 1.461, 0.043],
        [0.142, 1.462, 0.027],
        [0.162, 1.459, 0.003],
        [0.184, 1.456, -0.026],
        [0.177, 1.457, -0.051],
        [0.16, 1.449, -0.084],
        [0.138, 1.433, -0.111],
      ],
      milieux: [anneauDeltoide(TETE_HUMERUS, 0.044, 0.006), anneauDeltoide([0.19, 1.35, -0.0145], 0.031, 0)],
      insertion: [
        [0.203, 1.312, 0.0],
        [0.208, 1.302, -0.01],
        [0.204, 1.312, -0.021],
      ],
      epaisseur: 0.019,
      dedans: TETE_HUMERUS,
      nu: 24,
      nv: 24,
      ventre: 0.42,
      attaches: 0.3,
      surface: (p, _u, v) => {
        const d = distance(p, TETE_HUMERUS);
        const min = 0.038 * (1 - 0.35 * lisse(0.45, 1, v));
        return d >= min ? p : plus(TETE_HUMERUS, fois(unitaire(moins(p, TETE_HUMERUS)), min));
      },
    }),
  );
  // Le bras, en avant : biceps (deux chefs), brachial, coraco-brachial.
  m0.pair(
    "biceps-long",
    "biceps-brachial",
    surMembre(
      B,
      [
        [0.16, 14, 0.023],
        [0.4, 16, 0.031],
        [0.64, 10, 0.031],
        [0.86, 4, 0.022],
      ],
      { rayon: 0.0138, bout: 0.0042, ventre: 0.55, ovale: 0.8, apres: [[0.223, 1.105, 0.006]] },
    ),
  );
  m0.pair(
    "biceps-court",
    "biceps-brachial",
    surMembre(
      B,
      [
        [0.13, -26, 0.024],
        [0.4, -15, 0.031],
        [0.64, -5, 0.031],
        [0.86, 0, 0.022],
      ],
      { rayon: 0.0132, bout: 0.004, ventre: 0.55, ovale: 0.8, apres: [[0.222, 1.105, 0.006]] },
    ),
  );
  m1.pair(
    "brachial",
    "brachial",
    surMembre(
      B,
      [
        [0.42, 30, 0.015],
        [0.66, 15, 0.02],
        [0.9, 2, 0.017],
      ],
      { rayon: 0.018, bout: 0.006, ventre: 0.55, ovale: 0.6, apres: [[0.212, 1.096, -0.003]] },
    ),
  );
  m1.pair(
    "coraco-brachial",
    "coraco-brachial",
    surMembre(
      B,
      [
        [0.16, -50, 0.02],
        [0.38, -75, 0.016],
        [0.5, -86, 0.013],
      ],
      { rayon: 0.0072, bout: 0.003, ventre: 0.45, avant: [[0.15, 1.426, 0.011]] },
    ),
  );
  // Le bras, en arrière : le triceps et ses trois chefs.
  m0.pair(
    "triceps-long",
    "triceps-brachial",
    surMembre(
      B,
      [
        [0.12, -160, 0.028],
        [0.35, -170, 0.033],
        [0.6, -178, 0.031],
        [0.85, 180, 0.022],
      ],
      { rayon: 0.0168, bout: 0.005, ventre: 0.4, ovale: 0.72, avant: [[0.158, 1.386, -0.043]], apres: [[0.206, 1.16, -0.035]] },
    ),
  );
  m0.pair(
    "triceps-lateral",
    "triceps-brachial",
    surMembre(
      B,
      [
        [0.05, 128, 0.02],
        [0.3, 140, 0.031],
        [0.55, 155, 0.031],
        [0.8, 170, 0.023],
      ],
      { rayon: 0.016, bout: 0.005, ventre: 0.42, ovale: 0.72, apres: [[0.208, 1.16, -0.035]] },
    ),
  );
  m1.pair(
    "triceps-medial",
    "triceps-brachial",
    surMembre(
      B,
      [
        [0.4, -140, 0.019],
        [0.7, -160, 0.021],
        [0.92, -176, 0.018],
      ],
      { rayon: 0.0142, bout: 0.005, ventre: 0.5, ovale: 0.7 },
    ),
  );
  m0.pair(
    "ancone",
    "ancone",
    fuseau(
      [
        [0.236, 1.124, -0.028],
        [0.222, 1.1, -0.036],
        [0.211, 1.074, -0.031],
      ],
      { rayon: 0.0068, bout: 0.003, ventre: 0.35, ovale: 0.5, indice: [0, 0, 1] },
    ),
  );
  // L'avant-bras, en dehors et en arrière : les extenseurs et le brachio-radial.
  m0.pair(
    "brachio-radial",
    "brachio-radial",
    surMembre(
      A,
      [
        [0.05, 86, 0.032],
        [0.25, 76, 0.034],
        [0.45, 70, 0.027],
        [0.6, 64, 0.019],
      ],
      { rayon: 0.0158, bout: 0.004, ventre: 0.3, ovale: 0.7, avant: [[0.224, 1.22, -0.012]] },
    ),
  );
  m0.pair(
    "lerc",
    "long-extenseur-radial-carpe",
    surMembre(
      A,
      [
        [0.08, 106, 0.03],
        [0.3, 110, 0.028],
        [0.52, 110, 0.02],
      ],
      { rayon: 0.0122, bout: 0.0035, ventre: 0.3, avant: [[0.23, 1.165, -0.014]] },
    ),
  );
  m1.pair(
    "cerc",
    "court-extenseur-radial-carpe",
    surMembre(
      A,
      [
        [0.15, 126, 0.026],
        [0.4, 125, 0.024],
        [0.62, 120, 0.017],
      ],
      { rayon: 0.0112, bout: 0.0035, ventre: 0.35, avant: [[0.238, 1.12, -0.018]] },
    ),
  );
  m0.pair(
    "extenseur-doigts",
    "extenseur-doigts",
    surMembre(
      A,
      [
        [0.12, 150, 0.025],
        [0.4, 160, 0.024],
        [0.7, 165, 0.016],
      ],
      { rayon: 0.0122, bout: 0.0035, ventre: 0.4, avant: [[0.238, 1.118, -0.022]] },
    ),
  );
  m0.pair(
    "extenseur-ulnaire-carpe",
    "extenseur-ulnaire-carpe",
    surMembre(
      A,
      [
        [0.12, 192, 0.022],
        [0.45, 205, 0.02],
        [0.75, 212, 0.014],
      ],
      { rayon: 0.0105, bout: 0.003, ventre: 0.4, avant: [[0.232, 1.115, -0.026]] },
    ),
  );
  m0.pair(
    "long-abducteur-pouce",
    "long-abducteur-pouce",
    surMembre(
      A,
      [
        [0.4, 142, 0.02],
        [0.6, 122, 0.022],
        [0.78, 96, 0.022],
        [0.9, 82, 0.019],
      ],
      { rayon: 0.0068, bout: 0.0025, ventre: 0.35 },
    ),
  );
  m0.pair(
    "court-extenseur-pouce",
    "court-extenseur-pouce",
    surMembre(
      A,
      [
        [0.55, 136, 0.02],
        [0.72, 112, 0.021],
        [0.87, 90, 0.02],
      ],
      { rayon: 0.0052, bout: 0.002, ventre: 0.35 },
    ),
  );
  m2.pair(
    "supinateur",
    "supinateur",
    fuseau(
      [
        [0.236, 1.115, -0.022],
        [0.243, 1.085, -0.008],
        [0.24, 1.055, 0.008],
        [0.233, 1.04, 0.012],
      ],
      { rayon: 0.0058, bout: 0.003 },
    ),
  );
  // L'avant-bras, en avant et en dedans : les fléchisseurs et les pronateurs.
  m0.pair(
    "rond-pronateur",
    "rond-pronateur",
    surMembre(
      A,
      [
        [0.08, -60, 0.026],
        [0.25, -12, 0.027],
        [0.42, 40, 0.02],
      ],
      { rayon: 0.0122, bout: 0.0035, ventre: 0.4, avant: [[0.19, 1.13, -0.008]] },
    ),
  );
  m0.pair(
    "flechisseur-radial-carpe",
    "flechisseur-radial-carpe",
    surMembre(
      A,
      [
        [0.1, -55, 0.026],
        [0.35, -35, 0.027],
        [0.6, -16, 0.02],
      ],
      { rayon: 0.0122, bout: 0.0035, ventre: 0.35, avant: [[0.192, 1.118, -0.006]] },
    ),
  );
  m0.pair(
    "long-palmaire",
    "long-palmaire",
    surMembre(
      A,
      [
        [0.1, -72, 0.027],
        [0.3, -56, 0.03],
        [0.45, -46, 0.027],
      ],
      { rayon: 0.0082, bout: 0.0025, ventre: 0.4, avant: [[0.192, 1.118, -0.006]] },
    ),
  );
  m0.pair(
    "flechisseur-ulnaire-carpe",
    "flechisseur-ulnaire-carpe",
    surMembre(
      A,
      [
        [0.08, -106, 0.026],
        [0.35, -110, 0.026],
        [0.65, -100, 0.02],
        [0.92, -95, 0.015],
      ],
      { rayon: 0.0122, bout: 0.0035, ventre: 0.35, avant: [[0.195, 1.12, -0.02]] },
    ),
  );
  m1.pair(
    "flechisseur-superficiel-doigts",
    "flechisseur-superficiel-doigts",
    surMembre(
      A,
      [
        [0.15, -75, 0.02],
        [0.45, -55, 0.021],
        [0.78, -36, 0.016],
      ],
      { rayon: 0.0152, bout: 0.004, ventre: 0.45, avant: [[0.195, 1.115, -0.01]] },
    ),
  );
  m2.pair(
    "flechisseur-profond-doigts",
    "flechisseur-profond-doigts",
    surMembre(
      A,
      [
        [0.08, -96, 0.014],
        [0.4, -76, 0.014],
        [0.8, -52, 0.012],
      ],
      { rayon: 0.014, bout: 0.004, ventre: 0.45 },
    ),
  );
  m2.pair(
    "long-flechisseur-pouce",
    "long-flechisseur-pouce",
    surMembre(
      A,
      [
        [0.3, 56, 0.014],
        [0.6, 40, 0.015],
        [0.85, 26, 0.013],
      ],
      { rayon: 0.0076, bout: 0.003, ventre: 0.45 },
    ),
  );
  m2.pair(
    "carre-pronateur",
    "carre-pronateur",
    fuseau(
      [
        [0.236, 0.885, 0.006],
        [0.248, 0.887, 0.017],
        [0.262, 0.885, 0.017],
      ],
      { rayon: 0.0058, bout: 0.0035, ovale: 0.45, indice: [0, 1, 0] },
    ),
  );
  // La main : éminences thénar (le pouce) et hypothénar (le petit doigt), premier interosseux dorsal.
  m0.pair(
    "court-abducteur-pouce",
    "court-abducteur-pouce",
    fuseau(
      [
        [0.279, 0.826, 0.027],
        [0.291, 0.8, 0.037],
        [0.299, 0.778, 0.041],
      ],
      { rayon: 0.0066, bout: 0.003, ventre: 0.45 },
    ),
  );
  m0.pair(
    "court-flechisseur-pouce",
    "court-flechisseur-pouce",
    fuseau(
      [
        [0.27, 0.822, 0.028],
        [0.28, 0.798, 0.035],
        [0.292, 0.776, 0.038],
      ],
      { rayon: 0.0058, bout: 0.0028, ventre: 0.45 },
    ),
  );
  m1.pair(
    "opposant-pouce",
    "opposant-pouce",
    fuseau(
      [
        [0.28, 0.82, 0.022],
        [0.289, 0.8, 0.028],
        [0.295, 0.784, 0.032],
      ],
      { rayon: 0.0056, bout: 0.0028 },
    ),
  );
  m1.pair(
    "adducteur-pouce",
    "adducteur-pouce",
    fuseau(
      [
        [0.258, 0.772, 0.023],
        [0.275, 0.776, 0.031],
        [0.293, 0.774, 0.037],
      ],
      { rayon: 0.0056, bout: 0.003, ovale: 0.5, indice: [0, 1, 0] },
    ),
  );
  m0.pair(
    "abducteur-petit-doigt",
    "abducteur-petit-doigt",
    fuseau(
      [
        [0.243, 0.826, 0.022],
        [0.237, 0.79, 0.022],
        [0.231, 0.752, 0.019],
      ],
      { rayon: 0.0059, bout: 0.0026, ventre: 0.45 },
    ),
  );
  m0.pair(
    "interosseux-dorsal",
    "interosseux-dorsaux",
    fuseau(
      [
        [0.287, 0.795, 0.02],
        [0.283, 0.772, 0.016],
        [0.275, 0.745, 0.014],
      ],
      { rayon: 0.0056, bout: 0.0025, ventre: 0.45 },
    ),
  );
}

/* ================================================================ le membre inférieur */

function membreInferieur(pieces: Piece[]) {
  const m0 = ajouteur(pieces, "muscle", 0);
  const m1 = ajouteur(pieces, "muscle", 1);
  const m2 = ajouteur(pieces, "muscle", 2);
  const C = CUISSE_R;
  const J = JAMBE_R;
  // La cuisse, en avant : le quadriceps (quatre chefs) et le couturier.
  m0.pair(
    "droit-femoral",
    "droit-femoral",
    surMembre(
      C,
      [
        [0.05, -24, 0.05],
        [0.3, -12, 0.056],
        [0.6, -5, 0.053],
        [0.88, 0, 0.041],
      ],
      { rayon: 0.025, bout: 0.006, ventre: 0.5, ovale: 0.75, avant: [[0.112, 0.955, 0.06]], apres: [[0.1, 0.575, 0.036]], anneaux: 30 },
    ),
  );
  m0.pair(
    "vaste-lateral",
    "vaste-lateral",
    surMembre(
      C,
      [
        [0.05, 95, 0.03],
        [0.3, 100, 0.043],
        [0.6, 85, 0.043],
        [0.88, 55, 0.036],
      ],
      { rayon: 0.031, bout: 0.007, ventre: 0.45, ovale: 0.65, avant: [[0.158, 0.885, 0.005]], apres: [[0.118, 0.56, 0.033]], anneaux: 30 },
    ),
  );
  m0.pair(
    "vaste-medial",
    "vaste-medial",
    surMembre(
      C,
      [
        [0.3, -70, 0.03],
        [0.6, -65, 0.04],
        [0.85, -50, 0.043],
        [0.97, -30, 0.033],
      ],
      { rayon: 0.028, bout: 0.006, ventre: 0.72, ovale: 0.7, apres: [[0.086, 0.555, 0.031]], anneaux: 28 },
    ),
  );
  m2.pair(
    "vaste-intermediaire",
    "vaste-intermediaire",
    surMembre(
      C,
      [
        [0.08, 20, 0.025],
        [0.5, 10, 0.028],
        [0.88, 5, 0.024],
      ],
      { rayon: 0.02, bout: 0.007, ventre: 0.5, ovale: 0.6 },
    ),
  );
  m0.pair(
    "sartorius",
    "sartorius",
    surMembre(
      C,
      [
        [0.12, -20, 0.064],
        [0.35, -55, 0.066],
        [0.6, -100, 0.062],
        [0.85, -135, 0.053],
        [1.0, -150, 0.045],
      ],
      { rayon: 0.0088, bout: 0.0052, pointe: 0.25, ovale: 0.45, avant: [[0.118, 0.985, 0.071]], apres: [[0.07, 0.47, 0.0], [0.08, 0.445, 0.019]], anneaux: 44 },
    ),
  );
  // La cuisse, en dedans : les adducteurs, le gracile, le pectiné.
  m0.pair(
    "gracile",
    "gracile",
    surMembre(
      C,
      [
        [0.25, -118, 0.085],
        [0.55, -135, 0.064],
        [0.85, -150, 0.052],
        [1.0, -152, 0.041],
      ],
      { rayon: 0.011, bout: 0.004, ventre: 0.4, ovale: 0.6, avant: [[0.022, 0.862, 0.045]], apres: [[0.075, 0.455, 0.012]], anneaux: 36 },
    ),
  );
  m0.pair(
    "long-adducteur",
    "long-adducteur",
    surMembre(
      C,
      [
        [0.15, -105, 0.066],
        [0.35, -130, 0.042],
        [0.55, -160, 0.018],
      ],
      { rayon: 0.021, bout: 0.005, ventre: 0.3, ovale: 0.55, avant: [[0.025, 0.89, 0.062]] },
    ),
  );
  m0.pair(
    "pectine",
    "pectine",
    surMembre(
      C,
      [
        [0.03, -120, 0.04],
        [0.1, -150, 0.018],
      ],
      { rayon: 0.0132, bout: 0.005, ventre: 0.35, ovale: 0.55, avant: [[0.045, 0.905, 0.058], [0.065, 0.885, 0.05]] },
    ),
  );
  m1.pair(
    "court-adducteur",
    "court-adducteur",
    surMembre(
      C,
      [
        [0.15, -120, 0.045],
        [0.35, -160, 0.016],
      ],
      { rayon: 0.018, bout: 0.005, ventre: 0.4, avant: [[0.03, 0.875, 0.05]] },
    ),
  );
  m1.pair(
    "grand-adducteur",
    "grand-adducteur",
    fusion(
      surMembre(
        C,
        [
          [0.2, -150, 0.06],
          [0.55, -145, 0.046],
          [0.9, -130, 0.031],
        ],
        { rayon: 0.026, bout: 0.006, ventre: 0.35, ovale: 0.7, avant: [[0.06, 0.848, -0.035]], apres: [[0.075, 0.545, -0.008]], anneaux: 30 },
      ),
      surMembre(
        C,
        [
          [0.2, -140, 0.05],
          [0.45, -165, 0.02],
        ],
        { rayon: 0.02, bout: 0.006, ventre: 0.4, avant: [[0.038, 0.85, 0.015]] },
      ),
    ),
  );
  // La cuisse, en arrière : les ischio-jambiers.
  m0.pair(
    "biceps-femoral-long",
    "biceps-femoral",
    surMembre(
      C,
      [
        [0.2, 170, 0.06],
        [0.5, 155, 0.05],
        [0.8, 130, 0.04],
        [0.95, 115, 0.033],
      ],
      { rayon: 0.026, bout: 0.005, ventre: 0.45, ovale: 0.75, avant: [[0.068, 0.845, -0.038]], apres: [[0.132, 0.47, -0.022]], anneaux: 30 },
    ),
  );
  m1.pair(
    "biceps-femoral-court",
    "biceps-femoral",
    surMembre(
      C,
      [
        [0.45, 165, 0.022],
        [0.75, 140, 0.03],
        [0.95, 120, 0.032],
      ],
      { rayon: 0.015, bout: 0.005, ventre: 0.5 },
    ),
  );
  m0.pair(
    "semi-tendineux",
    "semi-tendineux",
    surMembre(
      C,
      [
        [0.2, -170, 0.062],
        [0.45, -160, 0.056],
        [0.7, -150, 0.046],
        [0.88, -140, 0.04],
      ],
      { rayon: 0.024, bout: 0.0045, ventre: 0.35, ovale: 0.8, avant: [[0.066, 0.842, -0.04]], anneaux: 28 },
    ),
  );
  m1.pair(
    "semi-membraneux",
    "semi-membraneux",
    surMembre(
      C,
      [
        [0.3, -165, 0.045],
        [0.6, -155, 0.046],
        [0.88, -145, 0.036],
      ],
      { rayon: 0.027, bout: 0.005, ventre: 0.62, ovale: 0.7, avant: [[0.07, 0.85, -0.032]], apres: [[0.072, 0.49, -0.022]], anneaux: 28 },
    ),
  );
  // La jambe, en arrière : le triceps sural (les deux gastrocnémiens et le soléaire), le poplité.
  m0.pair(
    "gastrocnemien-medial",
    "gastrocnemien",
    surMembre(
      J,
      [
        [0.1, -152, 0.035],
        [0.28, -163, 0.045],
        [0.48, -172, 0.036],
        [0.62, -178, 0.026],
      ],
      { rayon: 0.032, bout: 0.006, ventre: 0.4, ovale: 0.6, avant: [[0.078, 0.535, -0.03]], anneaux: 28 },
    ),
  );
  m0.pair(
    "gastrocnemien-lateral",
    "gastrocnemien",
    surMembre(
      J,
      [
        [0.1, 152, 0.033],
        [0.26, 163, 0.041],
        [0.45, 172, 0.032],
        [0.56, 178, 0.025],
      ],
      { rayon: 0.027, bout: 0.006, ventre: 0.4, ovale: 0.6, avant: [[0.12, 0.535, -0.03]], anneaux: 28 },
    ),
  );
  m1.pair(
    "soleaire",
    "soleaire",
    surMembre(
      J,
      [
        [0.12, 170, 0.025],
        [0.35, 180, 0.033],
        [0.6, 180, 0.034],
        [0.8, 180, 0.025],
      ],
      { rayon: 0.034, bout: 0.008, ventre: 0.5, ovale: 0.45, anneaux: 28 },
    ),
  );
  m2.pair(
    "poplite",
    "poplite",
    fuseau(
      [
        [0.128, 0.505, -0.025],
        [0.11, 0.48, -0.036],
        [0.085, 0.46, -0.029],
      ],
      { rayon: 0.008, bout: 0.0035, ovale: 0.5, indice: [0, 1, 0] },
    ),
  );
  m2.pair(
    "tibial-posterieur",
    "tibial-posterieur",
    surMembre(
      J,
      [
        [0.1, 175, 0.016],
        [0.4, -175, 0.017],
        [0.75, -150, 0.016],
      ],
      { rayon: 0.0112, bout: 0.004, ventre: 0.4 },
    ),
  );
  m2.pair(
    "long-flechisseur-orteils",
    "long-flechisseur-orteils",
    surMembre(
      J,
      [
        [0.25, -135, 0.02],
        [0.55, -145, 0.022],
        [0.85, -150, 0.018],
      ],
      { rayon: 0.0096, bout: 0.0035, ventre: 0.45 },
    ),
  );
  m2.pair(
    "long-flechisseur-hallux",
    "long-flechisseur-hallux",
    surMembre(
      J,
      [
        [0.35, 150, 0.024],
        [0.6, 160, 0.026],
        [0.85, 175, 0.02],
      ],
      { rayon: 0.011, bout: 0.004, ventre: 0.45 },
    ),
  );
  // La jambe, en avant et en dehors : tibial antérieur, extenseurs, fibulaires.
  m0.pair(
    "tibial-anterieur",
    "tibial-anterieur",
    surMembre(
      J,
      [
        [0.08, 10, 0.03],
        [0.35, 20, 0.034],
        [0.65, 12, 0.026],
        [0.8, 5, 0.02],
      ],
      { rayon: 0.0158, bout: 0.0045, ventre: 0.35, ovale: 0.75, avant: [[0.118, 0.47, 0.012]], anneaux: 28 },
    ),
  );
  m0.pair(
    "long-extenseur-orteils",
    "long-extenseur-orteils",
    surMembre(
      J,
      [
        [0.08, 70, 0.03],
        [0.4, 58, 0.035],
        [0.75, 40, 0.026],
      ],
      { rayon: 0.0118, bout: 0.0035, ventre: 0.45, avant: [[0.13, 0.46, 0.0]], anneaux: 26 },
    ),
  );
  m1.pair(
    "long-extenseur-hallux",
    "long-extenseur-hallux",
    surMembre(
      J,
      [
        [0.35, 40, 0.024],
        [0.6, 35, 0.027],
        [0.85, 25, 0.024],
      ],
      { rayon: 0.0074, bout: 0.003, ventre: 0.45 },
    ),
  );
  m0.pair(
    "long-fibulaire",
    "long-fibulaire",
    surMembre(
      J,
      [
        [0.05, 105, 0.036],
        [0.3, 108, 0.04],
        [0.55, 115, 0.034],
      ],
      { rayon: 0.015, bout: 0.0045, ventre: 0.4, ovale: 0.7, avant: [[0.138, 0.455, -0.02]] },
    ),
  );
  m1.pair(
    "court-fibulaire",
    "court-fibulaire",
    surMembre(
      J,
      [
        [0.45, 112, 0.032],
        [0.65, 120, 0.034],
        [0.85, 140, 0.026],
      ],
      { rayon: 0.012, bout: 0.0038, ventre: 0.5 },
    ),
  );
  // Le pied.
  m0.pair(
    "court-extenseur-orteils",
    "court-extenseur-orteils",
    fuseau(
      [
        [0.122, 0.048, 0.018],
        [0.113, 0.043, 0.05],
        [0.106, 0.034, 0.085],
      ],
      { rayon: 0.0086, bout: 0.003, ventre: 0.4, ovale: 0.5, indice: [1, 0, 0] },
    ),
  );
  m0.pair(
    "abducteur-hallux",
    "abducteur-hallux",
    fuseau(
      [
        [0.088, 0.03, -0.045],
        [0.077, 0.03, 0.0],
        [0.075, 0.026, 0.06],
        [0.082, 0.018, 0.13],
      ],
      { rayon: 0.0096, bout: 0.0035, ventre: 0.4, ovale: 0.7, indice: [0, 1, 0] },
    ),
  );
  m0.pair(
    "abducteur-petit-orteil",
    "abducteur-petit-orteil",
    fuseau(
      [
        [0.112, 0.022, -0.045],
        [0.128, 0.02, 0.02],
        [0.139, 0.016, 0.11],
      ],
      { rayon: 0.0076, bout: 0.003, ventre: 0.35, ovale: 0.7, indice: [0, 1, 0] },
    ),
  );
  m0.pair(
    "court-flechisseur-orteils",
    "court-flechisseur-orteils",
    fuseau(
      [
        [0.098, 0.012, -0.04],
        [0.104, 0.009, 0.02],
        [0.107, 0.01, 0.08],
      ],
      { rayon: 0.0086, bout: 0.003, ventre: 0.4, ovale: 0.5, indice: [1, 0, 0] },
    ),
  );
}

/** Tous les muscles. */
export function muscles(): Piece[] {
  const pieces: Piece[] = [];
  tete(pieces);
  cou(pieces);
  troncAvant(pieces);
  troncArriere(pieces);
  hanche(pieces);
  membreSuperieur(pieces);
  membreInferieur(pieces);
  return pieces;
}
