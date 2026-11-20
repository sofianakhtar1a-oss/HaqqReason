"use client";

import { Extension, type Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Le Calame — replier une partie.
 *
 * Un titre replié cache, à l'écran seulement, tout ce qui le suit jusqu'au titre
 * suivant de même rang (ou plus haut). Le texte n'est pas touché ; l'impression et les
 * exports montrent toujours tout. Une petite flèche devant chaque titre replie et déplie.
 */

export const CLE_REPLIS = new PluginKey<number[]>("replisCalame");

/** La partie d'un titre de premier niveau : [début du titre, fin de sa dernière ligne). */
export function partie(doc: NoeudPM, posTitre: number): { from: number; to: number; niveau: number } | null {
  const titre = doc.nodeAt(posTitre);
  if (!titre || titre.type.name !== "heading") return null;
  const niveau = Number(titre.attrs.level) || 2;
  let fin = doc.content.size;
  let trouve = false;
  doc.forEach((noeud, offset) => {
    if (trouve || offset <= posTitre) return;
    if (noeud.type.name === "heading" && (Number(noeud.attrs.level) || 2) <= niveau) {
      fin = offset;
      trouve = true;
    }
  });
  return { from: posTitre, to: fin, niveau };
}

function decorer(doc: NoeudPM, replis: number[]): DecorationSet {
  const decorations: Decoration[] = [];
  const caches = new Set<number>();
  for (const pos of replis) {
    const p = partie(doc, pos);
    if (!p) continue;
    const titre = doc.nodeAt(pos);
    let n = 0;
    doc.forEach((noeud, offset) => {
      if (offset > pos && offset < p.to && !caches.has(offset)) {
        caches.add(offset);
        decorations.push(Decoration.node(offset, offset + noeud.nodeSize, { class: "calame-replie" }));
        n++;
      }
    });
    if (titre) {
      decorations.push(
        Decoration.widget(
          pos + titre.nodeSize,
          () => {
            const el = document.createElement("button");
            el.type = "button";
            el.className = "calame-replie-etiquette";
            el.contentEditable = "false";
            el.setAttribute("data-widget", "");
            el.dataset.replisPos = String(pos);
            el.textContent = n > 0 ? `${n} bloc${n > 1 ? "s" : ""} replié${n > 1 ? "s" : ""} — déplier` : "Partie vide — déplier";
            return el;
          },
          { side: 1, key: `repli-${pos}-${n}` },
        ),
      );
    }
  }
  // La flèche devant chaque titre de premier niveau.
  doc.forEach((noeud, offset) => {
    if (noeud.type.name !== "heading") return;
    const replie = replis.includes(offset);
    decorations.push(
      Decoration.widget(
        offset + 1,
        () => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = "calame-repli-fleche sans-impression";
          el.contentEditable = "false";
          el.dataset.replisPos = String(offset);
          el.setAttribute("aria-label", replie ? "Déplier cette partie" : "Replier cette partie");
          el.setAttribute("aria-expanded", replie ? "false" : "true");
          el.textContent = replie ? "▸" : "▾";
          return el;
        },
        { side: -1, key: `fleche-${offset}-${replie ? 1 : 0}`, ignoreSelection: true },
      ),
    );
  });
  return DecorationSet.create(doc, decorations);
}

export const Replis = Extension.create({
  name: "replisCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin<number[]>({
        key: CLE_REPLIS,
        state: {
          init: () => [],
          apply: (tr, valeur, _ancien, nouvel) => {
            const meta = tr.getMeta(CLE_REPLIS) as number[] | undefined;
            if (meta) return meta;
            if (!tr.docChanged || valeur.length === 0) return valeur;
            return valeur.map((p) => tr.mapping.map(p)).filter((p) => nouvel.doc.nodeAt(p)?.type.name === "heading");
          },
        },
        props: {
          decorations(etat) {
            return decorer(etat.doc, CLE_REPLIS.getState(etat) ?? []);
          },
          handleDOMEvents: {
            mousedown(vue, evenement) {
              const cible = (evenement.target as HTMLElement | null)?.closest<HTMLElement>("[data-replis-pos]");
              if (!cible) return false;
              evenement.preventDefault();
              const pos = Number(cible.dataset.replisPos);
              const actuels = CLE_REPLIS.getState(vue.state) ?? [];
              const suite = actuels.includes(pos) ? actuels.filter((p) => p !== pos) : [...actuels, pos];
              vue.dispatch(vue.state.tr.setMeta(CLE_REPLIS, suite).setMeta("addToHistory", false));
              return true;
            },
          },
        },
      }),
    ];
  },
});

export function replisActuels(editor: Editor | null): number[] {
  return (editor && CLE_REPLIS.getState(editor.state)) || [];
}

export function basculerRepli(editor: Editor, pos: number): void {
  const actuels = replisActuels(editor);
  const suite = actuels.includes(pos) ? actuels.filter((p) => p !== pos) : [...actuels, pos];
  editor.view.dispatch(editor.state.tr.setMeta(CLE_REPLIS, suite).setMeta("addToHistory", false));
}

export function toutDeplier(editor: Editor): void {
  if (replisActuels(editor).length === 0) return;
  editor.view.dispatch(editor.state.tr.setMeta(CLE_REPLIS, []).setMeta("addToHistory", false));
}
