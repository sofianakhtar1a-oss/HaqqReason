"use client";

import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import type { StyleNomme } from "@/lib/atelier/modele";
import { poserStyleCaractere, poserStyleParagraphe, styleCourant } from "./extensions/styles-nommes";

type Props = { editor: Editor; styles: StyleNomme[] };

/**
 * La liste « Style » de la barre d'outils : un style de paragraphe pour le paragraphe où se
 * trouve le curseur (ou tous ceux de la sélection), un style de caractère pour les mots choisis.
 */
export function SelecteurStyle({ editor, styles }: Props) {
  const etat = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      paragraphe: styleCourant(ed),
      caractere: (ed.getAttributes("styleCaractere").id as string | undefined) ?? null,
      vide: ed.state.selection.empty,
    }),
  });
  const paragraphes = styles.filter((s) => s.genre === "paragraphe");
  const caracteres = styles.filter((s) => s.genre === "caractere");
  const valeur = etat.caractere ? `c:${etat.caractere}` : etat.paragraphe ? `p:${etat.paragraphe}` : "";

  return (
    <label className="calame-selecteur-style">
      <span className="sr-only">Style nommé</span>
      <select
        className="champ"
        value={valeur}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || v === "aucun") {
            poserStyleParagraphe(editor, null);
            if (etat.caractere) poserStyleCaractere(editor, null);
          } else if (v.startsWith("p:")) poserStyleParagraphe(editor, v.slice(2));
          else if (v.startsWith("c:")) poserStyleCaractere(editor, v.slice(2));
        }}
        title="Style nommé (réglé dans l'onglet « Styles »)"
      >
        <option value="">Style…</option>
        <optgroup label="Paragraphe">
          {paragraphes.map((s) => (
            <option key={s.id} value={`p:${s.id}`}>
              {s.nom}
            </option>
          ))}
        </optgroup>
        {caracteres.length > 0 && (
          <optgroup label={etat.vide ? "Caractère (sélectionne d'abord des mots)" : "Caractère"}>
            {caracteres.map((s) => (
              <option key={s.id} value={`c:${s.id}`} disabled={etat.vide}>
                {s.nom}
              </option>
            ))}
          </optgroup>
        )}
        {valeur && <option value="aucun">Retirer le style</option>}
      </select>
    </label>
  );
}
