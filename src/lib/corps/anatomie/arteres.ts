/*
 * L'Écorché — les artères : de l'aorte jusqu'aux arcades de la main et du pied.
 * L'aorte et ses branches médianes sont impaires ; le tronc brachio-céphalique n'existe qu'à droite
 * (côté x < 0) ; tout le reste est construit à gauche puis reflété.
 */

import { type Maillage, fusion, tube } from "../geometrie";
import type { Piece } from "../types";
import type { V3 } from "../vec";
import { AVANT_BRAS_R, BRAS_R, CUISSE_R, JAMBE_R } from "./reperes";
import { ajouteur, pointCote } from "./squelette";

/** Un vaisseau : un tube lisse qui s'affine doucement de `r0` à `r1`. */
const vaisseau = (pts: V3[], r0: number, r1 = r0 * 0.8, tour = 10): Maillage =>
  tube(pts, { tour, anneaux: Math.max(12, pts.length * 7), rayon: (t) => r0 + (r1 - r0) * t });

function centrales(pieces: Piece[]) {
  const a = ajouteur(pieces, "artere", 0);
  // L'aorte : ascendante, la crosse (qui passe à gauche et en arrière), thoracique puis abdominale, jusqu'à sa bifurcation.
  a.impair(
    "aorte",
    "aorte",
    vaisseau(
      [
        [-0.006, 1.29, 0.03],
        [-0.008, 1.33, 0.03],
        [-0.004, 1.375, 0.018],
        [0.008, 1.398, -0.002],
        [0.02, 1.39, -0.026],
        [0.024, 1.36, -0.042],
        [0.022, 1.3, -0.05],
        [0.018, 1.23, -0.045],
        [0.012, 1.17, -0.032],
        [0.009, 1.11, -0.016],
        [0.006, 1.05, -0.006],
      ],
      0.0135,
      0.0085,
      14,
    ),
  );
  // À droite seulement : le tronc brachio-céphalique, qui donne la sous-clavière et la carotide commune droites.
  a.impair(
    "tronc-brachio-cephalique",
    "tronc-brachio-cephalique",
    vaisseau(
      [
        [-0.002, 1.394, 0.006],
        [-0.012, 1.418, 0.012],
        [-0.022, 1.44, 0.016],
      ],
      0.0065,
      0.006,
    ),
  );
  // À gauche, carotide commune et sous-clavière naissent directement de la crosse.
  a.impair(
    "carotide-commune-origine",
    "carotide-commune",
    vaisseau(
      [
        [0.008, 1.398, 0.0],
        [0.016, 1.42, 0.008],
        [0.022, 1.44, 0.014],
      ],
      0.0046,
    ),
  );
  a.impair(
    "subclaviere-origine",
    "subclaviere",
    vaisseau(
      [
        [0.016, 1.394, -0.014],
        [0.028, 1.425, -0.004],
        [0.04, 1.444, 0.006],
      ],
      0.005,
    ),
  );
  a.impair(
    "subclaviere-origine-droite",
    "subclaviere",
    vaisseau(
      [
        [-0.022, 1.44, 0.016],
        [-0.032, 1.446, 0.01],
        [-0.04, 1.444, 0.006],
      ],
      0.005,
    ),
  );
  // Les branches viscérales de l'aorte abdominale.
  a.impair(
    "tronc-coeliaque",
    "tronc-coeliaque",
    fusion(
      vaisseau(
        [
          [0.01, 1.165, -0.026],
          [0.008, 1.168, -0.004],
          [0.006, 1.17, 0.008],
        ],
        0.0035,
      ),
      vaisseau(
        [
          [0.006, 1.17, 0.008],
          [0.03, 1.176, 0.004],
          [0.06, 1.18, -0.012],
          [0.085, 1.185, -0.03],
        ],
        0.0026,
        0.002,
      ),
      vaisseau(
        [
          [0.006, 1.17, 0.008],
          [-0.02, 1.172, 0.012],
          [-0.045, 1.18, 0.006],
        ],
        0.0024,
        0.002,
      ),
    ),
  );
  a.impair(
    "mesenterique-superieure",
    "mesenterique-superieure",
    vaisseau(
      [
        [0.009, 1.148, -0.022],
        [0.006, 1.14, 0.0],
        [0.004, 1.11, 0.024],
        [0.002, 1.06, 0.04],
        [-0.01, 1.01, 0.045],
      ],
      0.0036,
      0.002,
    ),
  );
}

function tronc(pieces: Piece[]) {
  const a = ajouteur(pieces, "artere", 0);
  // Le cou et la tête.
  a.pair(
    "carotide-commune",
    "carotide-commune",
    vaisseau(
      [
        [0.022, 1.44, 0.016],
        [0.024, 1.47, 0.016],
        [0.026, 1.5, 0.013],
      ],
      0.0046,
      0.0044,
    ),
  );
  a.pair(
    "carotide-interne",
    "carotide-interne",
    vaisseau(
      [
        [0.026, 1.5, 0.012],
        [0.03, 1.53, 0.002],
        [0.032, 1.56, -0.008],
        [0.028, 1.585, -0.01],
      ],
      0.0036,
      0.0032,
    ),
  );
  a.pair(
    "carotide-externe",
    "carotide-externe",
    vaisseau(
      [
        [0.026, 1.5, 0.014],
        [0.03, 1.525, 0.02],
        [0.04, 1.555, 0.006],
        [0.048, 1.58, -0.012],
      ],
      0.0031,
      0.0026,
    ),
  );
  a.pair(
    "artere-faciale",
    "artere-faciale",
    vaisseau(
      [
        [0.03, 1.525, 0.02],
        [0.036, 1.535, 0.03],
        [0.041, 1.538, 0.04],
        [0.036, 1.553, 0.064],
        [0.03, 1.57, 0.078],
        [0.024, 1.592, 0.084],
        [0.018, 1.612, 0.08],
      ],
      0.0019,
      0.0012,
    ),
  );
  a.pair(
    "temporale-superficielle",
    "temporale-superficielle",
    fusion(
      vaisseau(
        [
          [0.048, 1.58, -0.012],
          [0.064, 1.6, -0.012],
          [0.068, 1.625, -0.01],
          [0.07, 1.65, -0.005],
          [0.066, 1.675, 0.012],
          [0.058, 1.69, 0.03],
        ],
        0.0019,
        0.0012,
      ),
      vaisseau(
        [
          [0.07, 1.65, -0.005],
          [0.068, 1.67, -0.03],
          [0.058, 1.69, -0.055],
        ],
        0.0014,
        0.0011,
      ),
    ),
  );
  a.pair(
    "artere-occipitale",
    "artere-occipitale",
    vaisseau(
      [
        [0.04, 1.555, 0.004],
        [0.048, 1.58, -0.04],
        [0.044, 1.6, -0.075],
        [0.03, 1.625, -0.1],
      ],
      0.0017,
      0.0012,
    ),
  );
  a.pair(
    "vertebrale",
    "vertebrale",
    vaisseau(
      [
        [0.036, 1.444, 0.004],
        [0.03, 1.47, -0.012],
        [0.027, 1.51, -0.022],
        [0.026, 1.55, -0.028],
        [0.018, 1.568, -0.032],
      ],
      0.0024,
      0.0021,
    ),
  );
  // Le thorax : thoracique interne (derrière le sternum), intercostales.
  a.pair(
    "thoracique-interne",
    "thoracique-interne",
    vaisseau(
      [
        [0.038, 1.44, 0.008],
        [0.03, 1.42, 0.05],
        [0.024, 1.38, 0.07],
        [0.025, 1.3, 0.08],
        [0.03, 1.25, 0.082],
        [0.038, 1.18, 0.09],
      ],
      0.0019,
      0.0015,
    ),
  );
  a.pair(
    "intercostales",
    "arteres-intercostales",
    fusion(
      ...[2, 3, 4, 5, 6, 7, 8, 9].map((i) =>
        vaisseau(
          Array.from({ length: 9 }, (_, k) => {
            const p = pointCote(i, 152 - k * 12);
            return [p[0] * 0.985, p[1] - 0.0075, p[2] * 0.985 + 0.0002] as V3;
          }),
          0.0013,
          0.001,
          7,
        ),
      ),
    ),
  );
  // L'abdomen et le bassin.
  a.pair(
    "renale",
    "renale",
    vaisseau(
      [
        [0.009, 1.13, -0.014],
        [0.03, 1.132, -0.018],
        [0.055, 1.13, -0.028],
      ],
      0.003,
      0.0026,
    ),
  );
  a.pair(
    "iliaque-commune",
    "iliaque-commune",
    vaisseau(
      [
        [0.006, 1.05, -0.006],
        [0.018, 1.025, -0.002],
        [0.032, 1.0, 0.002],
      ],
      0.0058,
      0.0054,
    ),
  );
  a.pair(
    "iliaque-interne",
    "iliaque-interne",
    vaisseau(
      [
        [0.032, 1.0, 0.002],
        [0.038, 0.975, -0.018],
        [0.042, 0.95, -0.035],
        [0.046, 0.925, -0.045],
      ],
      0.0042,
      0.003,
    ),
  );
  a.pair(
    "iliaque-externe",
    "iliaque-externe",
    vaisseau(
      [
        [0.032, 1.0, 0.003],
        [0.045, 0.975, 0.022],
        [0.06, 0.945, 0.045],
        [0.072, 0.922, 0.058],
      ],
      0.0048,
      0.0046,
    ),
  );
  a.pair(
    "epigastrique-inferieure",
    "epigastrique-inferieure",
    vaisseau(
      [
        [0.066, 0.93, 0.055],
        [0.055, 0.96, 0.068],
        [0.045, 1.01, 0.078],
        [0.04, 1.08, 0.086],
        [0.04, 1.15, 0.09],
      ],
      0.0017,
      0.0012,
    ),
  );
}

function membres(pieces: Piece[]) {
  const a = ajouteur(pieces, "artere", 0);
  const B = BRAS_R;
  const A = AVANT_BRAS_R;
  const C = CUISSE_R;
  const J = JAMBE_R;
  // Le membre supérieur : sous-clavière → axillaire → humérale → radiale et ulnaire → arcades palmaires.
  a.pair(
    "subclaviere",
    "subclaviere",
    vaisseau(
      [
        [0.04, 1.444, 0.006],
        [0.058, 1.452, 0.014],
        [0.08, 1.447, 0.02],
        [0.1, 1.432, 0.02],
      ],
      0.005,
      0.0047,
    ),
  );
  a.pair(
    "axillaire",
    "axillaire",
    vaisseau(
      [
        [0.1, 1.432, 0.02],
        [0.125, 1.415, 0.012],
        [0.148, 1.39, 0.002],
        [0.166, 1.37, -0.004],
      ],
      0.0046,
      0.0042,
    ),
  );
  a.pair("humerale", "humerale", vaisseau([[0.166, 1.37, -0.004], B.point(0.2, -80, 0.024), B.point(0.5, -60, 0.024), B.point(0.8, -25, 0.022), [0.212, 1.11, 0.012], [0.216, 1.095, 0.01]], 0.0038, 0.0033));
  a.pair(
    "humerale-profonde",
    "humerale-profonde",
    vaisseau([B.point(0.17, -80, 0.024), B.point(0.3, -140, 0.016), B.point(0.5, 170, 0.014), B.point(0.75, 120, 0.016)], 0.0022, 0.0015),
  );
  a.pair("radiale", "radiale", vaisseau([[0.216, 1.095, 0.01], A.point(0.15, 20, 0.02), A.point(0.45, 40, 0.019), A.point(0.8, 50, 0.017), [0.27, 0.86, 0.02], [0.28, 0.842, 0.014], [0.283, 0.822, 0.008], [0.277, 0.8, 0.016]], 0.0026, 0.0021));
  a.pair("ulnaire", "ulnaire", vaisseau([[0.215, 1.093, 0.008], A.point(0.2, -50, 0.017), A.point(0.5, -75, 0.016), A.point(0.85, -82, 0.016), [0.245, 0.84, 0.024], [0.244, 0.826, 0.029]], 0.0028, 0.0023));
  a.pair(
    "arcade-palmaire-superficielle",
    "arcade-palmaire-superficielle",
    fusion(
      vaisseau(
        [
          [0.244, 0.826, 0.029],
          [0.246, 0.8, 0.033],
          [0.256, 0.787, 0.035],
          [0.268, 0.79, 0.034],
          [0.276, 0.803, 0.03],
        ],
        0.0019,
        0.0016,
      ),
      ...[0.243, 0.254, 0.265].map((x, k) =>
        vaisseau(
          [
            [x + 0.002, 0.79 - k * 0.001, 0.034],
            [x - 0.004, 0.76, 0.03],
            [x - 0.006, 0.735, 0.026],
          ],
          0.0012,
          0.0009,
          7,
        ),
      ),
    ),
  );
  a.pair(
    "arcade-palmaire-profonde",
    "arcade-palmaire-profonde",
    vaisseau(
      [
        [0.277, 0.8, 0.016],
        [0.268, 0.796, 0.018],
        [0.256, 0.795, 0.018],
        [0.244, 0.8, 0.016],
      ],
      0.0016,
      0.0013,
    ),
  );
  // Le membre inférieur : fémorale → poplitée → tibiales et fibulaire → pédieuse et plantaires.
  a.pair("femorale", "femorale", vaisseau([[0.072, 0.922, 0.058], [0.074, 0.895, 0.062], C.point(0.15, -95, 0.06), C.point(0.4, -115, 0.05), C.point(0.65, -140, 0.038), C.point(0.85, -165, 0.03)], 0.0049, 0.0042));
  a.pair("femorale-profonde", "femorale-profonde", vaisseau([[0.074, 0.885, 0.06], C.point(0.1, -110, 0.04), C.point(0.25, -150, 0.022), C.point(0.5, -175, 0.02), C.point(0.75, 170, 0.022)], 0.0036, 0.0022));
  a.pair(
    "circonflexe-femorale-laterale",
    "circonflexe-femorale-laterale",
    vaisseau([C.point(0.1, -110, 0.04), C.point(0.05, -40, 0.045), C.point(0.08, 40, 0.042), C.point(0.2, 85, 0.038)], 0.0022, 0.0016),
  );
  a.pair("poplitee", "poplitee", vaisseau([C.point(0.85, -165, 0.03), C.point(0.95, -175, 0.032), [0.1, 0.5, -0.035], [0.104, 0.468, -0.034], [0.106, 0.445, -0.03]], 0.0042, 0.0038));
  a.pair(
    "tibiale-anterieure",
    "tibiale-anterieure",
    vaisseau([[0.106, 0.445, -0.03], [0.114, 0.436, -0.012], J.point(0.12, 45, 0.016), J.point(0.45, 35, 0.018), J.point(0.8, 22, 0.019), [0.1, 0.075, 0.03]], 0.0028, 0.0024),
  );
  a.pair(
    "dorsale-du-pied",
    "dorsale-du-pied",
    vaisseau(
      [
        [0.1, 0.075, 0.03],
        [0.098, 0.062, 0.044],
        [0.094, 0.054, 0.058],
        [0.09, 0.046, 0.072],
        [0.088, 0.036, 0.085],
      ],
      0.0022,
      0.0017,
    ),
  );
  a.pair("tibiale-posterieure", "tibiale-posterieure", vaisseau([[0.106, 0.445, -0.03], J.point(0.15, -170, 0.02), J.point(0.45, -160, 0.02), J.point(0.8, -150, 0.019), [0.076, 0.08, -0.018], [0.074, 0.06, -0.01], [0.08, 0.04, 0.0]], 0.0031, 0.0026));
  a.pair("fibulaire", "fibulaire", vaisseau([J.point(0.12, -175, 0.02), J.point(0.35, 150, 0.024), J.point(0.65, 140, 0.024), J.point(0.88, 140, 0.02)], 0.0024, 0.0018));
  a.pair(
    "plantaires",
    "plantaires",
    fusion(
      vaisseau(
        [
          [0.08, 0.04, 0.0],
          [0.084, 0.028, 0.03],
          [0.086, 0.02, 0.08],
          [0.088, 0.016, 0.125],
        ],
        0.0018,
        0.0013,
      ),
      vaisseau(
        [
          [0.08, 0.04, 0.0],
          [0.1, 0.024, 0.02],
          [0.12, 0.02, 0.045],
          [0.124, 0.02, 0.065],
          [0.11, 0.022, 0.075],
          [0.095, 0.024, 0.074],
        ],
        0.0019,
        0.0014,
      ),
    ),
  );
}

/** Toutes les artères. */
export function arteres(): Piece[] {
  const pieces: Piece[] = [];
  centrales(pieces);
  tronc(pieces);
  membres(pieces);
  return pieces;
}
