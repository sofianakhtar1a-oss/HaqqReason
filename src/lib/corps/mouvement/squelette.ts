/*
 * L'Écorché — poser le squelette : des angles des articulations aux matrices de chaque segment.
 *
 * Chaque segment (un os ou un groupe d'os qui bougent d'un bloc) reçoit une matrice 3 × 4 qui dit où il est passé,
 * à partir de la position anatomique. Le moteur la donne à la carte graphique, qui déplace les os et tout ce qui
 * les suit (muscles, tendons, vaisseaux, nerfs : chaque sommet connaît ses deux segments et leur part).
 *
 * Les segments du milieu du corps viennent d'abord, puis ceux de gauche, puis ceux de droite dans le même ordre.
 * Module pur : pas de DOM, pas de WebGL.
 */
import donnees from "@/lib/corps/modele/squelette.json";
import type { V3 } from "@/lib/corps/vec";
import { DDL, DDL_PAR_ID, type Ddl } from "./articulations";

type Brut = { axiaux: string[]; lateraux: string[]; parents: Record<string, string | null>; ponts: Record<string, string[]>; reperes: Record<string, Record<string, unknown>> };
const D = donnees as unknown as Brut;

export type Cote = "g" | "d";
/** Les angles voulus : « coude.flexion:g » → degrés (clé sans côté pour la colonne, la tête, la mâchoire). */
export type Pose = Record<string, number>;
/** Une matrice 3 × 4 en lignes : [r00, r01, r02, t0, r10, r11, r12, t1, r20, r21, r22, t2]. */
export type Mat = Float64Array;

export const NB_AXIAUX = D.axiaux.length;
export const NB_LATERAUX = D.lateraux.length;
export const NB_SEGMENTS = NB_AXIAUX + 2 * NB_LATERAUX;
export const SEGMENTS_AXIAUX = D.axiaux;
export const SEGMENTS_LATERAUX = D.lateraux;

export function numero(segment: string, cote: Cote = "g"): number {
  const a = D.axiaux.indexOf(segment);
  if (a >= 0) return a;
  const l = D.lateraux.indexOf(segment);
  return l < 0 ? -1 : NB_AXIAUX + l + (cote === "d" ? NB_LATERAUX : 0);
}

export const cleDdl = (id: string, cote: Cote = "g") => (DDL_PAR_ID[id]?.lateral ? `${id}:${cote}` : id);

const miroirPoint = (p: V3): V3 => [-p[0], p[1], p[2]];
/** L'axe du côté droit : son symétrique, retourné, pour qu'un angle positif y fasse le même mouvement. */
const miroirAxe = (a: V3): V3 => [a[0], -a[1], -a[2]];

function repere(segment: string): Record<string, unknown> {
  const r = D.reperes[segment];
  if (!r) throw new Error(`repère inconnu : ${segment}`);
  return r;
}
/** Un point mesuré (« humerus » → son centre ; « cote-3.avant » → un point nommé), du côté voulu. */
export function pointMesure(nom: string, cote: Cote = "g"): V3 {
  const [segment, cle = "p"] = nom.split(".");
  const p = repere(segment)[cle] as V3;
  return cote === "d" ? miroirPoint(p) : [p[0], p[1], p[2]];
}
export function axeMesure(nom: string, cote: Cote = "g"): V3 {
  const [segment, cle] = nom.split(".");
  const a = repere(segment)[cle] as V3;
  if (!a) throw new Error(`axe inconnu : ${nom}`);
  return cote === "d" ? miroirAxe(a) : [a[0], a[1], a[2]];
}

/* ---------- matrices 3 × 4 ---------- */

const identite = (): Mat => {
  const m = new Float64Array(12);
  m[0] = m[5] = m[10] = 1;
  return m;
};

function rotation(pivot: V3, axe: V3, degres: number): Mat {
  const t = (degres * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  const k = 1 - c;
  const [x, y, z] = axe;
  const m = new Float64Array(12);
  m[0] = c + x * x * k;
  m[1] = x * y * k - z * s;
  m[2] = x * z * k + y * s;
  m[4] = y * x * k + z * s;
  m[5] = c + y * y * k;
  m[6] = y * z * k - x * s;
  m[8] = z * x * k - y * s;
  m[9] = z * y * k + x * s;
  m[10] = c + z * z * k;
  m[3] = pivot[0] - (m[0] * pivot[0] + m[1] * pivot[1] + m[2] * pivot[2]);
  m[7] = pivot[1] - (m[4] * pivot[0] + m[5] * pivot[1] + m[6] * pivot[2]);
  m[11] = pivot[2] - (m[8] * pivot[0] + m[9] * pivot[1] + m[10] * pivot[2]);
  return m;
}

function translation(v: V3): Mat {
  const m = identite();
  m[3] = v[0];
  m[7] = v[1];
  m[11] = v[2];
  return m;
}

/** a ∘ b : on applique b, puis a. */
function composer(a: Mat, b: Mat): Mat {
  const m = new Float64Array(12);
  for (let l = 0; l < 3; l++) {
    const a0 = a[l * 4];
    const a1 = a[l * 4 + 1];
    const a2 = a[l * 4 + 2];
    m[l * 4] = a0 * b[0] + a1 * b[4] + a2 * b[8];
    m[l * 4 + 1] = a0 * b[1] + a1 * b[5] + a2 * b[9];
    m[l * 4 + 2] = a0 * b[2] + a1 * b[6] + a2 * b[10];
    m[l * 4 + 3] = a0 * b[3] + a1 * b[7] + a2 * b[11] + a[l * 4 + 3];
  }
  return m;
}

export function appliquer(m: ArrayLike<number>, p: V3, debut = 0): V3 {
  return [
    m[debut] * p[0] + m[debut + 1] * p[1] + m[debut + 2] * p[2] + m[debut + 3],
    m[debut + 4] * p[0] + m[debut + 5] * p[1] + m[debut + 6] * p[2] + m[debut + 7],
    m[debut + 8] * p[0] + m[debut + 9] * p[1] + m[debut + 10] * p[2] + m[debut + 11],
  ];
}

/** Rend une rotation à peu près juste rigoureusement orthonormée (Gram-Schmidt sur les lignes). */
function redresser(m: Mat) {
  const n = (i: number) => Math.hypot(m[i], m[i + 1], m[i + 2]) || 1;
  let l = n(0);
  m[0] /= l;
  m[1] /= l;
  m[2] /= l;
  let d = m[4] * m[0] + m[5] * m[1] + m[6] * m[2];
  m[4] -= d * m[0];
  m[5] -= d * m[1];
  m[6] -= d * m[2];
  l = n(4);
  m[4] /= l;
  m[5] /= l;
  m[6] /= l;
  m[8] = m[1] * m[6] - m[2] * m[5];
  m[9] = m[2] * m[4] - m[0] * m[6];
  m[10] = m[0] * m[5] - m[1] * m[4];
  d = 0;
}

/* ---------- le plan : pour chaque segment, ce qui le fait bouger ---------- */

type Etape = { cle: string; ddl: Ddl; pivot: V3; axe: V3; part: number; courbe?: [number, number][]; glisse?: number };

const etapes: Etape[][] = Array.from({ length: NB_SEGMENTS }, () => []);
for (const ddl of DDL) {
  for (const coteDdl of ddl.lateral ? (["g", "d"] as const) : (["g"] as const)) {
    for (const e of ddl.effets) {
      const cote: Cote = ddl.lateral ? coteDdl : (e.cote ?? "g");
      const seg = numero(e.segment, cote);
      if (seg < 0) throw new Error(`segment inconnu : ${e.segment}`);
      const lateral = seg >= NB_AXIAUX;
      const axe = typeof e.axe === "string" ? axeMesure(e.axe, lateral ? cote : "g") : lateral && cote === "d" ? miroirAxe(e.axe) : e.axe;
      etapes[seg].push({ cle: ddl.lateral ? `${ddl.id}:${coteDdl}` : ddl.id, ddl, pivot: pointMesure(e.pivot, lateral ? cote : "g"), axe, part: e.part ?? 1, courbe: e.courbe, glisse: e.glisse });
    }
  }
}

const parents = new Int16Array(NB_SEGMENTS).fill(-1);
for (const [k, s] of D.axiaux.entries()) parents[k] = D.parents[s] ? numero(D.parents[s]!) : -1;
for (const cote of ["g", "d"] as const) for (const s of D.lateraux) parents[numero(s, cote)] = numero(D.parents[s]!, cote);

const STERNUM = numero("sternum");
const PONT_STERNUM = (D.ponts.sternum ?? ["t3", "t10"]).map((s) => numero(s));
const C_STERNUM = pointMesure("sternum");
const COTES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
/** L'ordre du calcul : la colonne et la tête, les côtes, le sternum qu'elles portent, puis les membres. */
const ORDRE: number[] = [];
for (let s = 0; s < NB_AXIAUX; s++) if (s !== STERNUM) ORDRE.push(s);
for (const cote of ["g", "d"] as const) for (const n of COTES) ORDRE.push(numero(`cote-${n}`, cote));
ORDRE.push(STERNUM);
for (const cote of ["g", "d"] as const) for (const s of D.lateraux) if (!s.startsWith("cote-")) ORDRE.push(numero(s, cote));

function interpoler(courbe: [number, number][], x: number): number {
  if (x <= courbe[0][0]) return courbe[0][1];
  for (let i = 1; i < courbe.length; i++) {
    if (x <= courbe[i][0]) {
      const [x0, y0] = courbe[i - 1];
      const [x1, y1] = courbe[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return courbe[courbe.length - 1][1];
}

const borner = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

/** Les angles effectifs : bornés par les amplitudes, avec ce que le corps ajoute de lui-même. */
export function anglesEffectifs(pose: Pose): Pose {
  const v: Pose = {};
  for (const ddl of DDL) for (const cle of ddl.lateral ? [`${ddl.id}:g`, `${ddl.id}:d`] : [ddl.id]) v[cle] = borner(pose[cle] ?? 0, ddl.min, ddl.max);
  for (const c of ["g", "d"] as const) {
    // Le rythme scapulo-huméral : au-delà de 30° d'élévation du bras, la scapula fournit un degré sur trois.
    const elevation = Math.min(180, Math.hypot(Math.max(0, v[`epaule.flexion:${c}`]), Math.max(0, v[`epaule.abduction:${c}`])));
    const au_dela = Math.max(0, elevation - 30);
    const s = DDL_PAR_ID["scapula.sonnette"];
    v[`scapula.sonnette:${c}`] = borner(v[`scapula.sonnette:${c}`] + au_dela / 3, s.min, s.max);
    // Le genou ne tourne que fléchi (ses ligaments collatéraux se détendent).
    v[`genou.rotation:${c}`] *= borner(v[`genou.flexion:${c}`] / 70, 0, 1);
  }
  return v;
}

/** La matrice propre d'un segment (ce que ses articulations lui font, dans le repère de son porteur). */
function propre(seg: number, v: Pose): Mat | null {
  let m: Mat | null = null;
  for (const e of etapes[seg]) {
    const x = v[e.cle];
    if (!x) continue;
    const a = e.courbe ? interpoler(e.courbe, x) : x * e.part;
    if (!a) continue;
    const pas = e.glisse !== undefined ? translation([e.axe[0] * a * e.glisse * 0.001, e.axe[1] * a * e.glisse * 0.001, e.axe[2] * a * e.glisse * 0.001]) : rotation(e.pivot, e.axe, a);
    m = m ? composer(m, pas) : pas;
  }
  return m;
}

const HUMERUS = [numero("humerus", "g"), numero("humerus", "d")];
const C_HUMERUS = [pointMesure("humerus", "g"), pointMesure("humerus", "d")];

/**
 * Les matrices de tous les segments pour une pose : 12 nombres par segment, dans l'ordre des numéros.
 * (Une pose vide rend l'identité partout.)
 */
export function poser(pose: Pose, sortie: Float32Array = new Float32Array(NB_SEGMENTS * 12)): Float32Array {
  const v = anglesEffectifs(pose);
  const W: Mat[] = new Array(NB_SEGMENTS);
  for (const seg of ORDRE) {
    const L = propre(seg, v);
    if (seg === STERNUM) {
      // Le sternum est porté par les côtes : il se place à mi-chemin de ce que lui feraient faire T3 et T10…
      const [a, b] = [W[PONT_STERNUM[0]], W[PONT_STERNUM[1]]];
      const m = new Float64Array(12);
      for (let i = 0; i < 12; i++) m[i] = (a[i] + b[i]) / 2;
      redresser(m);
      const ca = appliquer(a, C_STERNUM);
      const cb = appliquer(b, C_STERNUM);
      // … et il suit le bout antérieur des côtes quand elles se soulèvent (inspiration).
      let dx = 0;
      let dy = 0;
      let dz = 0;
      let nb = 0;
      for (const cote of ["g", "d"] as const)
        for (const n of [2, 3, 4, 5, 6]) {
          const cotePos = numero(`cote-${n}`, cote);
          const avant = pointMesure(`cote-${n}.avant`, cote);
          const avec = appliquer(W[cotePos], avant);
          const sans = appliquer(W[parents[cotePos]], avant);
          dx += avec[0] - sans[0];
          dy += avec[1] - sans[1];
          dz += avec[2] - sans[2];
          nb++;
        }
      const c: V3 = [(ca[0] + cb[0]) / 2 + dx / nb, (ca[1] + cb[1]) / 2 + dy / nb, (ca[2] + cb[2]) / 2 + dz / nb];
      const rc = [m[0] * C_STERNUM[0] + m[1] * C_STERNUM[1] + m[2] * C_STERNUM[2], m[4] * C_STERNUM[0] + m[5] * C_STERNUM[1] + m[6] * C_STERNUM[2], m[8] * C_STERNUM[0] + m[9] * C_STERNUM[1] + m[10] * C_STERNUM[2]];
      m[3] = c[0] - rc[0];
      m[7] = c[1] - rc[1];
      m[11] = c[2] - rc[2];
      W[seg] = m;
      continue;
    }
    const parent = parents[seg];
    const P = parent < 0 ? identite() : W[parent];
    const h = HUMERUS.indexOf(seg);
    if (h >= 0) {
      // L'humérus s'oriente par rapport au thorax ; sa tête reste dans la glène, que la scapula emmène.
      const m = L ? composer(W[STERNUM], L) : new Float64Array(W[STERNUM]);
      const c = C_HUMERUS[h];
      const centre = appliquer(P, c);
      m[3] = centre[0] - (m[0] * c[0] + m[1] * c[1] + m[2] * c[2]);
      m[7] = centre[1] - (m[4] * c[0] + m[5] * c[1] + m[6] * c[2]);
      m[11] = centre[2] - (m[8] * c[0] + m[9] * c[1] + m[10] * c[2]);
      W[seg] = m;
      continue;
    }
    W[seg] = L ? composer(P, L) : P;
  }
  for (let s = 0; s < NB_SEGMENTS; s++) sortie.set(W[s], s * 12);
  return sortie;
}

/** Vrai si la pose ne bouge rien (on peut alors se passer des matrices). */
export function auRepos(pose: Pose): boolean {
  for (const cle in pose) if (pose[cle]) return false;
  return true;
}

/** Où passe un point d'un segment, pour des matrices données. */
export function deplacer(matrices: ArrayLike<number>, segment: number, p: V3): V3 {
  return segment < 0 ? p : appliquer(matrices, p, segment * 12);
}
