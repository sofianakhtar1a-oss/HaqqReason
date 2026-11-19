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
  /** Lire les questions à voix haute. */
  voix: boolean;
  /** L'objectif du jour (nombre de questions) et ce qui est déjà fait aujourd'hui. */
  objectif: number;
  jourObjectif: string;
  faites: number;
  /** Des faux choix plus ou moins ressemblants. */
  difficulte: Difficulte;
  /** Les gels de série en réserve (deux au plus). */
  gels: number;
  /** Le nombre de questions d'un niveau et le rythme du chrono. */
  questions: 10 | 20 | 30;
  rythme: "lent" | "normal" | "rapide";
  /** Ce qui a été acheté à la boutique, et ce qu'on a choisi. */
  achats: string[];
  globe: string;
  cadre: string;
  bateau: string;
  /** Le pays de chez soi (son code), choisi sur la carte : les distances et les heures partent de lui. */
  monPays: string;
  q: number;
};
export type Difficulte = "facile" | "normal" | "difficile";
/** Une erreur récente : la méthode (ou « cabinet/méthode »), la cible, la réponse donnée, le jour. */
export type Erreur = { t: string; c: string; r: string; j: number };
/** Un cabinet (départements, États, wilayas…) : ses niveaux et la mémoire de chaque élément. */
export type EtatCabinet = { n: Record<string, ResultatNiveau>; m: Record<string, Maitrise> };
export type Etat = {
  niveaux: Record<string, ResultatNiveau>;
  pays: Record<string, Partial<Record<Famille, Maitrise>>>;
  profil: Profil;
  cabinets: Record<string, EtatCabinet>;
  /** Les meilleurs scores des jeux sans niveau (« Nomme-les tous », contre-la-montre…). */
  records: Record<string, number>;
  /** Les erreurs des sept derniers jours (les plus récentes à la fin). */
  erreurs: Erreur[];
  /** Les confusions : « fr>it » = la France prise pour l'Italie, et combien de fois. */
  confusions: Record<string, number>;
  /** « Mes pays » : l'heure de l'ajout (positive) ou du retrait (négative). */
  favoris: Record<string, number>;
};

const NOM = "haqqreason-portulan";
const cle = () => tiroir(NOM);
const profilVide = (): Profil => ({
  gagnes: 0,
  depenses: 0,
  xp: 0,
  jours: 0,
  dernierJour: "",
  eclair: 0,
  survie: 0,
  chrono: true,
  voix: false,
  objectif: 20,
  jourObjectif: "",
  faites: 0,
  difficulte: "normal",
  gels: 0,
  questions: 20,
  rythme: "normal",
  achats: [],
  globe: "globe-classique",
  cadre: "cadre-aucun",
  bateau: "bateau-safran",
  monPays: "",
  q: 0,
});
const vide: Etat = { niveaux: {}, pays: {}, profil: profilVide(), cabinets: {}, records: {}, erreurs: [], confusions: {}, favoris: {} };
let etat: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (etat) return etat;
  try {
    const brut = JSON.parse(localStorage.getItem(cle()) ?? "null") as Partial<Etat> | null;
    etat = brut && typeof brut === "object" ? { niveaux: brut.niveaux ?? {}, pays: brut.pays ?? {}, profil: { ...profilVide(), ...(brut.profil ?? {}) }, cabinets: brut.cabinets ?? {}, records: brut.records ?? {}, erreurs: Array.isArray(brut.erreurs) ? brut.erreurs : [], confusions: brut.confusions ?? {}, favoris: brut.favoris ?? {} } : vide;
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

/** Une question de plus vers l'objectif du jour. */
function avancerObjectif(p: Profil): Profil {
  const jour = jourDeParis();
  return p.jourObjectif === jour ? { ...p, faites: p.faites + 1 } : { ...p, jourObjectif: jour, faites: 1 };
}

/** Une réponse donnée dans une partie (ou une fiche retournée). */
export function noterReponse(code: string, f: Famille, juste: boolean, xp = 0) {
  majPays(code, f, juste);
  const e = lire();
  const profil = avancerObjectif(xp > 0 || juste ? { ...e.profil, xp: e.profil.xp + xp, gagnes: e.profil.gagnes + (juste && f !== "fiches" ? DUCATS.bonne : 0) } : e.profil);
  ecrire({ ...e, profil: { ...profil, q: Date.now() } });
  void noter("monde", "profil");
}

/* ---------- Les erreurs, les confusions, « Mes pays » ---------- */

const SEPT_JOURS = 7;

/** Une erreur : gardée sept jours ; si l'on a pris un pays pour un autre, la confusion est comptée. */
export function noterErreur(t: string, c: string, r: string, confondu?: string) {
  const e = lire();
  const jour = aujourdhui();
  const erreurs = [...e.erreurs.filter((x) => jour - x.j < SEPT_JOURS), { t, c, r: r.slice(0, 60), j: jour }].slice(-300);
  const cle = confondu && confondu !== c ? `${c}>${confondu}` : null;
  const confusions = cle ? { ...e.confusions, [cle]: (e.confusions[cle] ?? 0) + 1 } : e.confusions;
  ecrire({ ...e, erreurs, confusions });
  void noter("monde", "erreurs");
  if (cle) void noter("monde", "confusions");
}

export const erreursRecentes = (e: Etat): Erreur[] => {
  const jour = aujourdhui();
  return e.erreurs.filter((x) => jour - x.j < SEPT_JOURS);
};

/** Les confusions les plus fréquentes : [cible, prise pour, nombre]. */
export function confusionsFrequentes(e: Etat, n = 12): [string, string, number][] {
  return Object.entries(e.confusions)
    .map(([k, v]) => {
      const [a, b] = k.split(">");
      return [a, b, v] as [string, string, number];
    })
    .filter(([a, b]) => a && b)
    .sort((x, y) => y[2] - x[2])
    .slice(0, n);
}

export const estFavori = (e: Etat, code: string) => (e.favoris[code] ?? 0) > 0;
export const mesPays = (e: Etat): string[] => Object.keys(e.favoris).filter((c) => e.favoris[c] > 0);

export function basculerFavori(code: string) {
  const e = lire();
  const maintenant = Date.now();
  ecrire({ ...e, favoris: { ...e.favoris, [code]: estFavori(e, code) ? -maintenant : maintenant } });
  void noter("monde", "favoris");
}

/** Les révisions des sept prochains jours (aujourd'hui compte aussi ce qui est en retard). */
export function prevision(e: Etat, jours = 7): number[] {
  const sortie = Array.from({ length: jours }, () => 0);
  const jour = aujourdhui();
  const compter = (m: Maitrise | undefined) => {
    if (!m || m[0] + m[1] === 0 || m[2] >= 5) return;
    const k = Math.max(0, m[3] + DELAIS[m[2]] - jour);
    if (k < jours) sortie[k]++;
  };
  for (const m of Object.values(e.pays)) for (const [f, x] of Object.entries(m)) if (f !== "fiches") compter(x);
  for (const c of Object.values(e.cabinets)) for (const x of Object.values(c.m)) compter(x);
  return sortie;
}

export type Bilan = { etoiles: number; ducats: number; premiereFois: boolean; record: boolean; jours: number };

/** Une partie de niveau terminée (réussie si des cœurs restent). */
export function finirNiveau(c: CategorieId, n: number, r: { bonnes: number; fautes: number; reussi: boolean; rapide?: boolean }): Bilan {
  const e = lire();
  const k = cleNiveau(c, n);
  const avant = e.niveaux[k];
  // Trois étoiles : sans faute et vite ; sans faute mais lentement, ou une faute : deux.
  const note = r.reussi ? (r.fautes <= 0 ? (r.rapide === false ? 2 : 3) : r.fautes === 1 ? 2 : 1) : 0;
  const x = recompenser(e, avant, note, r.reussi);
  const niveaux = r.reussi ? { ...e.niveaux, [k]: { e: Math.max(avant?.e ?? 0, note), m: Math.max(avant?.m ?? 0, r.bonnes), f: Date.now() } } : e.niveaux;
  ecrire({ ...e, niveaux, profil: { ...e.profil, gagnes: e.profil.gagnes + x.gain, jours: x.jours, dernierJour: x.dernierJour, gels: x.gels, q: Date.now() } });
  if (r.reussi) void noter("monde", `niveau:${k}`);
  void noter("monde", "profil");
  return { etoiles: note, ducats: x.gain, premiereFois: x.premiereFois, record: x.record, jours: x.jours };
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

/** Un article de la boutique : acheté une fois (le gel de série se rachète, deux au plus en réserve). */
export function acheter(id: string, prix: number, sorte: "globe" | "cadre" | "bateau" | "gel"): boolean {
  const e = lire();
  if (sorte === "gel" ? e.profil.gels >= 2 : e.profil.achats.includes(id)) return false;
  if (ducats(e) < prix) return false;
  const profil: Profil =
    sorte === "gel"
      ? { ...e.profil, depenses: e.profil.depenses + prix, gels: e.profil.gels + 1, q: Date.now() }
      : { ...e.profil, depenses: e.profil.depenses + prix, achats: [...e.profil.achats, id], [sorte]: id, q: Date.now() };
  ecrire({ ...e, profil });
  void noter("monde", "profil");
  return true;
}

/* ---------- La partie en cours (sur cet appareil seulement) ---------- */

const CLE_PARTIE = "haqqreason-portulan-partie";
export function sauverPartie(v: unknown) {
  try {
    localStorage.setItem(tiroir(CLE_PARTIE), JSON.stringify({ ...((v as object) ?? {}), t: Date.now() }));
  } catch {
    // Disque plein ou navigation privée : la partie ne pourra pas reprendre.
  }
}
export function partieSauvee<T>(): (T & { t: number }) | null {
  try {
    const v = JSON.parse(localStorage.getItem(tiroir(CLE_PARTIE)) ?? "null") as (T & { t: number }) | null;
    // Une partie de plus de deux jours ne se reprend plus.
    return v && Date.now() - v.t < 2 * 86_400_000 ? v : null;
  } catch {
    return null;
  }
}
export function oublierPartie() {
  try {
    localStorage.removeItem(tiroir(CLE_PARTIE));
  } catch {
    // rien à faire
  }
}

/** Un record de jeu sans niveau (« Nomme-les tous », contre-la-montre…) : true s'il est battu. */
export function battreRecordDe(cle: string, score: number): boolean {
  const e = lire();
  if (score <= (e.records[cle] ?? 0)) return false;
  ecrire({ ...e, records: { ...e.records, [cle]: score } });
  void noter("monde", "records");
  return true;
}

/* ---------- Les cabinets ---------- */

const cabinetDe = (e: Etat, cab: string): EtatCabinet => e.cabinets[cab] ?? { n: {}, m: {} };

export const etoilesCabinet = (e: Etat, cab: string, n: number): number => cabinetDe(e, cab).n[n]?.e ?? 0;
export const niveauOuvertCabinet = (e: Etat, cab: string, n: number): boolean => n === 1 || (cabinetDe(e, cab).n[n - 1]?.f ?? 0) > 0;
export function niveauCourantCabinet(e: Etat, cab: string, total: number): number {
  for (let n = 1; n <= total; n++) if (!(cabinetDe(e, cab).n[n]?.f ?? 0)) return n;
  return total;
}
export function niveauxReussisCabinet(e: Etat, cab: string, total: number): number {
  let k = 0;
  for (let n = 1; n <= total; n++) if ((cabinetDe(e, cab).n[n]?.f ?? 0) > 0) k++;
  return k;
}
export const boiteCabinet = (e: Etat, cab: string, id: string): number => cabinetDe(e, cab).m[id]?.[2] ?? 0;

/** Les éléments des niveaux d'avant à revoir d'abord (les plus fragiles, les plus anciens). */
export function aReviserCabinet(e: Etat, cab: string, avant: string[], n: number): string[] {
  const m = cabinetDe(e, cab).m;
  const jour = aujourdhui();
  return avant
    .map((id) => ({ id, x: m[id] }))
    .sort((a, b) => Number(aRevoir(b.x, jour)) - Number(aRevoir(a.x, jour)) || (a.x?.[2] ?? -1) - (b.x?.[2] ?? -1) || (a.x?.[3] ?? 0) - (b.x?.[3] ?? 0))
    .slice(0, n)
    .map((x) => x.id);
}

/** Une réponse sur un élément de cabinet. */
export function noterCabinet(cab: string, id: string, juste: boolean, xp = 0) {
  const e = lire();
  const c = cabinetDe(e, cab);
  const avant = c.m[id] ?? ([0, 0, 0, 0] as Maitrise);
  const jour = aujourdhui();
  const nouvelle: Maitrise = juste ? [avant[0] + 1, avant[1], Math.min(5, avant[2] + 1), jour] : [avant[0], avant[1] + 1, Math.max(0, avant[2] - 2), jour];
  const profil = avancerObjectif(xp > 0 || juste ? { ...e.profil, xp: e.profil.xp + xp, gagnes: e.profil.gagnes + (juste ? DUCATS.bonne : 0) } : e.profil);
  ecrire({ ...e, profil: { ...profil, q: Date.now() }, cabinets: { ...e.cabinets, [cab]: { ...c, m: { ...c.m, [id]: nouvelle } } } });
  void noter("monde", `cabinet:${cab}`);
  void noter("monde", "profil");
}

/** Les ducats et la série de jours d'un niveau réussi (pays ou cabinet). */
function recompenser(e: Etat, avant: ResultatNiveau | undefined, note: number, reussi: boolean) {
  const premiereFois = reussi && !(avant?.f ?? 0);
  const record = reussi && note > (avant?.e ?? 0);
  let gain = 0;
  let jours = e.profil.jours;
  let dernierJour = e.profil.dernierJour;
  let gels = e.profil.gels;
  if (reussi) {
    gain += premiereFois ? DUCATS.niveau + note * DUCATS.parEtoile : record ? (note - (avant?.e ?? 0)) * DUCATS.parEtoile : 0;
    const jour = jourDeParis();
    if (dernierJour !== jour) {
      // Les jours manqués depuis le dernier jour joué : un gel de série couvre chacun d'eux.
      const manques = dernierJour ? Math.max(0, Math.round((Date.parse(`${jour}T12:00:00Z`) - Date.parse(`${dernierJour}T12:00:00Z`)) / 86_400_000) - 1) : 0;
      if (!dernierJour) jours = 1;
      else if (manques === 0) jours += 1;
      else if (manques <= gels) {
        gels -= manques;
        jours += 1;
      } else jours = 1;
      dernierJour = jour;
      gain += DUCATS.jour;
    }
  }
  return { premiereFois, record, gain, jours, dernierJour, gels };
}

/** Un niveau de cabinet terminé (réussi si des cœurs restent). */
export function finirNiveauCabinet(cab: string, n: number, r: { bonnes: number; fautes: number; reussi: boolean }): Bilan {
  const e = lire();
  const c = cabinetDe(e, cab);
  const avant = c.n[n];
  const note = r.reussi ? (r.fautes <= 0 ? 3 : r.fautes === 1 ? 2 : 1) : 0;
  const x = recompenser(e, avant, note, r.reussi);
  const niveaux = r.reussi ? { ...c.n, [n]: { e: Math.max(avant?.e ?? 0, note), m: Math.max(avant?.m ?? 0, r.bonnes), f: Date.now() } } : c.n;
  ecrire({ ...e, cabinets: { ...e.cabinets, [cab]: { ...c, n: niveaux } }, profil: { ...e.profil, gagnes: e.profil.gagnes + x.gain, jours: x.jours, dernierJour: x.dernierJour, gels: x.gels, q: Date.now() } });
  if (r.reussi) void noter("monde", `cabinet:${cab}`);
  void noter("monde", "profil");
  return { etoiles: note, ducats: x.gain, premiereFois: x.premiereFois, record: x.record, jours: x.jours };
}

export function regler(r: Partial<Pick<Profil, "chrono" | "voix" | "objectif" | "difficulte" | "questions" | "rythme" | "globe" | "cadre" | "bateau" | "monPays">>) {
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
    ...Object.entries(e.cabinets).map(([id, x]) => ({ c: `cabinet:${id}`, q: Math.max(0, ...Object.values(x.n).map((r) => r.f)) || undefined })),
    ...(Object.keys(e.records).length ? [{ c: "records" }] : []),
    ...(e.erreurs.length ? [{ c: "erreurs" }] : []),
    ...(Object.keys(e.confusions).length ? [{ c: "confusions" }] : []),
    ...(Object.keys(e.favoris).length ? [{ c: "favoris" }] : []),
  ];
}

export function valeurLocale(c: string): unknown {
  const e = lire();
  if (c === "profil") return e.profil;
  if (c.startsWith("niveau:")) return e.niveaux[c.slice(7)];
  if (c.startsWith("pays:")) return e.pays[c.slice(5)];
  if (c.startsWith("cabinet:")) return e.cabinets[c.slice(8)];
  if (c === "records") return e.records;
  if (c === "erreurs") return e.erreurs;
  if (c === "confusions") return e.confusions;
  if (c === "favoris") return e.favoris;
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
      voix: recent && typeof p.voix === "boolean" ? p.voix : a.voix,
      objectif: recent && [10, 20, 50].includes(nombre(p.objectif)) ? nombre(p.objectif) : a.objectif,
      jourObjectif: (p.jourObjectif ?? "") > a.jourObjectif ? String(p.jourObjectif) : a.jourObjectif,
      faites: (p.jourObjectif ?? "") > a.jourObjectif ? nombre(p.faites) : (p.jourObjectif ?? "") === a.jourObjectif ? Math.max(a.faites, nombre(p.faites)) : a.faites,
      difficulte: recent && (p.difficulte === "facile" || p.difficulte === "normal" || p.difficulte === "difficile") ? p.difficulte : a.difficulte,
      gels: recent ? Math.min(2, Math.max(0, nombre(p.gels))) : a.gels,
      questions: recent && (p.questions === 10 || p.questions === 20 || p.questions === 30) ? p.questions : a.questions,
      rythme: recent && (p.rythme === "lent" || p.rythme === "normal" || p.rythme === "rapide") ? p.rythme : a.rythme,
      achats: [...new Set([...a.achats, ...(Array.isArray(p.achats) ? p.achats.filter((x): x is string => typeof x === "string") : [])])],
      globe: recent && typeof p.globe === "string" ? p.globe : a.globe,
      cadre: recent && typeof p.cadre === "string" ? p.cadre : a.cadre,
      bateau: recent && typeof p.bateau === "string" ? p.bateau : a.bateau,
      monPays: recent && typeof p.monPays === "string" && /^[a-z]{0,2}$/.test(p.monPays) ? p.monPays : a.monPays,
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
  if (c.startsWith("cabinet:")) {
    const id = c.slice(8);
    const venu = (v ?? {}) as Partial<EtatCabinet>;
    const ici = cabinetDe(e, id);
    let mieux = false;
    const n: Record<string, ResultatNiveau> = { ...ici.n };
    for (const k of new Set([...Object.keys(ici.n), ...Object.keys(venu.n ?? {})])) {
      const a = ici.n[k];
      const b = (venu.n ?? {})[k];
      const fusion = { e: Math.max(a?.e ?? 0, nombre(b?.e)), m: Math.max(a?.m ?? 0, nombre(b?.m)), f: Math.max(a?.f ?? 0, nombre(b?.f)) };
      if (fusion.e !== nombre(b?.e) || fusion.m !== nombre(b?.m) || fusion.f !== nombre(b?.f)) mieux = true;
      n[k] = fusion;
    }
    const m: Record<string, Maitrise> = { ...ici.m };
    for (const k of new Set([...Object.keys(ici.m), ...Object.keys(venu.m ?? {})])) {
      const a = ici.m[k];
      const brut = (venu.m ?? {})[k];
      const b = Array.isArray(brut) && brut.length === 4 ? (brut.map(nombre) as Maitrise) : undefined;
      if (!b) {
        if (a) mieux = true;
        continue;
      }
      const garde = !a || b[3] > a[3] || (b[3] === a[3] && b[2] >= a[2]) ? b : a;
      if (garde !== b) mieux = true;
      m[k] = garde;
    }
    ecrire({ ...e, cabinets: { ...e.cabinets, [id]: { n, m } } });
    return mieux;
  }
  if (c === "erreurs") {
    const venu = Array.isArray(v) ? (v as Partial<Erreur>[]) : [];
    const jour = aujourdhui();
    const vus = new Set(e.erreurs.map((x) => `${x.t}|${x.c}|${x.r}|${x.j}`));
    const ajout = venu
      .filter((x): x is Erreur => typeof x.t === "string" && typeof x.c === "string" && typeof x.r === "string" && typeof x.j === "number")
      .filter((x) => jour - x.j < SEPT_JOURS && !vus.has(`${x.t}|${x.c}|${x.r}|${x.j}`));
    const erreurs = [...e.erreurs, ...ajout].filter((x) => jour - x.j < SEPT_JOURS).sort((a, b) => a.j - b.j).slice(-300);
    ecrire({ ...e, erreurs });
    return erreurs.length > venu.length;
  }
  if (c === "confusions") {
    const venu = (v ?? {}) as Record<string, unknown>;
    const fusion: Record<string, number> = { ...e.confusions };
    let mieux = false;
    for (const k of new Set([...Object.keys(e.confusions), ...Object.keys(venu)])) {
      fusion[k] = Math.max(e.confusions[k] ?? 0, nombre(venu[k]));
      if (fusion[k] !== nombre(venu[k])) mieux = true;
    }
    ecrire({ ...e, confusions: fusion });
    return mieux;
  }
  if (c === "favoris") {
    const venu = (v ?? {}) as Record<string, unknown>;
    const fusion: Record<string, number> = { ...e.favoris };
    let mieux = false;
    for (const k of new Set([...Object.keys(e.favoris), ...Object.keys(venu)])) {
      const a = e.favoris[k] ?? 0;
      const b = nombre(venu[k]);
      // Le geste le plus récent l'emporte (ajout ou retrait).
      fusion[k] = Math.abs(b) >= Math.abs(a) ? b : a;
      if (fusion[k] !== b) mieux = true;
    }
    ecrire({ ...e, favoris: fusion });
    return mieux;
  }
  if (c === "records") {
    const venu = (v ?? {}) as Record<string, unknown>;
    const fusion: Record<string, number> = { ...e.records };
    let mieux = false;
    for (const k of new Set([...Object.keys(e.records), ...Object.keys(venu)])) {
      fusion[k] = Math.max(e.records[k] ?? 0, nombre(venu[k]));
      if (fusion[k] !== nombre(venu[k])) mieux = true;
    }
    ecrire({ ...e, records: fusion });
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
  } else if (c.startsWith("cabinet:")) {
    const cabinets = { ...e.cabinets };
    delete cabinets[c.slice(8)];
    ecrire({ ...e, cabinets });
  } else if (c === "records") {
    ecrire({ ...e, records: {} });
  } else if (c === "erreurs") {
    ecrire({ ...e, erreurs: [] });
  } else if (c === "confusions") {
    ecrire({ ...e, confusions: {} });
  } else if (c === "favoris") {
    ecrire({ ...e, favoris: {} });
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
