"use client";

import { useEffect } from "react";

/** Un clic, un toucher ou une touche passe l'ouverture : elle s'efface aussitôt. */
export function PasserOuverture() {
  useEffect(() => {
    const racine = document.documentElement;
    if (!racine.hasAttribute("data-ouverture")) return;
    function passer() {
      racine.setAttribute("data-ouverture-passee", "");
      racine.removeAttribute("data-portail-arret");
      window.setTimeout(() => {
        racine.removeAttribute("data-ouverture");
        racine.removeAttribute("data-ouverture-passee");
      }, 320);
      retirer();
    }
    function retirer() {
      window.removeEventListener("pointerdown", passer, true);
      window.removeEventListener("keydown", passer, true);
    }
    window.addEventListener("pointerdown", passer, true);
    window.addEventListener("keydown", passer, true);
    const fin = window.setTimeout(retirer, 3000);
    return () => {
      window.clearTimeout(fin);
      retirer();
    };
  }, []);
  return null;
}
