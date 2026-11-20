"use client";

import { Extension, mergeAttributes, Node, type Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/**
 * Le Calame — les sauts de section : à partir d'ici, les pages passent en paysage (un grand
 * tableau, une frise), puis une autre section les remet en portrait. Chaque section commence
 * sur une page neuve.
 */

export type OrientationSection = "portrait" | "paysage";

export const SautSection = Node.create({
  name: "sautSection",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      orientation: {
        default: "paysage",
        parseHTML: (el) => (el.getAttribute("data-orientation") === "portrait" ? "portrait" : "paysage"),
        renderHTML: (a) => ({ "data-orientation": a.orientation === "portrait" ? "portrait" : "paysage" }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div.calame-saut-section" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const paysage = node.attrs.orientation !== "portrait";
    return ["div", mergeAttributes(HTMLAttributes, { class: "calame-saut-section", contenteditable: "false" }), ["span", { class: "sans-impression" }, paysage ? "Section : pages en paysage" : "Section : pages en portrait"]];
  },
});

/** L'orientation de chaque bloc de premier niveau (par rang), selon les sauts de section qui le précèdent. */
export function orientationsDesBlocs(doc: NoeudPM, depart: OrientationSection): { section: number; orientation: OrientationSection }[] {
  const resultat: { section: number; orientation: OrientationSection }[] = [];
  let section = 0;
  let orientation = depart;
  doc.forEach((n) => {
    if (n.type.name === "sautSection") {
      section++;
      orientation = n.attrs.orientation === "portrait" ? "portrait" : "paysage";
    }
    resultat.push({ section, orientation });
  });
  return resultat;
}

type Reglages = { depart: OrientationSection; ecart: number };
type Etat = { reglages: Reglages; decorations: DecorationSet };

const CLE = new PluginKey<Etat>("sectionsCalame");

function decorer(doc: NoeudPM, r: Reglages): DecorationSet {
  if (!r.ecart) return DecorationSet.empty;
  const decorations: Decoration[] = [];
  const orientations = orientationsDesBlocs(doc, r.depart);
  doc.forEach((n, pos, i) => {
    const o = orientations[i];
    if (!o || o.orientation === r.depart || n.type.name === "sautSection") return;
    // Plus large (paysage dans un document en portrait) ou plus étroit : le bloc suit sa page.
    const d = o.orientation === "paysage" ? r.ecart : -r.ecart;
    decorations.push(Decoration.node(pos, pos + n.nodeSize, { style: `margin-left: ${-d}px; margin-right: ${-d}px; max-width: none;`, "data-section": o.orientation }));
  });
  return DecorationSet.create(doc, decorations);
}

export const Sections = Extension.create({
  name: "sectionsCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin<Etat>({
        key: CLE,
        state: {
          init: () => ({ reglages: { depart: "portrait", ecart: 0 }, decorations: DecorationSet.empty }),
          apply: (tr, valeur, _avant, apres) => {
            const meta = tr.getMeta(CLE) as Reglages | undefined;
            if (meta) return { reglages: meta, decorations: decorer(apres.doc, meta) };
            if (!tr.docChanged) return valeur;
            return { reglages: valeur.reglages, decorations: decorer(apres.doc, valeur.reglages) };
          },
        },
        props: { decorations: (etat) => CLE.getState(etat)?.decorations ?? DecorationSet.empty },
      }),
    ];
  },
});

/** L'orientation du document et l'écart de largeur (en pixels, de chaque côté) entre portrait et paysage. */
export function reglerSections(editor: Editor, reglages: Reglages): void {
  const actuel = CLE.getState(editor.state)?.reglages;
  if (actuel && actuel.depart === reglages.depart && Math.abs(actuel.ecart - reglages.ecart) < 0.5) return;
  const tr = editor.state.tr.setMeta(CLE, reglages);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}
