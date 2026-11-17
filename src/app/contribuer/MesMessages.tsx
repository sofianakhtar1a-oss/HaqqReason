"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Inbox, MessageCircle, Send } from "lucide-react";
import { MessageFormulaire } from "@/components/MessageFormulaire";
import { LIBELLE_STATUT, LIMITES_MESSAGE, NOM_NATURE, NOM_TYPE, type ContributionSuivie } from "@/lib/contributions/modele";
import { ETAT_INITIAL } from "@/lib/form-state";
import { marquerLu, mesConversations, repondre } from "./actions";
import { lireJetons, oublierJeton, surChangement } from "./suivi";

function quand(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Les conversations de ce navigateur, relues à l'ouverture et après chaque envoi. */
export function useConversations() {
  const [conversations, setConversations] = useState<ContributionSuivie[] | null>(null);

  const recharger = useCallback(() => {
    const jetons = lireJetons();
    if (jetons.length === 0) {
      setConversations([]);
      return;
    }
    mesConversations(jetons)
      .then(setConversations)
      .catch(() => setConversations([]));
  }, []);

  useEffect(() => {
    // Lecture différée : le stockage du navigateur n'existe pas pendant le rendu serveur.
    const minuteur = window.setTimeout(recharger, 0);
    const desabonner = surChangement(recharger);
    return () => {
      window.clearTimeout(minuteur);
      desabonner();
    };
  }, [recharger]);

  const nonLus = (conversations ?? []).reduce((n, c) => n + c.messages.filter((m) => m.auteur === "createur" && !m.lu).length, 0);
  return { conversations, nonLus, recharger };
}

function Conversation({ c, onChange }: { c: ContributionSuivie; onChange: () => void }) {
  const [etat, action] = useActionState(repondre, ETAT_INITIAL);
  const [texte, setTexte] = useState("");
  const [ouverte, setOuverte] = useState(false);
  const aNouveau = c.messages.some((m) => m.auteur === "createur" && !m.lu);
  const [vu, setVu] = useState(etat);

  // Après un envoi réussi : on vide le champ et on relit la conversation.
  if (vu !== etat) {
    setVu(etat);
    if (etat.statut === "succes") {
      setTexte("");
      onChange();
    }
  }

  function basculer() {
    const suivant = !ouverte;
    setOuverte(suivant);
    if (suivant && aNouveau) marquerLu(c.jeton).then(onChange).catch(() => undefined);
  }

  return (
    <article className="messagerie-fil" data-nouveau={aNouveau || undefined}>
      <button type="button" className="messagerie-entete" aria-expanded={ouverte} onClick={basculer}>
        <span className="messagerie-entete-haut">
          <span className="contrib-badge" data-statut={c.statut}>
            {LIBELLE_STATUT[c.statut]}
          </span>
          <span className="text-sm font-semibold">{c.type === "site" && c.nature ? NOM_NATURE[c.nature] : NOM_TYPE[c.type]}</span>
          {aNouveau && <span className="messagerie-pastille">Nouvelle réponse</span>}
        </span>
        <span className="messagerie-titre">{c.titre}</span>
        <span className="text-sm text-encre-douce">
          {c.messages.length === 0 ? "Pas encore de réponse" : `${c.messages.length} message${c.messages.length > 1 ? "s" : ""}`}
        </span>
      </button>

      {ouverte && (
        <div className="messagerie-corps">
          <div className="messagerie-bulle messagerie-bulle-lecteur">
            <p className="messagerie-qui">Ta proposition · {quand(c.created_at)}</p>
            <p className="whitespace-pre-wrap">{c.texte}</p>
          </div>
          {c.messages.map((m) => (
            <div key={m.id} className={`messagerie-bulle messagerie-bulle-${m.auteur}`}>
              <p className="messagerie-qui">
                {m.auteur === "createur" ? "Réponse de HaqqReason" : "Toi"} · {quand(m.created_at)}
              </p>
              <p className="whitespace-pre-wrap">{m.texte}</p>
            </div>
          ))}

          <form action={action} className="messagerie-reponse">
            <input type="hidden" name="jeton" value={c.jeton} />
            <label htmlFor={`rep-${c.id}`} className="etiquette">
              Répondre
            </label>
            <textarea
              id={`rep-${c.id}`}
              name="texte"
              rows={3}
              maxLength={LIMITES_MESSAGE.texte}
              className="champ"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Une précision, un merci, une question…"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="bouton bouton-principal bouton-petit" disabled={texte.trim().length < 2}>
                <Send className="size-4" aria-hidden="true" />
                Envoyer
              </button>
              <button
                type="button"
                className="bouton bouton-discret bouton-petit ml-auto"
                onClick={() => {
                  oublierJeton(c.jeton);
                }}
              >
                Retirer de cet appareil
              </button>
            </div>
            <MessageFormulaire etat={etat} />
          </form>
        </div>
      )}
    </article>
  );
}

export function MesMessages({ conversations, onChange }: { conversations: ContributionSuivie[] | null; onChange: () => void }) {
  return (
    <div className="messagerie">
      <div className="contrib-explication">
        <h2 className="contrib-explication-titre">Tes conversations</h2>
        <p>
          Chaque proposition envoyée depuis cet appareil arrive ici, avec mes réponses. Tu peux me répondre à ton tour. Pas de compte : c&apos;est ton
          navigateur qui garde la clé de tes conversations. Si tu effaces ses données, ou si tu changes d&apos;appareil, elles ne s&apos;afficheront
          plus ici.
        </p>
      </div>

      {conversations === null ? (
        <p className="contrib-vide mt-6">Chargement de tes messages…</p>
      ) : conversations.length === 0 ? (
        <div className="contrib-vide mt-6 flex items-start gap-3">
          <Inbox className="size-6 shrink-0 text-accent" aria-hidden="true" />
          <p>Aucune conversation pour l&apos;instant. Envoie une idée, un argument ou une amélioration du site : ma réponse arrivera ici.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {conversations.map((c) => (
            <Conversation key={c.id} c={c} onChange={onChange} />
          ))}
        </div>
      )}
      <p className="contrib-note mt-6">
        <MessageCircle className="size-4 shrink-0 text-accent" aria-hidden="true" />
        Tes messages ne sont visibles que de toi et de moi. Seules mes réponses aux propositions publiées s&apos;affichent aussi sous la carte, pour
        tous les lecteurs.
      </p>
    </div>
  );
}
