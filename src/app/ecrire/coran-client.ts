"use client";

/** Le texte du Coran, chargé une seule fois (le fichier est mis en cache par le navigateur). */

export const FICHIER_CORAN = "/calame/coran-031c62ebd3.json";

type Coran = { source: string; sourates: string[][]; nomsArabes: string[] };

let promesse: Promise<Coran> | null = null;

export function chargerCoran(): Promise<Coran> {
  if (!promesse)
    promesse = fetch(FICHIER_CORAN)
      .then((r) => {
        if (!r.ok) throw new Error("Le texte du Coran n'a pas pu être chargé.");
        return r.json() as Promise<Coran>;
      })
      .catch((e) => {
        promesse = null;
        throw e;
      });
  return promesse;
}
