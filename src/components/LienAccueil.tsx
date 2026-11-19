"use client";

import Link from "next/link";
import { useAdresseAccueil } from "@/lib/client/acces";

/**
 * La porte de lumière de chaque destination du logo : le passage d'un espace à l'autre
 * s'anime partout de la même façon (et à la durée choisie dans Paramètres → Animations).
 */
const PORTES: Record<string, { titre: string; sur: string; accent: string }> = {
  "/": { titre: "HaqqReason", sur: "Accueil", accent: "or" },
  "/explorer": { titre: "Les preuves de la véracité de l'islam", sur: "La bibliothèque", accent: "emeraude" },
  "/ecrire": { titre: "Le Calame", sur: "Atelier d'écriture", accent: "or" },
  "/alambic": { titre: "L'Alambic", sur: "Studio de fichiers", accent: "amethyste" },
  "/langues": { titre: "Le Truchement", sur: "Apprendre les langues", accent: "azur" },
  "/monde": { titre: "Le Portulan", sur: "Apprendre la géographie", accent: "safran" },
};

/** Lien « accueil » cloisonné : voir lib/client/acces.ts. */
export function LienAccueil({ className, children }: { className?: string; children: React.ReactNode }) {
  const href = useAdresseAccueil();
  const porte = PORTES[href];
  return (
    <Link
      href={href}
      className={className}
      data-portail={porte?.titre}
      data-portail-sur={porte?.sur}
      data-portail-accent={porte?.accent}
    >
      {children}
    </Link>
  );
}
