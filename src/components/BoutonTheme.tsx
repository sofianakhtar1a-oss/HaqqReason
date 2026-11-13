"use client";

import { Moon, Sun } from "lucide-react";

/** Bascule entre thème sombre et thème clair. Le choix reste sur l'appareil du lecteur. */
export function BoutonTheme() {
  function basculer() {
    const racine = document.documentElement;
    const suivant = racine.dataset.theme === "light" ? "dark" : "light";
    racine.dataset.theme = suivant;
    try {
      localStorage.setItem("hr-theme", suivant);
    } catch {
      // Stockage indisponible (navigation privée stricte) : le thème vaut pour cette visite.
    }
  }

  return (
    <button type="button" onClick={basculer} className="bouton bouton-discret !min-h-11 !px-3" aria-label="Changer de thème (clair ou sombre)">
      <Sun className="hidden size-5 [[data-theme=dark]_&]:block" aria-hidden="true" />
      <Moon className="hidden size-5 [[data-theme=light]_&]:block" aria-hidden="true" />
    </button>
  );
}
