"use client";

import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Le Calame — les coupures de page, posées dans le texte.
 *
 * On ne découpe pas le document en plusieurs zones éditables : on garde un seul
 * texte, et on y insère des blancs calculés, juste avant le bloc qui ouvre
 * chaque nouvelle page. Le texte retombe donc exactement en haut de la feuille
 * suivante, tout en restant un seul document : curseur, sélection, annulation
 * et glisser-déposer traversent les pages sans s'en apercevoir.
 *
 * Les blancs sont des décorations : ils n'entrent jamais dans le document
 * enregistré, et disparaissent de l'export comme de l'impression.
 */

/** pos : position dans le document, juste avant le bloc (ou l'élément de liste) qui ouvre la page. */
export type Coupure = { pos: number; hauteur: number; numero: number };

const CLE = new PluginKey<{ coupures: Coupure[] }>("coupuresCalame");

export const CoupuresDePage = Extension.create({
  name: "coupuresCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CLE,
        state: {
          init: () => ({ coupures: [] as Coupure[] }),
          apply: (tr, valeur) => {
            const meta = tr.getMeta(CLE) as { coupures: Coupure[] } | undefined;
            if (meta) return meta;
            // Le texte a bougé avant la prochaine mesure : les blancs suivent leur bloc.
            return tr.docChanged ? { coupures: valeur.coupures.map((c) => ({ ...c, pos: tr.mapping.map(c.pos, -1) })) } : valeur;
          },
        },
        props: {
          decorations(etat) {
            const { coupures } = CLE.getState(etat) ?? { coupures: [] };
            if (coupures.length === 0) return DecorationSet.empty;
            const decorations: Decoration[] = [];
            const max = etat.doc.content.size;
            for (const coupure of coupures) {
              if (coupure.pos < 0 || coupure.pos > max) continue;
              decorations.push(
                Decoration.widget(
                  coupure.pos,
                  () => {
                    const blanc = document.createElement("div");
                    blanc.className = "calame-coupure";
                    blanc.setAttribute("contenteditable", "false");
                    blanc.setAttribute("data-blanc", "page");
                    blanc.setAttribute("aria-hidden", "true");
                    blanc.style.height = `${Math.max(0, coupure.hauteur)}px`;
                    const etiquette = document.createElement("span");
                    etiquette.className = "calame-coupure-numero";
                    etiquette.textContent = `Page ${coupure.numero}`;
                    blanc.appendChild(etiquette);
                    return blanc;
                  },
                  { side: -1, key: `coupure-${coupure.pos}-${Math.round(coupure.hauteur)}` },
                ),
              );
            }
            return DecorationSet.create(etat.doc, decorations);
          },
        },
      }),
    ];
  },
});

/** Pose (ou remplace) les blancs de coupure. Ne modifie pas le document. */
export function appliquerCoupures(editor: Editor, coupures: Coupure[]): void {
  const actuelles = CLE.getState(editor.state)?.coupures ?? [];
  const memeChose =
    actuelles.length === coupures.length &&
    actuelles.every((c, i) => c.pos === coupures[i].pos && Math.abs(c.hauteur - coupures[i].hauteur) < 0.5);
  if (memeChose) return;
  const tr = editor.state.tr.setMeta(CLE, { coupures });
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}
