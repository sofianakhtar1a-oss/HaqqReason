"use client";

import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import type { DocumentAtelier } from "@/lib/atelier/modele";
import { codeJuste, ouvrirVerrou } from "./verrou";

/** L'écran d'un document verrouillé : son titre, et le code à donner pour l'ouvrir. */
export function EcranVerrou({ doc, verrou, surAutre }: { doc: DocumentAtelier; verrou: { sel: string; empreinte: string }; surAutre?: () => void }) {
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [verification, setVerification] = useState(false);

  const essayer = async () => {
    if (!code) return;
    setVerification(true);
    const juste = await codeJuste(verrou, code);
    setVerification(false);
    if (juste) ouvrirVerrou(doc.id);
    else {
      setErreur("Ce n'est pas le bon code.");
      setCode("");
    }
  };

  return (
    <div className="calame-verrou">
      <form
        className="calame-verrou-carte"
        onSubmit={(e) => {
          e.preventDefault();
          void essayer();
        }}
      >
        <LockKeyhole className="size-8" aria-hidden="true" />
        <h1>{doc.titre || "Document sans titre"}</h1>
        <p>Ce document est verrouillé par un code.</p>
        <input className="champ" type="password" inputMode="numeric" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Code du document" autoFocus />
        {erreur && (
          <p className="inspecteur-aide" data-alerte="" role="alert">
            {erreur}
          </p>
        )}
        <button type="submit" className="bouton bouton-principal" disabled={!code || verification}>
          Ouvrir
        </button>
        {surAutre && (
          <button type="button" className="bouton bouton-discret" onClick={surAutre}>
            Ouvrir un autre document
          </button>
        )}
      </form>
    </div>
  );
}
