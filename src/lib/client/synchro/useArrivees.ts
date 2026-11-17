"use client";

import { useEffect } from "react";
import type { NomMagasin } from "@/lib/compte/limites";
import { EVENEMENT_RECU } from "./journal";

/** Appelle « rappel » quand des données de l'un de ces magasins arrivent d'un autre appareil. */
export function useArrivees(magasins: readonly NomMagasin[], rappel: () => void) {
  useEffect(() => {
    const surReception = (e: Event) => {
      const recus = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(recus) && recus.some((m) => (magasins as readonly string[]).includes(m))) rappel();
    };
    window.addEventListener(EVENEMENT_RECU, surReception);
    return () => window.removeEventListener(EVENEMENT_RECU, surReception);
    // La liste des magasins est une constante de l'appelant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rappel]);
}
