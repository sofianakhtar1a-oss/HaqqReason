/*
 * L'Écorché — les repères communs aux muscles, aux tendons et aux artères :
 *   • le tronc, vu comme une suite de sections (une superellipse par hauteur) sur laquelle on pose les muscles larges ;
 *   • le crâne, pour les muscles de la tête ;
 *   • un repère par segment de membre (le long de l'os ; angle 0 en avant, 90° en dehors, 180° en arrière, −90° en dedans).
 * Côté gauche du sujet (x > 0) ; le côté droit est le miroir.
 */

import { type V3, fois, longueur, moins, perpendiculaire, plus, unitaire, vect } from "../vec";
import { table } from "./squelette";

export const DEG = Math.PI / 180;

/* ---------------------------------------------------------------- le tronc */

/** Hauteur, demi-largeur, profondeur en avant, profondeur en arrière, centre (z) : la surface où reposent les muscles superficiels. */
const PROFIL: [number, number, number, number, number][] = [
  [0.95, 0.15, 0.082, 0.095, 0.005],
  [1.0, 0.15, 0.088, 0.1, 0.0],
  [1.05, 0.142, 0.093, 0.105, -0.003],
  [1.1, 0.128, 0.097, 0.108, -0.005],
  [1.15, 0.124, 0.1, 0.11, -0.006],
  [1.2, 0.13, 0.104, 0.115, -0.008],
  [1.25, 0.14, 0.108, 0.122, -0.008],
  [1.3, 0.145, 0.108, 0.128, -0.008],
  [1.35, 0.145, 0.106, 0.13, -0.009],
  [1.4, 0.138, 0.098, 0.125, -0.011],
  [1.43, 0.12, 0.09, 0.115, -0.012],
  [1.46, 0.095, 0.08, 0.1, -0.014],
  [1.5, 0.058, 0.055, 0.068, -0.01],
  [1.56, 0.052, 0.05, 0.068, -0.015],
  [1.6, 0.05, 0.045, 0.075, -0.02],
];
const colonne = (j: number): [number, number][] => PROFIL.map((r) => [r[0], r[j]]);
const [PW, PF, PA, PZ] = [colonne(1), colonne(2), colonne(3), colonne(4)];

export function profilTronc(y: number) {
  return { W: table(PW, y), Df: table(PF, y), Dp: table(PA, y), zc: table(PZ, y) };
}

/** Le rayon de la section du tronc dans la direction `t` (radians, 0 en avant, vers la gauche du sujet). */
function rayonSection(t: number, y: number): number {
  const { W, Df, Dp } = profilTronc(y);
  const s = Math.abs(Math.sin(t));
  const c = Math.cos(t);
  const D = c >= 0 ? Df : Dp;
  const n = c >= 0 ? 2.3 : 3.0;
  return Math.pow(Math.pow(s / W, n) + Math.pow(Math.abs(c) / D, n), -1 / n);
}

/** Un point de la surface du tronc : angle en degrés (0 en avant, 90 sur le flanc gauche, 180 au dos), hauteur, écart. */
export function tronc(angle: number, y: number, ecart = 0): V3 {
  const t = angle * DEG;
  const r = rayonSection(t, y) + ecart;
  return [r * Math.sin(t), y, profilTronc(y).zc + r * Math.cos(t)];
}

/** Ramène hors du tronc (à `ecart` de sa surface) un point qui y serait entré. */
export function horsTronc(p: V3, ecart: number): V3 {
  const y = p[1];
  if (y < 0.93 || y > 1.6) return p;
  const zc = profilTronc(y).zc;
  const dx = p[0];
  const dz = p[2] - zc;
  const t = Math.atan2(dx, dz);
  const r = Math.hypot(dx, dz);
  const rs = rayonSection(t, y) + ecart;
  if (r >= rs) return p;
  return [rs * Math.sin(t), y, zc + rs * Math.cos(t)];
}

/** Pose un point sur le tronc (à `ecart` de sa surface), qu'il soit dedans ou dehors. */
export function surTronc(p: V3, ecart: number): V3 {
  const y = p[1];
  if (y < 0.93 || y > 1.6) return p;
  const zc = profilTronc(y).zc;
  const t = Math.atan2(p[0], p[2] - zc);
  const rs = rayonSection(t, y) + ecart;
  return [rs * Math.sin(t), y, zc + rs * Math.cos(t)];
}

/** Le devant du tronc à l'abscisse x (pour le droit de l'abdomen). */
export function devant(x: number, y: number, ecart = 0): V3 {
  const { W, Df, zc } = profilTronc(y);
  const k = Math.min(0.999, Math.abs(x) / W);
  return [x, y, zc + Df * Math.pow(1 - Math.pow(k, 2.3), 1 / 2.3) + ecart];
}

/** Le dos du tronc à l'abscisse x (pour le fascia thoraco-lombaire). */
export function dos(x: number, y: number, ecart = 0): V3 {
  const { W, Dp, zc } = profilTronc(y);
  const k = Math.min(0.999, Math.abs(x) / W);
  return [x, y, zc - Dp * Math.pow(1 - Math.pow(k, 3), 1 / 3) - ecart];
}

/* ---------------------------------------------------------------- la cage thoracique */

/** Côtes 1 à 12 : hauteur moyenne, demi-largeur, demi-profondeur, centre (z) — reprises du squelette. */
const CAGE: [number, number, number, number][] = [
  [1.43, 0.058, 0.048, 0.016],
  [1.4, 0.085, 0.068, 0.006],
  [1.37, 0.102, 0.08, 0.0],
  [1.34, 0.115, 0.09, -0.004],
  [1.31, 0.124, 0.097, -0.006],
  [1.28, 0.13, 0.102, -0.007],
  [1.25, 0.133, 0.104, -0.008],
  [1.22, 0.133, 0.104, -0.01],
  [1.19, 0.13, 0.102, -0.012],
  [1.16, 0.125, 0.098, -0.014],
  [1.13, 0.114, 0.09, -0.016],
  [1.1, 0.099, 0.08, -0.02],
].reverse() as [number, number, number, number][];

/** Un point de la cage (son contour extérieur) : angle en degrés depuis l'avant, hauteur, écart. */
export function cage(angle: number, y: number, ecart = 0): V3 {
  const A = table(CAGE.map((c) => [c[0], c[1]]), y) + ecart;
  const B = table(CAGE.map((c) => [c[0], c[2]]), y) + ecart;
  const zc = table(CAGE.map((c) => [c[0], c[3]]), y);
  const t = angle * DEG;
  return [A * Math.sin(t), y, zc + B * Math.cos(t)];
}

/** L'angle (en degrés) d'un point autour de l'axe de la cage, à sa hauteur. */
export function angleCage(p: V3): number {
  const zc = table(CAGE.map((c) => [c[0], c[3]]), p[1]);
  return Math.atan2(p[0], p[2] - zc) / DEG;
}

/* ---------------------------------------------------------------- le crâne */

const CRANE = { c: [0, 1.648, -0.012] as V3, a: [0.074, 0.086, 0.099] as V3 };

/**
 * Un point de la voûte du crâne : azimut (degrés, 0 devant, 90 à gauche, 180 derrière), hauteur relative `ny`
 * (−1 en bas, 1 au sommet), écart. Reprend l'aplatissement du front et le creux des tempes du squelette.
 */
export function crane(azimut: number, ny: number, ecart = 0): V3 {
  const { c, a } = CRANE;
  const t = azimut * DEG;
  const h = Math.sqrt(Math.max(0, 1 - ny * ny));
  let x = a[0] * h * Math.sin(t);
  const y = c[1] + a[1] * ny;
  let z = c[2] + a[2] * h * Math.cos(t);
  const nz = (z - c[2]) / a[2];
  if (nz > 0.2 && ny > -0.2) z -= 0.012 * Math.min(1, Math.max(0, (nz - 0.2) / 0.7)) * Math.min(1, Math.max(0, (0.9 - ny) / 0.7));
  if (Math.abs(x) > 0.05 && ny < 0.2 && ny > -0.5 && nz > -0.3 && nz < 0.4) x *= 0.94;
  const d = unitaire([x / a[0], (y - c[1]) / a[1], (z - c[2]) / a[2]]);
  return [x + d[0] * ecart, y + d[1] * ecart, z + d[2] * ecart];
}

export const CENTRE_CRANE = CRANE.c;

/* ---------------------------------------------------------------- les membres */

export type Repere = {
  /** Le point à la fraction `t` du segment, à l'angle `a` (degrés) et à la distance `r` de l'axe. */
  point: (t: number, a: number, r: number) => V3;
  /** La direction qui tourne autour du membre à l'angle `a` (pour aplatir un muscle contre lui). */
  tangente: (a: number) => V3;
  axe: V3;
  longueur: number;
};

export function repere(a: V3, b: V3, avant: V3 = [0, 0, 1]): Repere {
  const d = moins(b, a);
  const L = longueur(d);
  const u = unitaire(d);
  const f = perpendiculaire(u, avant);
  const l = unitaire(vect(f, u));
  return {
    point: (t, ang, r) => plus(plus(a, fois(u, t * L)), plus(fois(f, Math.cos(ang * DEG) * r), fois(l, Math.sin(ang * DEG) * r))),
    tangente: (ang) => plus(fois(f, -Math.sin(ang * DEG)), fois(l, Math.cos(ang * DEG))),
    axe: u,
    longueur: L,
  };
}

/** Les segments du membre supérieur et du membre inférieur gauches, le long de leurs os. */
export const BRAS_R = repere([0.186, 1.39, -0.016], [0.213, 1.14, -0.013]);
export const AVANT_BRAS_R = repere([0.219, 1.1, -0.011], [0.252, 0.855, 0.006]);
export const CUISSE_R = repere([0.144, 0.86, 0.005], [0.098, 0.535, -0.008]);
export const JAMBE_R = repere([0.112, 0.47, -0.006], [0.098, 0.09, -0.005]);

/** Le centre de la tête de l'humérus (pour draper le deltoïde). */
export const TETE_HUMERUS: V3 = [0.178, 1.41, -0.022];
