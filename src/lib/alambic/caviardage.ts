/*
 * Masquer (caviarder) : trouver ce qu'il faut cacher dans le texte d'une page, et où il se trouve.
 *
 * Le texte d'une page arrive en morceaux placés (ceux de pdf.js pour un PDF, les mots reconnus pour
 * une photo ou un scan). On les recolle en une seule chaîne « pliée » (minuscules, sans accents) où
 * l'on cherche un mot de l'utilisateur ou un motif tout prêt (e-mail, téléphone, IBAN…), puis chaque
 * trouvaille redevient un ou plusieurs cadres sur la page. Pur : testé dans tests/test-alambic-studio.mts.
 */
import type { BoiteVisible } from "./signature";

/**
 * Un morceau de texte placé sur la page, en unités de la page visible (origine en haut à gauche,
 * y vers le bas). Soit une ligne de base (`ox`, `oy`, `angle`, `largeur`, `hauteur` : pdf.js), soit un
 * cadre droit (`cadre` : un mot reconnu sur une image).
 */
export type Morceau = {
  t: string;
  ox: number;
  oy: number;
  /** Sens de l'écriture (radians, sens des aiguilles d'une montre puisque y descend). */
  angle: number;
  /** Longueur du texte le long de la ligne de base. */
  largeur: number;
  /** Corps du texte (hauteur d'une ligne). */
  hauteur: number;
  /** Le morceau finit une ligne. */
  finDeLigne?: boolean;
  /** Mot reconnu : son cadre droit (x0, y0) – (x1, y1). */
  cadre?: { x0: number; y0: number; x1: number; y1: number };
  /**
   * Position de chaque bord de caractère le long de la ligne (n + 1 valeurs, de 0 à `largeur`) :
   * sans elle, on suppose des lettres de même largeur, ce qui décale les caches dans un texte courant.
   */
  avances?: number[];
};

export type PageTexte = { largeur: number; hauteur: number; morceaux: Morceau[] };

export type Trouvaille = { page: number; boites: BoiteVisible[]; texte: string };

export type IdMotif = "courriel" | "telephone" | "iban" | "secu" | "carte";

/** Les motifs tout prêts. Ils s'appliquent au texte plié (minuscules, sans accents). */
export const MOTIFS: { id: IdMotif; nom: string; exemple: string }[] = [
  { id: "courriel", nom: "Adresses e-mail", exemple: "prenom.nom@exemple.fr" },
  { id: "telephone", nom: "Téléphones", exemple: "06 12 34 56 78" },
  { id: "iban", nom: "IBAN", exemple: "FR76 3000 6000 0112 3456 7890 189" },
  { id: "secu", nom: "N° de sécurité sociale", exemple: "1 85 05 78 006 084 36" },
  { id: "carte", nom: "Numéros de carte bancaire", exemple: "4970 1012 3456 7890" },
];

const EXPRESSIONS: Record<IdMotif, RegExp> = {
  courriel: /[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/g,
  telephone: /(?:(?:\+|00)\d{2,3}[\s.-]?(?:\(0\)[\s.-]?)?[1-9]|\b0[1-9])(?:[\s.-]?\d{2}){4}(?!\d)/g,
  iban: /\b[a-z]{2}\d{2}(?:\s?[a-z0-9]{4}){2,7}(?:\s?[a-z0-9]{1,3})?\b/g,
  secu: /\b[1-478]\s?\d{2}\s?(?:0[1-9]|1[0-2]|[2-9]\d)\s?(?:\d{2}|2[ab])\s?\d{3}\s?\d{3}(?:\s?\d{2})?(?!\d)/g,
  carte: /\b(?:\d[\s-]?){12,18}\d(?!\d)/g,
};

/** Un IBAN est-il valide (clé « modulo 97 ») ? */
export function ibanValide(brut: string): boolean {
  const s = brut.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return false;
  const deplace = s.slice(4) + s.slice(0, 4);
  let reste = 0;
  for (const c of deplace) {
    const v = c >= "A" && c <= "Z" ? String(c.charCodeAt(0) - 55) : c;
    for (const chiffre of v) reste = (reste * 10 + Number(chiffre)) % 97;
  }
  return reste === 1;
}

/** Contrôle de Luhn (numéros de carte bancaire). */
export function luhnValide(brut: string): boolean {
  const s = brut.replace(/\D/g, "");
  if (s.length < 13 || s.length > 19) return false;
  let somme = 0;
  for (let i = 0; i < s.length; i++) {
    let n = Number(s[s.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    somme += n;
  }
  return somme % 10 === 0;
}

/** Plie un caractère : minuscule, sans accent (peut donner plusieurs lettres, ou aucune). */
const plier = (c: string) => c.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase();

/** Ce qu'on cherche, écrit par l'utilisateur : sans tenir compte des majuscules, des accents ni des espaces. */
export function motifDeRecherche(q: string): RegExp | null {
  const lettres = [...plier(q)].filter((c) => !/\s/.test(c));
  if (lettres.length < 2) return null;
  let source = "";
  lettres.forEach((c, i) => {
    if (i > 0) source += /\d/.test(c) && /\d/.test(lettres[i - 1]) ? "[\\s.\\-]*" : "\\s*";
    source += c.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
  });
  return new RegExp(source, "g");
}

/** Le texte plié d'une page, et pour chacun de ses caractères, d'où il vient (morceau, position). */
export function texteDePage(page: PageTexte): { texte: string; origine: ({ m: number; i: number } | null)[] } {
  let texte = "";
  const origine: ({ m: number; i: number } | null)[] = [];
  page.morceaux.forEach((m, k) => {
    if (k > 0) {
      const sep = separateur(page.morceaux[k - 1], m);
      if (sep) {
        texte += sep;
        origine.push(null);
      }
    }
    [...m.t].forEach((c, i) => {
      for (const p of plier(c)) {
        texte += p;
        origine.push({ m: k, i });
      }
    });
  });
  return { texte, origine };
}

/** Entre deux morceaux : rien s'ils se touchent, une espace s'ils sont écartés, un saut de ligne sinon. */
function separateur(a: Morceau, b: Morceau): "" | " " | "\n" {
  if (a.finDeLigne) return "\n";
  if (a.cadre && b.cadre) {
    const memeLigne = b.cadre.y0 < a.cadre.y1 && b.cadre.y1 > a.cadre.y0;
    return memeLigne ? " " : "\n";
  }
  const finX = a.ox + Math.cos(a.angle) * a.largeur;
  const finY = a.oy + Math.sin(a.angle) * a.largeur;
  const dx = b.ox - finX;
  const dy = b.oy - finY;
  // Écart le long de la ligne, et de côté (une autre ligne).
  const le = dx * Math.cos(a.angle) + dy * Math.sin(a.angle);
  const cote = -dx * Math.sin(a.angle) + dy * Math.cos(a.angle);
  const h = Math.max(1, a.hauteur);
  if (Math.abs(cote) > h * 0.6 || le < -h) return "\n";
  return le > h * 0.2 ? " " : "";
}

/** Le cadre (fraction de la page) des caractères [debut, fin) d'un morceau. */
export function boiteDe(m: Morceau, debut: number, fin: number, page: { largeur: number; hauteur: number }): BoiteVisible {
  const n = Math.max(1, [...m.t].length);
  let x0: number, y0: number, x1: number, y1: number;
  if (m.cadre) {
    const l = m.cadre.x1 - m.cadre.x0;
    const marge = (m.cadre.y1 - m.cadre.y0) * 0.12;
    x0 = m.cadre.x0 + (l * debut) / n - marge;
    x1 = m.cadre.x0 + (l * fin) / n + marge;
    y0 = m.cadre.y0 - marge;
    y1 = m.cadre.y1 + marge;
  } else {
    const c = Math.cos(m.angle);
    const s = Math.sin(m.angle);
    // Ligne de base, puis vers le haut des lettres (accents compris) et le bas des jambages.
    const ux = s;
    const uy = -c;
    const haut = m.hauteur * 0.95;
    const bas = m.hauteur * 0.3;
    // Une petite marge de chaque côté : mieux vaut couvrir un peu trop qu'oublier le bord d'une lettre.
    const marge = m.hauteur * 0.12;
    const exactes = m.avances && m.avances.length === n + 1;
    const a = (exactes ? m.avances![debut] : (m.largeur * debut) / n) - marge;
    const b = (exactes ? m.avances![fin] : (m.largeur * fin) / n) + marge;
    const coins = [a, b].flatMap((d) => {
      const px = m.ox + c * d;
      const py = m.oy + s * d;
      return [
        [px + ux * haut, py + uy * haut],
        [px - ux * bas, py - uy * bas],
      ];
    });
    x0 = Math.min(...coins.map((p) => p[0]));
    x1 = Math.max(...coins.map((p) => p[0]));
    y0 = Math.min(...coins.map((p) => p[1]));
    y1 = Math.max(...coins.map((p) => p[1]));
  }
  const L = Math.max(1, page.largeur);
  const H = Math.max(1, page.hauteur);
  const gx = Math.max(0, x0 / L);
  const gy = Math.max(0, y0 / H);
  return { x: gx, y: gy, w: Math.min(1, x1 / L) - gx, h: Math.min(1, y1 / H) - gy };
}

/** Retire d'une trouvaille d'IBAN ce qui dépasse, jusqu'à retrouver un IBAN valide. */
function ajusterIban(texte: string): number {
  for (let fin = texte.length; fin >= 15; fin--) {
    if (/\s$/.test(texte.slice(0, fin))) continue;
    if (ibanValide(texte.slice(0, fin))) return fin;
  }
  return 0;
}

/** Les trouvailles d'une expression sur toutes les pages. */
export function chercher(pages: PageTexte[], motif: RegExp | IdMotif): Trouvaille[] {
  const id = typeof motif === "string" ? motif : null;
  const expr: RegExp = typeof motif === "string" ? EXPRESSIONS[motif] : motif;
  const trouvailles: Trouvaille[] = [];
  pages.forEach((page, numero) => {
    const { texte, origine } = texteDePage(page);
    const re = new RegExp(expr.source, expr.flags.includes("g") ? expr.flags : `${expr.flags}g`);
    for (const r of texte.matchAll(re)) {
      let longueur = r[0].length;
      if (!longueur) continue;
      if (id === "iban") longueur = ajusterIban(r[0]);
      if (id === "carte" && !luhnValide(r[0])) continue;
      if (!longueur) continue;
      const debut = r.index ?? 0;
      // Les caractères trouvés, regroupés par morceau.
      const parMorceau = new Map<number, { de: number; a: number }>();
      for (let k = debut; k < debut + longueur; k++) {
        const o = origine[k];
        if (!o) continue;
        const p = parMorceau.get(o.m);
        if (p) {
          p.de = Math.min(p.de, o.i);
          p.a = Math.max(p.a, o.i + 1);
        } else parMorceau.set(o.m, { de: o.i, a: o.i + 1 });
      }
      const boites = [...parMorceau].map(([m, { de, a }]) => boiteDe(page.morceaux[m], de, a, page));
      if (!boites.length) continue;
      const brut = [...parMorceau].map(([m, { de, a }]) => [...page.morceaux[m].t].slice(de, a).join("")).join(" ");
      trouvailles.push({ page: numero, boites, texte: brut.replace(/\s+/g, " ").trim() });
    }
  });
  return trouvailles;
}

/** Part (0 à 1) de la boîte `b` recouverte par les caches donnés. */
export function couverture(b: BoiteVisible, caches: BoiteVisible[]): number {
  const aire = b.w * b.h;
  if (aire <= 0) return 1;
  let couvert = 0;
  for (const c of caches) {
    const ix = Math.max(0, Math.min(b.x + b.w, c.x + c.w) - Math.max(b.x, c.x));
    const iy = Math.max(0, Math.min(b.y + b.h, c.y + c.h) - Math.max(b.y, c.y));
    couvert += ix * iy;
  }
  return Math.min(1, couvert / aire);
}

/**
 * Ce qui, parmi les textes cherchés, n'est pas (ou plus) sous un cache : un cache retiré ou déplacé
 * laisserait l'information lisible dans l'image de la page.
 */
export function decouverts(pages: PageTexte[], motifs: (RegExp | IdMotif)[], caches: { page: number; boite: BoiteVisible }[]): { page: number; texte: string }[] {
  const vus = new Set<string>();
  const restes: { page: number; texte: string }[] = [];
  for (const m of motifs)
    for (const t of chercher(pages, m)) {
      const sur = caches.filter((c) => c.page === t.page).map((c) => c.boite);
      if (t.boites.every((b) => couverture(b, sur) >= 0.85)) continue;
      const cle = `${t.page}|${t.texte}`;
      if (vus.has(cle)) continue;
      vus.add(cle);
      restes.push({ page: t.page, texte: t.texte });
    }
  return restes;
}

/** Deux cadres qui se recouvrent presque entièrement sont le même : on n'en garde qu'un. */
export function memeBoite(a: BoiteVisible, b: BoiteVisible): boolean {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const petite = Math.min(a.w * a.h, b.w * b.h);
  return petite > 0 && inter / petite > 0.8;
}

/** Les cadres en pixels d'une image de `l` × `h`, agrandis d'une petite marge et bornés à l'image. */
export function enPixels(b: BoiteVisible, l: number, h: number, marge = 1): { x: number; y: number; w: number; h: number } {
  const x = Math.max(0, Math.floor(b.x * l) - marge);
  const y = Math.max(0, Math.floor(b.y * h) - marge);
  const x2 = Math.min(l, Math.ceil((b.x + b.w) * l) + marge);
  const y2 = Math.min(h, Math.ceil((b.y + b.h) * h) + marge);
  return { x, y, w: Math.max(0, x2 - x), h: Math.max(0, y2 - y) };
}
