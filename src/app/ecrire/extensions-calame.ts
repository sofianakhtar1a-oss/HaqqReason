"use client";

import { Node as NoeudTiptap, type AnyExtension } from "@tiptap/core";
import { ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { extensionsDocument } from "@/lib/editeur/extensions";
import { VueLienCarte, VueLogique, VueSchema, VueSommaire, VueSophisme } from "../createur/_composants/editeur/VuesBlocs";
import { extensionsTableau } from "./tableaux";
import { VueDocumentLocal, VueImageLocale } from "./VuesLocales";

/**
 * Le vocabulaire des documents du Calame : celui des articles du site (mêmes blocs,
 * mêmes vues), plus ce qui n'existe qu'ici (les tableaux, et les blocs propres à
 * l'atelier). Utilisé par l'éditeur, par les vues en lecture seule (versions, vue
 * côte à côte) et par les exports, pour que tous lisent le même document.
 */

const VUES: Record<string, (p: NodeViewProps) => React.ReactNode> = {
  schema: VueSchema,
  logique: VueLogique,
  lienCarte: VueLienCarte,
  sophisme: VueSophisme,
  sommaire: VueSommaire,
  image: VueImageLocale,
  documentPdf: VueDocumentLocal,
};

/** Des vues propres au Calame, ajoutées par les modules qui les définissent (blocs de l'atelier). */
export const VUES_CALAME: Record<string, (p: NodeViewProps) => React.ReactNode> = {};

export function avecVues(extensions: AnyExtension[]): AnyExtension[] {
  return extensions.map((e) => {
    const Vue = VUES_CALAME[e.name] ?? VUES[e.name];
    if (!Vue) return e;
    return (e as NoeudTiptap).extend({ addNodeView: () => ReactNodeViewRenderer(Vue as Parameters<typeof ReactNodeViewRenderer>[0]) });
  });
}

/** Extensions supplémentaires du Calame (blocs et marques propres à l'atelier), déclarées par leurs modules. */
export const EXTENSIONS_CALAME: AnyExtension[] = [];

/** Tout ce qu'il faut pour lire (et écrire) un document du Calame. */
export function extensionsContenu(): AnyExtension[] {
  return [...avecVues(extensionsDocument()), ...extensionsTableau, ...avecVues(EXTENSIONS_CALAME)];
}
