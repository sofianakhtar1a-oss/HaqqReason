/**
 * Petites fonctions autour du contenu des articles.
 * Le format complet (liste blanche, nettoyage, texte brut) est dans document-schema.ts.
 */
import { compterMots, texteDuDocument, type NoeudJSON } from "./document-schema";

export type DocumentArticle = NoeudJSON;

/** Document vide (un paragraphe), point de départ d'un nouvel article. */
export function documentVide(): DocumentArticle {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

/** Texte brut, utilisé par la future recherche. */
export function documentVersTexteBrut(document: unknown): string {
  return texteDuDocument(document);
}

/** Texte aéré (paragraphes séparés par une ligne vide), utilisé pour comparer deux versions. */
export function documentVersTexteAere(document: unknown): string {
  return texteDuDocument(document, true);
}

export function minutesDeLecture(document: unknown): number {
  return Math.max(1, Math.round(compterMots(texteDuDocument(document)) / 230));
}
