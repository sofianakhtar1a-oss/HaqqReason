"use client";

import type { Editor } from "@tiptap/core";
import { Check, CornerDownRight, MessageSquareText, Pencil, RotateCcw, Send, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { commentairesDuDocument, modifierCommentaire, repondreCommentaire, resoudreCommentaire } from "./blocs/Marges";
import { usePartageCourant } from "./partage/contexte";
import { useRevision } from "./crochets";

type Props = { editor: Editor; commentaires: { id: string; texte: string; y: number }[] };

const quand = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const jours = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  return jours === 0 ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

/**
 * Les commentaires dans la marge de droite, chacun à la hauteur de son passage. Pour soi, ou, dans un
 * document partagé, ceux des relecteurs : avec leur nom, les réponses, et « résolu ».
 * Ils ne s'impriment jamais : ils vivent hors de la feuille.
 */
export function MargeCommentaires({ editor, commentaires }: Props) {
  useRevision(editor);
  const partage = usePartageCourant();
  const conteneur = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<Record<string, number>>({});
  const [edition, setEdition] = useState<{ id: string; texte: string } | null>(null);
  const [reponse, setReponse] = useState<{ id: string; texte: string } | null>(null);
  const [ouverts, setOuverts] = useState<string[]>([]);
  const infos = new Map(commentairesDuDocument(editor).map((c) => [c.id, c]));
  // Ce qui change la hauteur des cartes : les réponses, l'état résolu.
  const signature = [...infos.values()].map((c) => `${c.id}:${c.reponses?.length ?? 0}:${c.resolu ? 1 : 0}`).join(",");

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
  }, [commentaires, edition, reponse, ouverts, signature]);

  const moi = partage.moi;
  const lecteur = partage.role === "lecture";

  return (
    <div ref={conteneur} className="calame-commentaires sans-impression" aria-label={moi ? "Commentaires" : "Commentaires pour soi"}>
      {commentaires.map((c) => {
        const info = infos.get(c.id);
        const resolu = info?.resolu === true && !ouverts.includes(c.id);
        // Son auteur, ou le propriétaire (ou chacun, hors partage), peut modifier ou retirer un commentaire.
        const maitre = !info?.compte || !moi || info.compte === moi.compte || partage.role === "proprietaire";
        return (
          <aside key={c.id} data-carte={c.id} className="calame-commentaire" data-resolu={resolu ? "" : undefined} style={{ top: places[c.id] ?? c.y }}>
            <MessageSquareText className="calame-commentaire-icone" aria-hidden="true" />
            {info?.auteur && (
              <p className="calame-commentaire-auteur">
                <strong>{info.auteur}</strong> <span>{quand(info.quand)}</span>
              </p>
            )}
            {resolu ? (
              <button type="button" className="calame-commentaire-resolu" onClick={() => setOuverts((o) => [...o, c.id])}>
                <Check className="size-3.5" aria-hidden="true" /> Résolu · {c.texte.slice(0, 40)}
                {c.texte.length > 40 ? "…" : ""}
              </button>
            ) : edition?.id === c.id ? (
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
                {(info?.reponses ?? []).map((r, i) => (
                  <p key={`${r.quand}-${i}`} className="calame-commentaire-reponse">
                    <CornerDownRight className="size-3" aria-hidden="true" />
                    <span>
                      <strong>{r.nom}</strong> {r.texte}
                    </span>
                  </p>
                ))}
                {reponse?.id === c.id && moi && (
                  <form
                    className="calame-commentaire-repondre"
                    onSubmit={(e) => {
                      e.preventDefault();
                      repondreCommentaire(editor, c.id, { compte: moi.compte, nom: moi.nom, texte: reponse.texte });
                      setReponse(null);
                    }}
                  >
                    <textarea className="champ" rows={2} value={reponse.texte} onChange={(e) => setReponse({ id: c.id, texte: e.target.value })} aria-label="Ta réponse" placeholder="Répondre…" autoFocus />
                    <button type="submit" aria-label="Envoyer la réponse" disabled={!reponse.texte.trim()}>
                      <Send className="size-3.5" aria-hidden="true" />
                    </button>
                  </form>
                )}
                <div className="calame-commentaire-actions">
                  {moi && !lecteur && (
                    <button type="button" onClick={() => setReponse({ id: c.id, texte: "" })} aria-label="Répondre au commentaire" title="Répondre">
                      <CornerDownRight className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                  {moi && !lecteur && (
                    <button
                      type="button"
                      onClick={() => {
                        resoudreCommentaire(editor, c.id, !info?.resolu);
                        setOuverts((o) => o.filter((x) => x !== c.id));
                      }}
                      aria-label={info?.resolu ? "Rouvrir le commentaire" : "Marquer comme résolu"}
                      title={info?.resolu ? "Rouvrir" : "Résolu"}
                    >
                      {info?.resolu ? <RotateCcw className="size-3.5" aria-hidden="true" /> : <Check className="size-3.5" aria-hidden="true" />}
                    </button>
                  )}
                  {maitre && !lecteur && (
                    <button type="button" onClick={() => setEdition({ id: c.id, texte: c.texte })} aria-label="Modifier le commentaire">
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                  {maitre && !lecteur && (
                    <button type="button" onClick={() => modifierCommentaire(editor, c.id, null)} aria-label="Retirer le commentaire">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </>
            )}
          </aside>
        );
      })}
    </div>
  );
}
