"use client";

import type { Editor } from "@tiptap/core";
import { BookA, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRevision } from "./crochets";
import { GENRES_REMARQUE, appliquerSuggestion, ignorerRemarque, remarqueParId } from "./extensions/grammaire";
import { TexteSuggestion, ajouterAuDictionnaire } from "./panneaux/PanneauGrammaire";

/*
 * Le Calame — la bulle d'une remarque de relecture : un clic sur un mot souligné (ou F7) montre
 * l'explication et les corrections proposées, juste sous le mot.
 */

export const EVENEMENT_BULLE = "calame:bulle-remarque";

/** Ouvre la bulle d'une remarque (depuis le clavier : le focus y entre). */
export function ouvrirBulle(id: string) {
  window.dispatchEvent(new CustomEvent(EVENEMENT_BULLE, { detail: id }));
}

export function BulleGrammaire({ editor }: { editor: Editor }) {
  useRevision(editor);
  const [ouverte, setOuverte] = useState<{ id: string; clavier: boolean } | null>(null);
  const bulle = useRef<HTMLDivElement>(null);
  const remarque = ouverte ? remarqueParId(editor.state, ouverte.id) : null;

  // Un clic sur un mot souligné ouvre sa bulle ; F7 l'ouvre au clavier.
  useEffect(() => {
    const dom = editor.view.dom as HTMLElement;
    const auClic = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-remarque]");
      if (el && e.button === 0 && !e.altKey && !e.ctrlKey && !e.metaKey) setOuverte({ id: el.dataset.remarque ?? "", clavier: false });
    };
    const surEvenement = (e: Event) => setOuverte({ id: (e as CustomEvent<string>).detail, clavier: true });
    dom.addEventListener("click", auClic);
    window.addEventListener(EVENEMENT_BULLE, surEvenement);
    return () => {
      dom.removeEventListener("click", auClic);
      window.removeEventListener(EVENEMENT_BULLE, surEvenement);
    };
  }, [editor]);

  // La bulle suit le mot quand la page défile ; elle se ferme par Échap ou par un clic ailleurs.
  useLayoutEffect(() => {
    if (!ouverte || !remarque) return;
    const placer = () => {
      const mot = editor.view.dom.querySelector<HTMLElement>(`[data-remarque="${CSS.escape(ouverte.id)}"]`);
      const b = bulle.current;
      if (!b) return;
      if (!mot) {
        b.style.visibility = "hidden";
        return;
      }
      const r = mot.getBoundingClientRect();
      const largeur = b.offsetWidth;
      const hauteur = b.offsetHeight;
      const gauche = Math.max(8, Math.min(window.innerWidth - largeur - 8, r.left));
      const dessous = r.bottom + 6 + hauteur < window.innerHeight - 8;
      b.style.left = `${gauche}px`;
      b.style.top = `${dessous ? r.bottom + 6 : Math.max(8, r.top - hauteur - 6)}px`;
      b.style.visibility = "visible";
    };
    placer();
    let image = 0;
    const plusTard = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(placer);
    };
    window.addEventListener("scroll", plusTard, true);
    window.addEventListener("resize", plusTard);
    return () => {
      cancelAnimationFrame(image);
      window.removeEventListener("scroll", plusTard, true);
      window.removeEventListener("resize", plusTard);
    };
  });

  useEffect(() => {
    if (!ouverte) return;
    // Une image plus tard : après un éventuel « focus » de l'éditeur encore en attente.
    const image = ouverte.clavier ? requestAnimationFrame(() => bulle.current?.querySelector<HTMLElement>(".calame-lt-suggestion, button")?.focus()) : 0;
    const auClavier = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOuverte(null);
      editor.view.focus();
    };
    const ailleurs = (e: MouseEvent) => {
      const cible = e.target as HTMLElement | null;
      if (bulle.current?.contains(cible) || cible?.closest("[data-remarque]")) return;
      setOuverte(null);
    };
    window.addEventListener("keydown", auClavier, true);
    window.addEventListener("mousedown", ailleurs, true);
    return () => {
      cancelAnimationFrame(image);
      window.removeEventListener("keydown", auClavier, true);
      window.removeEventListener("mousedown", ailleurs, true);
    };
  }, [ouverte, editor]);

  if (!ouverte || !remarque) return null;
  const genre = GENRES_REMARQUE.find((g) => g.cle === remarque.genre);
  const fermer = () => {
    setOuverte(null);
    editor.view.focus();
  };

  return createPortal(
    <div ref={bulle} className="calame-lt-bulle sans-impression" data-genre={remarque.genre} role="dialog" aria-label={`Remarque : ${genre?.libelle ?? ""}`} style={{ visibility: "hidden" }} onMouseDown={(e) => e.preventDefault()}>
      <div className="calame-lt-bulle-tete">
        <span className="calame-lt-pastille" aria-hidden="true" />
        <span>{genre?.libelle}</span>
        <button type="button" className="calame-lt-bulle-fermer" onClick={fermer} aria-label="Fermer">
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <p className="calame-lt-bulle-message">{remarque.message}</p>
      {remarque.suggestions.length > 0 && (
        <div className="calame-lt-bulle-suggestions">
          {remarque.suggestions.map((s, i) => (
            <button
              key={`${i}-${s}`}
              type="button"
              className="calame-lt-suggestion"
              onClick={() => {
                appliquerSuggestion(editor, remarque.id, s);
                fermer();
              }}
            >
              <TexteSuggestion texte={s} />
            </button>
          ))}
        </div>
      )}
      <div className="calame-lt-bulle-gestes">
        <button
          type="button"
          className="bouton bouton-discret bouton-petit"
          onClick={() => {
            ignorerRemarque(editor, remarque.id);
            fermer();
          }}
        >
          Ignorer
        </button>
        {remarque.genre === "orthographe" && (
          <button
            type="button"
            className="bouton bouton-discret bouton-petit"
            onClick={() => {
              ajouterAuDictionnaire(editor, remarque.mot);
              fermer();
            }}
          >
            <BookA className="size-4" aria-hidden="true" />
            Ajouter au dictionnaire
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
