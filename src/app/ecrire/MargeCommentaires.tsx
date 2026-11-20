"use client";

import type { Editor } from "@tiptap/core";
import { Check, MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { modifierCommentaire } from "./blocs/Marges";

type Props = { editor: Editor; commentaires: { id: string; texte: string; y: number }[] };

/**
 * Les commentaires pour soi, dans la marge de droite, chacun à la hauteur de son passage.
 * Ils ne s'impriment jamais : ils vivent hors de la feuille.
 */
export function MargeCommentaires({ editor, commentaires }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Record<string, number>>({});
  const [edition, setEdition] = useState<{ id: string; texte: string } | null>(null);

  // Deux commentaires proches ne se recouvrent pas : chacun descend sous le précédent.
  useLayoutEffect(() => {
    const el = conteneur.current;
    if (!el) return;
    const cartes = Array.from(el.querySelectorAll<HTMLElement>("[data-carte]"));
    const suite: Record<string, number> = {};
    let bas = -Infinity;
    for (const c of commentaires) {
      const carte = cartes.find((x) => x.dataset.carte === c.id);
      const haut = Math.max(c.y, bas + 8);
      suite[c.id] = haut;
      bas = haut + (carte?.offsetHeight ?? 60);
    }
    setPlaces((avant) => (JSON.stringify(avant) === JSON.stringify(suite) ? avant : suite));
  }, [commentaires, edition]);

  return (
    <div ref={conteneur} className="calame-commentaires sans-impression" aria-label="Commentaires pour soi">
      {commentaires.map((c) => (
        <aside key={c.id} data-carte={c.id} className="calame-commentaire" style={{ top: places[c.id] ?? c.y }}>
          <MessageSquareText className="calame-commentaire-icone" aria-hidden="true" />
          {edition?.id === c.id ? (
            <>
              <textarea className="champ" rows={3} value={edition.texte} onChange={(e) => setEdition({ id: c.id, texte: e.target.value })} aria-label="Texte du commentaire" autoFocus />
              <div className="calame-commentaire-actions">
                <button
                  type="button"
                  onClick={() => {
                    modifierCommentaire(editor, c.id, edition.texte.trim() || c.texte);
                    setEdition(null);
                  }}
                  aria-label="Enregistrer le commentaire"
                >
                  <Check className="size-4" aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <>
              <p>{c.texte}</p>
              <div className="calame-commentaire-actions">
                <button type="button" onClick={() => setEdition({ id: c.id, texte: c.texte })} aria-label="Modifier le commentaire">
                  <Pencil className="size-3.5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => modifierCommentaire(editor, c.id, null)} aria-label="Retirer le commentaire">
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </aside>
      ))}
    </div>
  );
}
