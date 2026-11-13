"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Fenêtre plein écran des ateliers (schémas, logique, sources). Échap ferme, le focus reste dedans. */
export function Modale({ titre, onFermer, children, actions, large = true }: { titre: string; onFermer: () => void; children: ReactNode; actions?: ReactNode; large?: boolean }) {
  const boite = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null;
    boite.current?.querySelector<HTMLElement>("input, textarea, select, button:not(.modale-fermer)")?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onFermer();
      }
      if (e.key === "Tab" && boite.current) {
        const focusables = [...boite.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, textarea, select, [tabindex='0']")];
        if (focusables.length === 0) return;
        const premier = focusables[0];
        const dernier = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === premier) {
          e.preventDefault();
          dernier.focus();
        } else if (!e.shiftKey && document.activeElement === dernier) {
          e.preventDefault();
          premier.focus();
        }
      }
    };
    document.addEventListener("keydown", touche, true);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", touche, true);
      document.body.style.overflow = "";
      precedent?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return createPortal(
    <div className="modale-fond" onPointerDown={(e) => e.target === e.currentTarget && onFermer()}>
      <div ref={boite} className={`modale ${large ? "modale-large" : ""}`} role="dialog" aria-modal="true" aria-label={titre}>
        <header className="modale-entete">
          <h2 className="font-display text-xl font-bold">{titre}</h2>
          <div className="flex items-center gap-2">
            {actions}
            <button type="button" className="bouton-icone modale-fermer" aria-label="Fermer" onClick={onFermer}>
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="modale-corps">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
