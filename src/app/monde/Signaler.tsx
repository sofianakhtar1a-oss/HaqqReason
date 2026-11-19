"use client";

import { Flag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { profilActuel } from "@/lib/monde/progression";

/*
 * « Signaler une erreur » : depuis une fiche ou après une question, quelques mots pour le
 * créateur, qui les lit dans son atelier. Le contexte (le pays, la question, la réponse donnée)
 * part avec, pour qu'il retrouve l'endroit sans avoir à demander.
 */

type Sujet = "fiche" | "question" | "carte" | "traduction" | "autre";
type Etat = "saisie" | "envoi" | "merci" | "erreur";

const MESSAGES: Record<string, string> = {
  deconnecte: "Connecte-toi avec ton compte Google pour envoyer un signalement.",
  trop_vite: "Un instant : réessaie dans quelques secondes.",
  trop_court: "Quelques mots de plus, pour que le créateur comprenne.",
  reseau: "Pas de réseau : vérifie ta connexion.",
};

export function Signaler({ code, sujet, contexte, compact = false }: { code?: string; sujet: Sujet; contexte?: Record<string, string>; compact?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <button type="button" className="pt-signaler" data-compact={compact || undefined} onClick={() => setOuvert(true)} aria-haspopup="dialog">
        <Flag className="size-3.5" aria-hidden="true" />
        Signaler une erreur
      </button>
      {/* La fenêtre s'ouvre au niveau de la page : ni une fiche ni une partie ne la coupent. */}
      {ouvert && createPortal(<FenetreSignaler code={code} sujet={sujet} contexte={contexte} onFermer={() => setOuvert(false)} />, document.body)}
    </>
  );
}

function FenetreSignaler({ code, sujet, contexte, onFermer }: { code?: string; sujet: Sujet; contexte?: Record<string, string>; onFermer: () => void }) {
  const [texte, setTexte] = useState("");
  const [etat, setEtat] = useState<Etat>("saisie");
  const [message, setMessage] = useState("");
  const champ = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    champ.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onFermer();
      }
    };
    window.addEventListener("keydown", touche, true);
    return () => {
      window.removeEventListener("keydown", touche, true);
      avant?.focus?.();
    };
  }, [onFermer]);

  const envoyer = async () => {
    if (texte.trim().length < 3) {
      setEtat("erreur");
      setMessage(MESSAGES.trop_court);
      return;
    }
    setEtat("envoi");
    try {
      const r = await fetch("/api/monde/signaler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, sujet, texte, contexte: { ...contexte, langue: profilActuel().langue, ecran: location.hash.slice(1, 80) } }),
      });
      if (r.ok) {
        setEtat("merci");
        return;
      }
      const corps = (await r.json().catch(() => ({}))) as { erreur?: string };
      setEtat("erreur");
      setMessage(MESSAGES[corps.erreur ?? ""] ?? "L'envoi n'a pas abouti. Réessaie un peu plus tard.");
    } catch {
      setEtat("erreur");
      setMessage(MESSAGES.reseau);
    }
  };

  return (
    <div className="pt pt-confirmer-voile" data-accent="safran" role="presentation" onClick={(e) => e.target === e.currentTarget && onFermer()}>
      {/* Les touches tapées ici ne vont pas au jeu (Entrée, Espace, 1 à 6). */}
      <div className="pt-confirmer pt-signalement" role="dialog" aria-modal="true" aria-labelledby="pt-signaler-titre" onKeyDown={(e) => e.stopPropagation()}>
        <h2 id="pt-signaler-titre">{etat === "merci" ? "Merci !" : "Signaler une erreur"}</h2>
        {etat === "merci" ? (
          <p>Le créateur lira ton message et corrigera ce qui doit l&apos;être.</p>
        ) : (
          <>
            <p>Qu&apos;est-ce qui ne va pas ? Une date, un nom, une traduction, une frontière… Quelques mots suffisent.</p>
            <label className="pt-signalement-champ">
              <span className="sr-only">Ton message</span>
              <textarea ref={champ} value={texte} maxLength={1000} rows={4} onChange={(e) => setTexte(e.target.value)} placeholder="Par exemple : la devise a changé en 2024." />
            </label>
            {etat === "erreur" && (
              <p className="pt-signalement-erreur" role="alert">
                {message}
              </p>
            )}
          </>
        )}
        <div className="pt-confirmer-actions">
          {etat === "merci" ? (
            <button type="button" className="bouton bouton-principal" onClick={onFermer}>
              Fermer
            </button>
          ) : (
            <>
              <button type="button" className="bouton bouton-discret" onClick={onFermer}>
                Annuler
              </button>
              <button type="button" className="bouton bouton-principal" onClick={() => void envoyer()} disabled={etat === "envoi"}>
                {etat === "envoi" ? "Envoi…" : "Envoyer"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
