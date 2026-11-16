"use client";

import { ArrowUp, BookOpenText, Check, Copy, GitCompareArrows, ListTree, MessageCircleQuestion, Square, Trash2, X } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { lireCitations, lierCitations } from "@/lib/alambic/carnet/citations";
import { type Action, ACTIONS, type Message, type Source } from "@/lib/alambic/carnet/types";
import type { Cible } from "./Visionneuse";

const ICONES_ACTIONS: Record<Action, typeof ListTree> = {
  synthese: BookOpenText,
  divergences: GitCompareArrows,
  glossaire: ListTree,
  questions: MessageCircleQuestion,
};

/** Markdown → HTML sûr, avec les citations transformées en boutons. */
function rendre(texte: string, sources: Source[]): string {
  const html = marked.parse(lierCitations(texte, sources), { async: false, gfm: true, breaks: false }) as string;
  return DOMPurify.sanitize(html, { ADD_ATTR: ["data-source", "data-page", "data-t", "data-ligne", "data-inconnue"], FORBID_TAGS: ["style", "form", "input"] });
}

const Reponse = memo(function Reponse({ texte, sources, enCours }: { texte: string; sources: Source[]; enCours: boolean }) {
  const html = useMemo(() => rendre(texte, sources), [texte, sources]);
  return <div className="cb-reponse" data-en-cours={enCours || undefined} dangerouslySetInnerHTML={{ __html: html }} />;
});

type Props = {
  messages: Message[];
  sources: Source[];
  enCours: boolean;
  pret: boolean;
  analyseEnCours: boolean;
  erreur: string | null;
  onErreurLue: () => void;
  onEnvoyer: (question: string, action?: Action) => void;
  onArreter: () => void;
  onCiter: (c: Cible) => void;
  onEffacer: () => void;
};

export function Conversation({ messages, sources, enCours, pret, analyseEnCours, erreur, onErreurLue, onEnvoyer, onArreter, onCiter, onEffacer }: Props) {
  const [question, setQuestion] = useState("");
  const [copie, setCopie] = useState<string | null>(null);
  const fil = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLTextAreaElement>(null);
  const suivre = useRef(true);

  // Le fil suit la réponse qui s'écrit, sauf si l'on remonte pour relire.
  useEffect(() => {
    const el = fil.current;
    if (el && suivre.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const envoyer = (action?: Action) => {
    if (enCours || !pret || (!question.trim() && !action)) return;
    onEnvoyer(question.trim(), action);
    setQuestion("");
    suivre.current = true;
    requestAnimationFrame(() => {
      if (champ.current) champ.current.style.height = "";
    });
  };

  const citer = (e: React.MouseEvent) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>(".cb-cite");
    if (!b) return;
    const source = sources.find((s) => s.id === b.dataset.source);
    if (!source) return;
    onCiter({ source, page: b.dataset.page ? Number(b.dataset.page) : undefined, t: b.dataset.t ? Number(b.dataset.t) : undefined, ligne: b.dataset.ligne ? Number(b.dataset.ligne) : undefined });
  };

  const copier = async (m: Message) => {
    try {
      // Les citations restent lisibles dans le texte copié.
      await navigator.clipboard.writeText(m.texte);
      setCopie(m.id);
      setTimeout(() => setCopie(null), 2000);
    } catch {
      setCopie(null);
    }
  };

  const vide = messages.length === 0;
  const nbCitations = (t: string) => [...t.matchAll(/\[([^[\]\n]{3,400})\](?!\()/g)].reduce((n, m) => n + lireCitations(m[1], sources).length, 0);

  return (
    <main className="cb-conversation">
      <div
        ref={fil}
        className="cb-fil"
        onClick={citer}
        onScroll={(e) => {
          const el = e.currentTarget;
          suivre.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {vide ? (
          <div className="cb-accueil">
            <p className="cb-accueil-titre">Que veux-tu savoir ?</p>
            <p className="cb-accueil-aide">
              {pret
                ? "Pose une question, ou lance une analyse complète en un clic. Chaque affirmation renverra à sa page ou à sa minute."
                : analyseEnCours
                  ? "Tes sources sont en cours de lecture. Tu pourras poser tes questions dès que l'une d'elles est prête."
                  : "Commence par ajouter des sources dans le panneau de gauche : fichiers ou liens YouTube."}
            </p>
            <div className="cb-actions-grandes">
              {ACTIONS.map((a) => {
                const Icone = ICONES_ACTIONS[a.id];
                return (
                  <button key={a.id} type="button" disabled={!pret || enCours} onClick={() => onEnvoyer("", a.id)}>
                    <Icone className="size-5" strokeWidth={1.6} aria-hidden="true" />
                    <span className="cb-action-nom">{a.nom}</span>
                    <span className="cb-action-aide">{a.aide}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="cb-messages">
            {messages.map((m, i) =>
              m.role === "utilisateur" ? (
                <div key={m.id} className="cb-question" data-action={m.action || undefined}>
                  {m.action && (() => {
                    const Icone = ICONES_ACTIONS[m.action];
                    return <Icone className="size-4" aria-hidden="true" />;
                  })()}
                  <p dir="auto">{m.texte}</p>
                </div>
              ) : (
                <article key={m.id} className="cb-article" data-erreur={m.erreur || undefined}>
                  {m.texte ? (
                    <Reponse texte={m.texte} sources={sources} enCours={enCours && i === messages.length - 1} />
                  ) : m.erreur ? (
                    <p className="text-sm text-encre-douce">Pas de réponse.</p>
                  ) : (
                    <div className="cb-reflexion" aria-label="L'assistant lit tes sources">
                      <span />
                      <span />
                      <span />
                      <em>Lecture des sources…</em>
                    </div>
                  )}
                  {m.texte && !(enCours && i === messages.length - 1) && (
                    <div className="cb-article-pied">
                      <button type="button" className="cb-pied-bouton" onClick={() => void copier(m)}>
                        {copie === m.id ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                        {copie === m.id ? "Copié" : "Copier"}
                      </button>
                      <span className="text-xs text-encre-douce">{nbCitations(m.texte)} citations</span>
                    </div>
                  )}
                </article>
              ),
            )}
          </div>
        )}
      </div>

      <div className="cb-composeur">
        {erreur && (
          <p className="cb-erreur" role="alert">
            {erreur}
            <button type="button" className="tr-cmd" aria-label="Fermer" onClick={onErreurLue}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </p>
        )}
        {!vide && (
          <div className="cb-actions" role="toolbar" aria-label="Actions rapides">
            {ACTIONS.map((a) => {
              const Icone = ICONES_ACTIONS[a.id];
              return (
                <button key={a.id} type="button" disabled={!pret || enCours} onClick={() => envoyer(a.id)} title={a.aide}>
                  <Icone className="size-4" aria-hidden="true" />
                  {a.nom}
                </button>
              );
            })}
            <span className="flex-1" />
            <button type="button" className="cb-effacer" disabled={enCours} onClick={onEffacer} title="Effacer la conversation (les sources restent)">
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
        <form
          className="cb-champ"
          onSubmit={(e) => {
            e.preventDefault();
            envoyer();
          }}
        >
          <textarea
            ref={champ}
            rows={1}
            value={question}
            dir="auto"
            placeholder={pret ? "Pose ta question sur les sources cochées…" : "Ajoute et coche au moins une source prête"}
            disabled={!pret}
            onChange={(e) => {
              setQuestion(e.target.value);
              e.target.style.height = "";
              e.target.style.height = `${Math.min(220, e.target.scrollHeight)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                envoyer();
              }
            }}
            aria-label="Ta question"
          />
          {enCours ? (
            <button type="button" className="cb-envoyer" data-arret="" onClick={onArreter} aria-label="Arrêter la réponse">
              <Square className="size-4" fill="currentColor" aria-hidden="true" />
            </button>
          ) : (
            <button type="submit" className="cb-envoyer" disabled={!pret || !question.trim()} aria-label="Envoyer">
              <ArrowUp className="size-5" aria-hidden="true" />
            </button>
          )}
        </form>
        <p className="cb-mention">L&apos;assistant ne répond qu&apos;à partir de tes sources cochées. Vérifie les citations importantes en cliquant dessus.</p>
      </div>
    </main>
  );
}
