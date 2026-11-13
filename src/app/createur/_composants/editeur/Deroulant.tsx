"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

type Props = {
  libelle: string;
  bouton: React.ReactNode;
  actif?: boolean;
  aDroite?: boolean;
  children: (fermer: () => void) => React.ReactNode;
};

/** Bouton qui ouvre un petit panneau (couleurs, styles…). Se ferme avec Échap ou en cliquant ailleurs. */
export function Deroulant({ libelle, bouton, actif = false, aDroite = false, children }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const id = useId();
  const panneau = useRef<HTMLDivElement>(null);

  // Garde le panneau entièrement visible : s'il dépasse d'un bord de la fenêtre, on le décale.
  useLayoutEffect(() => {
    const el = panneau.current;
    if (!ouvert || !el) return;
    const recaler = () => {
      el.style.transform = "";
      const r = el.getBoundingClientRect();
      const marge = 8;
      let dx = 0;
      if (r.left < marge) dx = marge - r.left;
      else if (r.right > window.innerWidth - marge) dx = window.innerWidth - marge - r.right;
      if (dx) el.style.transform = `translateX(${Math.round(dx)}px)`;
    };
    recaler();
    window.addEventListener("resize", recaler);
    return () => window.removeEventListener("resize", recaler);
  }, [ouvert]);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (zone.current && !zone.current.contains(e.target as Node)) setOuvert(false);
    };
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  return (
    <div ref={zone} className="relative">
      <button
        type="button"
        className="outil"
        aria-label={libelle}
        title={libelle}
        aria-expanded={ouvert}
        aria-controls={id}
        aria-pressed={actif && !ouvert ? true : undefined}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOuvert((o) => !o)}
      >
        {bouton}
      </button>
      {ouvert && (
        <div id={id} ref={panneau} style={{ maxWidth: "calc(100vw - 16px)" }} className={`panneau-flottant top-full mt-1.5 ${aDroite ? "right-0" : "left-0"}`}>
          {children(() => setOuvert(false))}
        </div>
      )}
    </div>
  );
}
