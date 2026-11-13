"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

type Props = {
  libelle: string;
  confirmation: string;
  enCours: string;
  className?: string;
  avertissement?: string;
};

/**
 * Bouton d'envoi en deux temps pour les actions irréversibles :
 * le premier clic demande confirmation, le second envoie.
 */
export function BoutonConfirmation({ libelle, confirmation, enCours, className = "bouton bouton-danger", avertissement }: Props) {
  const [arme, setArme] = useState(false);
  const { pending } = useFormStatus();

  if (!arme) {
    return (
      <button type="button" className={className} onClick={() => setArme(true)}>
        {libelle}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {avertissement && <span className="text-sm text-danger">{avertissement}</span>}
      <button type="submit" className={className} disabled={pending} autoFocus>
        {pending ? enCours : confirmation}
      </button>
      <button type="button" className="bouton bouton-discret" onClick={() => setArme(false)} disabled={pending}>
        Annuler
      </button>
    </span>
  );
}
