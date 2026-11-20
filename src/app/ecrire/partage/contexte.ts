"use client";

import { useSyncExternalStore } from "react";
import type { MonRole } from "@/lib/atelier/partage-commun";

/*
 * Le Calame — qui je suis dans le document partagé ouvert (mon compte, mon nom, mon rôle) : les
 * commentaires, les suggestions et la marge en ont besoin. Hors partage : rien (commentaires pour soi).
 */

export type PartageCourant = { moi: { compte: string; nom: string; couleur: string } | null; role: MonRole | null };

const VIDE: PartageCourant = { moi: null, role: null };
let courant = VIDE;
const abonnes = new Set<() => void>();

export function definirPartageCourant(p: PartageCourant | null) {
  const suite = p ?? VIDE;
  if (suite.moi?.compte === courant.moi?.compte && suite.role === courant.role && suite.moi?.nom === courant.moi?.nom) return;
  courant = suite;
  for (const f of abonnes) f();
}

export const lirePartageCourant = () => courant;

export const usePartageCourant = () =>
  useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => courant,
    () => VIDE,
  );
