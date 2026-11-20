/*
 * L'Écorché — les tendons, aponévroses, ligaments et rétinaculums (le blanc nacré de l'écorché).
 * Côté gauche puis son miroir ; les structures médianes (ligne blanche, centre tendineux) sont impaires.
 */

import { type Maillage, fusion, nappe, tube } from "../geometrie";
import type { Piece } from "../types";
import { type V3, fois, lisse, melange, plus } from "../vec";
import { AVANT_BRAS_R, BRAS_R, CUISSE_R, JAMBE_R, crane, devant, dos } from "./reperes";
import { pointDiaphragme } from "./muscles";
import { DOIGTS, ajouteur, directionDoigt, phalangesDoigt, phalangesOrteil, RAYONS_PIED, table } from "./squelette";

/** Un tendon rond : une corde qui suit des points, plus fine au bout. */
const corde = (pts: V3[], rayon: number, fin = 0.7, ovale = 0.8, indice?: V3): Maillage =>
  tube(pts, { tour: 8, anneaux: Math.max(10, pts.length * 6), rayon: (t) => rayon * (1 - (1 - fin) * t), ovale, indice });

/** Un tendon plat (une bande) : `indice` donne la direction de sa largeur. */
const bande = (pts: V3[], large: number, epais: number, indice: V3 | ((t: number) => V3), fin = 1): Maillage =>
  tube(pts, { tour: 12, anneaux: Math.max(12, pts.length * 6), rayon: (t) => large * (1 - (1 - fin) * t), ovale: epais / large, indice });

/** Une nappe dont chaque point est calculé. */
function feuille(f: (u: number, v: number) => V3, o: { epaisseur: number; dedans: V3; nu?: number; nv?: number }): Maillage {
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
    attaches: 0.9,
    ventre: 0.5,
    bords: 0.6,
    ...o,
  });
}

/* ---------------------------------------------------------------- tête et tronc */

function teteEtTronc(pieces: Piece[]) {
  const t = ajouteur(pieces, "tendon", 0);
  // L'aponévrose épicrânienne (la galéa) : la calotte qui relie les ventres frontal et occipital.
  t.pair(
    "galea",
    "aponevrose-epicranienne",
    feuille(
      (u, v) => {
        const lat = u * 0.9;
        const beta = 0.8 + v * (2.98 - 0.8);
        const d: V3 = [Math.sin(lat), Math.cos(lat) * Math.sin(beta), Math.cos(lat) * Math.cos(beta)];
        return crane((Math.atan2(d[0], d[2]) * 180) / Math.PI, d[1], 0.0036);
      },
      { epaisseur: 0.0016, dedans: [0, 1.65, -0.012], nu: 14, nv: 24 },
    ),
  );
  // La ligne blanche, du processus xiphoïde à la symphyse pubienne.
  t.impair(
    "ligne-blanche",
    "ligne-blanche",
    feuille(
      (u, v) => {
        const y = 0.9 + v * 0.37;
        const large = 0.004 + 0.004 * lisse(0.3, 1, v);
        const p = devant((u - 0.5) * 2 * large, y, 0.008);
        const bas = 1 - lisse(0, 0.12, v);
        return [p[0], p[1], p[2] * (1 - bas) + 0.081 * bas];
      },
      { epaisseur: 0.002, dedans: [0, 1.1, -0.05], nu: 4, nv: 30 },
    ),
  );
  // Les intersections tendineuses du droit de l'abdomen (les lignes des « tablettes »).
  [0.47, 0.67, 0.85].forEach((c, k) => {
    const y = 0.903 + c * 0.365;
    const large = 0.021 + 0.05 * lisse(0, 0.85, c);
    t.pair(
      `intersection-${k + 1}`,
      "intersections-tendineuses",
      corde(
        Array.from({ length: 6 }, (_, i) => devant(0.005 + (i / 5) * large, y + (i / 5 - 0.5) * 0.004, 0.0105)),
        0.0034,
        1,
        0.35,
        [0, 1, 0],
      ),
    );
  });
  // Le ligament inguinal, de l'épine iliaque antéro-supérieure au tubercule pubien.
  t.pair(
    "ligament-inguinal",
    "ligament-inguinal",
    corde(
      [
        [0.119, 0.985, 0.072],
        [0.09, 0.95, 0.078],
        [0.055, 0.918, 0.082],
        [0.022, 0.896, 0.079],
      ],
      0.0028,
      1,
    ),
  );
  // Le fascia thoraco-lombaire : le losange nacré du bas du dos, d'où part le grand dorsal.
  const bord: [number, number][] = [
    [0.93, 0.03],
    [0.99, 0.05],
    [1.04, 0.09],
    [1.066, 0.128],
    [1.09, 0.104],
    [1.13, 0.074],
    [1.19, 0.05],
    [1.25, 0.03],
    [1.31, 0.012],
  ];
  t.pair(
    "fascia-thoraco-lombaire",
    "fascia-thoraco-lombaire",
    feuille(
      (u, v) => {
        const y = 0.94 + v * 0.37;
        const x = 0.002 + u * (table(bord, y) + 0.008);
        const p = dos(x, y, 0.0048);
        // Sur le sacrum, le fascia descend jusqu'à la surface de l'os.
        return y < 1.0 ? [p[0], p[1], Math.max(p[2], -0.098 + (1.0 - y) * 0.05)] : p;
      },
      { epaisseur: 0.0022, dedans: [0.03, 1.12, 0], nu: 12, nv: 30 },
    ),
  );
  // Le centre tendineux du diaphragme : le trèfle au sommet du dôme.
  t.impair(
    "centre-tendineux",
    "centre-tendineux",
    feuille(
      (u, v) => {
        const p = pointDiaphragme(0.16 + u * 0.68, 0.7 + v * 0.3);
        return [p[0], p[1] + 0.0018, p[2]];
      },
      { epaisseur: 0.0026, dedans: [0, 1.05, -0.01], nu: 26, nv: 8 },
    ),
  );
}

/* ---------------------------------------------------------------- membre supérieur */

function membreSuperieur(pieces: Piece[]) {
  const t = ajouteur(pieces, "tendon", 0);
  const B = BRAS_R;
  const A = AVANT_BRAS_R;
  // Le biceps : le long chef glisse dans le sillon de l'humérus ; en bas, le tendon gagne le radius.
  t.pair(
    "tendon-long-biceps",
    "tendon-long-biceps",
    corde([[0.158, 1.43, -0.021], [0.177, 1.437, -0.004], [0.189, 1.415, 0.006], [0.19, 1.39, 0.008], B.point(0.17, 14, 0.023)], 0.0028, 0.95),
  );
  t.pair("tendon-biceps", "tendon-biceps", corde([B.point(0.84, 4, 0.022), [0.222, 1.108, 0.008], [0.229, 1.09, 0.001], [0.232, 1.084, -0.003]], 0.0042, 0.75));
  t.pair(
    "aponevrose-bicipitale",
    "aponevrose-bicipitale",
    bande(
      [
        [0.218, 1.112, 0.012],
        [0.208, 1.098, 0.012],
        [0.199, 1.082, 0.006],
      ],
      0.006,
      0.0012,
      [0, 1, 0],
    ),
  );
  // Le tendon du triceps, large et plat, jusqu'à l'olécrâne.
  t.pair("tendon-triceps", "tendon-triceps", bande([B.point(0.62, 180, 0.03), B.point(0.82, 180, 0.026), [0.207, 1.16, -0.038], [0.205, 1.142, -0.037]], 0.013, 0.0022, [1, 0, 0], 0.55));
  // Les tendons de l'avant-bras vers le poignet.
  t.pair("tendon-brachio-radial", "tendon-brachio-radial", corde([A.point(0.58, 64, 0.019), A.point(0.8, 70, 0.016), [0.276, 0.866, 0.014], [0.284, 0.852, 0.011]], 0.0032, 0.8));
  t.pair("tendon-flechisseur-radial-carpe", "tendon-flechisseur-radial-carpe", corde([A.point(0.58, -16, 0.021), A.point(0.85, -8, 0.018), [0.268, 0.84, 0.027], [0.268, 0.805, 0.022]], 0.0025, 0.85));
  t.pair("tendon-long-palmaire", "tendon-long-palmaire", corde([A.point(0.45, -46, 0.028), A.point(0.8, -35, 0.024), [0.258, 0.84, 0.033]], 0.0018, 0.9));
  t.pair("tendon-flechisseur-ulnaire-carpe", "tendon-flechisseur-ulnaire-carpe", corde([A.point(0.88, -95, 0.016), [0.246, 0.842, 0.022], [0.244, 0.83, 0.022]], 0.0028, 0.9));
  t.pair(
    "tendons-extenseurs-radiaux",
    "tendons-extenseurs-radiaux",
    fusion(
      corde([A.point(0.5, 110, 0.021), A.point(0.8, 112, 0.017), [0.27, 0.842, -0.002], [0.268, 0.806, 0.005]], 0.0023, 0.9),
      corde([A.point(0.6, 120, 0.018), A.point(0.85, 125, 0.015), [0.262, 0.842, -0.004], [0.258, 0.806, 0.003]], 0.0023, 0.9),
    ),
  );
  t.pair("tendon-extenseur-ulnaire-carpe", "tendon-extenseur-ulnaire-carpe", corde([A.point(0.72, 212, 0.015), A.point(0.92, 210, 0.012), [0.238, 0.835, -0.004], [0.24, 0.805, 0.003]], 0.0023, 0.9));
  t.pair(
    "tendons-pouce",
    "tendons-pouce",
    fusion(
      corde([A.point(0.88, 84, 0.02), [0.283, 0.84, 0.014], [0.284, 0.81, 0.017]], 0.0022, 0.9),
      corde([A.point(0.85, 92, 0.02), [0.286, 0.84, 0.01], [0.292, 0.8, 0.024], [0.301, 0.772, 0.032]], 0.0018, 0.9),
    ),
  );
  // Les rétinaculums du poignet : les bracelets qui tiennent les tendons en place.
  t.pair(
    "retinaculum-flechisseurs",
    "retinaculum-flechisseurs",
    bande(
      [
        [0.244, 0.826, 0.025],
        [0.262, 0.822, 0.03],
        [0.281, 0.82, 0.027],
      ],
      0.009,
      0.0022,
      [0, 1, 0],
    ),
  );
  t.pair(
    "retinaculum-extenseurs",
    "retinaculum-extenseurs",
    bande(
      [
        [0.236, 0.86, -0.006],
        [0.258, 0.857, -0.012],
        [0.28, 0.857, -0.002],
      ],
      0.009,
      0.0018,
      [0, 1, 0],
    ),
  );
  // L'aponévrose palmaire : un éventail dans le creux de la main.
  t.pair(
    "aponevrose-palmaire",
    "aponevrose-palmaire",
    nappe({
      origine: [[0.258, 0.83, 0.034]],
      insertion: [
        [0.271, 0.748, 0.03],
        [0.257, 0.745, 0.029],
        [0.244, 0.748, 0.027],
        [0.233, 0.753, 0.024],
      ],
      milieux: [
        [
          [0.27, 0.79, 0.035],
          [0.259, 0.788, 0.035],
          [0.248, 0.79, 0.033],
          [0.239, 0.794, 0.03],
        ],
      ],
      epaisseur: 0.0018,
      dedans: [0.258, 0.79, 0.0],
      nu: 10,
      nv: 12,
      attaches: 0.9,
      bords: 0.6,
    }),
  );
  // Les tendons des fléchisseurs (paume) et des extenseurs (dos de la main), jusqu'au bout des doigts.
  const flech: Maillage[] = [];
  const ext: Maillage[] = [];
  for (let n = 1; n < 5; n++) {
    const d = DOIGTS[n];
    const ph = phalangesDoigt(n);
    const bout = ph[ph.length - 1][1];
    const dir = directionDoigt(n);
    const palmaire = (p: V3, e: number): V3 => plus(p, [0, 0, e]);
    const decal = (n - 2.5) * 0.007;
    flech.push(
      corde(
        [A.point(0.78, -36 + n * 8, 0.015), [0.258 + decal * 0.4, 0.84, 0.024], palmaire(melange(d.base, d.tete, 0.5), d.rayon + 0.004), palmaire(d.tete, d.rayon + 0.0035), ...ph.map(([a, b]) => palmaire(melange(a, b, 0.5), d.rayon * 0.8 + 0.002)), palmaire(plus(bout, fois(dir, -0.003)), 0.003)],
        0.0019,
        0.75,
      ),
    );
    ext.push(
      corde(
        [A.point(0.72, 160 + (n - 2.5) * 6, 0.016), [0.258 + decal * 0.5, 0.845, -0.009], palmaire(melange(d.base, d.tete, 0.5), -(d.rayon + 0.003)), palmaire(d.tete, -(d.rayon + 0.0035)), ...ph.map(([a, b]) => palmaire(melange(a, b, 0.5), -(d.rayon * 0.8 + 0.0015)))],
        0.0016,
        0.7,
        0.5,
        [1, 0, 0],
      ),
    );
  }
  t.pair("tendons-flechisseurs-doigts", "tendons-flechisseurs-doigts", fusion(...flech));
  t.pair("tendons-extenseurs-doigts", "tendons-extenseurs-doigts", fusion(...ext));
}

/* ---------------------------------------------------------------- membre inférieur */

function membreInferieur(pieces: Piece[]) {
  const t = ajouteur(pieces, "tendon", 0);
  const C = CUISSE_R;
  const J = JAMBE_R;
  // Le tendon quadricipital, la patella, le ligament patellaire.
  t.pair(
    "tendon-quadricipital",
    "tendon-quadricipital",
    bande(
      [
        [0.101, 0.6, 0.036],
        [0.099, 0.575, 0.039],
        [0.098, 0.558, 0.041],
      ],
      0.017,
      0.003,
      [1, 0, 0],
      0.8,
    ),
  );
  t.pair(
    "ligament-patellaire",
    "ligament-patellaire",
    bande(
      [
        [0.098, 0.51, 0.04],
        [0.099, 0.487, 0.036],
        [0.1, 0.466, 0.029],
      ],
      0.0105,
      0.0032,
      [1, 0, 0],
      0.85,
    ),
  );
  // Le tractus ilio-tibial, bande nacrée sur le dehors de la cuisse.
  t.pair(
    "tractus-ilio-tibial",
    "tractus-ilio-tibial",
    bande(
      [[0.163, 0.875, 0.018], C.point(0.15, 96, 0.057), C.point(0.45, 94, 0.066), C.point(0.75, 88, 0.058), C.point(0.95, 75, 0.047), [0.13, 0.478, 0.012]],
      0.015,
      0.0018,
      (k) => C.tangente(96 - 20 * k),
      0.55,
    ),
  );
  // Le tendon calcanéen (d'Achille), le plus puissant du corps.
  t.pair(
    "tendon-calcaneen",
    "tendon-calcaneen",
    tube([J.point(0.55, 180, 0.034), J.point(0.72, 180, 0.026), J.point(0.88, 180, 0.024), [0.097, 0.07, -0.058], [0.096, 0.048, -0.074]], {
      tour: 12,
      anneaux: 30,
      rayon: (k) => 0.017 - 0.011 * lisse(0, 0.6, k),
      ovale: (k) => 0.22 + 0.5 * lisse(0, 0.7, k),
      indice: [1, 0, 0],
    }),
  );
  t.pair("tendon-semi-tendineux", "tendon-semi-tendineux", corde([C.point(0.86, -140, 0.042), [0.07, 0.5, -0.03], [0.068, 0.475, -0.018], [0.076, 0.455, 0.008]], 0.0032, 0.85));
  // Les tendons de la loge antérieure, sur le cou-de-pied.
  t.pair("tendon-tibial-anterieur", "tendon-tibial-anterieur", corde([J.point(0.78, 5, 0.021), J.point(0.92, -5, 0.022), [0.09, 0.075, 0.032], [0.083, 0.056, 0.052], [0.08, 0.048, 0.062]], 0.0036, 0.85));
  t.pair(
    "tendon-long-extenseur-hallux",
    "tendon-long-extenseur-hallux",
    corde([J.point(0.84, 25, 0.025), [0.098, 0.078, 0.034], [0.088, 0.054, 0.068], plus(RAYONS_PIED[0][1], [0, 0.008, 0]), ...phalangesOrteil(0).map(([a, b]) => plus(melange(a, b, 0.5), [0, 0.0075, 0]))], 0.0026, 0.75),
  );
  const ext: Maillage[] = [];
  for (let n = 1; n < 5; n++) {
    const [base, tete] = RAYONS_PIED[n];
    ext.push(corde([J.point(0.75, 40, 0.027), [0.11, 0.075, 0.03], plus(melange(base, tete, 0.3), [0, 0.0065, 0]), plus(tete, [0, 0.0058, 0]), ...phalangesOrteil(n).map(([a, b]) => plus(melange(a, b, 0.5), [0, 0.0045, 0]))], 0.0017, 0.7));
  }
  t.pair("tendons-extenseurs-orteils", "tendons-extenseurs-orteils", fusion(...ext));
  // Les fibulaires passent derrière la malléole latérale.
  t.pair(
    "tendons-fibulaires",
    "tendons-fibulaires",
    fusion(
      corde([J.point(0.55, 116, 0.036), J.point(0.85, 135, 0.028), [0.133, 0.088, -0.026], [0.136, 0.06, -0.016], [0.132, 0.04, 0.03], [0.128, 0.034, 0.058]], 0.0028, 0.85),
      corde([J.point(0.8, 140, 0.028), [0.128, 0.09, -0.024], [0.132, 0.058, -0.02], [0.128, 0.03, 0.01], [0.11, 0.022, 0.04]], 0.0026, 0.85),
    ),
  );
  // Derrière la malléole médiale : tibial postérieur et longs fléchisseurs.
  t.pair(
    "tendons-malleole-mediale",
    "tendons-malleole-mediale",
    fusion(
      corde([J.point(0.72, -150, 0.018), [0.074, 0.09, -0.014], [0.07, 0.062, -0.006], [0.082, 0.04, 0.035]], 0.0028, 0.85),
      corde([J.point(0.82, -150, 0.019), [0.078, 0.088, -0.022], [0.076, 0.055, -0.016], [0.088, 0.025, 0.03], [0.1, 0.018, 0.08]], 0.0024, 0.85),
    ),
  );
  t.pair(
    "retinaculums-cheville",
    "retinaculums-cheville",
    fusion(
      bande(
        [
          [0.074, 0.088, 0.02],
          [0.1, 0.092, 0.034],
          [0.128, 0.09, 0.012],
        ],
        0.0055,
        0.0011,
        [0, 1, 0],
      ),
      bande(
        [
          [0.08, 0.062, 0.05],
          [0.1, 0.064, 0.05],
          [0.122, 0.06, 0.04],
        ],
        0.0048,
        0.001,
        [0, 1, 0],
      ),
    ),
  );
  // L'aponévrose plantaire, sous la voûte.
  t.pair(
    "aponevrose-plantaire",
    "aponevrose-plantaire",
    nappe({
      origine: [[0.098, 0.006, -0.042]],
      milieux: [
        [
          [0.088, 0.008, 0.04],
          [0.104, 0.006, 0.035],
          [0.12, 0.007, 0.03],
        ],
      ],
      insertion: [
        [0.086, 0.01, 0.13],
        [0.112, 0.008, 0.132],
        [0.138, 0.009, 0.118],
      ],
      epaisseur: 0.0022,
      dedans: [0.1, 0.05, 0.03],
      nu: 10,
      nv: 16,
      attaches: 0.9,
      bords: 0.6,
    }),
  );
}

/** Tous les tendons. */
export function tendons(): Piece[] {
  const pieces: Piece[] = [];
  teteEtTronc(pieces);
  membreSuperieur(pieces);
  membreInferieur(pieces);
  return pieces;
}
