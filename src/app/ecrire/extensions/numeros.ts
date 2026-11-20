"use client";

import { Extension, type Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Le Calame — les numéros posés dans le texte : appels de note (1, 2, 3…), titres
 * numérotés (1., 1.1., 1.1.1.), légendes (Figure 3, Tableau 2).
 *
 * Ils sont recalculés à chaque modification, en décorations : rien n'entre dans le
 * document enregistré. Le numéro est écrit sur l'élément lui-même (data-numero) et
 * non laissé à un compteur CSS : l'impression recopie les pages une à une, et un
 * compteur repartirait de 1 sur chacune ; une partie repliée, elle, fausserait la suite.
 */

export type ReglagesNumeros = { titres: boolean };

type Etat = { reglages: ReglagesNumeros; decorations: DecorationSet };

export const CLE_NUMEROS = new PluginKey<Etat>("numerosCalame");

export type NumeroTitre = { pos: number; niveau: number; numero: string; texte: string; ordinal: number };

/** Les titres du document, dans l'ordre, avec leur numéro (vide si la numérotation est coupée). */
export function titresNumerotes(doc: NoeudPM, numeroter: boolean): NumeroTitre[] {
  const titres: NumeroTitre[] = [];
  const compteurs = [0, 0, 0];
  let ordinal = 0;
  doc.descendants((n, pos) => {
    if (n.type.name !== "heading") return true;
    ordinal++;
    const niveau = Math.min(4, Math.max(2, Number(n.attrs.level) || 2));
    const i = niveau - 2;
    compteurs[i]++;
    for (let j = i + 1; j < compteurs.length; j++) compteurs[j] = 0;
    // Un titre de niveau 3 sans titre 2 avant lui commence quand même à 1, pas à 0.
    const numero = numeroter ? `${compteurs.slice(0, i + 1).map((c) => Math.max(1, c)).join(".")}.` : "";
    titres.push({ pos, niveau, numero, texte: n.textContent.trim(), ordinal });
    return false;
  });
  return titres;
}

/** Les notes du document, dans l'ordre : leur numéro et leur texte. */
export function notesDuDocument(doc: NoeudPM): { pos: number; numero: string; texte: string }[] {
  const notes: { pos: number; numero: string; texte: string }[] = [];
  doc.descendants((n, pos) => {
    if (n.type.name === "note") {
      notes.push({ pos, numero: String(notes.length + 1), texte: String(n.attrs.texte ?? "").trim() });
      return false;
    }
    return true;
  });
  return notes;
}

function calculer(doc: NoeudPM, reglages: ReglagesNumeros): DecorationSet {
  const decorations: Decoration[] = [];
  for (const note of notesDuDocument(doc)) {
    const n = doc.nodeAt(note.pos);
    if (n) decorations.push(Decoration.node(note.pos, note.pos + n.nodeSize, { "data-numero": note.numero }));
  }
  if (reglages.titres) {
    for (const t of titresNumerotes(doc, true)) {
      const n = doc.nodeAt(t.pos);
      if (n) decorations.push(Decoration.node(t.pos, t.pos + n.nodeSize, { "data-numero": t.numero }));
    }
  }
  // Légendes numérotées : « Figure n » sous les images, « Tableau n » sur les tableaux légendés.
  let figure = 0;
  doc.descendants((n, pos) => {
    if (n.type.name === "image") {
      figure++;
      decorations.push(Decoration.node(pos, pos + n.nodeSize, { "data-figure": String(figure) }));
      return false;
    }
    return true;
  });
  return DecorationSet.create(doc, decorations);
}

export const Numeros = Extension.create({
  name: "numerosCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin<Etat>({
        key: CLE_NUMEROS,
        state: {
          init: (_, etat) => {
            const reglages = { titres: false };
            return { reglages, decorations: calculer(etat.doc, reglages) };
          },
          apply: (tr, valeur, _avant, apres) => {
            const meta = tr.getMeta(CLE_NUMEROS) as ReglagesNumeros | undefined;
            if (meta) return { reglages: meta, decorations: calculer(apres.doc, meta) };
            if (!tr.docChanged) return valeur;
            return { reglages: valeur.reglages, decorations: calculer(apres.doc, valeur.reglages) };
          },
        },
        props: {
          decorations: (etat) => CLE_NUMEROS.getState(etat)?.decorations ?? DecorationSet.empty,
        },
      }),
    ];
  },
});

/** Allume ou éteint la numérotation des titres (les notes, elles, sont toujours numérotées). */
export function reglerNumeros(editor: Editor, reglages: ReglagesNumeros): void {
  const actuel = CLE_NUMEROS.getState(editor.state)?.reglages;
  if (actuel && actuel.titres === reglages.titres) return;
  const tr = editor.state.tr.setMeta(CLE_NUMEROS, reglages);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}
