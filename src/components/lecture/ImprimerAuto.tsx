"use client";

import { Printer } from "lucide-react";
import { useEffect } from "react";

/** Ouvre la fenêtre d'impression dès que les polices sont prêtes ; on y choisit « Enregistrer au format PDF ». */
export function ImprimerAuto() {
  useEffect(() => {
    let annule = false;
    void document.fonts.ready.then(() => {
      setTimeout(() => {
        if (!annule) window.print();
      }, 600);
    });
    return () => {
      annule = true;
    };
  }, []);
  return (
    <div className="livre-barre">
      <p>
        Dans la fenêtre d&apos;impression, choisis <strong>Enregistrer au format PDF</strong> comme destination.
      </p>
      <button type="button" className="bouton bouton-principal" onClick={() => window.print()}>
        <Printer className="size-4" aria-hidden="true" />
        Imprimer ou enregistrer en PDF
      </button>
    </div>
  );
}
