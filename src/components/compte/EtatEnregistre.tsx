"use client";

import { Check, CloudCheck, CloudOff, CloudUpload } from "lucide-react";
import { useSyncExternalStore } from "react";
import { compteLocal } from "@/lib/client/compte";
import { abonnerEtat, etatInitial, lireEtat } from "@/lib/client/synchro/journal";

const sansAbonnement = () => () => undefined;

/**
 * Dit où se trouve le travail qu'on vient d'enregistrer : sur le compte (il suit la personne partout),
 * en route vers le compte, ou seulement sur cet appareil (hors ligne, ou sans compte).
 */
export function EtatEnregistre() {
  const connecte = useSyncExternalStore(sansAbonnement, () => compteLocal() !== null, () => false);
  const etat = useSyncExternalStore(abonnerEtat, lireEtat, etatInitial);
  if (!connecte) {
    return (
      <>
        <Check className="size-4 text-emeraude" aria-hidden="true" /> Enregistré sur cet appareil
      </>
    );
  }
  if (etat.phase === "a-jour" && etat.enAttente === 0) {
    return (
      <>
        <CloudCheck className="size-4 text-emeraude" aria-hidden="true" /> Enregistré sur ton compte
      </>
    );
  }
  if (etat.phase === "hors-ligne" || etat.phase === "erreur" || etat.phase === "deconnecte") {
    return (
      <span title={etat.phase === "deconnecte" ? "Ta session est terminée : reconnecte-toi pour envoyer ton travail sur ton compte." : "L'envoi sur ton compte reprendra tout seul."}>
        <CloudOff className="mr-1 inline size-4 text-or" aria-hidden="true" />
        Enregistré sur cet appareil
      </span>
    );
  }
  return (
    <>
      <CloudUpload className="size-4 text-encre-douce" aria-hidden="true" /> Envoi sur ton compte…
    </>
  );
}
