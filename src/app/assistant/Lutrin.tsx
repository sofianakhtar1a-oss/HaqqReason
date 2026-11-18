"use client";

import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { api, ErreurApi, type FicheDocument } from "./api";

/**
 * Le lutrin : la page citée par une référence « [Doc 2, p. 14] », telle qu'elle a été extraite
 * du PDF. De quoi vérifier une réponse d'un coup d'œil, page précédente et suivante comprises.
 */
export function Lutrin({ document, page, onPage, onFermer }: { document: FicheDocument; page: number; onPage: (n: number) => void; onFermer: () => void }) {
  const [etat, setEtat] = useState<{ page: number; texte?: string; erreur?: string } | null>(null);
  const fermer = useRef<HTMLButtonElement>(null);
  const titre = useId();

  useEffect(() => {
    let vivant = true;
    api
      .page(document.id, page)
      .then((r) => vivant && setEtat({ page, texte: r.texte }))
      .catch((e) => vivant && setEtat({ page, erreur: e instanceof ErreurApi ? e.message : "Cette page n'a pas pu être lue." }));
    return () => {
      vivant = false;
    };
  }, [document.id, page]);

  useEffect(() => {
    fermer.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer]);

  const charge = etat?.page === page;
  return (
    <aside className="aia-feuille aia-lutrin" role="dialog" aria-modal="false" aria-labelledby={titre}>
      <div className="aia-feuille-tete">
        <div className="min-w-0">
          <p className="aia-lutrin-doc">Doc {document.numero}</p>
          <h2 id={titre} className="aia-lutrin-nom" title={document.nom}>
            {document.nom}
          </h2>
        </div>
        <button ref={fermer} type="button" className="bouton-icone" onClick={onFermer} aria-label="Fermer la page">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="aia-lutrin-pages">
        <button type="button" className="bouton-icone" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente">
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <span>
          Page {page} sur {document.pages}
        </span>
        <button type="button" className="bouton-icone" disabled={page >= document.pages} onClick={() => onPage(page + 1)} aria-label="Page suivante">
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
      <div className="aia-feuille-corps">
        {!charge ? (
          <p className="aia-lutrin-attente">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Lecture de la page…
          </p>
        ) : etat?.erreur ? (
          <p className="message message-erreur">{etat.erreur}</p>
        ) : etat?.texte?.trim() ? (
          <div className="aia-lutrin-texte">{etat.texte}</div>
        ) : (
          <p className="aide">Cette page ne contient pas de texte lisible (image ou page blanche).</p>
        )}
        <p className="aide aia-lutrin-note">Texte extrait automatiquement du PDF : la mise en page d&apos;origine (colonnes, tableaux, notes) peut être simplifiée.</p>
      </div>
    </aside>
  );
}
