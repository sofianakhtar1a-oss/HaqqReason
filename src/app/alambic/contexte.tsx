"use client";

/*
 * Ce que tous les outils de L'Alambic partagent : passer un fichier à un autre outil,
 * le préréglage choisi dans « Que veux-tu faire ? », et les résultats de la visite.
 */
import type { LucideIcon } from "lucide-react";
import { createContext, useContext } from "react";
import type { Intention } from "@/lib/alambic/intentions";
import type { Resultat } from "@/lib/alambic/navigateur/moteur";
import type { Outil } from "@/lib/alambic/outils";

export type FicheOutil = { id: Outil; nom: string; aide: string; Icone: LucideIcon };

export type ValeurAlambic = {
  /** L'outil affiché. */
  outil: Outil;
  /** Les outils présents, avec les noms choisis par le créateur. */
  outils: FicheOutil[];
  /** Ouvre un autre outil et lui remet ces fichiers. */
  envoyer: (outil: Outil, fichiers: File[]) => void;
  /** Le besoin choisi dans « Que veux-tu faire ? », pour l'outil affiché (ou null). */
  intention: Intention | null;
  /** Range un résultat dans « Tes résultats » (le temps de la visite). */
  noter: (r: Resultat) => void;
};

export const ContexteAlambic = createContext<ValeurAlambic | null>(null);

/** Hors de L'Alambic (Le Truchement réutilise certains morceaux), tout reste sans effet. */
const NEUTRE: ValeurAlambic = { outil: "convertir", outils: [], envoyer: () => {}, intention: null, noter: () => {} };

export function useAlambic(): ValeurAlambic {
  return useContext(ContexteAlambic) ?? NEUTRE;
}

/** Le fichier d'un résultat, prêt à être remis à un autre outil ou partagé. */
export function fichierDe(r: Resultat): File {
  return new File([r.blob], r.nom, { type: r.blob.type || "application/octet-stream", lastModified: Date.now() });
}
