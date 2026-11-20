"use client";

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Le Calame — le bloc en cours. En mode concentration, tout le reste s'estompe ;
 * la décoration ne fait que poser une classe sur le bloc où se trouve le curseur.
 */
export const BlocCourant = Extension.create({
  name: "blocCourantCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("blocCourantCalame"),
        props: {
          decorations(etat) {
            const { $from } = etat.selection;
            if ($from.depth < 1) return DecorationSet.empty;
            const debut = $from.before(1);
            const noeud = etat.doc.nodeAt(debut);
            if (!noeud) return DecorationSet.empty;
            return DecorationSet.create(etat.doc, [Decoration.node(debut, debut + noeud.nodeSize, { class: "calame-bloc-courant" })]);
          },
        },
      }),
    ];
  },
});
