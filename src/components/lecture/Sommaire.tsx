"use client";

import { useEffect, useState } from "react";
import type { EntreeSommaire } from "@/lib/sommaire";

/** Sommaire flottant : suit la lecture et met en avant la section en cours. */
export function Sommaire({ entrees }: { entrees: EntreeSommaire[] }) {
  const [actif, setActif] = useState<string | null>(entrees[0]?.id ?? null);

  useEffect(() => {
    const titres = entrees.map((e) => document.getElementById(e.id)).filter((x): x is HTMLElement => x !== null);
    if (titres.length === 0) return;
    const observateur = new IntersectionObserver(
      (vus) => {
        const visibles = vus.filter((v) => v.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles[0]) setActif(visibles[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    titres.forEach((t) => observateur.observe(t));
    return () => observateur.disconnect();
  }, [entrees]);

  if (entrees.length < 2) return null;
  const liste = (
    <ol className="sommaire-liste">
      {entrees.map((e) => (
        <li key={e.id} data-niveau={e.niveau}>
          <a href={`#${e.id}`} aria-current={actif === e.id ? "location" : undefined}>
            {e.texte}
          </a>
        </li>
      ))}
    </ol>
  );
  return (
    <>
      <details className="sommaire-mobile verre masque-immersif xl:hidden">
        <summary>Sommaire</summary>
        {liste}
      </details>
      <nav className="sommaire-flottant masque-immersif hidden xl:block" aria-label="Sommaire de l'article">
        <p className="sommaire-titre">Sommaire</p>
        {liste}
      </nav>
    </>
  );
}
