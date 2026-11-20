"use client";

import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { extrasDe, type DocumentAtelier } from "@/lib/atelier/modele";
import { codeJuste, creerVerrou, ouvrirVerrou, refermer } from "../verrou";

/** Verrouiller le document par un code (appareil partagé), le reverrouiller, ou retirer le verrou. */
export function PanneauVerrou({ doc, surModifier }: { doc: DocumentAtelier; surModifier: (modif: Partial<DocumentAtelier>) => void }) {
  const verrou = extrasDe(doc).verrou;
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");

  const poser = async () => {
    if (code.length < 4) return setMessage("Choisis un code d'au moins 4 caractères.");
    if (code !== confirmation) return setMessage("Les deux saisies ne sont pas identiques.");
    surModifier({ verrou: await creerVerrou(code) } as Partial<DocumentAtelier>);
    ouvrirVerrou(doc.id);
    setCode("");
    setConfirmation("");
    setMessage("Verrouillé. Le code sera demandé à la prochaine ouverture (onglet fermé ou « Reverrouiller »).");
  };
  const retirer = async () => {
    if (!verrou) return;
    if (!(await codeJuste(verrou, code))) return setMessage("Ce n'est pas le bon code.");
    surModifier({ verrou: null } as Partial<DocumentAtelier>);
    setCode("");
    setMessage("Verrou retiré.");
  };

  return (
    <section className="calame-section" aria-labelledby="verrou-titre">
      <h3 className="calame-section-titre" id="verrou-titre">
        <LockKeyhole className="size-4" aria-hidden="true" /> Verrou
      </h3>
      {verrou ? (
        <>
          <p className="inspecteur-aide">Ce document demande un code à l&apos;ouverture. Le code n&apos;est gardé nulle part : s&apos;il est oublié, le document reste lisible depuis tes autres appareils connectés.</p>
          <button type="button" className="bouton bouton-discret w-full" onClick={() => refermer(doc.id)}>
            Reverrouiller maintenant
          </button>
          <input className="champ" type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code actuel" aria-label="Code actuel" />
          <button type="button" className="bouton bouton-discret w-full" onClick={() => void retirer()} disabled={!code}>
            Retirer le verrou
          </button>
        </>
      ) : (
        <>
          <p className="inspecteur-aide">Sur un appareil partagé : un code sera demandé pour ouvrir ce document. Il protège des regards, il ne chiffre pas le texte.</p>
          <input className="champ" type="password" autoComplete="new-password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (4 caractères ou plus)" aria-label="Nouveau code" />
          <input className="champ" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Le même, encore une fois" aria-label="Confirmer le code" />
          <button type="button" className="bouton bouton-discret w-full" onClick={() => void poser()} disabled={!code}>
            Verrouiller ce document
          </button>
        </>
      )}
      {message && (
        <p className="inspecteur-aide" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
