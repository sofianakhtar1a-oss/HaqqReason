"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyserPhrase, traduireLot } from "@/lib/alambic/transcription/client";
import { type Analyse, texteDe, type Transcription } from "@/lib/alambic/transcription/types";

/*
 * Traductions françaises, à la demande :
 * - des lots de phrases consécutives (celles qu'on voit à l'écran), un lot à la fois ;
 * - l'analyse mot à mot d'une phrase, quand on survole ou touche un de ses mots.
 * Tout est gardé avec la transcription : une phrase n'est jamais traduite deux fois.
 */

const LOT = 18;

export function useTraductions(t: Transcription, enregistrer: (maj: Pick<Transcription, "traductions" | "analyses">) => void) {
  const [traductions, setTraductions] = useState(t.traductions);
  const [analyses, setAnalyses] = useState(t.analyses);
  const [erreur, setErreur] = useState<string | null>(null);
  const file = useRef(new Set<number>());
  const demandees = useRef(new Set(Object.keys(t.traductions).map(Number)));
  const enVol = useRef(false);
  const analysesEnCours = useRef(new Set<number>());
  const controle = useRef(new AbortController());

  useEffect(() => {
    const c = controle.current;
    return () => c.abort();
  }, []);

  const pomper = useCallback(async () => {
    if (enVol.current) return;
    enVol.current = true;
    try {
      while (file.current.size) {
        const ids = [...file.current].sort((a, b) => a - b);
        const lot: number[] = [];
        for (const id of ids) {
          if (lot.length && (id !== lot[lot.length - 1] + 1 || lot.length >= LOT)) break;
          lot.push(id);
        }
        lot.forEach((id) => file.current.delete(id));
        try {
          const contexte = lot[0] > 0 ? texteDe(t.phrases[lot[0] - 1]) : "";
          const r = await traduireLot(t.langue, lot.map((id) => texteDe(t.phrases[id])), contexte, controle.current.signal);
          setTraductions((avant) => ({ ...avant, ...Object.fromEntries(lot.map((id, k) => [id, r[k]])) }));
          setErreur(null);
        } catch (e) {
          if (controle.current.signal.aborted) return;
          lot.forEach((id) => demandees.current.delete(id));
          file.current.clear();
          setErreur(e instanceof Error ? e.message : "La traduction a échoué.");
          return;
        }
      }
    } finally {
      enVol.current = false;
    }
  }, [t.langue, t.phrases]);

  const traduire = useCallback(
    (ids: number[]) => {
      let ajout = false;
      for (const id of ids) {
        if (demandees.current.has(id) || !t.phrases[id]) continue;
        demandees.current.add(id);
        file.current.add(id);
        ajout = true;
      }
      if (ajout) void pomper();
    },
    [pomper, t.phrases],
  );

  const analyser = useCallback(
    (id: number) => {
      if (analyses[id] || analysesEnCours.current.has(id) || !t.phrases[id]) return;
      analysesEnCours.current.add(id);
      const contexte = id > 0 ? texteDe(t.phrases[id - 1]) : "";
      analyserPhrase(
        t.langue,
        t.phrases[id].mots.map((m) => m.t),
        contexte,
        controle.current.signal,
      )
        .then((a: Analyse) => {
          setAnalyses((avant) => ({ ...avant, [id]: a }));
          if (a.traduction) {
            setTraductions((avant) => (avant[id] ? avant : { ...avant, [id]: a.traduction }));
            demandees.current.add(id);
          }
          setErreur(null);
        })
        .catch((e) => {
          if (!controle.current.signal.aborted) setErreur(e instanceof Error ? e.message : "L'analyse a échoué.");
        })
        .finally(() => analysesEnCours.current.delete(id));
    },
    [analyses, t.langue, t.phrases],
  );

  // Sauvegarde sur l'appareil, groupée.
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    const minuteur = setTimeout(() => enregistrer({ traductions, analyses }), 700);
    return () => clearTimeout(minuteur);
  }, [traductions, analyses, enregistrer]);

  return { traductions, analyses, erreur, traduire, analyser, effacerErreur: () => setErreur(null) };
}
