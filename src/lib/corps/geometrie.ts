/*
 * L'Écorché — les formes du corps, fabriquées par le calcul (aucun fichier 3D à télécharger) :
 * tubes qui suivent une courbe (os longs, artères, tendons, muscles en fuseau), ellipsoïdes (os courts),
 * nappes épaisses tendues entre deux lignes (muscles larges : trapèze, grand dorsal, pectoral…).
 * Chaque forme donne un maillage indexé ; les normales sont lissées à la fin. Module pur.
 */

import { type V3, courbe, cloche, fois, longueur, melange, moins, perpendiculaire, plus, reechantillonner, scal, unitaire, vect } from "./vec";

export type Maillage = {
  /** Positions (x, y, z) à la suite. */
  p: number[];
  /** Normales, calculées par `finir`. */
  n: number[];
  /** Coordonnées de surface : u le long des fibres (ou de l'os), v autour. */
  uv: number[];
  /** Triangles. */
  i: number[];
};

export const maillage = (): Maillage => ({ p: [], n: [], uv: [], i: [] });

/** Ajoute `b` à `a` (les indices sont décalés). */
export function ajouter(a: Maillage, b: Maillage): Maillage {
  if (a.p.length && a.n.length !== a.p.length) finir(a);
  if (b.p.length && b.n.length !== b.p.length) finir(b);
  const base = a.p.length / 3;
  for (const x of b.p) a.p.push(x);
  for (const x of b.n) a.n.push(x);
  for (const x of b.uv) a.uv.push(x);
  for (const x of b.i) a.i.push(x + base);
  return a;
}

export function fusion(...morceaux: Maillage[]): Maillage {
  const m = maillage();
  for (const x of morceaux) ajouter(m, x);
  return m;
}

/** Normales lissées (moyenne des faces, pondérée par leur aire). Déjà calculées : rien à refaire. */
export function finir(m: Maillage): Maillage {
  if (m.n.length === m.p.length && m.p.length > 0) return m;
  const n = new Float64Array(m.p.length);
  for (let k = 0; k < m.i.length; k += 3) {
    const [a, b, c] = [m.i[k] * 3, m.i[k + 1] * 3, m.i[k + 2] * 3];
    const ab: V3 = [m.p[b] - m.p[a], m.p[b + 1] - m.p[a + 1], m.p[b + 2] - m.p[a + 2]];
    const ac: V3 = [m.p[c] - m.p[a], m.p[c + 1] - m.p[a + 1], m.p[c + 2] - m.p[a + 2]];
    const f = vect(ab, ac);
    for (const s of [a, b, c]) {
      n[s] += f[0];
      n[s + 1] += f[1];
      n[s + 2] += f[2];
    }
  }
  m.n = [];
  for (let s = 0; s < n.length; s += 3) {
    const l = Math.hypot(n[s], n[s + 1], n[s + 2]) || 1;
    m.n.push(n[s] / l, n[s + 1] / l, n[s + 2] / l);
  }
  while (m.uv.length < (m.p.length / 3) * 2) m.uv.push(0, 0);
  return m;
}

/**
 * Normales lissées sur une topologie « soudée » : `soudure[s]` donne le sommet qui représente `s`
 * (la couture d'un tube, les pôles d'un ellipsoïde) ; les doublons reçoivent la même normale, sans arête visible.
 */
function normalesSoudees(m: Maillage, soudure: Int32Array) {
  const n = new Float64Array(m.p.length);
  for (let k = 0; k < m.i.length; k += 3) {
    const [a, b, c] = [m.i[k] * 3, m.i[k + 1] * 3, m.i[k + 2] * 3];
    const ab: V3 = [m.p[b] - m.p[a], m.p[b + 1] - m.p[a + 1], m.p[b + 2] - m.p[a + 2]];
    const ac: V3 = [m.p[c] - m.p[a], m.p[c + 1] - m.p[a + 1], m.p[c + 2] - m.p[a + 2]];
    const f = vect(ab, ac);
    for (const s of [m.i[k], m.i[k + 1], m.i[k + 2]]) {
      const r = soudure[s] * 3;
      n[r] += f[0];
      n[r + 1] += f[1];
      n[r + 2] += f[2];
    }
  }
  m.n = [];
  for (let s = 0; s < m.p.length / 3; s++) {
    const r = soudure[s] * 3;
    const l = Math.hypot(n[r], n[r + 1], n[r + 2]) || 1;
    m.n.push(n[r] / l, n[r + 1] / l, n[r + 2] / l);
  }
}

/** L'unité des coordonnées de surface (en travers des fibres) : 5 cm. Les stries ont ainsi le même pas partout. */
export const UNITE_SURFACE = 0.05;

/** Le symétrique gauche ↔ droite d'un maillage (les triangles sont retournés pour rester à l'endroit). */
export function symetrique(m: Maillage): Maillage {
  const s = maillage();
  for (let k = 0; k < m.p.length; k += 3) s.p.push(-m.p[k], m.p[k + 1], m.p[k + 2]);
  for (let k = 0; k < m.n.length; k += 3) s.n.push(-m.n[k], m.n[k + 1], m.n[k + 2]);
  s.uv = m.uv.slice();
  for (let k = 0; k < m.i.length; k += 3) s.i.push(m.i[k], m.i[k + 2], m.i[k + 1]);
  return s;
}

/* ---------- Le tube : une section qui suit une courbe ---------- */

export type OptionsTube = {
  /** Nombre de points autour de la section. */
  tour?: number;
  /** Rayon selon t (0 → 1 le long de la courbe) et l'angle a ; nombre : constant. */
  rayon: number | ((t: number, a: number) => number);
  /** Section ovale : rapport entre le petit et le grand axe (1 : ronde). */
  ovale?: number | ((t: number) => number);
  /** La direction du grand axe de l'ovale (sinon : choisie seule). */
  indice?: V3 | ((t: number) => V3);
  /** Fermer les deux bouts (par défaut : oui). */
  bouts?: boolean;
  /** Courbe fermée (un anneau). */
  boucle?: boolean;
  /** Nombre d'anneaux le long de la courbe (sinon : selon les points donnés). */
  anneaux?: number;
  /** La courbe passe-t-elle par les points tels quels (sinon on la lisse) ? */
  brut?: boolean;
};

export function tube(points: V3[], o: OptionsTube): Maillage {
  const tour = o.tour ?? 14;
  const n = o.anneaux ?? Math.max(4, points.length * 4);
  const chemin = o.brut ? points : o.boucle ? reechantillonner(courbe([...points, points[0]], n + 1), n + 1).slice(0, n) : reechantillonner(courbe(points, n * 2), n);
  const nb = chemin.length;
  const m = maillage();
  const L = tour + 1; // un sommet de plus par anneau : la couture, pour que les stries ne se tassent pas
  // Repères par transport parallèle (pas de torsion parasite).
  const tangentes: V3[] = chemin.map((p, i) => {
    const avant = chemin[o.boucle ? (i - 1 + nb) % nb : Math.max(0, i - 1)];
    const apres = chemin[o.boucle ? (i + 1) % nb : Math.min(nb - 1, i + 1)];
    return unitaire(moins(apres, avant));
  });
  const indiceDe = (t: number): V3 | undefined => (typeof o.indice === "function" ? o.indice(t) : o.indice);
  let normale = perpendiculaire(tangentes[0], indiceDe(0));
  let perimetre = 0;
  for (let i = 0; i < nb; i++) {
    const t = o.boucle ? i / nb : i / (nb - 1);
    const T = tangentes[i];
    const indice = indiceDe(t);
    normale = indice ? perpendiculaire(T, indice) : perpendiculaire(T, normale);
    const B = vect(T, normale);
    const ovale = typeof o.ovale === "function" ? o.ovale(t) : (o.ovale ?? 1);
    let tourAnneau = 0;
    let avant: V3 | null = null;
    for (let k = 0; k <= tour; k++) {
      const a = ((k % tour) / tour) * Math.PI * 2;
      const r = typeof o.rayon === "number" ? o.rayon : o.rayon(t, a);
      const q = plus(chemin[i], plus(fois(normale, Math.cos(a) * r), fois(B, Math.sin(a) * r * ovale)));
      m.p.push(q[0], q[1], q[2]);
      if (avant) tourAnneau += longueur(moins(q, avant));
      avant = q;
    }
    perimetre = Math.max(perimetre, tourAnneau);
  }
  // En travers : la longueur d'arc du plus gros anneau (même nombre de fibres d'un bout à l'autre).
  const travers = perimetre / UNITE_SURFACE;
  for (let i = 0; i < nb; i++) {
    const t = o.boucle ? i / nb : i / (nb - 1);
    for (let k = 0; k <= tour; k++) m.uv.push(t, (k / tour) * travers);
  }
  const anneauxFaces = o.boucle ? nb : nb - 1;
  for (let i = 0; i < anneauxFaces; i++) {
    const i2 = (i + 1) % nb;
    for (let k = 0; k < tour; k++) {
      const a = i * L + k;
      const b = i * L + k + 1;
      const c = i2 * L + k;
      const d = i2 * L + k + 1;
      m.i.push(a, c, b, b, c, d);
    }
  }
  if (!o.boucle && o.bouts !== false) {
    for (const [i, sens] of [
      [0, -1],
      [nb - 1, 1],
    ] as const) {
      const centre = m.p.length / 3;
      const c = plus(chemin[i], fois(tangentes[i], sens * 0.0004));
      m.p.push(c[0], c[1], c[2]);
      m.uv.push(i === 0 ? 0 : 1, travers / 2);
      for (let k = 0; k < tour; k++) {
        if (sens < 0) m.i.push(centre, i * L + k, i * L + k + 1);
        else m.i.push(centre, i * L + k + 1, i * L + k);
      }
    }
  }
  const soudure = new Int32Array(m.p.length / 3);
  for (let s2 = 0; s2 < soudure.length; s2++) soudure[s2] = s2;
  for (let i = 0; i < nb; i++) soudure[i * L + tour] = i * L;
  normalesSoudees(m, soudure);
  return m;
}

/** Un muscle en fuseau : gros au milieu (`ventre`, entre 0 et 1), fin aux attaches. */
export function fuseau(points: V3[], o: { rayon: number; bout?: number; ventre?: number; pointe?: number; ovale?: number; indice?: V3 | ((t: number) => V3); tour?: number; anneaux?: number }): Maillage {
  const bout = o.bout ?? o.rayon * 0.25;
  return tube(points, {
    tour: o.tour ?? 16,
    anneaux: o.anneaux ?? 26,
    ovale: o.ovale ?? 0.8,
    indice: o.indice,
    rayon: (t) => bout + (o.rayon - bout) * cloche(t, o.ventre ?? 0.5, o.pointe ?? 0.8),
  });
}

/* ---------- L'ellipsoïde ---------- */

/** Un ellipsoïde de centre `c`, de demi-axes portés par les vecteurs `ax`, `ay`, `az` (leur longueur = le demi-axe). */
export function ellipsoide(c: V3, ax: V3, ay: V3, az: V3, o: { tour?: number; meridiens?: number; deformer?: (p: V3, u: number, v: number) => V3 } = {}): Maillage {
  const tour = o.tour ?? 18;
  const mer = o.meridiens ?? 12;
  const m = maillage();
  for (let j = 0; j <= mer; j++) {
    const phi = (j / mer) * Math.PI;
    for (let k = 0; k <= tour; k++) {
      const th = (k / tour) * Math.PI * 2;
      const [x, y, z] = [Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)];
      let p = plus(c, plus(fois(ax, x), plus(fois(ay, y), fois(az, z))));
      if (o.deformer) p = o.deformer(p, k / tour, j / mer);
      m.p.push(p[0], p[1], p[2]);
      m.uv.push(j / mer, k / tour);
    }
  }
  for (let j = 0; j < mer; j++)
    for (let k = 0; k < tour; k++) {
      const a = j * (tour + 1) + k;
      const b = a + 1;
      const c2 = a + tour + 1;
      const d = c2 + 1;
      m.i.push(a, b, c2, b, d, c2);
    }
  const soudure = new Int32Array(m.p.length / 3);
  for (let j = 0; j <= mer; j++)
    for (let k = 0; k <= tour; k++) {
      const s2 = j * (tour + 1) + k;
      soudure[s2] = j === 0 ? 0 : j === mer ? mer * (tour + 1) : k === tour ? j * (tour + 1) : s2;
    }
  normalesSoudees(m, soudure);
  return m;
}

/** Ellipsoïde aligné sur une direction : de `a` à `b`, avec deux demi-épaisseurs. */
export function olive(a: V3, b: V3, largeur: number, epaisseur: number, indice?: V3, o: { tour?: number; meridiens?: number } = {}): Maillage {
  const c = melange(a, b, 0.5);
  const axe = moins(b, a);
  const L = longueur(axe) / 2;
  const u = unitaire(axe);
  const n = perpendiculaire(u, indice);
  const w = vect(u, n);
  return ellipsoide(c, fois(n, largeur), fois(u, L), fois(w, epaisseur), o);
}

/* ---------- La nappe : un muscle large, tendu entre deux lignes ---------- */

export type OptionsNappe = {
  /** Lignes d'origine et d'insertion (un seul point : la nappe converge en éventail). */
  origine: V3[];
  insertion: V3[];
  /** Lignes intermédiaires, que les fibres traversent (pour épouser le relief). */
  milieux?: V3[][];
  /** Épaisseur au plus gros. */
  epaisseur: number;
  /** Où les fibres sont le plus épaisses (0 origine → 1 insertion), et l'amincissement des bords. */
  ventre?: number;
  /** Vers où est l'extérieur (pour orienter la nappe) : un point « dedans ». */
  dedans: V3;
  /** Finesse : fibres (en travers) × points le long. */
  nu?: number;
  nv?: number;
  /** Épaisseur aux attaches (fraction de l'épaisseur). */
  attaches?: number;
  /** Pose chaque point de la surface médiane sur le corps (u en travers, v le long des fibres). */
  surface?: (p: V3, u: number, v: number) => V3;
  /** Épaisseur des bords (fraction), 0.35 par défaut : des bords arrondis mais minces. */
  bords?: number;
  /** Relief (les digitations du dentelé, les intersections du droit de l'abdomen) : un multiplicateur de l'épaisseur. */
  relief?: (u: number, v: number) => number;
};

export function nappe(o: OptionsNappe): Maillage {
  const nu = o.nu ?? 14;
  const nv = o.nv ?? 18;
  const lignes = [o.origine, ...(o.milieux ?? []), o.insertion].map((l) => (l.length === 1 ? Array.from({ length: nu }, () => l[0]) : reechantillonner(courbe(l, Math.max(nu, l.length * 3)), nu)));
  const grille: V3[][] = [];
  for (let k = 0; k < nu; k++) grille.push(reechantillonner(courbe(lignes.map((l) => l[k]), nv * 2), nv));
  if (o.surface) for (let k = 0; k < nu; k++) for (let j = 0; j < nv; j++) grille[k][j] = o.surface(grille[k][j], k / (nu - 1), j / (nv - 1));
  // Normales de la surface médiane, tournées vers l'extérieur.
  const normaleEn = (k: number, j: number): V3 => {
    const du = moins(grille[Math.min(nu - 1, k + 1)][j], grille[Math.max(0, k - 1)][j]);
    const dv = moins(grille[k][Math.min(nv - 1, j + 1)], grille[k][Math.max(0, j - 1)]);
    let n = unitaire(vect(du, dv));
    if (scal(n, moins(grille[k][j], o.dedans)) < 0) n = fois(n, -1);
    return n;
  };
  const attaches = o.attaches ?? 0.25;
  const epaisseur = (u: number, v: number) => o.epaisseur * (attaches + (1 - attaches) * cloche(v, o.ventre ?? 0.5, 0.7)) * ((o.bords ?? 0.35) + (1 - (o.bords ?? 0.35)) * cloche(u, 0.5, 0.35)) * (o.relief ? o.relief(u, v) : 1);
  const m = maillage();
  const indice = (face: number, k: number, j: number) => face * nu * nv + k * nv + j;
  // La largeur (en travers des fibres), mesurée au milieu : le pas des stries ne dépend pas de la taille du muscle.
  let largeur = 0;
  for (let k = 1; k < nu; k++) largeur += longueur(moins(grille[k][nv >> 1], grille[k - 1][nv >> 1]));
  const travers = Math.max(largeur, 0.004) / UNITE_SURFACE;
  for (const face of [0, 1]) {
    for (let k = 0; k < nu; k++)
      for (let j = 0; j < nv; j++) {
        const u = k / (nu - 1);
        const v = j / (nv - 1);
        const e = epaisseur(u, v) * (face === 0 ? 0.62 : -0.38);
        const p = plus(grille[k][j], fois(normaleEn(k, j), e));
        m.p.push(p[0], p[1], p[2]);
        m.uv.push(v, u * travers);
      }
  }
  for (let k = 0; k < nu - 1; k++)
    for (let j = 0; j < nv - 1; j++) {
      const [a, b, c, d] = [indice(0, k, j), indice(0, k + 1, j), indice(0, k, j + 1), indice(0, k + 1, j + 1)];
      const [a2, b2, c2, d2] = [indice(1, k, j), indice(1, k + 1, j), indice(1, k, j + 1), indice(1, k + 1, j + 1)];
      m.i.push(a, b, c, b, d, c);
      m.i.push(a2, c2, b2, b2, c2, d2);
    }
  // Les quatre bords, qui ferment la nappe.
  const coudre = (paires: [number, number][], sens: boolean) => {
    for (let s = 0; s < paires.length - 1; s++) {
      const [h1, b1] = paires[s];
      const [h2, b2] = paires[s + 1];
      if (sens) m.i.push(h1, b1, h2, h2, b1, b2);
      else m.i.push(h1, h2, b1, h2, b2, b1);
    }
  };
  coudre(
    Array.from({ length: nv }, (_, j) => [indice(0, 0, j), indice(1, 0, j)] as [number, number]),
    true,
  );
  coudre(
    Array.from({ length: nv }, (_, j) => [indice(0, nu - 1, j), indice(1, nu - 1, j)] as [number, number]),
    false,
  );
  coudre(
    Array.from({ length: nu }, (_, k) => [indice(0, k, 0), indice(1, k, 0)] as [number, number]),
    false,
  );
  coudre(
    Array.from({ length: nu }, (_, k) => [indice(0, k, nv - 1), indice(1, k, nv - 1)] as [number, number]),
    true,
  );
  return m;
}

/* ---------- Petites aides ---------- */

/** Le centre d'un maillage (moyenne des sommets) : pour viser une structure et poser son étiquette. */
export function centre(m: Maillage): V3 {
  let x = 0;
  let y = 0;
  let z = 0;
  const n = m.p.length / 3 || 1;
  for (let k = 0; k < m.p.length; k += 3) {
    x += m.p[k];
    y += m.p[k + 1];
    z += m.p[k + 2];
  }
  return [x / n, y / n, z / n];
}

/** Le rayon de la sphère qui l'englobe (depuis son centre). */
export function etendue(m: Maillage, c = centre(m)): number {
  let r = 0;
  for (let k = 0; k < m.p.length; k += 3) r = Math.max(r, Math.hypot(m.p[k] - c[0], m.p[k + 1] - c[1], m.p[k + 2] - c[2]));
  return r;
}

/** Translation de tous les sommets. */
export function deplacer(m: Maillage, d: V3): Maillage {
  for (let k = 0; k < m.p.length; k += 3) {
    m.p[k] += d[0];
    m.p[k + 1] += d[1];
    m.p[k + 2] += d[2];
  }
  return m;
}

export { melange, plus, moins, fois };

/**
 * Découpe un maillage en morceaux, triangle par triangle, selon le centre de chaque triangle
 * (le crâne en frontal, pariétaux, temporaux… ; les sutures tombent juste, sans trou).
 */
export function partager(m: Maillage, classer: (c: V3) => string | null): Map<string, Maillage> {
  const sortie = new Map<string, { m: Maillage; table: Map<number, number> }>();
  for (let k = 0; k < m.i.length; k += 3) {
    const [a, b, c] = [m.i[k], m.i[k + 1], m.i[k + 2]];
    const centreTri: V3 = [0, 1, 2].map((j) => (m.p[a * 3 + j] + m.p[b * 3 + j] + m.p[c * 3 + j]) / 3) as V3;
    const nom = classer(centreTri);
    if (!nom) continue;
    let morceau = sortie.get(nom);
    if (!morceau) sortie.set(nom, (morceau = { m: maillage(), table: new Map() }));
    for (const s of [a, b, c]) {
      let n = morceau.table.get(s);
      if (n === undefined) {
        n = morceau.m.p.length / 3;
        morceau.table.set(s, n);
        morceau.m.p.push(m.p[s * 3], m.p[s * 3 + 1], m.p[s * 3 + 2]);
        if (m.n.length === m.p.length) morceau.m.n.push(m.n[s * 3], m.n[s * 3 + 1], m.n[s * 3 + 2]);
        morceau.m.uv.push(m.uv[s * 2] ?? 0, m.uv[s * 2 + 1] ?? 0);
      }
      morceau.m.i.push(n);
    }
  }
  return new Map([...sortie].map(([k, v]) => [k, v.m]));
}
