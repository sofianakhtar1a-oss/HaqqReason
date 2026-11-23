"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";

/** Le bouton vers l'espace d'abonnement de Stripe (carte bancaire, factures). */
export function BoutonPortail() {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const ouvrir = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      const r = await fetch("/api/premium/portail", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}" });
      const v = (await r.json().catch(() => ({}))) as { url?: string; message?: string };
      if (r.ok && v.url && /^https:\/\/billing\.stripe\.com\//.test(v.url)) {
        window.location.assign(v.url);
        return;
      }
      setErreur(v.message ?? "L'espace d'abonnement n'a pas pu s'ouvrir. Réessaie dans un moment.");
    } catch {
      setErreur("Pas de connexion : vérifie ton réseau, puis recommence.");
    }
    setEnvoi(false);
  };
  return (
    <>
      <button type="button" className="bouton bouton-discret" onClick={ouvrir} disabled={envoi}>
        {envoi ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <CreditCard className="size-5" aria-hidden="true" />}
        Carte bancaire et factures
      </button>
      {erreur && (
        <p className="w-full font-semibold text-danger" role="alert">
          {erreur}
        </p>
      )}
    </>
  );
}
