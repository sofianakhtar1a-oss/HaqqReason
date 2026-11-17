"use client";

import { useSyncExternalStore } from "react";

/*
 * La progression des Règles, gardée sur l'appareil.
 * Pour chaque leçon : les étoiles (0 à 3, on garde la meilleure) et l'expérience gagnée.
 */

export type Resultat = { etoiles: number; xp: number; fini: number };
type Etat = { lecons: Record<string, Resultat> };

const CLE = "haqqreason-regles-anglais";
const vide: Etat = { lecons: {} };
let etat: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (etat) return etat;
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? "null") as Etat | null;
    etat = brut && typeof brut === "object" && brut.lecons ? brut : vide;
  } catch {
    etat = vide;
  }
  return etat;
}

function ecrire(e: Etat) {
  etat = e;
  try {
    localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    // Navigation privée : la progression vit le temps de la visite.
  }
  abonnes.forEach((f) => f());
}

export function enregistrerLecon(id: string, r: { etoiles: number; xp: number }) {
  const e = lire();
  const avant = e.lecons[id];
  ecrire({
    lecons: {
      ...e.lecons,
      [id]: { etoiles: Math.max(avant?.etoiles ?? 0, r.etoiles), xp: Math.max(avant?.xp ?? 0, r.xp), fini: Date.now() },
    },
  });
}

const abonner = (f: () => void) => {
  abonnes.add(f);
  const ailleurs = (ev: StorageEvent) => {
    if (ev.key === CLE) {
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

export function useProgression() {
  return useSyncExternalStore(abonner, lire, () => vide);
}
