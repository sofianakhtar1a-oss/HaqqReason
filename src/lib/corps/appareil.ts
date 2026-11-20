"use client";

import { useSyncExternalStore } from "react";

/*
 * L'Écorché — les réglages propres à l'appareil (ils ne suivent pas le compte : un téléphone et un ordinateur
 * n'ont pas la même puissance) : la finesse des modèles et le rendu de la pièce.
 */

/** La finesse des modèles : selon l'appareil, ou choisie. */
export type Finesse = "auto" | "legere" | "standard" | "haute";
/** Le rendu : la pièce fraîche (humide, brillante) ou plastinée (satinée, plus claire). */
export type Aspect = "frais" | "plastine";
export type Appareil = { finesse: Finesse; aspect: Aspect };

const CLE = "haqqreason-ecorche-appareil";
const DEFAUT: Appareil = { finesse: "auto", aspect: "frais" };
let etat: Appareil | null = null;
const abonnes = new Set<() => void>();

function lire(): Appareil {
  if (etat) return etat;
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? "null") as Partial<Appareil> | null;
    etat = {
      finesse: brut && ["auto", "legere", "standard", "haute"].includes(brut.finesse ?? "") ? (brut.finesse as Finesse) : DEFAUT.finesse,
      aspect: brut?.aspect === "plastine" ? "plastine" : "frais",
    };
  } catch {
    etat = DEFAUT;
  }
  return etat;
}

export function reglerAppareil(r: Partial<Appareil>) {
  etat = { ...lire(), ...r };
  try {
    localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    // Navigation privée : le réglage vit le temps de la visite.
  }
  abonnes.forEach((f) => f());
}

export function useAppareil(): Appareil {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    lire,
    () => DEFAUT,
  );
}

/** Le niveau de détail que l'appareil peut tenir : 2 (léger), 1 (standard) ou 0 (haute définition). */
export function niveauPour(finesse: Finesse): 0 | 1 | 2 {
  if (finesse === "legere") return 2;
  if (finesse === "standard") return 1;
  if (finesse === "haute") return 0;
  if (typeof navigator === "undefined" || typeof window === "undefined") return 1;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean; effectiveType?: string } };
  if (nav.connection?.saveData || /2g/.test(nav.connection?.effectiveType ?? "")) return 2;
  const tactile = window.matchMedia?.("(pointer: coarse)").matches;
  // Un téléphone garde la version légère (un million de triangles), sauf s'il annonce beaucoup de mémoire.
  if (tactile) return (nav.deviceMemory ?? 4) >= 8 ? 1 : 2;
  return (nav.deviceMemory ?? 8) <= 2 ? 2 : 1;
}
