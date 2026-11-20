"use client";

import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { adapterCasse, chercher, OPTIONS_PAR_DEFAUT, premiereApres, type OptionsRecherche, type Trouvaille } from "@/lib/atelier/recherche-texte";

/**
 * Le Calame — rechercher et remplacer.
 *
 * Les trouvailles sont des décorations : elles ne touchent jamais au texte enregistré.
 * Elles suivent la frappe (le texte change, la liste se refait), et la trouvaille
 * active est mise en avant pour qu'on sache toujours où l'on en est.
 */

export type EtatRecherche = { requete: string; options: OptionsRecherche; trouvailles: Trouvaille[]; actif: number };

export const CLE_RECHERCHE = new PluginKey<EtatRecherche>("rechercheCalame");
const VIDE: EtatRecherche = { requete: "", options: OPTIONS_PAR_DEFAUT, trouvailles: [], actif: 0 };

type Meta = { requete?: string; options?: OptionsRecherche; actif?: number; depuis?: number };

export const Recherche = Extension.create({
  name: "rechercheCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin<EtatRecherche>({
        key: CLE_RECHERCHE,
        state: {
          init: () => VIDE,
          apply: (tr, valeur, _ancien, nouvel) => {
            const meta = tr.getMeta(CLE_RECHERCHE) as Meta | undefined;
            if (meta) {
              const requete = meta.requete ?? valeur.requete;
              const options = meta.options ?? valeur.options;
              const changeRequete = meta.requete !== undefined || meta.options !== undefined;
              const trouvailles = changeRequete || tr.docChanged ? chercher(nouvel.doc, requete, options) : valeur.trouvailles;
              let actif = meta.actif ?? valeur.actif;
              if (changeRequete) actif = premiereApres(trouvailles, meta.depuis ?? nouvel.selection.from);
              actif = trouvailles.length === 0 ? 0 : ((actif % trouvailles.length) + trouvailles.length) % trouvailles.length;
              return { requete, options, trouvailles, actif };
            }
            if (!tr.docChanged || !valeur.requete) return valeur;
            const trouvailles = chercher(nouvel.doc, valeur.requete, valeur.options);
            return { ...valeur, trouvailles, actif: trouvailles.length === 0 ? 0 : Math.min(valeur.actif, trouvailles.length - 1) };
          },
        },
        props: {
          decorations(etat) {
            const r = CLE_RECHERCHE.getState(etat);
            if (!r || !r.requete || r.trouvailles.length === 0) return DecorationSet.empty;
            return DecorationSet.create(
              etat.doc,
              r.trouvailles.map((t, i) => Decoration.inline(t.from, t.to, { class: i === r.actif ? "calame-trouve calame-trouve-actif" : "calame-trouve" })),
            );
          },
        },
      }),
    ];
  },
});

function envoyer(editor: Editor, meta: Meta) {
  const tr = editor.state.tr.setMeta(CLE_RECHERCHE, meta).setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

export function etatRecherche(editor: Editor | null): EtatRecherche {
  return (editor && CLE_RECHERCHE.getState(editor.state)) || VIDE;
}

/** Fait défiler la page pour montrer une position du texte, au milieu de l'écran. */
export function montrerPosition(editor: Editor, pos: number): void {
  try {
    const { node } = editor.view.domAtPos(pos);
    const element = (node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement)) ?? null;
    element?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  } catch {
    // Position hors de la vue : rien à montrer.
  }
}

export function lancerRecherche(editor: Editor, requete: string, options: OptionsRecherche): void {
  envoyer(editor, { requete, options, depuis: editor.state.selection.from });
  const r = etatRecherche(editor);
  const t = r.trouvailles[r.actif];
  if (t) montrerPosition(editor, t.from);
}

export function allerA(editor: Editor, sens: 1 | -1): void {
  const r = etatRecherche(editor);
  if (r.trouvailles.length === 0) return;
  envoyer(editor, { actif: r.actif + sens });
  const suite = etatRecherche(editor);
  const t = suite.trouvailles[suite.actif];
  if (!t) return;
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, t.from, t.to)).setMeta("addToHistory", false));
  montrerPosition(editor, t.from);
}

export function effacerRecherche(editor: Editor): void {
  envoyer(editor, { requete: "", actif: 0 });
}

/** Remplace la trouvaille active, puis passe à la suivante. */
export function remplacerActif(editor: Editor, remplacement: string): void {
  const r = etatRecherche(editor);
  const t = r.trouvailles[r.actif];
  if (!t) return;
  const trouve = editor.state.doc.textBetween(t.from, t.to, " ");
  const texte = adapterCasse(trouve, remplacement, r.options);
  const tr = remplacement ? editor.state.tr.insertText(texte, t.from, t.to) : editor.state.tr.delete(t.from, t.to);
  tr.setMeta(CLE_RECHERCHE, { actif: r.actif });
  editor.view.dispatch(tr);
  const suite = etatRecherche(editor);
  const prochaine = suite.trouvailles[suite.actif];
  if (prochaine) montrerPosition(editor, prochaine.from);
}

/** Remplace tout d'un coup (une seule étape à annuler). Rend le nombre de remplacements. */
export function remplacerTout(editor: Editor, remplacement: string): number {
  const r = etatRecherche(editor);
  if (r.trouvailles.length === 0) return 0;
  const tr = editor.state.tr;
  for (let i = r.trouvailles.length - 1; i >= 0; i--) {
    const t = r.trouvailles[i];
    const trouve = editor.state.doc.textBetween(t.from, t.to, " ");
    const texte = adapterCasse(trouve, remplacement, r.options);
    if (texte) tr.insertText(texte, t.from, t.to);
    else tr.delete(t.from, t.to);
  }
  editor.view.dispatch(tr);
  return r.trouvailles.length;
}
