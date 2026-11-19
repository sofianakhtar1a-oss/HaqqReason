"use client";

import Link from "next/link";
import { useAccesComplet } from "@/lib/client/acces";

/**
 * « Quitter » : retour aux espaces par la porte de lumière, comme depuis Le Calame, L'Alambic
 * et Le Truchement. Seulement pour qui est passé par l'accueil (les espaces restent cloisonnés).
 */
export function SortieEspaces() {
  const complet = useAccesComplet();
  if (!complet) return null;
  return (
    <Link href="/utilisateur" className="calame-sortie" data-portail="Les espaces" data-portail-sur="Mode utilisateur" data-portail-accent="or">
      Quitter
    </Link>
  );
}
