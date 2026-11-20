"use client";

import type { Editor } from "@tiptap/core";
import { useEffect, useState, useSyncExternalStore } from "react";
import { abonnerPreferences, lirePreferences, PREFERENCES_SERVEUR, type PreferencesCalame } from "@/lib/atelier/preferences";
import { EVENEMENT_JOURNAL } from "@/lib/atelier/journal-ecriture";

/** Les préférences du Calame, à jour (un autre onglet ou un autre appareil peut les changer). */
export function usePreferences(): PreferencesCalame {
  return useSyncExternalStore(abonnerPreferences, lirePreferences, () => PREFERENCES_SERVEUR);
}

/** Un compteur qui change à chaque transaction de l'éditeur (pour les panneaux qui en dépendent). */
export function useRevision(editor: Editor | null, evenement: "transaction" | "update" | "selectionUpdate" = "transaction"): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const f = () => setN((x) => x + 1);
    editor.on(evenement, f);
    return () => {
      editor.off(evenement, f);
    };
  }, [editor, evenement]);
  return n;
}

/** Un compteur qui change quand le journal d'écriture bouge. */
export function useJournal(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const f = () => setN((x) => x + 1);
    window.addEventListener(EVENEMENT_JOURNAL, f);
    return () => window.removeEventListener(EVENEMENT_JOURNAL, f);
  }, []);
  return n;
}

/** « dans 3 jours », « aujourd'hui », « dépassée de 2 jours ». */
export function delaiEcheance(echeance: string, maintenant = new Date()): { texte: string; jours: number } {
  const [a, m, j] = echeance.split("-").map(Number);
  const cible = new Date(a, m - 1, j, 12);
  const ici = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 12);
  const jours = Math.round((cible.getTime() - ici.getTime()) / 86_400_000);
  if (jours === 0) return { texte: "aujourd'hui", jours };
  if (jours === 1) return { texte: "demain", jours };
  if (jours > 1) return { texte: `dans ${jours} jours`, jours };
  return { texte: `dépassée de ${-jours} jour${jours < -1 ? "s" : ""}`, jours };
}
