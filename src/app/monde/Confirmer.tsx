"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/*
 * Une question avant un geste qu'on ne peut pas défaire (quitter un duel en cours, fermer une classe,
 * retirer un ami) : une petite fenêtre aux couleurs du Portulan, au lieu de la boîte grise du navigateur.
 * Échap ou « Annuler » répondent non ; le bouton prudent a le focus.
 */

export type Demande = { titre: string; texte?: string; oui: string; non?: string; danger?: boolean };

export function useConfirmer(): [React.ReactNode, (d: Demande) => Promise<boolean>] {
  const [demande, setDemande] = useState<(Demande & { repondre: (oui: boolean) => void }) | null>(null);
  const demander = (d: Demande) =>
    new Promise<boolean>((ok) => {
      setDemande({ ...d, repondre: ok });
    });
  const fenetre = demande ? (
    <Fenetre
      demande={demande}
      onRepondre={(oui) => {
        demande.repondre(oui);
        setDemande(null);
      }}
    />
  ) : null;
  return [fenetre, demander];
}

function Fenetre({ demande, onRepondre }: { demande: Demande; onRepondre: (oui: boolean) => void }) {
  const prudent = useRef<HTMLButtonElement>(null);
  const repondre = useRef(onRepondre);
  useEffect(() => {
    repondre.current = onRepondre;
  });
  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    prudent.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        repondre.current(false);
      }
    };
    window.addEventListener("keydown", touche, true);
    return () => {
      window.removeEventListener("keydown", touche, true);
      avant?.focus?.();
    };
  }, []);
  return createPortal(
    <div className="pt pt-confirmer-voile" onClick={(e) => e.target === e.currentTarget && onRepondre(false)}>
      <div className="pt-confirmer" role="alertdialog" aria-modal="true" aria-labelledby="pt-confirmer-titre" aria-describedby={demande.texte ? "pt-confirmer-texte" : undefined}>
        <h2 id="pt-confirmer-titre">{demande.titre}</h2>
        {demande.texte && <p id="pt-confirmer-texte">{demande.texte}</p>}
        <div className="pt-confirmer-actions">
          <button ref={prudent} type="button" className="bouton" onClick={() => onRepondre(false)}>
            {demande.non ?? "Annuler"}
          </button>
          <button type="button" className="bouton bouton-principal" data-danger={demande.danger || undefined} onClick={() => onRepondre(true)}>
            {demande.oui}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
