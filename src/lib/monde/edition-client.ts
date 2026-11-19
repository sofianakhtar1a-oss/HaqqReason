"use client";

import { useSyncExternalStore } from "react";
import type { EditionPortulan } from "./edition";
import type { Pays } from "./types";

/*
 * Ce que le créateur a réglé depuis son atelier, côté navigateur : lu une fois par visite,
 * gardé sur l'appareil pour le jeu hors ligne. Tant qu'il n'est pas là, le Portulan montre
 * ses données d'origine.
 */

const CLE = "haqqreason-portulan-edition";
let edition: EditionPortulan | null = null;
let lueSurAppareil = false;
let promesse: Promise<void> | null = null;
const abonnes = new Set<() => void>();

function depuisAppareil() {
  if (lueSurAppareil || typeof localStorage === "undefined") return;
  lueSurAppareil = true;
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? "null") as EditionPortulan | null;
    if (brut && typeof brut === "object" && brut.fiches && brut.jour) edition = brut;
  } catch {
    // Rien de lisible : on attendra le serveur.
  }
}

export function chargerEdition(): Promise<void> {
  depuisAppareil();
  promesse ??= fetch("/api/monde/edition")
    .then((r) => (r.ok ? (r.json() as Promise<EditionPortulan>) : null))
    .then((e) => {
      if (!e) return;
      edition = e;
      try {
        localStorage.setItem(CLE, JSON.stringify(e));
      } catch {
        // Stockage plein ou refusé : l'édition reste en mémoire.
      }
      abonnes.forEach((f) => f());
    })
    .catch(() => {
      // Hors ligne : la version gardée sur l'appareil fait foi, on réessaiera.
      promesse = null;
    });
  return promesse;
}

export function surEdition(f: () => void): () => void {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

const abonner = (f: () => void) => {
  const fin = surEdition(f);
  void chargerEdition();
  return fin;
};

/** L'édition du créateur (null tant qu'elle n'est pas arrivée). */
export function useEdition(): EditionPortulan | null {
  return useSyncExternalStore(
    abonner,
    () => {
      depuisAppareil();
      return edition;
    },
    () => null,
  );
}

export const editionActuelle = (): EditionPortulan | null => {
  depuisAppareil();
  return edition;
};

/** La population à montrer : celle de la Banque mondiale si elle est plus récente que les données d'origine. */
export function populationDe(p: Pays, e: EditionPortulan | null): { n: number | null; annee: number | null; note?: string } {
  const v = e?.population?.valeurs[p.code];
  if (v && (!p.anneePopulation || v[1] >= p.anneePopulation)) return { n: v[0], annee: v[1] };
  return { n: p.population, annee: p.anneePopulation, note: p.notePopulation };
}
