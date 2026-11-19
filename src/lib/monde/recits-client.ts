"use client";

import { useSyncExternalStore } from "react";
import type { Recit } from "./types";

/*
 * Les récits des fiches (devise, hymne, histoire du drapeau…) : un gros fichier, chargé à la
 * demande la première fois qu'une fiche s'ouvre, puis gardé en mémoire.
 */

let recits: Readonly<Record<string, Recit>> | null = null;
let promesse: Promise<void> | null = null;
const abonnes = new Set<() => void>();

export function chargerRecits(): Promise<void> {
  if (!promesse) {
    promesse = import("./recits")
      .then((m) => {
        recits = m.RECITS;
        abonnes.forEach((f) => f());
      })
      .catch(() => {
        // Hors ligne au premier passage : on réessaiera à la prochaine fiche.
        promesse = null;
      });
  }
  return promesse ?? Promise.resolve();
}

const abonner = (f: () => void) => {
  abonnes.add(f);
  void chargerRecits();
  return () => {
    abonnes.delete(f);
  };
};

/** Tous les récits (null tant qu'ils ne sont pas chargés). */
export function useRecits(): Readonly<Record<string, Recit>> | null {
  return useSyncExternalStore(
    abonner,
    () => recits,
    () => null,
  );
}

/** Lecture directe, pour qui sait que les récits sont déjà là. */
export const recitDe = (code: string): Recit | undefined => recits?.[code];
