"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Rosace } from "@/components/Rosace";
import { PORTAIL_DUREE_DE_BASE_MS, REGLAGES_PAR_DEFAUT } from "@/lib/reglages";

/**
 * La porte de lumière : quand on entre dans un espace (ou qu'on le quitte), un disque aux couleurs
 * de l'espace s'ouvre depuis le point touché et couvre l'écran ; l'astrolabe s'y trace avec le nom
 * de l'espace, puis la porte s'efface et l'espace apparaît derrière elle.
 *
 * Il suffit de poser data-portail="Nom affiché" sur un lien (et, au besoin, data-portail-sur, et
 * data-portail-accent si la couleur de la porte n'est pas celle du lien). La porte n'apparaît pas
 * si le système demande de réduire les animations, ni pour un clic avec une touche (nouvel onglet),
 * ni pour un lien vers la page où l'on est déjà.
 *
 * Sa durée se règle dans l'espace créateur (Paramètres → Animations) : dureeMs. Toute l'animation
 * s'y ajuste d'un même facteur (les temps ci-dessous et, côté CSS, la variable --portail-f).
 * À 0, la porte est éteinte : les liens naviguent normalement (et le fil d'or prend le relais).
 */

type Passage = {
  cle: number;
  depart: string;
  x: number;
  y: number;
  echelle: number;
  titre: string;
  sur: string | null;
  accent: string | null;
  phase: "ouvre" | "ferme";
};

/** Diamètre du disque avant agrandissement, en pixels (voir .portail-disque). */
const TAILLE = 160;
/** Part du rayon du disque qui est pleinement opaque (voir le dégradé de .portail-disque). */
const PLEIN = 0.86;
/** La navigation part quand la porte couvre déjà presque tout l'écran. */
const LANCEMENT = 240;
/** Durée minimale d'affichage : le temps de voir l'astrolabe se tracer. */
const PRESENCE = 960;
/** Durée de l'effacement (voir .portail[data-phase="ferme"]). */
const FERMETURE = 580;
/** Si la page n'arrive pas, la porte se referme d'elle-même. */
const SECOURS = 7000;

export function Portail({ dureeMs = REGLAGES_PAR_DEFAUT.portail_duree_ms }: { dureeMs?: number }) {
  const eteint = dureeMs <= 0;
  // 1 = le rythme d'origine (1,5 s) ; 2 = deux fois plus lent ; 0,4 = bien plus vif.
  const f = eteint ? 1 : dureeMs / PORTAIL_DUREE_DE_BASE_MS;
  const lancement = LANCEMENT * f;
  const presence = PRESENCE * f;
  const fermeture = FERMETURE * f;
  const secours = Math.max(SECOURS, presence + 6000);
  const router = useRouter();
  const chemin = usePathname();
  const [passage, setPassage] = useState<Passage | null>(null);
  const ouverture = useRef(0);
  const enCours = useRef(false);

  // Porte éteinte : on le dit à la page (le fil d'or accompagne alors aussi ces liens).
  useEffect(() => {
    document.documentElement.toggleAttribute("data-portail-eteint", eteint);
    return () => document.documentElement.removeAttribute("data-portail-eteint");
  }, [eteint]);

  // Le clic est saisi avant que le lien ne navigue : on ouvre la porte, puis on navigue nous-mêmes.
  useEffect(() => {
    if (eteint) return;
    function surClic(e: MouseEvent) {
      if (enCours.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lien = e.target instanceof Element ? e.target.closest("a[data-portail]") : null;
      if (!(lien instanceof HTMLAnchorElement)) return;
      if ((lien.target && lien.target !== "_self") || lien.hasAttribute("download")) return;
      const url = new URL(lien.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      e.preventDefault();
      enCours.current = true;
      const boite = lien.getBoundingClientRect();
      // Au clavier, le clic n'a pas de position : la porte s'ouvre depuis le centre du lien.
      const auClavier = e.detail === 0;
      const x = auClavier ? boite.left + boite.width / 2 : e.clientX;
      const y = auClavier ? boite.top + boite.height / 2 : e.clientY;
      const loin = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      ouverture.current = performance.now();
      setPassage({
        cle: ouverture.current,
        depart: window.location.pathname,
        x,
        y,
        echelle: (loin / ((TAILLE / 2) * PLEIN)) * 1.08,
        titre: lien.dataset.portail ?? "",
        sur: lien.dataset.portailSur ?? null,
        accent: lien.dataset.portailAccent ?? lien.closest("[data-accent]")?.getAttribute("data-accent") ?? null,
        phase: "ouvre",
      });
      const destination = url.pathname + url.search + url.hash;
      window.setTimeout(() => router.push(destination), lancement);
    }
    document.addEventListener("click", surClic, true);
    return () => document.removeEventListener("click", surClic, true);
  }, [router, eteint, lancement]);

  // La nouvelle page est là, encore cachée : ses animations d'entrée attendent que la porte s'efface.
  useLayoutEffect(() => {
    if (!passage || passage.phase !== "ouvre" || chemin === passage.depart) return;
    document.documentElement.setAttribute("data-portail-arret", "");
    const reste = Math.max(140 * f, ouverture.current + presence - performance.now());
    const minuteur = window.setTimeout(() => setPassage((p) => (p ? { ...p, phase: "ferme" } : p)), reste);
    return () => window.clearTimeout(minuteur);
  }, [chemin, passage, presence, f]);

  // Filet de sécurité : la porte ne reste jamais fermée sur l'écran (navigation annulée, échec…).
  useEffect(() => {
    if (!passage || passage.phase !== "ouvre") return;
    const fermer = () => setPassage((p) => (p ? { ...p, phase: "ferme" } : p));
    const minuteur = window.setTimeout(fermer, secours);
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") fermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => {
      window.clearTimeout(minuteur);
      window.removeEventListener("keydown", surTouche);
    };
  }, [passage, secours]);

  useEffect(() => {
    if (passage?.phase !== "ferme") return;
    document.documentElement.removeAttribute("data-portail-arret");
    const minuteur = window.setTimeout(() => {
      enCours.current = false;
      setPassage(null);
    }, fermeture);
    return () => window.clearTimeout(minuteur);
  }, [passage?.phase, fermeture]);

  if (!passage) return null;
  const style = {
    "--porte-x": `${passage.x}px`,
    "--porte-y": `${passage.y}px`,
    "--porte-echelle": passage.echelle.toFixed(2),
    "--portail-f": f.toFixed(3),
  } as React.CSSProperties;
  return (
    <div key={passage.cle} className="portail" data-phase={passage.phase} data-accent={passage.accent ?? undefined} style={style} aria-hidden="true">
      <div className="portail-disque" />
      <div className="portail-coeur">
        <Rosace className="portail-rosace" />
      </div>
      <div className="portail-textes">
        {passage.sur && <p className="portail-sur">{passage.sur}</p>}
        <p className="portail-titre">{passage.titre}</p>
      </div>
    </div>
  );
}
