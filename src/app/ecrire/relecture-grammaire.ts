"use client";

import type { Editor } from "@tiptap/core";
import { useSyncExternalStore } from "react";
import { lirePreferences } from "@/lib/atelier/preferences";
import { relireDocument, type Avancement } from "./extensions/grammaire";

/*
 * Le Calame — l'état de la relecture grammaticale, hors des panneaux : elle continue quand on change
 * d'onglet, et F7 la lance depuis n'importe où.
 */

export type Portee = "tout" | "selection";
export type EtatRelecture = {
  /** L'éditeur en cours de relecture (une seule à la fois). */
  enCours: Editor | null;
  avancement: Avancement | null;
  erreur: { editeur: Editor; texte: string } | null;
  version: number;
};
export type DerniereRelecture = { portee: Portee; nombre: number; quand: number };

const INITIAL: EtatRelecture = { enCours: null, avancement: null, erreur: null, version: 0 };
/** La dernière relecture achevée de chaque document ouvert. */
const dernieres = new WeakMap<Editor, DerniereRelecture>();
export const derniereRelecture = (editor: Editor) => dernieres.get(editor) ?? null;
let etat = INITIAL;
let controleur: AbortController | null = null;
const abonnes = new Set<() => void>();

function changer(suite: Partial<EtatRelecture>) {
  etat = { ...etat, ...suite, version: etat.version + 1 };
  for (const f of abonnes) f();
}

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

export const useRelecture = () => useSyncExternalStore(abonner, () => etat, () => INITIAL);

export const etatRelecture = () => etat;

/** Lance la relecture du document entier ou de la sélection. Renvoie le nombre de remarques (ou null). */
export async function lancerRelecture(editor: Editor, portee: Portee, sansCitations: boolean): Promise<number | null> {
  if (etat.enCours) return null;
  const { from, to, empty } = editor.state.selection;
  const plage = portee === "selection" && !empty ? { de: from, a: to } : null;
  controleur = new AbortController();
  changer({ enCours: editor, avancement: { fait: 0, total: 1 }, erreur: null });
  const resultat = await relireDocument(editor, { plage, dictionnaire: lirePreferences().dictionnaire, sansCitations, surAvancement: (avancement) => changer({ avancement }), arret: controleur.signal });
  controleur = null;
  if ("erreur" in resultat) {
    changer({ enCours: null, avancement: null, erreur: { editeur: editor, texte: resultat.erreur } });
    return null;
  }
  dernieres.set(editor, { portee: plage ? "selection" : "tout", nombre: resultat.remarques.length, quand: Date.now() });
  changer({ enCours: null, avancement: null });
  return resultat.remarques.length;
}

export function arreterRelecture() {
  controleur?.abort();
}
