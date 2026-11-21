"use client";

import { Moon, Sun } from "lucide-react";

/** Passe du thème sombre au thème clair (ou l'inverse). Le choix reste sur l'appareil du lecteur. */
export function basculerTheme() {
  const racine = document.documentElement;
  const suivant = racine.dataset.theme === "light" ? "dark" : "light";
  racine.dataset.theme = suivant;
  try {
    localStorage.setItem("hr-theme", suivant);
  } catch {
    // Stockage indisponible (navigation privée stricte) : le thème vaut pour cette visite.
  }
}

/** Bascule entre thème sombre et thème clair. */
export function BoutonTheme() {
  return (
    <button type="button" onClick={basculerTheme} className="bouton bouton-discret !min-h-11 !px-3" aria-label="Changer de thème (clair ou sombre)">
      <Sun className="hidden size-5 [[data-theme=dark]_&]:block" aria-hidden="true" />
      <Moon className="hidden size-5 [[data-theme=light]_&]:block" aria-hidden="true" />
    </button>
  );
}
