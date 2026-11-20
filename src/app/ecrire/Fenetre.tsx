"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

type Props = {
  titre: string;
  sousTitre?: string;
  surFermer: () => void;
  children: React.ReactNode;
  /** Largeur maximale (rem). */
  largeur?: number;
  pied?: React.ReactNode;
};

/**
 * Une fenêtre de l'atelier : par-dessus la page, fermée par Échap, par le fond ou
 * par la croix ; le focus y entre à l'ouverture et revient d'où il venait ensuite.
 */
export function Fenetre({ titre, sousTitre, surFermer, children, largeur = 42, pied }: Props) {
  const id = useId();
  const boite = useRef<HTMLDivElement>(null);
  const fermerRef = useRef(surFermer);

  useEffect(() => {
    fermerRef.current = surFermer;
  }, [surFermer]);

  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    const premier = boite.current?.querySelector<HTMLElement>("[autofocus], input, select, textarea, button:not([data-fermer])");
    (premier ?? boite.current)?.focus();
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fermerRef.current();
      } else if (e.key === "Tab" && boite.current) {
        const focusables = [...boite.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute("disabled"));
        if (focusables.length === 0) return;
        const premierEl = focusables[0];
        const dernierEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === premierEl) {
          e.preventDefault();
          dernierEl.focus();
        } else if (!e.shiftKey && document.activeElement === dernierEl) {
          e.preventDefault();
          premierEl.focus();
        }
      }
    };
    window.addEventListener("keydown", auClavier, true);
    return () => {
      window.removeEventListener("keydown", auClavier, true);
      avant?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="calame-fenetre-fond sans-impression" onMouseDown={(e) => e.target === e.currentTarget && surFermer()}>
      <div ref={boite} className="calame-fenetre" role="dialog" aria-modal="true" aria-labelledby={`${id}-titre`} tabIndex={-1} style={{ width: `min(${largeur}rem, 100%)` }}>
        <header className="calame-fenetre-tete">
          <div>
            <h2 id={`${id}-titre`}>{titre}</h2>
            {sousTitre && <p>{sousTitre}</p>}
          </div>
          <button type="button" className="calame-icone" onClick={surFermer} aria-label="Fermer" data-fermer>
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>
        <div className="calame-fenetre-corps">{children}</div>
        {pied && <footer className="calame-fenetre-pied">{pied}</footer>}
      </div>
    </div>,
    document.body,
  );
}
