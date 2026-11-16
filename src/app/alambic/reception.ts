"use client";

import { useEffect, useRef } from "react";

/** Un outil s'abonne aux fichiers collés (Ctrl+V) sur la page tant qu'il est affiché. */
export type Abonner = (recevoir: ((fichiers: File[]) => void) | null) => void;

export function useReception(abonner: Abonner, recevoir: (fichiers: File[]) => void) {
  const dernier = useRef(recevoir);
  useEffect(() => {
    dernier.current = recevoir;
  });
  useEffect(() => {
    abonner((fichiers) => dernier.current(fichiers));
    return () => abonner(null);
  }, [abonner]);
}
