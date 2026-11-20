"use client";

import { Extension, Mark, type Editor } from "@tiptap/core";

/**
 * Le Calame — styles nommés. Un style de paragraphe se pose sur le paragraphe (ou le titre)
 * entier ; un style de caractère sur quelques mots. Leur allure se règle dans l'onglet
 * « Styles », une fois pour tout le document.
 */
export const StylesNommes = Extension.create({
  name: "stylesNommes",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          styleNomme: {
            default: null,
            parseHTML: (el) => el.getAttribute("data-style-nomme"),
            renderHTML: (a) => (a.styleNomme ? { "data-style-nomme": String(a.styleNomme) } : {}),
          },
        },
      },
    ];
  },
});

export const StyleCaractere = Mark.create({
  name: "styleCaractere",
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-style-car"),
        renderHTML: (a) => (a.id ? { "data-style-car": String(a.id) } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-style-car]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

/** Pose un style de paragraphe sur les paragraphes et titres de la sélection (null : l'enlever). */
export function poserStyleParagraphe(editor: Editor, id: string | null): void {
  editor.chain().focus().updateAttributes("paragraph", { styleNomme: id }).updateAttributes("heading", { styleNomme: id }).run();
}

/** Pose un style de caractère sur la sélection (null : l'enlever). */
export function poserStyleCaractere(editor: Editor, id: string | null): void {
  const chaine = editor.chain().focus();
  if (id) chaine.setMark("styleCaractere", { id }).run();
  else chaine.unsetMark("styleCaractere").run();
}

/** Le style de paragraphe du bloc où se trouve le curseur. */
export function styleCourant(editor: Editor): string | null {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    const n = $from.node(d);
    if (n.type.name === "paragraph" || n.type.name === "heading") return (n.attrs.styleNomme as string | null) ?? null;
  }
  return null;
}
