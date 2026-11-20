/*
 * L'Écorché — un peu de géométrie : vecteurs à trois composantes et matrices 4 × 4 (colonnes d'abord,
 * comme WebGL). Module pur, sans dépendance.
 */

export type V3 = [number, number, number];

export const v3 = (x = 0, y = 0, z = 0): V3 => [x, y, z];
export const plus = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const moins = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const fois = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const scal = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const vect = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const longueur = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const distance = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export function unitaire(a: V3): V3 {
  const l = longueur(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
export const melange = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
/** Le symétrique par rapport au plan médian (gauche ↔ droite). */
export const miroir = (a: V3): V3 => [-a[0], a[1], a[2]];

/** Une direction perpendiculaire à `d` (la plus proche de `indice` si on la donne). */
export function perpendiculaire(d: V3, indice?: V3): V3 {
  const u = unitaire(d);
  let p = indice ?? (Math.abs(u[1]) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0));
  p = moins(p, fois(u, scal(p, u)));
  if (longueur(p) < 1e-6) p = Math.abs(u[0]) < 0.9 ? vect(u, v3(1, 0, 0)) : vect(u, v3(0, 0, 1));
  return unitaire(p);
}

/** Rotation de `p` autour de l'axe `axe` (unitaire) d'un angle `a` (formule de Rodrigues). */
export function tourner(p: V3, axe: V3, a: number): V3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const k = unitaire(axe);
  return plus(plus(fois(p, c), fois(vect(k, p), s)), fois(k, scal(k, p) * (1 - c)));
}

/* ---------- Courbes ---------- */

/** Catmull-Rom centripète passant par tous les points ; `n` échantillons au total. */
export function courbe(points: V3[], n: number): V3[] {
  if (points.length < 2) return points.slice();
  const p = [moins(fois(points[0], 2), points[1]), ...points, moins(fois(points[points.length - 1], 2), points[points.length - 2])];
  const segments = points.length - 1;
  const sortie: V3[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * segments;
    const k = Math.min(segments - 1, Math.floor(t));
    const u = t - k;
    const [p0, p1, p2, p3] = [p[k], p[k + 1], p[k + 2], p[k + 3]];
    const u2 = u * u;
    const u3 = u2 * u;
    sortie.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)) as V3);
  }
  return sortie;
}

/** Rééchantillonne une polyligne à pas réguliers (par longueur d'arc). */
export function reechantillonner(points: V3[], n: number): V3[] {
  const cumul = [0];
  for (let i = 1; i < points.length; i++) cumul.push(cumul[i - 1] + distance(points[i - 1], points[i]));
  const total = cumul[cumul.length - 1] || 1;
  const sortie: V3[] = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * total;
    while (k < cumul.length - 2 && cumul[k + 1] < s) k++;
    const t = (s - cumul[k]) / (cumul[k + 1] - cumul[k] || 1);
    sortie.push(melange(points[k], points[k + 1], Math.min(1, Math.max(0, t))));
  }
  return sortie;
}

/* ---------- Matrices (Float32Array de 16, colonnes d'abord) ---------- */

export type M4 = Float32Array;

export function perspective(fov: number, aspect: number, pres: number, loin: number): M4 {
  const f = 1 / Math.tan(fov / 2);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (loin + pres) / (pres - loin);
  m[11] = -1;
  m[14] = (2 * loin * pres) / (pres - loin);
  return m;
}

export function regarder(oeil: V3, cible: V3, haut: V3 = [0, 1, 0]): M4 {
  const z = unitaire(moins(oeil, cible));
  const x = unitaire(vect(haut, z));
  const y = vect(z, x);
  const m = new Float32Array(16);
  m[0] = x[0];
  m[1] = y[0];
  m[2] = z[0];
  m[4] = x[1];
  m[5] = y[1];
  m[6] = z[1];
  m[8] = x[2];
  m[9] = y[2];
  m[10] = z[2];
  m[12] = -scal(x, oeil);
  m[13] = -scal(y, oeil);
  m[14] = -scal(z, oeil);
  m[15] = 1;
  return m;
}

export function multiplier(a: M4, b: M4): M4 {
  const m = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) m[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return m;
}

/** Projette un point du monde à l'écran : [x, y] en pixels CSS et la profondeur (null : derrière la caméra). */
export function projeter(p: V3, vueProj: M4, largeur: number, hauteur: number): [number, number, number] | null {
  const x = vueProj[0] * p[0] + vueProj[4] * p[1] + vueProj[8] * p[2] + vueProj[12];
  const y = vueProj[1] * p[0] + vueProj[5] * p[1] + vueProj[9] * p[2] + vueProj[13];
  const z = vueProj[2] * p[0] + vueProj[6] * p[1] + vueProj[10] * p[2] + vueProj[14];
  const w = vueProj[3] * p[0] + vueProj[7] * p[1] + vueProj[11] * p[2] + vueProj[15];
  if (w <= 0) return null;
  return [((x / w + 1) / 2) * largeur, ((1 - y / w) / 2) * hauteur, z / w];
}

/* ---------- Petites aides ---------- */

export const borne = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
export const lisse = (a: number, b: number, x: number) => {
  const t = borne((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Une bosse en cloche sur [0, 1] (0 aux bords, 1 au milieu `m`), plus pointue avec `p` grand. */
export function cloche(t: number, m = 0.5, p = 1): number {
  const u = t < m ? t / m : (1 - t) / (1 - m);
  return Math.pow(Math.sin((borne(u, 0, 1) * Math.PI) / 2), p);
}

/** Un bruit pseudo-aléatoire stable (pour varier les formes sans changer d'un chargement à l'autre). */
export function hasard(graine: number): () => number {
  let s = graine >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
