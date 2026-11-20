"use client";

import { Extension } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Le Calame — le sens d'écriture de chaque paragraphe.
 *
 * Un paragraphe (ou un titre, une ligne de liste) qui commence par de l'arabe
 * s'écrit de droite à gauche, sans rien régler : sa première lettre « forte »
 * décide, comme le ferait un traitement de texte. Le document enregistré ne
 * change pas ; l'export Word applique la même règle.
 */

const FORTE = /[\p{L}]/u;
const ARABE = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
const BLOCS = new Set(["paragraph", "heading"]);
const DEJA_ORIENTES = new Set(["versetArabe", "hadithArabe"]);

/** Le texte commence-t-il (à sa première lettre) par de l'écriture de droite à gauche ? */
export function commenceEnArabe(texte: string): boolean {
  for (const c of texte) {
    if (FORTE.test(c)) return ARABE.test(c);
  }
  return false;
}

function decorer(doc: NoeudPM): DecorationSet {
  const decorations: Decoration[] = [];
  doc.descendants((noeud, pos) => {
    if (DEJA_ORIENTES.has(noeud.type.name)) return false;
    if (BLOCS.has(noeud.type.name)) {
      if (commenceEnArabe(noeud.textContent)) decorations.push(Decoration.node(pos, pos + noeud.nodeSize, { dir: "rtl", class: "calame-rtl" }));
      return false;
    }
    return true;
  });
  return DecorationSet.create(doc, decorations);
}

export const SensEcriture = Extension.create({
  name: "sensEcritureCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: new PluginKey("sensEcritureCalame"),
        state: {
          init: (_, etat) => decorer(etat.doc),
          apply: (tr, valeur, _ancien, nouvel) => {
            if (!tr.docChanged) return valeur;
            // Une frappe ne touche qu'un bloc : on ne refait que les blocs modifiés.
            let suite = valeur.map(tr.mapping, nouvel.doc);
            const touches: { from: number; to: number }[] = [];
            tr.mapping.maps.forEach((carte, i) => {
              carte.forEach((_a, _b, debut, fin) => {
                let d = debut;
                let f = fin;
                for (let j = i + 1; j < tr.mapping.maps.length; j++) {
                  d = tr.mapping.maps[j].map(d, -1);
                  f = tr.mapping.maps[j].map(f, 1);
                }
                touches.push({ from: d, to: f });
              });
            });
            if (touches.length === 0) return suite;
            for (const { from, to } of touches) {
              const debut = Math.max(0, Math.min(from, nouvel.doc.content.size));
              const fin = Math.max(debut, Math.min(to, nouvel.doc.content.size));
              suite = suite.remove(suite.find(debut, fin));
              const ajouts: Decoration[] = [];
              nouvel.doc.nodesBetween(debut, fin, (noeud, pos) => {
                if (DEJA_ORIENTES.has(noeud.type.name)) return false;
                if (BLOCS.has(noeud.type.name)) {
                  if (commenceEnArabe(noeud.textContent)) ajouts.push(Decoration.node(pos, pos + noeud.nodeSize, { dir: "rtl", class: "calame-rtl" }));
                  return false;
                }
                return true;
              });
              suite = suite.add(nouvel.doc, ajouts);
            }
            return suite;
          },
        },
        props: {
          decorations(etat) {
            return this.getState(etat);
          },
        },
      }),
    ];
  },
});
