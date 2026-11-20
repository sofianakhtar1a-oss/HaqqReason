"use client";

import type { Editor } from "@tiptap/core";
import { useCallback, useSyncExternalStore } from "react";

/**
 * Ce que la mise en page à l'écran publie pour les blocs qui en ont besoin : la table
 * des matières (numéros de page des titres), les renvois (« voir p. 12 »), la table
 * des figures. Une publication par éditeur : la vue côte à côte, qui lit un autre
 * document, n'en reçoit pas.
 */
export type MiseEnPagePubliee = {
  /** Nombre de pages. */
  pages: number;
  /** Étiquette de page (« 12 », « iv ») de chaque titre, par rang du titre dans le document (1, 2, 3…). */
  titres: Map<number, string>;
  /** Étiquette de page de chaque image, par rang (1, 2, 3…). */
  figures: Map<number, string>;
  /** Étiquette de page de chaque tableau, par rang. */
  tableaux: Map<number, string>;
};

const VIDE: MiseEnPagePubliee = { pages: 0, titres: new Map(), figures: new Map(), tableaux: new Map() };
const etats = new WeakMap<Editor, MiseEnPagePubliee>();
const ecouteurs = new WeakMap<Editor, Set<() => void>>();

const memeCarte = (a: Map<number, string>, b: Map<number, string>) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);

export function publierMiseEnPage(editor: Editor, m: MiseEnPagePubliee): void {
  const avant = etats.get(editor);
  if (avant && avant.pages === m.pages && memeCarte(avant.titres, m.titres) && memeCarte(avant.figures, m.figures) && memeCarte(avant.tableaux, m.tableaux)) return;
  etats.set(editor, m);
  for (const e of ecouteurs.get(editor) ?? []) e();
}

export function lireMiseEnPage(editor: Editor | null | undefined): MiseEnPagePubliee {
  return (editor && etats.get(editor)) || VIDE;
}

export function useMiseEnPage(editor: Editor | null | undefined): MiseEnPagePubliee {
  const abonner = useCallback(
    (rappel: () => void) => {
      if (!editor) return () => undefined;
      let liste = ecouteurs.get(editor);
      if (!liste) {
        liste = new Set();
        ecouteurs.set(editor, liste);
      }
      liste.add(rappel);
      return () => {
        liste?.delete(rappel);
      };
    },
    [editor],
  );
  return useSyncExternalStore(
    abonner,
    () => lireMiseEnPage(editor),
    () => VIDE,
  );
}
