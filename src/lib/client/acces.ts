"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

/*
 * Les espaces du mode utilisateur, cloisonnés.
 *
 * Qui arrive par l'accueil (« / » ou « /utilisateur ») circule partout.
 * Qui arrive par un lien direct reste dans l'espace de ce lien :
 *   - un lien vers Le Calame (/ecrire) ne mène ni à l'accueil ni à la bibliothèque ;
 *   - un lien vers L'Alambic (/alambic) ne mène ni à l'accueil ni aux autres espaces ;
 *   - un lien vers Le Truchement (/langues) ne mène ni à l'accueil ni aux autres espaces ;
 *   - un lien vers la bibliothèque ne mène ni à l'accueil ni aux autres espaces.
 * Ce passage par l'accueil est retenu sur l'appareil (localStorage), rien n'est envoyé au serveur.
 *
 * C'est un cloisonnement de la navigation, pas un verrou : l'adresse de l'accueil
 * tapée à la main y mène toujours.
 */

const CLE = "haqqreason-accueil";
/** Les espaces qui ont leur propre porte (tout le reste appartient à la bibliothèque). */
const ESPACES_FERMES = ["/ecrire", "/alambic", "/langues"];
const EVENEMENT = "haqqreason:acces";

function lire(): boolean {
  try {
    return window.localStorage.getItem(CLE) === "1";
  } catch {
    return false;
  }
}

function abonner(rappel: () => void) {
  window.addEventListener("storage", rappel);
  window.addEventListener(EVENEMENT, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(EVENEMENT, rappel);
  };
}

/** Vrai si ce visiteur est passé par l'accueil. Faux côté serveur : par défaut, on cloisonne. */
export function useAccesComplet(): boolean {
  return useSyncExternalStore(abonner, lire, () => false);
}

/** L'adresse vers laquelle mène le logo : l'accueil, ou la porte de l'espace où l'on se trouve. */
export function useAdresseAccueil(): string {
  const complet = useAccesComplet();
  const chemin = usePathname() ?? "/";
  if (complet) return "/";
  for (const espace of ESPACES_FERMES) if (chemin === espace || chemin.startsWith(`${espace}/`)) return espace;
  return "/explorer";
}

/** Posé sur l'accueil : ce visiteur a l'adresse de l'accueil, il circule partout. */
export function MarqueAccueil() {
  useEffect(() => {
    try {
      window.localStorage.setItem(CLE, "1");
      window.dispatchEvent(new Event(EVENEMENT));
    } catch {
      // Stockage indisponible (navigation privée stricte) : on reste cloisonné, rien de cassé.
    }
  }, []);
  return null;
}
