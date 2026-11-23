"use client";

import { useEffect, useSyncExternalStore } from "react";
import { abonnerDroits, type EtatDroits, lireDroits, rechargerDroits } from "./premium";

/** Les droits Premium de la personne (null tant qu'ils ne sont pas arrivés, ou si tout est ouvert). */
export function useDroits(): EtatDroits {
  const e = useSyncExternalStore(abonnerDroits, lireDroits, lireDroits);
  useEffect(() => {
    void rechargerDroits();
  }, []);
  return e;
}
