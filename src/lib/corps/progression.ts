"use client";

import { useSyncExternalStore } from "react";
import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";
import { PAR_ID } from "./catalogue";
import { type Carte, type Certitude, carteDeBoite, degre, due, type Facette, noteDe, retenue, revoir } from "./memoire";
import { type CategorieId, ELEMENTS_APPRIS, IDS_CATEGORIES, nombreNiveaux, niveauxDe } from "./niveaux";

/*
 * La progression de L'Écorché : écrite sur l'appareil, recopiée sur le compte quand on est connecté
 * (magasin « corps », clé par clé : un niveau, une structure, le profil), et fusionnée en gardant
 * le meilleur des deux appareils.
 *
 *   • Les niveaux : la meilleure note (étoiles) de chaque niveau de chaque catégorie.
 *   • La mémoire de chaque structure : une boîte de Leitner (0 à 5). Une bonne réponse fait monter
 *     d'une boîte, une erreur fait redescendre de deux. À partir de la boîte 3, la structure est
 *     « sue » ; elle revient au bon moment pour le rester (1, 2, 4, 8, 16 jours).
 *   • Le profil : l'expérience, la série de jours (et ses gels), l'objectif du jour, les records,
 *     les réglages.
 *   • La mémoire de chaque facette (le nom, la place, la fonction, les nerfs, les attaches, les vaisseaux,
 *     la clinique) de chaque structure : une carte FSRS (voir memoire.ts), clé « facette:<id>|<facette> ».
 *     La boîte de Leitner continue d'avancer à côté : rien de ce qui existait ne se perd.
 */

/** [bonnes, fautes, boîte 0-5, jour du dernier passage (jours depuis 1970)] */
export type Maitrise = [number, number, number, number];
export type ResultatNiveau = { e: number; m: number; f: number };
export type Difficulte = "facile" | "normal" | "difficile";

export type Profil = {
  xp: number;
  /** La série : jours d'affilée où l'objectif a été atteint. */
  jours: number;
  dernierJour: string;
  gels: number;
  objectif: number;
  jourObjectif: string;
  faites: number;
  /** Réglages. */
  son: boolean;
  vibrations: boolean;
  voix: boolean;
  chrono: boolean;
  questions: 8 | 12 | 16;
  difficulte: Difficulte;
  /** Montrer le nom latin à côté du nom français. */
  latin: boolean;
  /** Le corps tourne seul quand on ne le touche pas. */
  rotation: boolean;
  contraste: boolean;
  taille: 100 | 115 | 130;
  plusDeTemps: boolean;
  q: number;
};

export type EntreeJournal = { t: number; s: string; n: string; b: number; q: number | null; x: number; e?: number };
export type Erreur = { t: string; c: string; r: string; j: number };

export type Etat = {
  niveaux: Record<string, ResultatNiveau>;
  elements: Record<string, Maitrise>;
  profil: Profil;
  records: Record<string, number>;
  erreurs: Erreur[];
  confusions: Record<string, number>;
  favoris: Record<string, number>;
  journal: EntreeJournal[];
  /** Les cartes de mémoire par facette : « <id>|<facette> » → carte FSRS. */
  facettes: Record<string, Carte>;
};

const NOM = "haqqreason-ecorche";
const cle = () => tiroir(NOM);
export const profilVide = (): Profil => ({
  xp: 0,
  jours: 0,
  dernierJour: "",
  gels: 0,
  objectif: 20,
  jourObjectif: "",
  faites: 0,
  son: true,
  vibrations: true,
  voix: false,
  chrono: false,
  questions: 12,
  difficulte: "normal",
  latin: true,
  rotation: true,
  contraste: false,
  taille: 100,
  plusDeTemps: false,
  q: 0,
});
const vide = (): Etat => ({ niveaux: {}, elements: {}, profil: profilVide(), records: {}, erreurs: [], confusions: {}, favoris: {}, journal: [], facettes: {} });

let etat: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (etat) return etat;
  try {
    const brut = JSON.parse(localStorage.getItem(cle()) ?? "null") as Partial<Etat> | null;
    etat =
      brut && typeof brut === "object"
        ? {
            niveaux: brut.niveaux ?? {},
            elements: brut.elements ?? {},
            profil: { ...profilVide(), ...(brut.profil ?? {}) },
            records: brut.records ?? {},
            erreurs: Array.isArray(brut.erreurs) ? brut.erreurs : [],
            confusions: brut.confusions ?? {},
            favoris: brut.favoris ?? {},
            journal: Array.isArray(brut.journal) ? brut.journal : [],
            facettes: brut.facettes && typeof brut.facettes === "object" ? brut.facettes : {},
          }
        : vide();
  } catch {
    etat = vide();
  }
  return etat;
}

let tempo: ReturnType<typeof setTimeout> | null = null;
function ecrire(e: Etat) {
  etat = e;
  if (tempo) clearTimeout(tempo);
  tempo = setTimeout(() => {
    tempo = null;
    try {
      localStorage.setItem(cle(), JSON.stringify(etat));
    } catch {
      // Navigation privée ou disque plein : la progression vit le temps de la visite.
    }
  }, 250);
  abonnes.forEach((f) => f());
}

const SERVEUR = vide();
export function useEcorche(): Etat {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      const surStockage = (ev: StorageEvent) => {
        if (ev.key === cle()) {
          etat = null;
          f();
        }
      };
      window.addEventListener("storage", surStockage);
      return () => {
        abonnes.delete(f);
        window.removeEventListener("storage", surStockage);
      };
    },
    lire,
    () => SERVEUR,
  );
}
export const etatActuel = (): Etat => lire();
export const profilActuel = (): Profil => lire().profil;

/* ---------- Le temps ---------- */

export const aujourdhui = () => Math.floor(Date.now() / 86_400_000);
/** La date du jour à Paris (AAAA-MM-JJ) : l'objectif, la série et le défi changent à minuit, heure de Paris. */
export function jourDeParis(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}
const veille = (jour: string) => jourDeParis(new Date(Date.parse(`${jour}T12:00:00Z`) - 86_400_000));

/* ---------- Lire ---------- */

const cleNiveau = (c: CategorieId, n: number) => `${c}:${n}`;
export const etoiles = (e: Etat, c: CategorieId, n: number): number => e.niveaux[cleNiveau(c, n)]?.e ?? 0;
export const niveauOuvert = (e: Etat, c: CategorieId, n: number): boolean => n === 1 || (e.niveaux[cleNiveau(c, n - 1)]?.f ?? 0) > 0 || (c === "corps" && n <= 4);
export function niveauCourant(e: Etat, c: CategorieId): number {
  const nb = nombreNiveaux(c);
  for (let n = 1; n <= nb; n++) if (!(e.niveaux[cleNiveau(c, n)]?.f ?? 0)) return n;
  return nb;
}
export function niveauxReussis(e: Etat, c: CategorieId): number {
  let k = 0;
  for (let n = 1; n <= nombreNiveaux(c); n++) if ((e.niveaux[cleNiveau(c, n)]?.f ?? 0) > 0) k++;
  return k;
}
export const etoilesTotales = (e: Etat, c: CategorieId): number => niveauxDe(c).reduce((s, x) => s + etoiles(e, c, x.n), 0);
export const boite = (e: Etat, id: string): number => e.elements[id]?.[2] ?? 0;
export const estSu = (e: Etat, id: string): boolean => boite(e, id) >= 3;

/** Le nombre de structures sues d'une catégorie, sur le total. */
export function maitrise(e: Etat, c: CategorieId): { sus: number; total: number } {
  const ids = c === "corps" ? ELEMENTS_APPRIS.map((x) => x.id) : niveauxDe(c).flatMap((x) => x.nouveaux);
  return { sus: ids.filter((id) => estSu(e, id)).length, total: ids.length };
}

const DELAIS = [0, 1, 2, 4, 8, 16];
export const aRevoir = (m: Maitrise | undefined, jour = aujourdhui()) => Boolean(m && m[2] < 5 && jour - m[3] >= DELAIS[m[2]]);

/** Les structures à revoir aujourd'hui (les plus fragiles d'abord). */
export function revisionsDues(e: Etat): string[] {
  const jour = aujourdhui();
  return Object.entries(e.elements)
    .filter(([id, m]) => PAR_ID.has(id) && aRevoir(m, jour))
    .sort((a, b) => a[1][2] - b[1][2] || a[1][3] - b[1][3])
    .map(([id]) => id);
}

/** Avant un niveau : les structures déjà vues de la catégorie qui flanchent. */
export function aReviserAvant(e: Etat, c: CategorieId, n: number): string[] {
  const avant = niveauxDe(c)
    .slice(0, n - 1)
    .flatMap((x) => x.nouveaux);
  return avant.filter((id) => (e.elements[id]?.[2] ?? 0) < 3);
}

/** Ce qui arrivera à réviser dans les jours qui viennent. */
export function prevision(e: Etat, jours = 7): number[] {
  const jour = aujourdhui();
  const sortie = Array.from({ length: jours }, () => 0);
  for (const m of Object.values(e.elements)) {
    if (m[2] >= 5) continue;
    const du = m[3] + DELAIS[m[2]] - jour;
    sortie[Math.max(0, Math.min(jours - 1, du))]++;
  }
  return sortie;
}

/* ---------- La mémoire par facette ---------- */

export const cleFacette = (id: string, f: Facette) => `${id}|${f}`;

/** La carte d'une facette ; pour le nom, celle que donne l'ancienne boîte de Leitner tant qu'il n'y en a pas d'autre. */
export function carte(e: Etat, id: string, f: Facette): Carte | undefined {
  const c = e.facettes[cleFacette(id, f)];
  if (c) return c;
  const m = e.elements[id];
  return f === "nom" && m && m[0] + m[1] > 0 ? carteDeBoite(m) : undefined;
}

export const degreFacette = (e: Etat, id: string, f: Facette, jour = aujourdhui()) => degre(carte(e, id, f), jour);

/** Les facettes à revoir aujourd'hui, les plus près d'être oubliées d'abord. */
export function facettesDues(e: Etat, jour = aujourdhui()): { id: string; facette: Facette; retenue: number }[] {
  const sortie: { id: string; facette: Facette; retenue: number }[] = [];
  const vues = new Set<string>();
  for (const [k, c] of Object.entries(e.facettes)) {
    const [id, f] = k.split("|") as [string, Facette];
    vues.add(k);
    if (PAR_ID.has(id) && due(c, jour)) sortie.push({ id, facette: f, retenue: retenue(jour - c[2], c[0]) });
  }
  // Les noms appris avant les facettes : leur boîte dit s'ils sont dus.
  for (const [id, m] of Object.entries(e.elements)) {
    if (vues.has(cleFacette(id, "nom")) || !PAR_ID.has(id) || m[0] + m[1] === 0) continue;
    const c = carteDeBoite(m);
    if (due(c, jour)) sortie.push({ id, facette: "nom", retenue: retenue(jour - c[2], c[0]) });
  }
  return sortie.sort((a, b) => a.retenue - b.retenue);
}

/** Pour une liste de structures : combien sont sues (au moins une semaine de stabilité), facette par facette. */
export function maitriseParFacette(e: Etat, ids: string[], facettes: Facette[], jour = aujourdhui()): Record<Facette, { sues: number; vues: number; total: number }> {
  const sortie = {} as Record<Facette, { sues: number; vues: number; total: number }>;
  for (const f of facettes) {
    let sues = 0;
    let vues = 0;
    for (const id of ids) {
      const d = degre(carte(e, id, f), jour);
      if (d > 0) vues++;
      if (d >= 3) sues++;
    }
    sortie[f] = { sues, vues, total: ids.length };
  }
  return sortie;
}

function majFacette(id: string, f: Facette, juste: boolean, certitude?: Certitude, rapide?: boolean) {
  const e = lire();
  const k = cleFacette(id, f);
  const nouvelle = revoir(carte(e, id, f), noteDe(juste, certitude, rapide), aujourdhui());
  ecrire({ ...e, facettes: { ...e.facettes, [k]: nouvelle } });
  void noter("corps", `facette:${k}`);
}

/* ---------- Écrire ---------- */

function majElement(id: string, juste: boolean) {
  const e = lire();
  const avant = e.elements[id] ?? ([0, 0, 0, 0] as Maitrise);
  const jour = aujourdhui();
  const nouvelle: Maitrise = juste ? [avant[0] + 1, avant[1], Math.min(5, avant[2] + 1), jour] : [avant[0], avant[1] + 1, Math.max(0, avant[2] - 2), jour];
  ecrire({ ...e, elements: { ...e.elements, [id]: nouvelle } });
  void noter("corps", `element:${id}`);
}

/** La série de jours : elle avance quand l'objectif du jour est atteint ; un gel sauve un jour manqué. */
function avancerObjectif(p: Profil): Profil {
  const jour = jourDeParis();
  const faites = p.jourObjectif === jour ? p.faites + 1 : 1;
  let suite: Profil = { ...p, jourObjectif: jour, faites };
  if (faites === p.objectif && suite.dernierJour !== jour) {
    const hier = veille(jour);
    const avantHier = veille(hier);
    let jours = suite.dernierJour === hier ? suite.jours + 1 : 1;
    let gels = suite.gels;
    if (suite.dernierJour === avantHier && gels > 0) {
      jours = suite.jours + 1;
      gels -= 1;
    }
    // Un gel de série gagné tous les sept jours (deux au plus en réserve).
    if (jours % 7 === 0) gels = Math.min(2, gels + 1);
    suite = { ...suite, jours, gels, dernierJour: jour };
  }
  return suite;
}

/**
 * Une réponse donnée (dans une partie, une fiche retournée, un jeu). `facette` : ce que la question interrogeait
 * (le nom par défaut) ; `certitude` : ce que la personne en dit ; `rapide` : répondu sans hésiter.
 */
export function noterReponse(id: string, juste: boolean, xp = 0, o: { facette?: Facette; certitude?: Certitude; rapide?: boolean } = {}) {
  if (PAR_ID.has(id)) {
    majElement(id, juste);
    majFacette(id, o.facette ?? "nom", juste, o.certitude, o.rapide);
  }
  const e = lire();
  const profil = avancerObjectif({ ...e.profil, xp: e.profil.xp + Math.max(0, xp) });
  ecrire({ ...e, profil: { ...profil, q: Date.now() } });
  void noter("corps", "profil");
}

/** Une erreur : gardée sept jours ; si l'on a pris une structure pour une autre, la confusion est comptée. */
export function noterErreur(t: string, c: string, r: string, confondu?: string) {
  const e = lire();
  const jour = aujourdhui();
  const erreurs = [...e.erreurs.filter((x) => jour - x.j < 7), { t, c, r: r.slice(0, 60), j: jour }].slice(-300);
  const k = confondu && confondu !== c ? `${c}>${confondu}` : null;
  const confusions = k ? { ...e.confusions, [k]: (e.confusions[k] ?? 0) + 1 } : e.confusions;
  ecrire({ ...e, erreurs, confusions });
  void noter("corps", "erreurs");
  if (k) void noter("corps", "confusions");
}

export function confusionsFrequentes(e: Etat, n = 10): [string, string, number][] {
  return Object.entries(e.confusions)
    .map(([k, v]) => {
      const [a, b] = k.split(">");
      return [a, b, v] as [string, string, number];
    })
    .filter(([a, b]) => PAR_ID.has(a) && PAR_ID.has(b))
    .sort((x, y) => y[2] - x[2])
    .slice(0, n);
}

export type Bilan = { etoiles: number; premiereFois: boolean; record: boolean; xp: number };

export function finirNiveau(c: CategorieId, n: number, r: { bonnes: number; fautes: number; reussi: boolean; etoiles: number }): Bilan {
  const e = lire();
  const k = cleNiveau(c, n);
  const avant = e.niveaux[k] ?? { e: 0, m: 0, f: 0 };
  const premiereFois = r.reussi && !avant.f;
  const apres: ResultatNiveau = r.reussi ? { e: Math.max(avant.e, r.etoiles), m: Math.max(avant.m, r.bonnes), f: avant.f + 1 } : { ...avant, m: Math.max(avant.m, r.bonnes) };
  const xp = r.reussi ? 20 + r.etoiles * 15 + (premiereFois ? 40 : 0) : 0;
  ecrire({ ...e, niveaux: { ...e.niveaux, [k]: apres }, profil: { ...e.profil, xp: e.profil.xp + xp, q: Date.now() } });
  void noter("corps", `niveau:${k}`);
  void noter("corps", "profil");
  return { etoiles: r.etoiles, premiereFois, record: r.reussi && r.etoiles > avant.e, xp };
}

export function battreRecord(cle: string, score: number): boolean {
  const e = lire();
  if (score <= (e.records[cle] ?? 0)) return false;
  ecrire({ ...e, records: { ...e.records, [cle]: score } });
  void noter("corps", "records");
  return true;
}

export function noterJournal(x: Omit<EntreeJournal, "t">) {
  const e = lire();
  ecrire({ ...e, journal: [...e.journal, { ...x, t: Date.now() }].slice(-120) });
  void noter("corps", "journal");
}

export const estFavori = (e: Etat, id: string) => (e.favoris[id] ?? 0) > 0;
export const mesFavoris = (e: Etat): string[] => Object.keys(e.favoris).filter((id) => e.favoris[id] > 0 && PAR_ID.has(id));
export function basculerFavori(id: string) {
  const e = lire();
  const ajoute = !estFavori(e, id);
  ecrire({ ...e, favoris: { ...e.favoris, [id]: ajoute ? Date.now() : -Date.now() } });
  void noter("corps", "favoris");
}

export type Reglable = "son" | "vibrations" | "voix" | "chrono" | "questions" | "difficulte" | "latin" | "rotation" | "contraste" | "taille" | "plusDeTemps" | "objectif";
export function regler(r: Partial<Pick<Profil, Reglable>>) {
  const e = lire();
  ecrire({ ...e, profil: { ...e.profil, ...r, q: Date.now() } });
  void noter("corps", "profil");
}

/** Remettre une catégorie à zéro (ses niveaux et la mémoire de ses structures). */
export function remettreAZero(c: CategorieId) {
  const e = lire();
  const niveaux = Object.fromEntries(Object.entries(e.niveaux).filter(([k]) => !k.startsWith(`${c}:`)));
  const ids = new Set(c === "corps" ? [] : niveauxDe(c).flatMap((x) => x.nouveaux));
  const elements = Object.fromEntries(Object.entries(e.elements).filter(([id]) => !ids.has(id)));
  const facettes = Object.fromEntries(Object.entries(e.facettes).filter(([k]) => !ids.has(k.split("|")[0])));
  for (const k of Object.keys(e.facettes)) if (!(k in facettes)) void noter("corps", `facette:${k}`);
  ecrire({ ...e, niveaux, elements, facettes });
  for (let n = 1; n <= nombreNiveaux(c); n++) void noter("corps", `niveau:${c}:${n}`);
  for (const id of ids) void noter("corps", `element:${id}`);
}

/* ---------- Exporter, importer ---------- */

export function exporterProgression(): string {
  return JSON.stringify({ format: "ecorche", version: 1, exporte: new Date().toISOString(), progression: lire() }, null, 1);
}

export function importerProgression(texte: string): boolean {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return false;
  }
  const x = (brut && typeof brut === "object" && "progression" in brut ? (brut as { progression: unknown }).progression : brut) as Partial<Etat> | null;
  if (!x || typeof x !== "object" || (!x.profil && !x.niveaux && !x.elements)) return false;
  if (x.profil) rangerValeur("profil", x.profil);
  for (const [k, v] of Object.entries(x.niveaux ?? {})) rangerValeur(`niveau:${k}`, v);
  for (const [k, v] of Object.entries(x.elements ?? {})) rangerValeur(`element:${k}`, v);
  for (const [k, v] of Object.entries(x.facettes ?? {})) rangerValeur(`facette:${k}`, v);
  for (const c of ["records", "erreurs", "confusions", "favoris", "journal"] as const) if (x[c]) rangerValeur(c, x[c]);
  for (const { c } of clesLocales()) void noter("corps", c);
  return true;
}

/* ---------- La synchronisation (adaptateur du magasin « corps ») ---------- */

export function clesLocales(): { c: string; q?: number }[] {
  const e = lire();
  return [
    { c: "profil", q: e.profil.q || undefined },
    ...Object.keys(e.niveaux).map((k) => ({ c: `niveau:${k}` })),
    ...Object.keys(e.elements).map((id) => ({ c: `element:${id}` })),
    ...Object.keys(e.facettes).map((k) => ({ c: `facette:${k}` })),
    ...(Object.keys(e.records).length ? [{ c: "records" }] : []),
    ...(e.erreurs.length ? [{ c: "erreurs" }] : []),
    ...(Object.keys(e.confusions).length ? [{ c: "confusions" }] : []),
    ...(Object.keys(e.favoris).length ? [{ c: "favoris" }] : []),
    ...(e.journal.length ? [{ c: "journal" }] : []),
  ];
}

export function valeurLocale(c: string): unknown {
  const e = lire();
  if (c === "profil") return e.profil;
  if (c.startsWith("niveau:")) return e.niveaux[c.slice(7)];
  if (c.startsWith("element:")) return e.elements[c.slice(8)];
  if (c.startsWith("facette:")) return e.facettes[c.slice(8)];
  if (c === "records") return e.records;
  if (c === "erreurs") return e.erreurs;
  if (c === "confusions") return e.confusions;
  if (c === "favoris") return e.favoris;
  if (c === "journal") return e.journal;
  return undefined;
}

const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const booleen = (v: unknown, defaut: boolean) => (typeof v === "boolean" ? v : defaut);

/** Range ce qui vient d'un autre appareil en gardant le meilleur des deux. Renvoie true si l'appareil a mieux. */
export function rangerValeur(c: string, v: unknown): boolean {
  const e = lire();
  if (c === "profil") {
    const p = (v ?? {}) as Partial<Profil>;
    const a = e.profil;
    const recent = nombre(p.q) > a.q;
    const profil: Profil = {
      xp: Math.max(a.xp, nombre(p.xp)),
      jours: (p.dernierJour ?? "") > a.dernierJour ? nombre(p.jours) : a.jours,
      dernierJour: (p.dernierJour ?? "") > a.dernierJour ? String(p.dernierJour) : a.dernierJour,
      gels: recent ? Math.min(2, Math.max(0, nombre(p.gels))) : a.gels,
      objectif: recent && [10, 20, 40].includes(nombre(p.objectif)) ? nombre(p.objectif) : a.objectif,
      jourObjectif: (p.jourObjectif ?? "") > a.jourObjectif ? String(p.jourObjectif) : a.jourObjectif,
      faites: (p.jourObjectif ?? "") > a.jourObjectif ? nombre(p.faites) : (p.jourObjectif ?? "") === a.jourObjectif ? Math.max(a.faites, nombre(p.faites)) : a.faites,
      son: recent ? booleen(p.son, a.son) : a.son,
      vibrations: recent ? booleen(p.vibrations, a.vibrations) : a.vibrations,
      voix: recent ? booleen(p.voix, a.voix) : a.voix,
      chrono: recent ? booleen(p.chrono, a.chrono) : a.chrono,
      questions: recent && (p.questions === 8 || p.questions === 12 || p.questions === 16) ? p.questions : a.questions,
      difficulte: recent && (p.difficulte === "facile" || p.difficulte === "normal" || p.difficulte === "difficile") ? p.difficulte : a.difficulte,
      latin: recent ? booleen(p.latin, a.latin) : a.latin,
      rotation: recent ? booleen(p.rotation, a.rotation) : a.rotation,
      contraste: recent ? booleen(p.contraste, a.contraste) : a.contraste,
      taille: recent && (p.taille === 100 || p.taille === 115 || p.taille === 130) ? p.taille : a.taille,
      plusDeTemps: recent ? booleen(p.plusDeTemps, a.plusDeTemps) : a.plusDeTemps,
      q: Math.max(a.q, nombre(p.q)),
    };
    ecrire({ ...e, profil });
    return JSON.stringify(profil) !== JSON.stringify({ ...profilVide(), ...p });
  }
  if (c.startsWith("niveau:")) {
    const k = c.slice(7);
    const r = (v ?? {}) as Partial<ResultatNiveau>;
    const a = e.niveaux[k];
    const fusion = { e: Math.max(a?.e ?? 0, nombre(r.e)), m: Math.max(a?.m ?? 0, nombre(r.m)), f: Math.max(a?.f ?? 0, nombre(r.f)) };
    ecrire({ ...e, niveaux: { ...e.niveaux, [k]: fusion } });
    return fusion.e !== nombre(r.e) || fusion.m !== nombre(r.m) || fusion.f !== nombre(r.f);
  }
  if (c.startsWith("element:")) {
    const id = c.slice(8);
    const a = e.elements[id];
    const b = Array.isArray(v) && v.length === 4 ? (v.map(nombre) as Maitrise) : undefined;
    if (!b) return Boolean(a);
    // Le passage le plus récent l'emporte (à égalité, la boîte la plus haute).
    const garde = !a || b[3] > a[3] || (b[3] === a[3] && b[2] >= a[2]) ? b : a;
    ecrire({ ...e, elements: { ...e.elements, [id]: garde } });
    return garde !== b;
  }
  if (c.startsWith("facette:")) {
    const k = c.slice(8);
    const a = e.facettes[k];
    const b = Array.isArray(v) && v.length === 5 ? (v.map(nombre) as Carte) : undefined;
    if (!b) return Boolean(a);
    // Le passage le plus récent l'emporte (à égalité, la mémoire la plus stable).
    const garde = !a || b[2] > a[2] || (b[2] === a[2] && b[0] >= a[0]) ? b : a;
    ecrire({ ...e, facettes: { ...e.facettes, [k]: garde } });
    return garde !== b;
  }
  if (c === "records") {
    const r = (v ?? {}) as Record<string, unknown>;
    const records = { ...e.records };
    let mieux = false;
    for (const [k, x] of Object.entries(r)) records[k] = Math.max(records[k] ?? 0, nombre(x));
    for (const [k, x] of Object.entries(e.records)) if (x > nombre(r[k])) mieux = true;
    ecrire({ ...e, records });
    return mieux;
  }
  if (c === "confusions") {
    const r = (v ?? {}) as Record<string, unknown>;
    const confusions = { ...e.confusions };
    for (const [k, x] of Object.entries(r)) confusions[k] = Math.max(confusions[k] ?? 0, nombre(x));
    ecrire({ ...e, confusions });
    return Object.entries(confusions).some(([k, x]) => x > nombre(r[k]));
  }
  if (c === "favoris") {
    const r = (v ?? {}) as Record<string, unknown>;
    const favoris = { ...e.favoris };
    // Le geste le plus récent (ajout ou retrait) l'emporte.
    for (const [k, x] of Object.entries(r)) if (Math.abs(nombre(x)) > Math.abs(favoris[k] ?? 0)) favoris[k] = nombre(x);
    ecrire({ ...e, favoris });
    return Object.entries(favoris).some(([k, x]) => x !== nombre(r[k]));
  }
  if (c === "erreurs" || c === "journal") {
    const liste = Array.isArray(v) ? v : [];
    const ici = (c === "erreurs" ? e.erreurs : e.journal) as { t: unknown; j?: number; c?: string }[];
    const vus = new Set(ici.map((x) => JSON.stringify(x)));
    const fusion = [...ici, ...liste.filter((x) => x && typeof x === "object" && !vus.has(JSON.stringify(x)))];
    if (c === "journal") {
      const j = (fusion as EntreeJournal[]).filter((x) => typeof x.t === "number").sort((a, b) => a.t - b.t).slice(-120);
      ecrire({ ...e, journal: j });
      return j.length !== liste.length;
    }
    const jour = aujourdhui();
    const err = (fusion as Erreur[]).filter((x) => typeof x.j === "number" && jour - x.j < 7).slice(-300);
    ecrire({ ...e, erreurs: err });
    return err.length !== liste.length;
  }
  return false;
}

export function effacerValeur(c: string) {
  const e = lire();
  if (c.startsWith("niveau:")) {
    const niveaux = { ...e.niveaux };
    delete niveaux[c.slice(7)];
    ecrire({ ...e, niveaux });
  } else if (c.startsWith("element:")) {
    const elements = { ...e.elements };
    delete elements[c.slice(8)];
    ecrire({ ...e, elements });
  } else if (c.startsWith("facette:")) {
    const facettes = { ...e.facettes };
    delete facettes[c.slice(8)];
    ecrire({ ...e, facettes });
  }
}

/** Pour l'écran de progression : les catégories et ce qui en est su. */
export const resume = (e: Etat) =>
  IDS_CATEGORIES.map((c) => {
    const m = maitrise(e, c);
    return { c, sues: m.sus, structures: m.total, reussis: niveauxReussis(e, c), planches: nombreNiveaux(c), etoiles: etoilesTotales(e, c) };
  });
