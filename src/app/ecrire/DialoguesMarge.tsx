"use client";

import type { Editor } from "@tiptap/core";
import { useMemo, useState } from "react";
import type { DocumentAtelier } from "@/lib/atelier/modele";
import { Fenetre } from "./Fenetre";
import { ciblesDuDocument } from "./blocs/References";
import { ajouterCommentaire, poserLienInterne } from "./blocs/Marges";

/** Écrire un commentaire pour soi sur le passage sélectionné. */
export function DialogueCommentaire({ editor, surFermer }: { editor: Editor; surFermer: () => void }) {
  const [texte, setTexte] = useState("");
  const extrait = useMemo(() => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, " ").slice(0, 140);
  }, [editor]);
  return (
    <Fenetre
      titre="Commentaire pour toi"
      sousTitre="Il s'affiche dans la marge, à côté du passage. Il ne s'imprime jamais."
      surFermer={surFermer}
      largeur={32}
      pied={
        <button
          type="button"
          className="bouton bouton-principal"
          disabled={!texte.trim()}
          onClick={() => {
            ajouterCommentaire(editor, texte);
            surFermer();
          }}
        >
          Ajouter le commentaire
        </button>
      }
    >
      {extrait && <blockquote className="calame-extrait-commente">« {extrait} »</blockquote>}
      <textarea className="champ" rows={4} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Vérifier la source, reformuler, ajouter un exemple…" aria-label="Texte du commentaire" autoFocus />
    </Fenetre>
  );
}

/** Lier la sélection à une partie du document, ou à un autre document du Calame. */
export function DialogueLien({ editor, documents, docId, surFermer }: { editor: Editor; documents: DocumentAtelier[]; docId: string; surFermer: () => void }) {
  const [onglet, setOnglet] = useState<"partie" | "document">("partie");
  const [filtre, setFiltre] = useState("");
  const titres = useMemo(() => ciblesDuDocument(editor.state.doc).filter((c) => c.genre === "titre"), [editor]);
  const q = filtre.trim().toLowerCase();
  const autres = documents.filter((d) => d.id !== docId && !d.corbeille && (!q || d.titre.toLowerCase().includes(q)));
  const parties = titres.filter((t) => !q || t.texte.toLowerCase().includes(q));
  return (
    <Fenetre titre="Lien interne" sousTitre="Ctrl + clic sur le lien (⌘ + clic sur Mac) pour s'y rendre." surFermer={surFermer} largeur={34}>
      <div className="grid gap-3">
        <div className="inspecteur-choix" role="tablist" aria-label="Vers où">
          <button type="button" role="tab" className="puce-module" aria-selected={onglet === "partie"} onClick={() => setOnglet("partie")}>
            Une partie de ce document
          </button>
          <button type="button" role="tab" className="puce-module" aria-selected={onglet === "document"} onClick={() => setOnglet("document")}>
            Un autre document
          </button>
        </div>
        <input className="champ" value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Chercher…" aria-label="Chercher la cible du lien" autoFocus />
        <ul className="calame-cibles">
          {onglet === "partie" &&
            (parties.length === 0 ? (
              <li className="inspecteur-aide">Aucun titre dans ce document pour l&apos;instant.</li>
            ) : (
              parties.map((t) => (
                <li key={t.pos}>
                  <button
                    type="button"
                    className="calame-cible"
                    data-niveau={t.niveau}
                    onClick={() => {
                      poserLienInterne(editor, { pos: t.pos, ancre: t.ancre, texte: t.texte });
                      surFermer();
                    }}
                  >
                    <span className="calame-cible-genre">{t.numero || "Titre"}</span>
                    <span className="calame-cible-texte">{t.texte || "Sans titre"}</span>
                  </button>
                </li>
              ))
            ))}
          {onglet === "document" &&
            (autres.length === 0 ? (
              <li className="inspecteur-aide">Aucun autre document.</li>
            ) : (
              autres.slice(0, 200).map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className="calame-cible"
                    onClick={() => {
                      poserLienInterne(editor, { document: d.id, texte: d.titre || "Sans titre" });
                      surFermer();
                    }}
                  >
                    <span className="calame-cible-genre">Document</span>
                    <span className="calame-cible-texte">{d.titre || "Sans titre"}</span>
                  </button>
                </li>
              ))
            ))}
        </ul>
      </div>
    </Fenetre>
  );
}
