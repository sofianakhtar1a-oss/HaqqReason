"use client";

import type { Editor } from "@tiptap/core";
import { Check, CornerDownRight, MessageSquareText, RotateCcw, Send } from "lucide-react";
import { useState } from "react";
import { couleurDe } from "@/lib/atelier/partage-commun";
import { commentairesDuDocument, repondreCommentaire, resoudreCommentaire } from "../blocs/Marges";
import { usePartageCourant } from "./contexte";

const quand = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const jours = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  return jours === 0 ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

/**
 * Les commentaires du document partagé, en liste : la marge ne se montre que sur un écran large,
 * et ici chacun peut lire, répondre et marquer « résolu » même sur téléphone. Les résolus passent après.
 */
export function ListeCommentaires({ editor }: { editor: Editor }) {
  const { moi, role } = usePartageCourant();
  const [reponse, setReponse] = useState<{ id: string; texte: string } | null>(null);
  const [voirResolus, setVoirResolus] = useState(false);
  const tous = commentairesDuDocument(editor);
  if (tous.length === 0) return <p className="inspecteur-aide">Aucun commentaire : sélectionne un passage, puis « Ajouter un commentaire » (Ctrl+K).</p>;
  const ouverts = tous.filter((c) => !c.resolu);
  const resolus = tous.filter((c) => c.resolu);
  const peutRepondre = Boolean(moi) && role !== "lecture";
  const liste = voirResolus ? [...ouverts, ...resolus] : ouverts;

  return (
    <>
      <ul className="calame-liste-commentaires">
        {liste.map((c) => (
          <li key={c.id} data-resolu={c.resolu ? "" : undefined}>
            <button type="button" className="calame-liste-commentaires-passage" onClick={() => editor.chain().focus().setTextSelection({ from: c.from, to: c.to }).scrollIntoView().run()} title="Aller au passage">
              « {c.extrait} »
            </button>
            <p className="calame-liste-commentaires-texte">
              {c.auteur ? (
                <>
                  <span className="calame-personne-pastille" style={{ background: couleurDe(c.compte || c.auteur) }} aria-hidden="true">
                    {c.auteur.charAt(0)}
                  </span>
                  <strong>{c.auteur}</strong> <span className="calame-liste-commentaires-quand">{quand(c.quand)}</span>{" "}
                </>
              ) : (
                <MessageSquareText className="inline size-3.5" aria-hidden="true" />
              )}
              {c.texte}
            </p>
            {(c.reponses ?? []).map((r, i) => (
              <p key={`${r.quand}-${i}`} className="calame-liste-commentaires-reponse">
                <CornerDownRight className="size-3" aria-hidden="true" />
                <span>
                  <strong>{r.nom}</strong> {r.texte}
                </span>
              </p>
            ))}
            {peutRepondre && moi && (
              <div className="calame-liste-commentaires-gestes">
                {reponse?.id === c.id ? (
                  <form
                    className="calame-commentaire-repondre"
                    onSubmit={(e) => {
                      e.preventDefault();
                      repondreCommentaire(editor, c.id, { compte: moi.compte, nom: moi.nom, texte: reponse.texte });
                      setReponse(null);
                    }}
                  >
                    <textarea className="champ" rows={2} value={reponse.texte} onChange={(e) => setReponse({ id: c.id, texte: e.target.value })} aria-label="Ta réponse" placeholder="Répondre…" autoFocus />
                    <button type="submit" className="bouton bouton-principal bouton-petit" disabled={!reponse.texte.trim()}>
                      <Send className="size-4" aria-hidden="true" />
                      Envoyer
                    </button>
                  </form>
                ) : (
                  <>
                    <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => setReponse({ id: c.id, texte: "" })}>
                      <CornerDownRight className="size-4" aria-hidden="true" />
                      Répondre
                    </button>
                    <button type="button" className="bouton bouton-discret bouton-petit" onClick={() => resoudreCommentaire(editor, c.id, !c.resolu)}>
                      {c.resolu ? <RotateCcw className="size-4" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                      {c.resolu ? "Rouvrir" : "Résolu"}
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {resolus.length > 0 && (
        <button type="button" className="bouton bouton-discret bouton-petit" aria-expanded={voirResolus} onClick={() => setVoirResolus((v) => !v)}>
          {voirResolus ? "Cacher les résolus" : `Voir les résolus (${resolus.length})`}
        </button>
      )}
    </>
  );
}
