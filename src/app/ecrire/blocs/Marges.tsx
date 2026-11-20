"use client";

import { Extension, Mark, mergeAttributes, Node, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * Le Calame — trois outils qui servent l'auteur sans jamais s'imprimer ni changer le texte :
 *   • les commentaires pour soi, dans la marge ;
 *   • les liens internes, vers une partie du document ou vers un autre document du Calame ;
 *   • le bloc « deux colonnes », pour une partie du texte.
 */

// ---------------------------------------------------------------------------
// Commentaires pour soi
// ---------------------------------------------------------------------------

export const Commentaire = Mark.create({
  name: "commentaire",
  inclusive: false,
  excludes: "",
  addAttributes() {
    return {
      id: { default: "", parseHTML: (el) => el.getAttribute("data-commentaire") ?? "", renderHTML: (a) => ({ "data-commentaire": String(a.id ?? "") }) },
      texte: { default: "", parseHTML: (el) => el.getAttribute("data-texte") ?? "", renderHTML: (a) => ({ "data-texte": String(a.texte ?? ""), title: `Commentaire : ${String(a.texte ?? "")}` }) },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-commentaire]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "calame-commente" }), 0];
  },
});

export type CommentaireDoc = { id: string; texte: string; extrait: string; from: number; to: number };

/** Les commentaires du document, dans l'ordre, avec le passage qu'ils accompagnent. */
export function commentairesDuDocument(editor: Editor): CommentaireDoc[] {
  const parId = new Map<string, CommentaireDoc>();
  editor.state.doc.descendants((n, pos) => {
    if (!n.isText) return true;
    for (const m of n.marks) {
      if (m.type.name !== "commentaire") continue;
      const id = String(m.attrs.id);
      const actuel = parId.get(id);
      if (actuel) {
        actuel.to = pos + n.nodeSize;
        actuel.extrait = `${actuel.extrait}${n.text ?? ""}`.slice(0, 80);
      } else parId.set(id, { id, texte: String(m.attrs.texte ?? ""), extrait: (n.text ?? "").slice(0, 80), from: pos, to: pos + n.nodeSize });
    }
    return false;
  });
  return [...parId.values()];
}

export function ajouterCommentaire(editor: Editor, texte: string): boolean {
  const { empty } = editor.state.selection;
  if (empty || !texte.trim()) return false;
  const id = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  return editor.chain().focus().setMark("commentaire", { id, texte: texte.trim().slice(0, 2000) }).run();
}

/** Change le texte d'un commentaire (ou le retire si `texte` est null). */
export function modifierCommentaire(editor: Editor, id: string, texte: string | null): void {
  const type = editor.schema.marks.commentaire;
  if (!type) return;
  const tr = editor.state.tr;
  editor.state.doc.descendants((n, pos) => {
    if (!n.isText) return true;
    const m = n.marks.find((x) => x.type === type && x.attrs.id === id);
    if (!m) return false;
    tr.removeMark(pos, pos + n.nodeSize, m);
    if (texte !== null) tr.addMark(pos, pos + n.nodeSize, type.create({ id, texte: texte.slice(0, 2000) }));
    return false;
  });
  if (tr.docChanged) editor.view.dispatch(tr);
}

// ---------------------------------------------------------------------------
// Liens internes
// ---------------------------------------------------------------------------

export const LienInterne = Mark.create({
  name: "lienInterne",
  inclusive: false,
  addAttributes() {
    return {
      ancre: { default: null, parseHTML: (el) => el.getAttribute("data-ancre-cible"), renderHTML: (a) => (a.ancre ? { "data-ancre-cible": String(a.ancre) } : {}) },
      document: { default: null, parseHTML: (el) => el.getAttribute("data-document"), renderHTML: (a) => (a.document ? { "data-document": String(a.document) } : {}) },
      titre: { default: "", parseHTML: (el) => el.getAttribute("title") ?? "", renderHTML: (a) => (a.titre ? { title: String(a.titre) } : {}) },
    };
  },
  parseHTML() {
    return [{ tag: "a.calame-lien-interne" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(HTMLAttributes, { class: "calame-lien-interne", role: "link" }), 0];
  },
});

export type SuivreLien = (cible: { ancre: string | null; document: string | null }) => void;

/** Ctrl + clic (ou ⌘ + clic) sur un lien interne : on y va. Dans une vue en lecture seule, un simple clic suffit. */
export function pluginLiensInternes(suivre: SuivreLien): Plugin {
  return new Plugin({
    key: new PluginKey("liensInternes"),
    props: {
      handleClick(view, _pos, event) {
        const lien = (event.target as HTMLElement | null)?.closest?.("a.calame-lien-interne") as HTMLElement | null;
        if (!lien) return false;
        if (view.editable && !(event.ctrlKey || event.metaKey)) return false;
        event.preventDefault();
        suivre({ ancre: lien.getAttribute("data-ancre-cible"), document: lien.getAttribute("data-document") });
        return true;
      },
    },
  });
}

/** L'extension qui suit les liens : l'atelier lui donne, une fois monté, la façon d'ouvrir un autre document. */
export const SuiviLiensInternes = Extension.create<Record<string, never>, { suivre: SuivreLien | null }>({
  name: "liensInternesCalame",
  addStorage() {
    return { suivre: null };
  },
  addProseMirrorPlugins() {
    const stockage = this.storage;
    return [pluginLiensInternes((c) => stockage.suivre?.(c))];
  },
});

/** Donne à l'éditeur la façon de suivre ses liens internes. */
export function brancherSuiviLiens(editor: Editor, suivre: SuivreLien): void {
  const stockage = editor.storage as unknown as Record<string, { suivre: SuivreLien | null } | undefined>;
  const suivi = stockage.liensInternesCalame;
  if (suivi) suivi.suivre = suivre;
}

/** Va à l'ancre d'un titre du document ouvert. */
export function allerALAncre(editor: Editor, ancre: string): boolean {
  let cible: number | null = null;
  editor.state.doc.descendants((n, pos) => {
    if (cible !== null) return false;
    if (n.attrs?.ancre === ancre) cible = pos;
    return true;
  });
  if (cible === null) return false;
  const dom = editor.view.nodeDOM(cible) as HTMLElement | null;
  dom?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return true;
}

// ---------------------------------------------------------------------------
// Deux colonnes
// ---------------------------------------------------------------------------

export const DeuxColonnes = Node.create({
  name: "deuxColonnes",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "div.calame-deux-colonnes" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "calame-deux-colonnes" }), 0];
  },
});

/** Met les blocs de la sélection en deux colonnes. */
export function mettreEnDeuxColonnes(editor: Editor): boolean {
  return editor.chain().focus().wrapIn("deuxColonnes").run();
}

/** Remet en une seule colonne le bloc « deux colonnes » qui contient le curseur. */
export function revenirAUneColonne(editor: Editor): boolean {
  const { state } = editor;
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const n = $from.node(d);
    if (n.type.name !== "deuxColonnes") continue;
    const pos = $from.before(d);
    editor.view.dispatch(state.tr.replaceWith(pos, pos + n.nodeSize, n.content));
    return true;
  }
  return false;
}

/**
 * Pose un lien interne sur la sélection (ou, sans sélection, insère le titre de la cible déjà lié).
 * Un titre visé reçoit d'abord une ancre stable, pour que le lien survive aux changements.
 */
export function poserLienInterne(editor: Editor, cible: { pos?: number; ancre?: string | null; document?: string; texte: string }): boolean {
  const { state } = editor;
  const type = state.schema.marks.lienInterne;
  if (!type) return false;
  let tr = state.tr;
  let ancre = cible.ancre ?? null;
  if (cible.pos !== undefined && !ancre) {
    const n = state.doc.nodeAt(cible.pos);
    if (!n) return false;
    ancre = `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    tr = tr.setNodeMarkup(cible.pos, undefined, { ...n.attrs, ancre });
  }
  const marque = type.create({ ancre: cible.document ? null : ancre, document: cible.document ?? null, titre: cible.texte.slice(0, 200) });
  const { from, to, empty } = tr.selection;
  if (empty) {
    const texte = cible.texte || "lien";
    tr = tr.insertText(texte, from).addMark(from, from + texte.length, marque);
  } else tr = tr.addMark(from, to, marque);
  editor.view.dispatch(tr.scrollIntoView());
  editor.view.focus();
  return true;
}
