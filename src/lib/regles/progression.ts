"use client";

import { useSyncExternalStore } from "react";
import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";

/*
 * La progression des Règles : écrite sur l'appareil, et recopiée sur le compte quand on est connecté.
 * Pour chaque leçon : les étoiles (0 à 3, on garde la meilleure) et l'expérience gagnée.
 */

export type Resultat = { etoiles: number; xp: number; fini: number };
type Etat = { lecons: Record<string, Resultat> };

const NOM = "haqqreason-regles-anglais";
const cle = () => tiroir(NOM);
const vide: Etat = { lecons: {} };
let etat: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (etat) return etat;
  try {
    const brut = JSON.parse(localStorage.getItem(cle()) ?? "null") as Etat | null;
    etat = brut && typeof brut === "object" && brut.lecons ? brut : vide;
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
  void noter("regles", id);
}

/* Pour la synchronisation : lire et ranger une leçon sans rien noter au journal. */

export function leconsLocales(): Record<string, Resultat> {
  return lire().lecons;
}

/** Range le résultat venu d'un autre appareil ; on garde toujours le meilleur des deux. */
export function rangerLecon(id: string, r: Resultat | null) {
  const e = lire();
  const lecons = { ...e.lecons };
  if (!r) delete lecons[id];
  else {
    const avant = lecons[id];
    lecons[id] = {
      etoiles: Math.max(avant?.etoiles ?? 0, Number(r.etoiles) || 0),
      xp: Math.max(avant?.xp ?? 0, Number(r.xp) || 0),
      fini: Math.max(avant?.fini ?? 0, Number(r.fini) || 0),
    };
  }
  ecrire({ lecons });
}

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

export function useProgression() {
  return useSyncExternalStore(abonner, lire, () => vide);
}
