"use client";

import { useSyncExternalStore } from "react";
import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";

/*
 * Le suivi de l'entraînement des Règles : écrit sur l'appareil, recopié sur le compte quand on est connecté
 * (magasin « regles-suivi »).
 * - Les séries : pour chaque entraînement de leçon (« e:conjugaison/ma-lecon »), chaque examen de niveau
 *   (« n:grammaire/B1 ») et le test de positionnement (« p:positionnement »), le meilleur score.
 * - Le carnet d'erreurs : chaque exercice raté (« conjugaison/ma-lecon/e12 » pour l'entraînement,
 *   « …/d3 » pour le défi) y entre, et en sort après deux réussites du premier coup.
 */

export type ResultatSerie = { meilleur: number; total: number; series: number; dernier: number; niveau?: string };
export type Erreur = { ref: string; ajoute: number; vue: number; reussites: number; ratees: number };
type Etat = { series: Record<string, ResultatSerie>; erreurs: Record<string, Erreur> };

/** Réussites du premier coup qu'il faut pour qu'une erreur quitte le carnet. */
export const REUSSITES_POUR_SORTIR = 2;

const NOM = "haqqreason-regles-suivi";
const MAGASIN = "regles-suivi" as const;
const cle = () => tiroir(NOM);
const vide: Etat = { series: {}, erreurs: {} };
let etat: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (etat) return etat;
  try {
    const brut = JSON.parse(localStorage.getItem(cle()) ?? "null") as Partial<Etat> | null;
    etat = brut && typeof brut === "object" ? { series: brut.series ?? {}, erreurs: brut.erreurs ?? {} } : vide;
  } catch {
    etat = vide;
  }
  return etat;
}

function ecrire(e: Etat) {
  etat = e;
  try {
    localStorage.setItem(cle(), JSON.stringify(e));
  } catch {
    // Navigation privée : le suivi vit le temps de la visite.
  }
  abonnes.forEach((f) => f());
}

const cleSerieSynchro = (c: string) => `s:${c}`;
const cleErreurSynchro = (ref: string) => `x:${ref}`;

/** Une série terminée : on garde le meilleur score (en part de réussite), et le nombre de séries faites. */
export function enregistrerSerie(c: string, r: { juste: number; total: number; niveau?: string }) {
  const e = lire();
  const avant = e.series[c];
  const mieux = !avant || r.juste / Math.max(1, r.total) >= avant.meilleur / Math.max(1, avant.total);
  const suivant: ResultatSerie = {
    meilleur: mieux ? r.juste : avant.meilleur,
    total: mieux ? r.total : avant.total,
    series: (avant?.series ?? 0) + 1,
    dernier: Date.now(),
    niveau: r.niveau ?? avant?.niveau,
  };
  if (!suivant.niveau) delete suivant.niveau;
  ecrire({ ...e, series: { ...e.series, [c]: suivant } });
  void noter(MAGASIN, cleSerieSynchro(c));
}

/**
 * Les réponses d'une série, pour le carnet d'erreurs : un exercice raté y entre (ou y reste),
 * un exercice du carnet réussi du premier coup s'en rapproche de la sortie.
 */
export function noterReponses(reponses: { ref: string; juste: boolean; premierCoup: boolean }[]) {
  const e = lire();
  const erreurs = { ...e.erreurs };
  const touchees: string[] = [];
  const maintenant = Date.now();
  for (const { ref, juste, premierCoup } of reponses) {
    const avant = erreurs[ref];
    if (!juste || !premierCoup) {
      erreurs[ref] = { ref, ajoute: avant?.ajoute ?? maintenant, vue: maintenant, reussites: 0, ratees: (avant?.ratees ?? 0) + 1 };
      touchees.push(ref);
    } else if (avant) {
      const reussites = avant.reussites + 1;
      if (reussites >= REUSSITES_POUR_SORTIR) delete erreurs[ref];
      else erreurs[ref] = { ...avant, vue: maintenant, reussites };
      touchees.push(ref);
    }
  }
  if (!touchees.length) return;
  ecrire({ ...e, erreurs });
  for (const ref of touchees) void noter(MAGASIN, cleErreurSynchro(ref));
}

/** Retire une erreur du carnet à la main (« je l'ai comprise »). */
export function retirerErreur(ref: string) {
  const e = lire();
  if (!e.erreurs[ref]) return;
  const erreurs = { ...e.erreurs };
  delete erreurs[ref];
  ecrire({ ...e, erreurs });
  void noter(MAGASIN, cleErreurSynchro(ref));
}

/* ---------- Synchronisation ---------- */

export function clesLocales(): { c: string; q?: number }[] {
  const e = lire();
  return [
    ...Object.entries(e.series).map(([c, r]) => ({ c: cleSerieSynchro(c), q: r.dernier || undefined })),
    ...Object.values(e.erreurs).map((x) => ({ c: cleErreurSynchro(x.ref), q: x.vue || undefined })),
  ];
}

export function valeurLocale(c: string): unknown {
  const e = lire();
  if (c.startsWith("s:")) return e.series[c.slice(2)];
  if (c.startsWith("x:")) return e.erreurs[c.slice(2)];
  return undefined;
}

const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);

/** Range une valeur venue d'un autre appareil ; répond vrai si la fusion diffère de ce qui est arrivé. */
export function rangerValeur(c: string, v: unknown): boolean {
  const e = lire();
  const o = (v ?? {}) as Record<string, unknown>;
  if (c.startsWith("s:")) {
    const id = c.slice(2);
    const venu: ResultatSerie = { meilleur: nombre(o.meilleur), total: nombre(o.total), series: nombre(o.series), dernier: nombre(o.dernier), niveau: typeof o.niveau === "string" ? o.niveau.slice(0, 4) : undefined };
    if (!venu.niveau) delete venu.niveau;
    const ici = e.series[id];
    const taux = (r: ResultatSerie) => r.meilleur / Math.max(1, r.total);
    const garde = !ici || taux(venu) >= taux(ici) ? venu : ici;
    const fusion: ResultatSerie = { ...garde, series: Math.max(venu.series, ici?.series ?? 0), dernier: Math.max(venu.dernier, ici?.dernier ?? 0) };
    ecrire({ ...e, series: { ...e.series, [id]: fusion } });
    return JSON.stringify(fusion) !== JSON.stringify(venu);
  }
  if (c.startsWith("x:")) {
    const ref = c.slice(2);
    if (!/^[a-z]+\/[a-z0-9-]+\/[de]\d+$/.test(ref)) return false;
    const venu: Erreur = { ref, ajoute: nombre(o.ajoute), vue: nombre(o.vue), reussites: nombre(o.reussites), ratees: nombre(o.ratees) };
    const ici = e.erreurs[ref];
    // La plus récente l'emporte : c'est le dernier état connu de cette erreur.
    if (ici && ici.vue > venu.vue) return true;
    ecrire({ ...e, erreurs: { ...e.erreurs, [ref]: venu } });
  }
  return false;
}

export function effacerValeur(c: string) {
  const e = lire();
  if (c.startsWith("s:")) {
    const series = { ...e.series };
    delete series[c.slice(2)];
    ecrire({ ...e, series });
  } else if (c.startsWith("x:")) {
    const erreurs = { ...e.erreurs };
    delete erreurs[c.slice(2)];
    ecrire({ ...e, erreurs });
  }
}

/* ---------- Lecture dans l'interface ---------- */

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

export function useSuivi() {
  return useSyncExternalStore(abonner, lire, () => vide);
}

/** Les clés des séries. */
export const serieLecon = (section: string, lecon: string) => `e:${section}/${lecon}`;
export const serieExamen = (section: string, niveau: string) => `n:${section}/${niveau}`;
export const SERIE_POSITIONNEMENT = "p:positionnement";
/** La référence d'un exercice : leçon, et « d » (défi) ou « e » (entraînement) suivi de son rang. */
export const refExercice = (section: string, lecon: string, source: "d" | "e", rang: number) => `${section}/${lecon}/${source}${rang}`;
export function lireRef(ref: string): { section: string; lecon: string; source: "d" | "e"; rang: number } | null {
  const m = /^([a-z]+)\/([a-z0-9-]+)\/([de])(\d+)$/.exec(ref);
  return m ? { section: m[1], lecon: m[2], source: m[3] as "d" | "e", rang: Number(m[4]) } : null;
}
