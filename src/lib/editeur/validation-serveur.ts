import "server-only";
import { getSchema } from "@tiptap/core";
import type { Schema } from "@tiptap/pm/model";
import { nettoyerDocument, type NoeudJSON } from "../document-schema";
import { extensionsDocument } from "./extensions";

let schema: Schema | null = null;

/**
 * Contrôle complet d'un document reçu du navigateur :
 * 1. nettoyage par liste blanche (types, attributs, liens) ;
 * 2. vérification de la structure par le moteur de l'éditeur (un verset contient bien un texte arabe puis une traduction, etc.).
 */
export function validerDocument(entree: unknown): { ok: true; document: NoeudJSON } | { ok: false } {
  const propre = nettoyerDocument(entree);
  if (!propre.content || propre.content.length === 0) propre.content = [{ type: "paragraph" }];
  schema ??= getSchema(extensionsDocument());
  try {
    schema.nodeFromJSON(propre).check();
    return { ok: true, document: propre };
  } catch {
    return { ok: false };
  }
}
