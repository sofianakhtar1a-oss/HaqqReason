"use client";

import { useLayoutEffect, useRef } from "react";
import { dessiner } from "./rendu";

/**
 * Le texte d'une réponse, en Markdown nettoyé. Pendant la réponse en direct, le dessin se fait
 * au plus une fois par image (requestAnimationFrame) : le texte arrive par petits morceaux.
 */
export function Reponse({ contenu, noms, enDirect = false }: { contenu: string; noms: Map<number, string>; enDirect?: boolean }) {
  const cible = useRef<HTMLDivElement>(null);
  const image = useRef<number | null>(null);
  const dernier = useRef({ contenu, noms });

  useLayoutEffect(() => {
    dernier.current = { contenu, noms };
    const el = cible.current;
    if (!el) return;
    if (!enDirect) {
      if (image.current !== null) cancelAnimationFrame(image.current);
      image.current = null;
      dessiner(el, contenu, noms);
      return;
    }
    if (image.current !== null) return;
    image.current = requestAnimationFrame(() => {
      image.current = null;
      if (cible.current) dessiner(cible.current, dernier.current.contenu, dernier.current.noms);
    });
  }, [contenu, noms, enDirect]);

  useLayoutEffect(
    () => () => {
      if (image.current !== null) cancelAnimationFrame(image.current);
    },
    [],
  );

  return <div ref={cible} className="aia-texte" data-direct={enDirect ? "" : undefined} />;
}
