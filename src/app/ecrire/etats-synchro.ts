"use client";

import { useEffect, useState } from "react";
import { fichiersCites, listerDocuments } from "@/lib/atelier/depot";
import { abonnerEtat, EVENEMENT_A_ENVOYER, EVENEMENT_RECU, toutesLesTraces } from "@/lib/client/synchro/journal";

/*
 * L'état de chaque document vis-à-vis du compte : enregistré sur le compte, en attente d'envoi,
 * ou resté sur cet appareil (trop lourd, ou place du compte pleine). Sans compte : « local ».
 */

export type EtatDocument = "compte" | "attente" | "appareil" | "local";

async function calculer(): Promise<Map<string, EtatDocument>> {
  const carte = new Map<string, EtatDocument>();
  if (typeof document === "undefined" || !document.documentElement.dataset.compte) return carte;
  const traces = await toutesLesTraces();
  const fichiersRefuses = new Set(traces.filter((t) => t.m === "calame-fichiers" && t.r === 1).map((t) => t.c));
  const parDoc = new Map(traces.filter((t) => t.m === "calame-documents").map((t) => [t.c, t]));
  for (const d of await listerDocuments()) {
    const t = parDoc.get(d.id);
    const refuse = t?.r === 1 || [...fichiersCites(d.contenu)].some((f) => fichiersRefuses.has(f));
    carte.set(d.id, refuse ? "appareil" : !t || t.p === 1 ? "attente" : "compte");
  }
  return carte;
}

export function useEtatsDocuments(): Map<string, EtatDocument> {
  const [etats, setEtats] = useState<Map<string, EtatDocument>>(() => new Map());
  useEffect(() => {
    let vivant = true;
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const relire = () => {
      clearTimeout(minuteur);
      minuteur = setTimeout(() => {
        void calculer().then(
          (c) => vivant && setEtats(c),
          () => undefined,
        );
      }, 400);
    };
    relire();
    const desabonner = abonnerEtat(relire);
    window.addEventListener(EVENEMENT_A_ENVOYER, relire);
    window.addEventListener(EVENEMENT_RECU, relire);
    return () => {
      vivant = false;
      clearTimeout(minuteur);
      desabonner();
      window.removeEventListener(EVENEMENT_A_ENVOYER, relire);
      window.removeEventListener(EVENEMENT_RECU, relire);
    };
  }, []);
  return etats;
}
