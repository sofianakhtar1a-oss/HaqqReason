"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * La lampe du copiste : sur ordinateur, là où passe la souris, la trame à huit branches du fond
 * accroche une lumière d'or, comme un motif doré sous la flamme d'une lampe.
 *
 * Elle reste éteinte là où l'on lit ou écrit (rien ne doit bouger derrière le texte), sur écran
 * tactile, quand le système demande de réduire les animations, quand l'animation de la scène est
 * mise en pause, et quand l'onglet est caché. Elle ne bouge que par transform, une fois par image.
 */

/** Là où l'on lit ou écrit, la lampe reste éteinte. */
const SURFACES_CALMES = "[data-lecture], .lecture-article, .livre-corps, .calame-flux, .tiptap, .lg-fidele, .textLayer";
/** La pause choisie sur l'accueil (voir BoutonPauseScene) vaut pour tout le site. */
const CLE_PAUSE = "hr-scene-pause";

export function Lampe() {
  const chemin = usePathname();
  const revoir = useRef<() => void>(() => undefined);

  useEffect(() => {
    const racine = document.documentElement;
    const fin = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
    try {
      if (localStorage.getItem(CLE_PAUSE) === "1") racine.dataset.scenePause = "";
    } catch {}

    const lampe = document.createElement("div");
    lampe.className = "lampe";
    lampe.setAttribute("aria-hidden", "true");
    const trame = document.createElement("div");
    trame.className = "lampe-trame";
    lampe.append(trame);
    document.body.append(lampe);

    let rayon = 240;
    let x = -1;
    let y = -1;
    let image = 0;
    let allumee = false;
    let calme = false;
    let verifie = -Infinity;

    function mesurer() {
      rayon = lampe.offsetWidth / 2 || rayon;
    }

    function permise() {
      if (!fin.matches || reduit.matches || document.hidden || racine.hasAttribute("data-scene-pause")) return false;
      const maintenant = performance.now();
      // La page change sous la souris (navigation, contenu chargé) : on regarde de temps en temps.
      if (maintenant - verifie > 700) {
        calme = document.querySelector(SURFACES_CALMES) !== null;
        verifie = maintenant;
      }
      return !calme;
    }

    function eteindre() {
      if (!allumee) return;
      allumee = false;
      lampe.removeAttribute("data-allumee");
    }

    function dessiner() {
      image = 0;
      if (x < 0 || !permise()) {
        eteindre();
        return;
      }
      lampe.style.transform = `translate3d(${(x - rayon).toFixed(1)}px, ${(y - rayon).toFixed(1)}px, 0)`;
      trame.style.transform = `translate3d(${(rayon - x).toFixed(1)}px, ${(rayon - y).toFixed(1)}px, 0)`;
      if (!allumee) {
        allumee = true;
        lampe.setAttribute("data-allumee", "");
      }
    }

    function planifier() {
      if (!image) image = requestAnimationFrame(dessiner);
    }

    function surPointeur(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      planifier();
    }

    function surSortie(e: PointerEvent) {
      if (e.relatedTarget) return;
      x = -1;
      eteindre();
    }

    function surVisibilite() {
      if (document.hidden) eteindre();
    }

    function relancer() {
      verifie = -Infinity;
      planifier();
    }
    revoir.current = relancer;

    mesurer();
    document.addEventListener("pointermove", surPointeur, { passive: true });
    document.addEventListener("pointerout", surSortie, { passive: true });
    document.addEventListener("visibilitychange", surVisibilite);
    window.addEventListener("resize", mesurer, { passive: true });
    reduit.addEventListener("change", relancer);
    fin.addEventListener("change", relancer);
    // La pause de la scène se pose ou s'enlève sur <html> : la lampe suit aussitôt.
    const pause = new MutationObserver(relancer);
    pause.observe(racine, { attributes: true, attributeFilter: ["data-scene-pause"] });

    return () => {
      document.removeEventListener("pointermove", surPointeur);
      document.removeEventListener("pointerout", surSortie);
      document.removeEventListener("visibilitychange", surVisibilite);
      window.removeEventListener("resize", mesurer);
      reduit.removeEventListener("change", relancer);
      fin.removeEventListener("change", relancer);
      pause.disconnect();
      if (image) cancelAnimationFrame(image);
      revoir.current = () => undefined;
      lampe.remove();
    };
  }, []);

  // Nouvelle page : on revoit aussitôt si c'est un lieu de lecture, où la lampe s'éteint.
  useEffect(() => {
    revoir.current();
    const minuteur = window.setTimeout(() => revoir.current(), 400);
    return () => window.clearTimeout(minuteur);
  }, [chemin]);

  return null;
}
