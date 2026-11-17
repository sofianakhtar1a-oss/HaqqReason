"use client";

import { useEffect } from "react";

/** Lance la synchronisation des données personnelles dès qu'un compte est connecté. Rien à l'écran. */
export function Synchronisation() {
  useEffect(() => {
    let vivant = true;
    void import("@/lib/client/synchro/moteur").then((m) => {
      if (vivant) m.demarrerSynchro();
    });
    return () => {
      vivant = false;
    };
  }, []);
  return null;
}
