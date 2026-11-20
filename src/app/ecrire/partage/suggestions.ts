"use client";

import { Extension, Mark, mergeAttributes, type Editor } from "@tiptap/core";
import type { Node as NoeudPM, Slice } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection, type EditorState, type Transaction } from "@tiptap/pm/state";
import { Mapping, type Step } from "@tiptap/pm/transform";
import { META_DISTANT } from "./collab";

/*
 * Le Calame — le mode suggestion. Ce qu'on tape s'inscrit en couleur (ajout proposé) ; ce qu'on efface
 * reste, barré (retrait proposé). L'auteur accepte ou refuse chaque proposition. Un relecteur écrit
 * toujours en mode suggestion ; un auteur peut s'y mettre quand il veut.
 */

export type AuteurSuggestion = { compte: string; nom: string; couleur: string };

const attributs = () => ({
  auteur: { default: "", parseHTML: (el: HTMLElement) => el.getAttribute("data-auteur") ?? "", renderHTML: (a: Record<string, unknown>) => ({ "data-auteur": String(a.auteur ?? "") }) },
  nom: { default: "", parseHTML: (el: HTMLElement) => el.getAttribute("data-nom") ?? "", renderHTML: (a: Record<string, unknown>) => ({ "data-nom": String(a.nom ?? "") }) },
  couleur: {
    default: "#1971c2",
    parseHTML: (el: HTMLElement) => el.getAttribute("data-couleur") ?? "#1971c2",
    renderHTML: (a: Record<string, unknown>) => (/^#[0-9a-f]{6}$/i.test(String(a.couleur)) ? { "data-couleur": String(a.couleur), style: `--sugg: ${String(a.couleur)}` } : {}),
  },
  quand: { default: "", parseHTML: (el: HTMLElement) => el.getAttribute("data-quand") ?? "", renderHTML: (a: Record<string, unknown>) => ({ "data-quand": String(a.quand ?? "") }) },
});

export const SuggestionAjout = Mark.create({
  name: "suggestionAjout",
  inclusive: false,
  excludes: "suggestionAjout",
  addAttributes: attributs,
  parseHTML: () => [{ tag: "ins[data-suggestion]" }],
  renderHTML: ({ HTMLAttributes, mark }) => ["ins", mergeAttributes(HTMLAttributes, { class: "calame-sugg calame-sugg-ajout", "data-suggestion": "ajout", title: `Ajout proposé par ${String(mark.attrs.nom || "un relecteur")}` }), 0],
});

export const SuggestionRetrait = Mark.create({
  name: "suggestionRetrait",
  inclusive: false,
  excludes: "suggestionRetrait",
  addAttributes: attributs,
  parseHTML: () => [{ tag: "del[data-suggestion]" }],
  renderHTML: ({ HTMLAttributes, mark }) => ["del", mergeAttributes(HTMLAttributes, { class: "calame-sugg calame-sugg-retrait", "data-suggestion": "retrait", title: `Retrait proposé par ${String(mark.attrs.nom || "un relecteur")}` }), 0],
});

type EtatSuggestions = { actif: boolean; force: boolean; auteur: AuteurSuggestion | null };
export const CLE_SUGGESTIONS = new PluginKey<EtatSuggestions>("suggestionsCalame");
type MetaSuggestions = { regler: EtatSuggestions } | { geste: true };

/** Tout ce texte est-il un ajout que j'ai moi-même proposé ? (l'effacer l'efface vraiment) */
function entierementMien(doc: NoeudPM, de: number, a: number, compte: string): boolean {
  let tout = true;
  let texte = false;
  doc.nodesBetween(de, a, (n) => {
    if (n.isText) {
      texte = true;
      if (!n.marks.some((m) => m.type.name === "suggestionAjout" && m.attrs.auteur === compte)) tout = false;
    } else if (n.isLeaf && n.isInline) tout = false;
    return true;
  });
  return texte && tout;
}

const ignorer = (t: Transaction) => !t.docChanged || Boolean(t.getMeta(META_DISTANT)) || t.getMeta("rebased") !== undefined || Boolean(t.getMeta(CLE_SUGGESTIONS)) || Boolean(t.getMeta("history$")) || t.getMeta("addToHistory") === false;

/** Transforme les changements tapés en propositions : le texte effacé revient barré, le texte ajouté se colore. */
function enSuggestions(transactions: readonly Transaction[], avant: EditorState, apres: EditorState): Transaction | null {
  const etat = CLE_SUGGESTIONS.getState(apres);
  if (!etat?.actif || !etat.auteur || !transactions.some((t) => !ignorer(t))) return null;
  const ajout = apres.schema.marks.suggestionAjout;
  const retrait = apres.schema.marks.suggestionRetrait;
  if (!ajout || !retrait) return null;
  // À la minute près : les frappes d'une même minute forment une seule proposition.
  const attrs = { auteur: etat.auteur.compte, nom: etat.auteur.nom, couleur: etat.auteur.couleur, quand: new Date().toISOString().slice(0, 16) };
  const tr = apres.tr;
  let curseur: number | null = null;
  transactions.forEach((t, k) => {
    if (ignorer(t)) return;
    const ensuite = new Mapping();
    for (let j = k + 1; j < transactions.length; j++) ensuite.appendMapping(transactions[j].mapping);
    t.steps.forEach((pas: Step, i) => {
      // Un remplacement simple (ni marque, ni enveloppe) : reconnu à sa forme, sans « instanceof »
      // (deux copies de ProseMirror peuvent cohabiter).
      const r = pas as unknown as { from?: unknown; to?: unknown; slice?: Slice; gapFrom?: unknown; mark?: unknown };
      if (typeof r.from !== "number" || typeof r.to !== "number" || !r.slice || r.gapFrom !== undefined || r.mark !== undefined) return;
      const from = r.from;
      const to = r.to;
      const slice = r.slice;
      const versApres = new Mapping(t.mapping.maps.slice(i + 1));
      versApres.appendMapping(ensuite);
      const debut = versApres.map(from, -1);
      const fin = versApres.map(from + slice.size, 1);
      const docAvant = t.docs[i];
      // Ce qui a été effacé revient, barré (sauf mes propres ajouts, qui disparaissent pour de bon).
      if (to > from && !entierementMien(docAvant, from, to, etat.auteur!.compte)) {
        const ici = tr.mapping.map(debut, -1);
        const taille = tr.doc.content.size;
        tr.replace(ici, ici, docAvant.slice(from, to));
        let finRendu = ici + (tr.doc.content.size - taille);
        tr.addMark(ici, finRendu, retrait.create(attrs));
        const miens: [number, number][] = [];
        tr.doc.nodesBetween(ici, finRendu, (n, pos) => {
          if (n.isText && n.marks.some((m) => m.type === ajout && m.attrs.auteur === etat.auteur!.compte)) miens.push([Math.max(pos, ici), Math.min(pos + n.nodeSize, finRendu)]);
        });
        for (const [x, y] of miens.reverse()) {
          tr.delete(x, y);
          finRendu -= y - x;
        }
        // Retour arrière : le curseur passe devant le texte barré, pour continuer vers la gauche.
        const sel = avant.selection;
        if (k === 0 && i === 0 && slice.size === 0 && sel.empty && sel.head === to) curseur = ici;
        else if (k === 0 && i === 0 && slice.size === 0 && !sel.empty) curseur = ici;
      }
      if (slice.size > 0) {
        const a = tr.mapping.map(debut, 1);
        const b = tr.mapping.map(fin, 1);
        if (b > a) tr.addMark(a, b, ajout.create(attrs));
      }
    });
  });
  if (!tr.docChanged) return null;
  if (curseur !== null) tr.setSelection(TextSelection.create(tr.doc, Math.max(0, Math.min(curseur, tr.doc.content.size))));
  return tr.setMeta(CLE_SUGGESTIONS, { geste: true } satisfies MetaSuggestions);
}

export const pluginSuggestions = () =>
  new Plugin<EtatSuggestions>({
    key: CLE_SUGGESTIONS,
    state: {
      init: () => ({ actif: false, force: false, auteur: null }),
      apply: (tr, avant) => {
        const meta = tr.getMeta(CLE_SUGGESTIONS) as MetaSuggestions | undefined;
        return meta && "regler" in meta ? meta.regler : avant;
      },
    },
    appendTransaction: enSuggestions,
  });

export const Suggestions = Extension.create({
  name: "suggestionsCalame",
  addProseMirrorPlugins() {
    return [pluginSuggestions()];
  },
});

/** La transaction qui règle le mode suggestion (pour un état sans éditeur, dans les essais). */
export const transactionReglage = (state: EditorState, regler: EtatSuggestions) => state.tr.setMeta(CLE_SUGGESTIONS, { regler } satisfies MetaSuggestions);

// ---------------------------------------------------------------- réglages et gestes

export const etatSuggestions = (state: EditorState): EtatSuggestions => CLE_SUGGESTIONS.getState(state) ?? { actif: false, force: false, auteur: null };

export function reglerSuggestions(editor: Editor, regler: EtatSuggestions) {
  editor.view.dispatch(editor.state.tr.setMeta(CLE_SUGGESTIONS, { regler } satisfies MetaSuggestions).setMeta("addToHistory", false));
}

export type Suggestion = { genre: "ajout" | "retrait"; de: number; a: number; auteur: string; nom: string; couleur: string; quand: string; texte: string };

/** Les propositions du document, chacune d'un seul tenant (même genre, même auteur, côte à côte). */
export function listerSuggestions(state: EditorState): Suggestion[] {
  const liste: Suggestion[] = [];
  state.doc.descendants((n, pos) => {
    if (!n.isText) return true;
    for (const m of n.marks) {
      const genre = m.type.name === "suggestionAjout" ? "ajout" : m.type.name === "suggestionRetrait" ? "retrait" : null;
      if (!genre) continue;
      const precedente = [...liste].reverse().find((s) => s.genre === genre && s.auteur === m.attrs.auteur && s.a === pos);
      if (precedente) {
        precedente.a = pos + n.nodeSize;
        precedente.texte = `${precedente.texte}${n.text ?? ""}`.slice(0, 160);
      } else liste.push({ genre, de: pos, a: pos + n.nodeSize, auteur: String(m.attrs.auteur), nom: String(m.attrs.nom), couleur: String(m.attrs.couleur), quand: String(m.attrs.quand), texte: (n.text ?? "").slice(0, 160) });
    }
    return false;
  });
  return liste.sort((x, y) => x.de - y.de);
}

function appliquer(tr: Transaction, s: Suggestion, accepter: boolean) {
  const type = tr.doc.type.schema.marks[s.genre === "ajout" ? "suggestionAjout" : "suggestionRetrait"];
  // Accepter un ajout ou refuser un retrait : la marque s'en va. Sinon, le texte s'en va.
  if ((s.genre === "ajout") === accepter) tr.removeMark(s.de, s.a, type);
  else tr.delete(s.de, s.a);
}

/** Accepte ou refuse une proposition dans une transaction (qui ne devient pas elle-même une proposition). */
export function trancherDans(tr: Transaction, s: Suggestion, accepter: boolean): Transaction {
  appliquer(tr, s, accepter);
  return tr.setMeta(CLE_SUGGESTIONS, { geste: true } satisfies MetaSuggestions);
}

export function trancher(editor: Editor, s: Suggestion, accepter: boolean) {
  editor.view.dispatch(trancherDans(editor.state.tr, s, accepter));
}

export function trancherTout(editor: Editor, accepter: boolean, auteur?: string) {
  const tr = editor.state.tr;
  // De la fin vers le début : les positions de ce qui reste à traiter ne bougent pas.
  for (const s of listerSuggestions(editor.state).filter((x) => !auteur || x.auteur === auteur).reverse()) appliquer(tr, s, accepter);
  if (tr.docChanged) editor.view.dispatch(tr.setMeta(CLE_SUGGESTIONS, { geste: true } satisfies MetaSuggestions));
}
