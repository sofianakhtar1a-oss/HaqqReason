"use client";

import type { Editor } from "@tiptap/core";
import type { Transaction } from "@tiptap/pm/state";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { CLE_NUMEROS, titresNumerotes, type NumeroTitre } from "../extensions/numeros";
import { allerAuTitre } from "../plan";
import { useMiseEnPage } from "../pages-store";

function lire(editor: Editor): NumeroTitre[] {
  const numerotes = CLE_NUMEROS.getState(editor.state)?.reglages.titres ?? false;
  return titresNumerotes(editor.state.doc, numerotes).filter((t) => t.texte !== "");
}

/**
 * La table des matières du Calame : celle d'un livre. Chaque titre, son numéro s'il y en a,
 * des points de conduite et le numéro de la page où il tombe — le même qu'à l'impression,
 * puisque l'écran et le papier partagent la même mise en page. Un clic y emmène.
 */
export function VueSommaireCalame({ node, editor, selected }: NodeViewProps) {
  const profondeur = Number(node.attrs.profondeur ?? 4) || 4;
  const intitule = String(node.attrs.titre ?? "") || "Table des matières";
  const mep = useMiseEnPage(editor);
  const [titres, setTitres] = useState<NumeroTitre[]>(() => lire(editor));
  useEffect(() => {
    const relire = ({ transaction }: { transaction: Transaction }) => {
      if (transaction.docChanged || transaction.getMeta(CLE_NUMEROS) !== undefined) setTitres(lire(editor));
    };
    editor.on("transaction", relire);
    return () => {
      editor.off("transaction", relire);
    };
  }, [editor]);
  const entrees = titres.filter((t) => t.niveau <= profondeur);

  return (
    <NodeViewWrapper as="nav" className="calame-sommaire" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false} aria-label={intitule}>
      <p className="calame-sommaire-titre">{intitule}</p>
      {entrees.length === 0 ? (
        <p className="calame-sommaire-vide">Les titres du document viendront ici, avec le numéro de leur page.</p>
      ) : (
        <ol>
          {entrees.map((e) => (
            <li key={e.ordinal} data-niveau={e.niveau} data-ordinal={e.ordinal}>
              <button type="button" onClick={() => allerAuTitre(editor, e.pos)}>
                <span className="calame-sommaire-texte">
                  {e.numero && <span className="calame-sommaire-numero">{e.numero}</span>}
                  {e.texte}
                </span>
                <span className="calame-sommaire-points" aria-hidden="true" />
                <span className="calame-sommaire-page">{mep.titres.get(e.ordinal) ?? ""}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </NodeViewWrapper>
  );
}
