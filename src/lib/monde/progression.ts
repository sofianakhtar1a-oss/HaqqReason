"use client";

import { useSyncExternalStore } from "react";
import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";
import { CATEGORIES, type CategorieId } from "./categories";
import { PAYS } from "./donnees";
import { NB_NIVEAUX, niveauxDe } from "./niveaux";
import { DUCATS, DUCATS_DE_DEPART } from "./points";
import { jourDeParis } from "./atlas";

/*
 * La progression du Portulan : écrite sur l'appareil, et recopiée sur le compte quand on est
 * connecté (magasin « monde », clé par clé : un niveau, un pays, le profil).
 *
 *   • Les niveaux : la meilleure note (étoiles) de chaque niveau de chaque catégorie.
 *   • La mémoire de chaque pays, catégorie par catégorie : une boîte de Leitner (0 à 5).
 *     Une bonne réponse fait monter d'une boîte ; une erreur fait redescendre de deux.
 *     À partir de la boîte 3, le pays est « maîtrisé » ; il revient au bon moment pour le rester.
 *   • Le profil : les ducats, la série de jours, les records, les réglages.
 */

export type Famille = CategorieId | "fiches";
/** [bonnes, fautes, boîte 0-5, jour du dernier passage (jours depuis 1970)] */
export type Maitrise = [number, number, number, number];
export type ResultatNiveau = { e: number; m: number; f: number };
export type Profil = {
  gagnes: number;
  depenses: number;
  /** XP comptée sur l'appareil (le compte a la sienne, qui fait foi au classement). */
  xp: number;
  jours: number;
  dernierJour: string;
  eclair: number;
  survie: number;
  chrono: boolean;
  q: number;
};
export type Etat = {
  niveaux: Record<string, ResultatNiveau>;
  pays: Record<string, Partial<Record<Famille, Maitrise>>>;
  profil: Profil;
};

const NOM = "haqqreason-portulan";
const cle = () => tiroir(NOM);
const profilVide = (): Profil => ({ gagnes: 0, depenses: 0, xp: 0, jours: 0, dernierJour: "", eclair: 0, survie: 0, chrono: true, q: 0 });
const vide: Etat = { niveaux: {}, pays: {}, profil: profilVide() };
let etat: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (etat) return etat;
  try {
    const brut = JSON.parse(localStorage.getItem(cle()) ?? "null") as Partial<Etat> | null;
    etat = brut && typeof brut === "object" ? { niveaux: brut.niveaux ?? {}, pays: brut.pays ?? {}, profil: { ...profilVide(), ...(brut.profil ?? {}) } } : vide;
  } catch {
    etat = vide;
  }
  return etat;
}

let tempo: ReturnType<typeof setTimeout> | null = null;
function ecrire(e: Etat) {
  etat = e;
  // L'écriture sur le disque attend la fin d'une rafale de réponses.
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

export const aujourdhui = () => Math.floor(Date.now() / 86_400_000);
const cleNiveau = (c: CategorieId, n: number) => `${c}:${n}`;

/* ---------- Lire ---------- */

export function etoiles(e: Etat, c: CategorieId, n: number): number {
  return e.niveaux[cleNiveau(c, n)]?.e ?? 0;
}
export function niveauOuvert(e: Etat, c: CategorieId, n: number): boolean {
  return n === 1 || (e.niveaux[cleNiveau(c, n - 1)]?.f ?? 0) > 0;
}
/** Le prochain niveau à jouer (le premier non réussi, ou le dernier). */
export function niveauCourant(e: Etat, c: CategorieId): number {
  for (let n = 1; n <= NB_NIVEAUX; n++) if (!(e.niveaux[cleNiveau(c, n)]?.f ?? 0)) return n;
  return NB_NIVEAUX;
}
export function niveauxReussis(e: Etat, c: CategorieId): number {
  let n = 0;
  for (let i = 1; i <= NB_NIVEAUX; i++) if ((e.niveaux[cleNiveau(c, i)]?.f ?? 0) > 0) n++;
  return n;
}
export const ducats = (e: Etat) => Math.max(0, DUCATS_DE_DEPART + e.profil.gagnes - e.profil.depenses);
export const boite = (e: Etat, code: string, f: Famille) => e.pays[code]?.[f]?.[2] ?? 0;

/** La part des pays maîtrisés (boîte 3 ou plus) dans une catégorie. */
export function maitrise(e: Etat, c: CategorieId): { sus: number; total: number } {
  const def = CATEGORIES[c];
  let sus = 0;
  let total = 0;
  for (const p of PAYS) {
    if (!def.eligible(p)) continue;
    total++;
    if (boite(e, p.code, c) >= 3) sus++;
  }
  return { sus, total };
}

/** Les pays connus : maîtrisés dans au moins deux catégories. */
export function paysConnus(e: Etat): number {
  let n = 0;
  for (const p of PAYS) {
    if (!p.quiz) continue;
    const m = e.pays[p.code];
    if (!m) continue;
    let k = 0;
    for (const f of Object.keys(m) as Famille[]) if (f !== "fiches" && (m[f]?.[2] ?? 0) >= 3) k++;
    if (k >= 2) n++;
  }
  return n;
}

/** Délai avant de revoir un pays, selon sa boîte (en jours). */
const DELAIS = [0, 1, 3, 7, 16, 35];
export const aRevoir = (m: Maitrise | undefined, jour = aujourdhui()) => Boolean(m && m[2] < 5 && jour - m[3] >= DELAIS[m[2]]);

/** Les pays des niveaux précédents à revoir d'abord (les plus fragiles, les plus anciens). */
export function aReviserAvant(e: Etat, c: CategorieId, niveau: number, n: number): string[] {
  const avant = niveauxDe(c).slice(0, niveau - 1).flat();
  const jour = aujourdhui();
  return avant
    .map((code) => ({ code, m: e.pays[code]?.[c] }))
    .sort((a, b) => Number(aRevoir(b.m, jour)) - Number(aRevoir(a.m, jour)) || (a.m?.[2] ?? -1) - (b.m?.[2] ?? -1) || (a.m?.[3] ?? 0) - (b.m?.[3] ?? 0))
    .slice(0, n)
    .map((x) => x.code);
}

/** Tous les pays déjà vus et à revoir aujourd'hui, toutes catégories (pour la séance de révision). */
export function revisionsDues(e: Etat): { code: string; famille: CategorieId }[] {
  const jour = aujourdhui();
  const sortie: { code: string; famille: CategorieId; b: number }[] = [];
  for (const [code, m] of Object.entries(e.pays)) {
    for (const f of Object.keys(m) as Famille[]) {
      if (f === "fiches") continue;
      const x = m[f];
      if (x && aRevoir(x, jour) && x[0] + x[1] > 0) sortie.push({ code, famille: f, b: x[2] });
    }
  }
  return sortie.sort((a, b) => a.b - b.b);
}

/* ---------- Écrire ---------- */

function majPays(code: string, f: Famille, juste: boolean) {
  const e = lire();
  const avant = e.pays[code]?.[f] ?? ([0, 0, 0, 0] as Maitrise);
  const jour = aujourdhui();
  const nouvelle: Maitrise = juste ? [avant[0] + 1, avant[1], Math.min(5, avant[2] + 1), jour] : [avant[0], avant[1] + 1, Math.max(0, avant[2] - 2), jour];
  ecrire({ ...e, pays: { ...e.pays, [code]: { ...e.pays[code], [f]: nouvelle } } });
  void noter("monde", `pays:${code}`);
}

/** Une réponse donnée dans une partie (ou une fiche retournée). */
export function noterReponse(code: string, f: Famille, juste: boolean, xp = 0) {
  majPays(code, f, juste);
  if (xp > 0 || juste) {
    const e = lire();
    ecrire({ ...e, profil: { ...e.profil, xp: e.profil.xp + xp, gagnes: e.profil.gagnes + (juste && f !== "fiches" ? DUCATS.bonne : 0), q: Date.now() } });
    void noter("monde", "profil");
  }
}

export type Bilan = { etoiles: number; ducats: number; premiereFois: boolean; record: boolean; jours: number };

/** Une partie de niveau terminée (réussie si des cœurs restent). */
export function finirNiveau(c: CategorieId, n: number, r: { bonnes: number; fautes: number; reussi: boolean }): Bilan {
  const e = lire();
  const k = cleNiveau(c, n);
  const avant = e.niveaux[k];
  const note = r.reussi ? (r.fautes <= 0 ? 3 : r.fautes === 1 ? 2 : 1) : 0;
  const premiereFois = r.reussi && !(avant?.f ?? 0);
  const record = r.reussi && note > (avant?.e ?? 0);
  let gain = 0;
  let jours = e.profil.jours;
  let dernierJour = e.profil.dernierJour;
  if (r.reussi) {
    gain += premiereFois ? DUCATS.niveau + note * DUCATS.parEtoile : record ? (note - (avant?.e ?? 0)) * DUCATS.parEtoile : 0;
    const jour = jourDeParis();
    if (dernierJour !== jour) {
      const hier = jourDeParis(new Date(Date.now() - 86_400_000));
      jours = dernierJour === hier ? jours + 1 : 1;
      dernierJour = jour;
      gain += DUCATS.jour;
    }
  }
  const niveaux = r.reussi ? { ...e.niveaux, [k]: { e: Math.max(avant?.e ?? 0, note), m: Math.max(avant?.m ?? 0, r.bonnes), f: Date.now() } } : e.niveaux;
  ecrire({ ...e, niveaux, profil: { ...e.profil, gagnes: e.profil.gagnes + gain, jours, dernierJour, q: Date.now() } });
  if (r.reussi) void noter("monde", `niveau:${k}`);
  void noter("monde", "profil");
  return { etoiles: note, ducats: gain, premiereFois, record, jours };
}

/** Acheter un joker : false s'il manque des ducats. */
export function depenser(n: number): boolean {
  const e = lire();
  if (ducats(e) < n) return false;
  ecrire({ ...e, profil: { ...e.profil, depenses: e.profil.depenses + n, q: Date.now() } });
  void noter("monde", "profil");
  return true;
}

export function gagnerDucats(n: number) {
  const e = lire();
  ecrire({ ...e, profil: { ...e.profil, gagnes: e.profil.gagnes + Math.max(0, n), q: Date.now() } });
  void noter("monde", "profil");
}

/** Un record de mode rapide (renvoie true s'il est battu). */
export function battreRecord(mode: "eclair" | "survie", score: number): boolean {
  const e = lire();
  if (score <= e.profil[mode]) return false;
  ecrire({ ...e, profil: { ...e.profil, [mode]: score, q: Date.now() } });
  void noter("monde", "profil");
  return true;
}

export function regler(r: Partial<Pick<Profil, "chrono">>) {
  const e = lire();
  ecrire({ ...e, profil: { ...e.profil, ...r, q: Date.now() } });
  void noter("monde", "profil");
}

/* ---------- La synchronisation (adaptateur du magasin « monde ») ---------- */

export function clesLocales(): { c: string; q?: number }[] {
  const e = lire();
  return [
    { c: "profil", q: e.profil.q || undefined },
    ...Object.entries(e.niveaux).map(([k, r]) => ({ c: `niveau:${k}`, q: r.f || undefined })),
    ...Object.keys(e.pays).map((code) => ({ c: `pays:${code}` })),
  ];
}

export function valeurLocale(c: string): unknown {
  const e = lire();
  if (c === "profil") return e.profil;
  if (c.startsWith("niveau:")) return e.niveaux[c.slice(7)];
  if (c.startsWith("pays:")) return e.pays[c.slice(5)];
  return undefined;
}

const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Range ce qui vient d'un autre appareil en gardant le meilleur des deux. Renvoie true si l'appareil a mieux. */
export function rangerValeur(c: string, v: unknown): boolean {
  const e = lire();
  if (c === "profil") {
    const p = (v ?? {}) as Partial<Profil>;
    const a = e.profil;
    const recent = nombre(p.q) > a.q;
    const profil: Profil = {
      gagnes: Math.max(a.gagnes, nombre(p.gagnes)),
      depenses: Math.max(a.depenses, nombre(p.depenses)),
      xp: Math.max(a.xp, nombre(p.xp)),
      jours: (p.dernierJour ?? "") > a.dernierJour ? nombre(p.jours) : a.jours,
      dernierJour: (p.dernierJour ?? "") > a.dernierJour ? String(p.dernierJour) : a.dernierJour,
      eclair: Math.max(a.eclair, nombre(p.eclair)),
      survie: Math.max(a.survie, nombre(p.survie)),
      chrono: recent && typeof p.chrono === "boolean" ? p.chrono : a.chrono,
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
  if (c.startsWith("pays:")) {
    const code = c.slice(5);
    const venu = (v ?? {}) as Partial<Record<Famille, Maitrise>>;
    const ici = e.pays[code] ?? {};
    const fusion: Partial<Record<Famille, Maitrise>> = { ...ici };
    let mieux = false;
    for (const f of new Set([...Object.keys(ici), ...Object.keys(venu)]) as Set<Famille>) {
      const a = ici[f];
      const b = Array.isArray(venu[f]) && venu[f]!.length === 4 ? (venu[f]!.map(nombre) as Maitrise) : undefined;
      if (!b) {
        if (a) mieux = true;
        continue;
      }
      // Le passage le plus récent l'emporte (à égalité, la boîte la plus haute).
      const garde = !a || b[3] > a[3] || (b[3] === a[3] && b[2] >= a[2]) ? b : a;
      if (garde !== b) mieux = true;
      fusion[f] = garde;
    }
    ecrire({ ...e, pays: { ...e.pays, [code]: fusion } });
    return mieux;
  }
  return false;
}

export function effacerValeur(c: string) {
  const e = lire();
  if (c.startsWith("niveau:")) {
    const niveaux = { ...e.niveaux };
    delete niveaux[c.slice(7)];
    ecrire({ ...e, niveaux });
  } else if (c.startsWith("pays:")) {
    const pays = { ...e.pays };
    delete pays[c.slice(5)];
    ecrire({ ...e, pays });
  }
}

/* ---------- React ---------- */

const abonner = (f: () => void) => {
  abonnes.add(f);
  const ailleurs = (ev: StorageEvent) => {
    if (ev.key === cle()) {
      etat = null;
      f();
    }
  };
  window.addEventListener("storage", ailleurs);
  return () => {
    abonnes.delete(f);
    window.removeEventListener("storage", ailleurs);
  };
};

export function useMonde(): Etat {
  return useSyncExternalStore(abonner, lire, () => vide);
}
