"use client";

import { useSyncExternalStore } from "react";
import { recitCorrige } from "./edition";
import { chargerEdition, editionActuelle, surEdition } from "./edition-client";
import type { Recit } from "./types";

/*
 * Les récits des fiches (devise, hymne, histoire du drapeau…) : un gros fichier, chargé à la
 * demande la première fois qu'une fiche s'ouvre, puis gardé en mémoire.
 */

let bruts: Readonly<Record<string, Recit>> | null = null;
/** Les récits, avec les corrections du créateur (son atelier) par-dessus. */
let recits: Readonly<Record<string, Recit>> | null = null;
let promesse: Promise<void> | null = null;
const abonnes = new Set<() => void>();

function corriger() {
  const fiches = editionActuelle()?.fiches;
  if (!bruts || !fiches || !Object.keys(fiches).length) {
    recits = bruts;
    return;
  }
  const copie: Record<string, Recit> = { ...bruts };
  for (const [code, corrections] of Object.entries(fiches)) {
    const r = recitCorrige(bruts[code], corrections);
    if (r) copie[code] = r;
  }
  recits = copie;
}

surEdition(() => {
  corriger();
  abonnes.forEach((f) => f());
});

export function chargerRecits(): Promise<void> {
  if (!promesse) {
    promesse = import("./recits")
      .then((m) => {
        bruts = m.RECITS;
        corriger();
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
  void chargerEdition();
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
