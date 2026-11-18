"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Le fil d'or : pendant le passage d'une page à l'autre, un fil d'or se tire en haut de l'écran,
 * une petite étoile à sa pointe. Il ne paraît que si la page tarde (au-delà de ATTENTE), avance
 * vite puis de plus en plus lentement, et se termine d'un trait dès que la nouvelle page est là.
 *
 * Les portes de lumière (liens data-portail, voir Portail.tsx) ont leur propre passage : le fil
 * ne s'y ajoute pas. Les téléchargements, les liens externes, les nouveaux onglets et les ancres
 * de la même page non plus. Si le système demande de réduire les animations, le fil ne glisse
 * pas : il apparaît, immobile, puis disparaît.
 */

/** Une navigation plus rapide que cela n'affiche rien : pas de clignotement. */
const ATTENTE = 120;
/** Si la page n'arrive jamais (lien intercepté, navigation annulée), le fil s'efface tout seul. */
const SECOURS = 9000;
/** Le fil court en 9 s vers 90 % : vite au début, puis de plus en plus lentement. */
const DUREE = 9000;
const ETAPES = [
  { offset: 0, p: 0 },
  { offset: 0.06, p: 0.32 },
  { offset: 0.25, p: 0.6 },
  { offset: 0.6, p: 0.8 },
  { offset: 1, p: 0.9 },
];
const SORTIE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Phase = "repos" | "attente" | "court" | "fin";

function Fil() {
  const chemin = usePathname();
  const recherche = useSearchParams();
  const cle = `${chemin}?${recherche?.toString() ?? ""}`;
  const racine = useRef<HTMLDivElement>(null);
  const trait = useRef<HTMLSpanElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const terminer = useRef<() => void>(() => undefined);
  const derniere = useRef(cle);

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
    let phase: Phase = "repos";
    let minuteur = 0;
    let secours = 0;
    let animations: Animation[] = [];

    function annuler() {
      window.clearTimeout(minuteur);
      window.clearTimeout(secours);
      for (const a of animations) a.cancel();
      animations = [];
      racine.current?.removeAttribute("data-actif");
      trait.current?.style.removeProperty("transform");
      rail.current?.style.removeProperty("transform");
      phase = "repos";
    }

    function montrer() {
      const r = racine.current;
      const t = trait.current;
      const l = rail.current;
      if (phase !== "attente" || !r || !t || !l) return;
      phase = "court";
      r.setAttribute("data-actif", "");
      if (reduit.matches) {
        t.style.transform = "scaleX(0.5)";
        l.style.transform = "translate3d(50%, 0, 0)";
        return;
      }
      const options: KeyframeAnimationOptions = { duration: DUREE, fill: "forwards" };
      animations = [
        t.animate(
          ETAPES.map(({ offset, p }) => ({ offset, transform: `scaleX(${p})` })),
          options,
        ),
        l.animate(
          ETAPES.map(({ offset, p }) => ({ offset, transform: `translate3d(${p * 100}%, 0, 0)` })),
          options,
        ),
      ];
    }

    function finir() {
      window.clearTimeout(minuteur);
      window.clearTimeout(secours);
      // La page est arrivée avant que le fil ne paraisse : rien à montrer.
      if (phase === "attente") {
        phase = "repos";
        return;
      }
      const r = racine.current;
      const t = trait.current;
      const l = rail.current;
      if (phase !== "court" || !r || !t || !l) return;
      phase = "fin";
      if (reduit.matches) {
        annuler();
        return;
      }
      // On repart de là où le fil en est (sans à-coup), et on le tire jusqu'au bout.
      const deT = getComputedStyle(t).transform;
      const deL = getComputedStyle(l).transform;
      for (const a of animations) a.cancel();
      const options: KeyframeAnimationOptions = { duration: 260, easing: SORTIE, fill: "forwards" };
      const fondu = r.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, delay: 220, fill: "forwards" });
      animations = [
        t.animate([{ transform: deT === "none" ? "scaleX(0)" : deT }, { transform: "scaleX(1)" }], options),
        l.animate([{ transform: deL === "none" ? "translate3d(0, 0, 0)" : deL }, { transform: "translate3d(100%, 0, 0)" }], options),
        fondu,
      ];
      fondu.finished.then(() => {
        if (phase === "fin") annuler();
      }, () => undefined);
    }

    function demarrer() {
      annuler();
      phase = "attente";
      minuteur = window.setTimeout(montrer, ATTENTE);
      secours = window.setTimeout(finir, SECOURS);
    }

    function surClic(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lien = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(lien instanceof HTMLAnchorElement)) return;
      if ((lien.target && lien.target !== "_self") || lien.hasAttribute("download")) return;
      // La porte de lumière fait déjà le passage (sauf quand les animations sont réduites).
      if (lien.hasAttribute("data-portail") && !reduit.matches) return;
      let url: URL;
      try {
        url = new URL(lien.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith("/fichiers/") || url.searchParams.has("telecharger")) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      demarrer();
    }

    // Retour par le bouton « précédent » depuis le cache du navigateur : la page revient telle
    // qu'elle était au départ, fil compris. On l'efface.
    function surRetour(e: PageTransitionEvent) {
      if (e.persisted) annuler();
    }

    terminer.current = finir;
    // Capturé tout en haut, avant que les liens ne traitent le clic.
    window.addEventListener("click", surClic, true);
    window.addEventListener("pageshow", surRetour);
    return () => {
      window.removeEventListener("click", surClic, true);
      window.removeEventListener("pageshow", surRetour);
      terminer.current = () => undefined;
      annuler();
    };
  }, []);

  // La nouvelle page est là : le fil se termine.
  useEffect(() => {
    if (cle === derniere.current) return;
    derniere.current = cle;
    terminer.current();
  }, [cle]);

  return (
    <div ref={racine} className="fil-or" aria-hidden="true">
      <span ref={trait} className="fil-or-trait" />
      <span ref={rail} className="fil-or-rail">
        <span className="fil-or-tete" />
      </span>
    </div>
  );
}

export function FilDOr() {
  return (
    <Suspense fallback={null}>
      <Fil />
    </Suspense>
  );
}
