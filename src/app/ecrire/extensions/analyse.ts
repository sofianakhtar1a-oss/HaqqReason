"use client";

import { Extension, type Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { analyser, type Signalement } from "@/lib/atelier/analyse-texte";

/**
 * Le Calame — la relecture assistée : répétitions, phrases longues, mots faibles,
 * tournures passives, soulignés dans le texte à la demande. Rien n'est modifié :
 * ce sont des décorations, recalculées seulement pour les paragraphes qui changent.
 */

export type OptionsAnalyse = { repetitions: boolean; longues: boolean; faibles: boolean; passif: boolean };
export const AUCUNE_ANALYSE: OptionsAnalyse = { repetitions: false, longues: false, faibles: false, passif: false };
export const CLE_ANALYSE = new PluginKey<{ options: OptionsAnalyse; decorations: DecorationSet }>("analyseCalame");

const BLOCS_IGNORES = new Set(["versetArabe", "hadithArabe", "codeBlock"]);

function decorationsBloc(noeud: NoeudPM, pos: number, options: OptionsAnalyse): Decoration[] {
  if (BLOCS_IGNORES.has(noeud.type.name)) return [];
  // Le texte du bloc, avec la position de chaque caractère.
  let texte = "";
  const positions: number[] = [];
  noeud.forEach((enfant, decalage) => {
    if (enfant.isText) {
      const t = enfant.text ?? "";
      for (let i = 0; i < t.length; i++) {
        texte += t[i];
        positions.push(pos + 1 + decalage + i);
      }
    } else {
      texte += " ";
      positions.push(pos + 1 + decalage);
    }
  });
  if (!texte.trim()) return [];
  return analyser(texte, options).map((s: Signalement) => {
    const from = positions[s.debut];
    const to = (positions[s.fin - 1] ?? from) + 1;
    return Decoration.inline(from, to, { class: `calame-analyse calame-analyse-${s.genre}`, title: s.detail }, { genre: s.genre });
  });
}

function tout(doc: NoeudPM, options: OptionsAnalyse): DecorationSet {
  if (!Object.values(options).some(Boolean)) return DecorationSet.empty;
  const decorations: Decoration[] = [];
  doc.descendants((noeud, pos) => {
    if (noeud.isTextblock) {
      decorations.push(...decorationsBloc(noeud, pos, options));
      return false;
    }
    return true;
  });
  return DecorationSet.create(doc, decorations);
}

export const Analyse = Extension.create({
  name: "analyseCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CLE_ANALYSE,
        state: {
          init: () => ({ options: AUCUNE_ANALYSE, decorations: DecorationSet.empty }),
          apply: (tr, valeur, _ancien, nouvel) => {
            const meta = tr.getMeta(CLE_ANALYSE) as OptionsAnalyse | undefined;
            if (meta) return { options: meta, decorations: tout(nouvel.doc, meta) };
            if (!tr.docChanged || !Object.values(valeur.options).some(Boolean)) return valeur;
            let decorations = valeur.decorations.map(tr.mapping, nouvel.doc);
            const blocs = new Map<number, NoeudPM>();
            tr.mapping.maps.forEach((carte, i) => {
              carte.forEach((_a, _b, debut, fin) => {
                let d = debut;
                let f = fin;
                for (let j = i + 1; j < tr.mapping.maps.length; j++) {
                  d = tr.mapping.maps[j].map(d, -1);
                  f = tr.mapping.maps[j].map(f, 1);
                }
                const borne = (x: number) => Math.max(0, Math.min(x, nouvel.doc.content.size));
                nouvel.doc.nodesBetween(borne(d), borne(f), (noeud, pos) => {
                  if (noeud.isTextblock) {
                    blocs.set(pos, noeud);
                    return false;
                  }
                  return true;
                });
              });
            });
            for (const [pos, noeud] of blocs) {
              decorations = decorations.remove(decorations.find(pos, pos + noeud.nodeSize));
              decorations = decorations.add(nouvel.doc, decorationsBloc(noeud, pos, valeur.options));
            }
            return { options: valeur.options, decorations };
          },
        },
        props: {
          decorations(etat) {
            return CLE_ANALYSE.getState(etat)?.decorations ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

export function regler(editor: Editor, options: OptionsAnalyse): void {
  editor.view.dispatch(editor.state.tr.setMeta(CLE_ANALYSE, options).setMeta("addToHistory", false));
}

export function optionsActuelles(editor: Editor | null): OptionsAnalyse {
  return (editor && CLE_ANALYSE.getState(editor.state)?.options) || AUCUNE_ANALYSE;
}

/** Combien de signalements de chaque genre, et la position de chacun (pour s'y rendre). */
export function signalements(editor: Editor | null): Record<keyof OptionsAnalyse, number[]> {
  const sortie: Record<keyof OptionsAnalyse, number[]> = { repetitions: [], longues: [], faibles: [], passif: [] };
  const etat = editor ? CLE_ANALYSE.getState(editor.state) : null;
  if (!etat) return sortie;
  const correspondance: Record<string, keyof OptionsAnalyse> = { repetition: "repetitions", longue: "longues", faible: "faibles", passif: "passif" };
  for (const d of etat.decorations.find()) {
    const g = correspondance[(d.spec as { genre?: string }).genre ?? ""];
    if (g) sortie[g].push(d.from);
  }
  for (const g of Object.keys(sortie) as (keyof OptionsAnalyse)[]) sortie[g].sort((a, b) => a - b);
  return sortie;
}
