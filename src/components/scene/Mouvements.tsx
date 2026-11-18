"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Les mouvements de la scène, pour tout le site :
 * - les éléments marqués data-revele apparaissent en cascade quand on les fait défiler jusqu'à eux ;
 * - les cartes marquées data-inclinaison s'inclinent sous le curseur, avec un reflet qui le suit ;
 * - les couches marquées data-couche glissent un peu avec la souris, ou quand on incline le téléphone ;
 * - l'alidade de l'astrolabe (data-viseur) vise le curseur, ou la carte que l'on survole.
 *
 * Rien de tout cela ne se lance quand le système demande de réduire les animations.
 * On ne touche qu'à transform et opacity, et on ne calcule qu'une fois par image.
 */
export function Mouvements() {
  const chemin = usePathname();

  // Après une première visite de l'accueil, son entrée se rejoue plus vite.
  useEffect(() => {
    if (chemin !== "/") return;
    const minuteur = window.setTimeout(() => document.documentElement.setAttribute("data-deja-venu", ""), 2500);
    return () => window.clearTimeout(minuteur);
  }, [chemin]);

  useEffect(() => {
    const racine = document.documentElement;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fin = window.matchMedia("(hover: hover) and (pointer: fine)");
    let actif = !reduit.matches;

    /* ---------------- Révélations au défilement ---------------- */
    const revelations =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            (entrees) => {
              const visibles = entrees
                .filter((e) => e.isIntersecting)
                .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
              let rang = 0;
              for (const e of visibles) {
                const el = e.target as HTMLElement;
                revelations?.unobserve(el);
                // Sauté par un défilement rapide (déjà au-dessus de l'écran) : il est montré tel quel.
                if (e.boundingClientRect.bottom <= 0) {
                  el.setAttribute("data-vu", "deja");
                  continue;
                }
                // Ceux qui arrivent ensemble se suivent : la cascade se fait d'elle-même.
                el.style.setProperty("--rang-vu", String(Math.min(rang++, 9)));
                el.setAttribute("data-vu", "1");
              }
            },
            // La zone surveillée s'étend loin au-dessus de l'écran : rien ne reste caché après un saut.
            { rootMargin: "4000px 0px -6% 0px" },
          )
        : null;

    /** Inscrit un élément à révéler. Au tout premier passage, ce qui est déjà à l'écran reste tel quel. */
    function inscrire(el: Element, initial: boolean) {
      if (!revelations || !(el instanceof HTMLElement) || el.hasAttribute("data-vu")) return;
      if (initial && el.getBoundingClientRect().top < window.innerHeight) {
        el.setAttribute("data-vu", "deja");
        return;
      }
      revelations.observe(el);
    }

    function lancerRevelations() {
      if (!revelations) return;
      document.querySelectorAll("[data-revele]").forEach((el) => inscrire(el, true));
      racine.classList.add("scene");
    }

    /* ---------------- Inclinaison, profondeur, alidade ---------------- */
    let x = -1;
    let y = -1;
    let sousLeCurseur: Element | null = null;
    let carte: HTMLElement | null = null;
    let boiteCarte: DOMRect | null = null;
    let couches: HTMLElement[] = [];
    let viseur: HTMLElement | null = null;
    let centreViseur: { x: number; y: number } | null = null;
    let perimees = true;
    let image = 0;
    // Profondeur : la cible (souris ou gyroscope) et la position lissée, de -1 à 1.
    let cibleX = 0;
    let cibleY = 0;
    let posX = 0;
    let posY = 0;
    // Alidade : angle courant et angle visé, en degrés (0 = vers le haut, sens des aiguilles d'une montre).
    let angle = 0;
    let angleVise = 0;
    let pilote = false;
    let orientation = false;
    let base: { g: number; b: number } | null = null;

    function rafraichir() {
      perimees = false;
      // L'aurore ne dérive que sur les pages de scène (voir scene.css).
      racine.toggleAttribute("data-scene-vive", actif && document.querySelector(".accueil, .halos, .perdu") !== null);
      couches = Array.from(document.querySelectorAll<HTMLElement>("[data-couche]"));
      const nouveau = document.querySelector<HTMLElement>("[data-viseur]");
      if (nouveau !== viseur) {
        viseur = nouveau;
        pilote = false;
      }
      centreViseur = null;
      // Le gyroscope n'écoute que s'il y a des couches à bouger, et seulement sur un écran tactile.
      const veutOrientation = actif && !fin.matches && couches.length > 0 && "DeviceOrientationEvent" in window;
      if (veutOrientation && !orientation) {
        window.addEventListener("deviceorientation", surOrientation);
        orientation = true;
      } else if (!veutOrientation && orientation) {
        window.removeEventListener("deviceorientation", surOrientation);
        orientation = false;
        base = null;
      }
    }

    function planifier() {
      if (!image) image = requestAnimationFrame(dessiner);
    }

    function lacherCarte() {
      if (!carte) return;
      carte.removeAttribute("data-survol");
      carte.style.removeProperty("--incl-x");
      carte.style.removeProperty("--incl-y");
      carte = null;
      boiteCarte = null;
    }

    function dessiner() {
      image = 0;
      if (!actif) return;
      if (perimees) rafraichir();
      let encore = false;

      // Lectures d'abord (positions), écritures ensuite : une seule mise en page par image.
      if (x >= 0 && sousLeCurseur === null) sousLeCurseur = document.elementFromPoint(x, y);
      const survolee = fin.matches && sousLeCurseur instanceof Element ? (sousLeCurseur.closest("[data-inclinaison]") as HTMLElement | null) : null;
      if (survolee !== carte) {
        lacherCarte();
        if (survolee) {
          carte = survolee;
          boiteCarte = survolee.getBoundingClientRect();
          carte.setAttribute("data-survol", "");
        }
      }
      if (viseur && pilote && !centreViseur) {
        const b = viseur.getBoundingClientRect();
        centreViseur = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      }
      let visee: { x: number; y: number } | null = x >= 0 ? { x, y } : null;
      const cible = sousLeCurseur instanceof Element ? sousLeCurseur.closest("[data-cible]") : null;
      if (cible) {
        const b = cible.getBoundingClientRect();
        visee = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
      }

      if (carte && boiteCarte && x >= 0) {
        const mx = x - boiteCarte.left;
        const my = y - boiteCarte.top;
        const force = Number(carte.dataset.inclinaison) || 7;
        carte.style.setProperty("--incl-x", `${(-(my / boiteCarte.height - 0.5) * force).toFixed(2)}deg`);
        carte.style.setProperty("--incl-y", `${((mx / boiteCarte.width - 0.5) * force).toFixed(2)}deg`);
        carte.style.setProperty("--mx", `${mx.toFixed(1)}px`);
        carte.style.setProperty("--my", `${my.toFixed(1)}px`);
      }

      if (couches.length) {
        posX += (cibleX - posX) * 0.07;
        posY += (cibleY - posY) * 0.07;
        if (Math.abs(cibleX - posX) > 0.0005 || Math.abs(cibleY - posY) > 0.0005) encore = true;
        for (const couche of couches) {
          const [ax = 0, ay = 0] = (couche.dataset.couche ?? "").split(",").map(Number);
          couche.style.transform = `translate3d(${(posX * ax).toFixed(2)}px, ${(posY * ay).toFixed(2)}px, 0)`;
        }
      }

      if (viseur && fin.matches && visee) {
        if (!pilote) {
          // L'alidade tournait toute seule : on la reprend là où elle en est, sans à-coup.
          const t = getComputedStyle(viseur).transform;
          const m = t && t !== "none" ? new DOMMatrixReadOnly(t) : null;
          angle = m ? (Math.atan2(m.b, m.a) * 180) / Math.PI : 0;
          pilote = true;
          viseur.setAttribute("data-pilote", "");
          const b = viseur.getBoundingClientRect();
          centreViseur = { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        }
        if (centreViseur) {
          const brut = (Math.atan2(visee.x - centreViseur.x, -(visee.y - centreViseur.y)) * 180) / Math.PI;
          angleVise = angle + ((((brut - angle) % 360) + 540) % 360) - 180;
        }
      }
      if (viseur && pilote) {
        const ecart = angleVise - angle;
        angle += ecart * 0.09;
        if (Math.abs(ecart) > 0.05) encore = true;
        viseur.style.transform = `rotate(${angle.toFixed(2)}deg)`;
      }

      if (encore) planifier();
    }

    function surPointeur(e: PointerEvent) {
      if (!actif || e.pointerType === "touch") return;
      x = e.clientX;
      y = e.clientY;
      sousLeCurseur = e.target instanceof Element ? e.target : null;
      if (fin.matches) {
        cibleX = (x / window.innerWidth) * 2 - 1;
        cibleY = (y / window.innerHeight) * 2 - 1;
      }
      planifier();
    }

    function surSortie(e: PointerEvent) {
      if (e.relatedTarget) return;
      // Le curseur a quitté la fenêtre : tout revient doucement au repos.
      x = -1;
      y = -1;
      sousLeCurseur = null;
      cibleX = 0;
      cibleY = 0;
      lacherCarte();
      planifier();
    }

    function surDefilement() {
      // Le contenu a bougé sous un curseur immobile : on recalcule ce qu'il survole.
      boiteCarte = null;
      centreViseur = null;
      if (carte) lacherCarte();
      if (x >= 0) {
        sousLeCurseur = null;
        planifier();
      }
    }

    function surOrientation(e: DeviceOrientationEvent) {
      if (!actif || e.gamma === null || e.beta === null) return;
      if (!base) base = { g: e.gamma, b: e.beta };
      // La position de repos suit lentement la façon dont on tient le téléphone.
      base.g += (e.gamma - base.g) * 0.006;
      base.b += (e.beta - base.b) * 0.006;
      cibleX = Math.max(-1, Math.min(1, (e.gamma - base.g) / 14));
      cibleY = Math.max(-1, Math.min(1, (e.beta - base.b) / 14));
      planifier();
    }

    const observateur = new MutationObserver((mutations) => {
      let change = false;
      for (const m of mutations) {
        // Ce qui s'écrit dans un éditeur (Le Calame) ne nous concerne pas.
        if (m.target instanceof Element && m.target.closest("[contenteditable]:not([contenteditable='false'])")) continue;
        change = true;
        for (const n of m.addedNodes) {
          if (!(n instanceof Element)) continue;
          if (n.matches("[data-revele]")) inscrire(n, false);
          if (n.firstElementChild) n.querySelectorAll("[data-revele]").forEach((el) => inscrire(el, false));
        }
      }
      if (change) {
        perimees = true;
        if (actif) planifier();
      }
    });

    function arreter() {
      racine.classList.remove("scene");
      racine.removeAttribute("data-scene-vive");
      lacherCarte();
      for (const couche of couches) couche.style.removeProperty("transform");
      if (viseur) {
        viseur.style.removeProperty("transform");
        viseur.removeAttribute("data-pilote");
      }
      pilote = false;
    }

    function surPreference() {
      actif = !reduit.matches;
      if (actif) {
        lancerRevelations();
        perimees = true;
        planifier();
      } else {
        arreter();
        rafraichir();
      }
    }

    if (actif) lancerRevelations();
    observateur.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("pointermove", surPointeur, { passive: true });
    document.addEventListener("pointerout", surSortie, { passive: true });
    window.addEventListener("scroll", surDefilement, { passive: true });
    window.addEventListener("resize", surDefilement, { passive: true });
    reduit.addEventListener("change", surPreference);
    planifier();

    return () => {
      observateur.disconnect();
      revelations?.disconnect();
      document.removeEventListener("pointermove", surPointeur);
      document.removeEventListener("pointerout", surSortie);
      window.removeEventListener("scroll", surDefilement);
      window.removeEventListener("resize", surDefilement);
      window.removeEventListener("deviceorientation", surOrientation);
      reduit.removeEventListener("change", surPreference);
      if (image) cancelAnimationFrame(image);
      arreter();
    };
  }, []);

  return null;
}
