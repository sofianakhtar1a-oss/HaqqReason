"use client";

import type { Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

/**
 * Le Calame — le plan, vivant : chaque titre de premier niveau du texte, la longueur
 * de sa partie, et les gestes pour réorganiser (déplacer une partie entière, monter
 * ou descendre d'un niveau de titre).
 */

export type EntreePlan = { pos: number; niveau: number; texte: string; mots: number; fin: number };

const NIVEAU_MIN = 2;
const NIVEAU_MAX = 4;

function compterMots(texte: string): number {
  return (texte.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

/** Les titres du texte (au premier niveau du document), avec la fin et la longueur de leur partie. */
export function planDuDocument(doc: NoeudPM): EntreePlan[] {
  const blocs: { pos: number; noeud: NoeudPM }[] = [];
  doc.forEach((noeud, pos) => blocs.push({ pos, noeud }));
  const entrees: EntreePlan[] = [];
  blocs.forEach((b, i) => {
    if (b.noeud.type.name !== "heading") return;
    const niveau = Number(b.noeud.attrs.level) || NIVEAU_MIN;
    let fin = doc.content.size;
    let mots = 0;
    for (let j = i + 1; j < blocs.length; j++) {
      const autre = blocs[j];
      if (autre.noeud.type.name === "heading" && (Number(autre.noeud.attrs.level) || NIVEAU_MIN) <= niveau) {
        fin = autre.pos;
        break;
      }
      mots += compterMots(autre.noeud.textContent);
    }
    entrees.push({ pos: b.pos, niveau, texte: b.noeud.textContent.trim(), mots, fin });
  });
  return entrees;
}

/** Place le curseur au début d'un titre et le montre. */
export function allerAuTitre(editor: Editor, pos: number): void {
  const noeud = editor.state.doc.nodeAt(pos);
  if (!noeud) return;
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos + 1)).scrollIntoView());
  const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
  dom?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  editor.view.focus();
}

/**
 * Déplace une partie entière (son titre et tout ce qui la suit) avant un autre titre,
 * ou à la fin du document (cible = null). Une seule étape à annuler.
 */
export function deplacerPartie(editor: Editor, posSource: number, posCible: number | null): boolean {
  const { doc } = editor.state;
  const source = planDuDocument(doc).find((e) => e.pos === posSource);
  if (!source) return false;
  const cible = posCible ?? doc.content.size;
  if (cible >= source.pos && cible <= source.fin) return false;
  const tranche = doc.slice(source.pos, source.fin);
  const tr = editor.state.tr;
  if (cible > source.fin) {
    tr.insert(cible, tranche.content);
    tr.delete(source.pos, source.fin);
  } else {
    tr.delete(source.pos, source.fin);
    tr.insert(cible, tranche.content);
  }
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

/** Monte (delta = -1) ou descend (+1) une partie d'un niveau, sous-titres compris. */
export function changerNiveau(editor: Editor, pos: number, delta: 1 | -1): boolean {
  const { doc } = editor.state;
  const entree = planDuDocument(doc).find((e) => e.pos === pos);
  if (!entree) return false;
  const titres: { pos: number; niveau: number }[] = [];
  doc.nodesBetween(entree.pos, entree.fin, (noeud, p) => {
    if (noeud.type.name === "heading") titres.push({ pos: p, niveau: Number(noeud.attrs.level) || NIVEAU_MIN });
    return false;
  });
  if (titres.some((t) => t.niveau + delta < NIVEAU_MIN || t.niveau + delta > NIVEAU_MAX)) return false;
  const tr = editor.state.tr;
  for (const t of titres) {
    const noeud = doc.nodeAt(t.pos);
    if (noeud) tr.setNodeMarkup(t.pos, undefined, { ...noeud.attrs, level: t.niveau + delta });
  }
  editor.view.dispatch(tr);
  return true;
}
