"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

/**
 * Le Calame — le bloc « Formule » : une équation, ou une notation logique (∀x (P(x) → Q(x)),
 * ⊢, □…), composée comme dans un livre de mathématiques (KaTeX, écriture LaTeX).
 */

/** Les signes de logique les plus courants, à insérer d'un clic dans la source. */
const SIGNES: [string, string][] = [
  ["∀", "\\forall "],
  ["∃", "\\exists "],
  ["¬", "\\neg "],
  ["∧", "\\land "],
  ["∨", "\\lor "],
  ["→", "\\rightarrow "],
  ["↔", "\\leftrightarrow "],
  ["⊢", "\\vdash "],
  ["⊨", "\\vDash "],
  ["□", "\\Box "],
  ["◇", "\\Diamond "],
  ["≡", "\\equiv "],
  ["∴", "\\therefore "],
  ["∈", "\\in "],
  ["≠", "\\neq "],
  ["½", "\\frac{a}{b}"],
  ["√", "\\sqrt{x}"],
  ["Σ", "\\sum_{i=1}^{n} "],
];

export function composerFormule(source: string): { html: string; erreur: boolean } {
  try {
    return { html: katex.renderToString(source || "\\square", { displayMode: true, throwOnError: true, output: "htmlAndMathml", strict: "ignore" }), erreur: false };
  } catch {
    return { html: katex.renderToString(source || "\\square", { displayMode: true, throwOnError: false, output: "htmlAndMathml", strict: "ignore" }), erreur: true };
  }
}

function VueFormule({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const source = String(node.attrs.source ?? "");
  const { html, erreur } = useMemo(() => composerFormule(source), [source]);
  return (
    <NodeViewWrapper className="calame-formule" data-selectionne={selected || undefined} data-vide={source ? undefined : ""} contentEditable={false}>
      <div className="calame-formule-rendu" aria-label={`Formule : ${source}`} dangerouslySetInnerHTML={{ __html: html }} />
      {selected && editor.isEditable && (
        <div className="calame-formule-edition sans-impression">
          <div className="calame-formule-signes" role="group" aria-label="Signes">
            {SIGNES.map(([signe, code]) => (
              <button key={signe} type="button" onClick={() => updateAttributes({ source: `${source}${code}` })} title={code.trim()}>
                {signe}
              </button>
            ))}
          </div>
          <textarea className="champ" value={source} onChange={(e) => updateAttributes({ source: e.target.value.slice(0, 4000) })} rows={3} spellCheck={false} placeholder="Écriture LaTeX : \forall x \, (P(x) \rightarrow Q(x))" aria-label="Source de la formule" />
          {erreur && <p className="inspecteur-aide" data-alerte="">La formule n&apos;est pas encore complète : ce qui est rouge reste à corriger.</p>}
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const Formule = Node.create({
  name: "formule",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { source: { default: "", parseHTML: (el) => el.getAttribute("data-source") ?? "", renderHTML: (a) => ({ "data-source": String(a.source ?? "") }) } };
  },
  parseHTML() {
    return [{ tag: "div.calame-formule[data-source]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "calame-formule" }), String(node.attrs.source ?? "")];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueFormule, {
      stopEvent: ({ event }) => !!(event.target as HTMLElement | null)?.closest?.(".calame-formule-edition"),
    });
  },
});
