"use client";

import { memo } from "react";

export type BlocApercu = { genre: "titre" | "texte" | "image" | "tableau" | "autre"; haut: number; hauteur: number; texte?: string };
export type ApercuPage = { numero: number; ratio: number; blocs: BlocApercu[] };

type Props = { pages: ApercuPage[]; courante: number; surAller: (numero: number) => void };

/**
 * Les pages en miniature : la silhouette de chaque page (titres, paragraphes, images,
 * tableaux à leur place), pour s'y rendre d'un clic. Dessinées à partir de la mise en
 * page déjà calculée : aucune copie du texte, donc aucune lenteur.
 */
export const Miniatures = memo(function Miniatures({ pages, courante, surAller }: Props) {
  if (pages.length === 0) return <p className="calame-vide">Les pages apparaissent dès que le texte est mis en page.</p>;
  return (
    <ol className="calame-miniatures" aria-label="Pages du document">
      {pages.map((p) => (
        <li key={p.numero}>
          <button type="button" className="calame-miniature" aria-current={p.numero === courante ? "page" : undefined} onClick={() => surAller(p.numero)} aria-label={`Aller à la page ${p.numero}`}>
            <span className="calame-miniature-feuille" style={{ aspectRatio: String(p.ratio) }}>
              {p.blocs.map((b, i) => (
                <span key={i} className="calame-miniature-bloc" data-genre={b.genre} style={{ top: `${b.haut * 100}%`, height: `${Math.max(0.6, b.hauteur * 100)}%` }}>
                  {b.genre === "titre" && b.texte ? <span>{b.texte}</span> : null}
                </span>
              ))}
            </span>
            <span className="calame-miniature-numero">{p.numero}</span>
          </button>
        </li>
      ))}
    </ol>
  );
});
