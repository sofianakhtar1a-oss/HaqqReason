"use client";

import { BookmarkCheck, BookmarkPlus, Volume2 } from "lucide-react";
import type { Analyse, Phrase } from "@/lib/alambic/transcription/types";
import { texteDe } from "@/lib/alambic/transcription/types";
import { idMot, motPropre, nouveauMot } from "@/lib/langues/dictionnaire";
import type { OrigineMot } from "@/lib/langues/types";
import { parler, voixDisponible } from "@/lib/langues/voix";
import { type Cible, Popover, Tiroir } from "../alambic/transcription/Glose";
import { ajouterMot, useDonnees } from "./donnees";

/*
 * La traduction d'un mot touché, dans une vidéo ou un PDF :
 * carte flottante à la souris, tiroir du bas au doigt, avec « Écouter » et « Ajouter au dictionnaire ».
 */

type Props = {
  cible: Cible;
  phrase: Phrase;
  analyse?: Analyse;
  traduction?: string;
  erreur: string | null;
  origine: OrigineMot;
  tactile: boolean;
  onFermer: () => void;
  onMot: (i: number, el: HTMLElement) => void;
  /** Vidéo : reprendre la lecture à partir du mot. */
  onEcouter?: (t: number) => void;
};

/** Ce que l'on range dans le dictionnaire pour le mot touché. */
export function motDeLaGlose(phrase: Phrase, i: number, analyse: Analyse | undefined, traduction: string | undefined, origine: OrigineMot) {
  const forme = motPropre(phrase.mots[i]?.t ?? "");
  const g = analyse?.mots.find((x) => x.i === i);
  const lemme = g?.lemme ? motPropre(g.lemme) : "";
  const en = lemme && /^[\p{L}' -]+$/u.test(lemme) ? lemme : forme;
  return nouveauMot({ en, fr: g?.sens ?? "", nature: g?.nature, lemme: lemme || undefined, phrase: texteDe(phrase), phraseFr: traduction, forme }, origine);
}

export function GloseMot(p: Props) {
  const { mots } = useDonnees();
  const mot = motDeLaGlose(p.phrase, p.cible.mot, p.analyse, p.traduction, p.origine);
  const deja = mots.some((m) => m.id === mot.id || m.id === idMot(mot.forme ?? ""));
  const pret = Boolean(mot.fr);

  const actions = (
    <>
      {voixDisponible() && (
        <button type="button" className="lg-glose-action" onClick={() => void parler(mot.forme || mot.en)}>
          <Volume2 className="size-4" aria-hidden="true" />
          Écouter
        </button>
      )}
      <button
        type="button"
        className="lg-glose-action"
        data-principal={!deja || undefined}
        disabled={deja || !pret}
        title={pret ? undefined : "La traduction arrive…"}
        onClick={() => ajouterMot(mot)}
      >
        {deja ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <BookmarkPlus className="size-4" aria-hidden="true" />}
        {deja ? "Dans ton dictionnaire" : "Ajouter au dictionnaire"}
      </button>
    </>
  );

  const commun = {
    cible: p.cible,
    phrase: p.phrase,
    langue: "en",
    rtl: false,
    analyse: p.analyse,
    traduction: p.traduction,
    erreur: p.erreur,
    onEntrer: () => undefined,
    onSortir: () => undefined,
    onFermer: p.onFermer,
    onMot: p.onMot,
    actions,
  };
  return p.tactile ? <Tiroir {...commun} onEcouter={p.onEcouter} /> : <Popover {...commun} astuce="Clic ailleurs pour fermer" />;
}
