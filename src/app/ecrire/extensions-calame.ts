"use client";

import { Node as NoeudTiptap, type AnyExtension } from "@tiptap/core";
import { ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { extensionsDocument } from "@/lib/editeur/extensions";
import { VueLienCarte, VueLogique, VueSchema, VueSommaire, VueSophisme } from "../createur/_composants/editeur/VuesBlocs";
import { extensionsTableau } from "./tableaux";
import { VueDocumentLocal, VueImageLocale } from "./VuesLocales";
import { VueSommaireCalame } from "./blocs/SommaireCalame";
import { PageDeGarde } from "./blocs/PageDeGarde";
import { StyleCaractere, StylesNommes } from "./extensions/styles-nommes";
import { Ancres, IndexAlpha, Indexe, Renvoi, TableFigures } from "./blocs/References";
import { attributsEnveloppe, Galerie, ImageMiseEnPage, VueImageCalame } from "./blocs/ImageCalame";
import { Formule } from "./blocs/Formule";
import { Dessin } from "./blocs/Dessin";
import { CarteGeo } from "./blocs/CarteGeo";
import { Commentaire, DeuxColonnes, LienInterne } from "./blocs/Marges";
import { SautSection } from "./blocs/Sections";

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

/** Des vues propres au Calame : elles passent avant celles des articles (la table des matières d'un livre a des numéros de page). */
export const VUES_CALAME: Record<string, (p: NodeViewProps) => React.ReactNode> = {
  sommaire: VueSommaireCalame,
  image: VueImageCalame,
};

/** Des attributs posés sur l'enveloppe d'une vue (l'image qui flotte porte son habillage et sa largeur). */
const ENVELOPPES: Record<string, (p: { node: { attrs: Record<string, unknown> } }) => Record<string, string>> = {
  image: ({ node }) => attributsEnveloppe(node),
};

export function avecVues(extensions: AnyExtension[]): AnyExtension[] {
  return extensions.map((e) => {
    const Vue = VUES_CALAME[e.name] ?? VUES[e.name];
    if (!Vue) return e;
    const attrs = ENVELOPPES[e.name] as ((p: { node: { attrs: Record<string, unknown> } }) => Record<string, string>) | undefined;
    return (e as NoeudTiptap).extend({ addNodeView: () => ReactNodeViewRenderer(Vue as Parameters<typeof ReactNodeViewRenderer>[0], attrs ? { attrs } : undefined) });
  });
}

/** Extensions supplémentaires du Calame (blocs et marques propres à l'atelier). */
export const EXTENSIONS_CALAME: AnyExtension[] = [
  PageDeGarde,
  StylesNommes,
  StyleCaractere,
  Ancres,
  Indexe,
  Renvoi,
  TableFigures,
  IndexAlpha,
  ImageMiseEnPage,
  Galerie,
  Formule,
  Dessin,
  CarteGeo,
  Commentaire,
  LienInterne,
  DeuxColonnes,
  SautSection,
];

/** Tout ce qu'il faut pour lire (et écrire) un document du Calame. */
export function extensionsContenu(): AnyExtension[] {
  return [...avecVues(extensionsDocument()), ...extensionsTableau, ...avecVues(EXTENSIONS_CALAME)];
}
