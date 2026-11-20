"use client";

import { Plugin, PluginKey, TextSelection, type EditorState, type Transaction } from "@tiptap/pm/state";
import type { Step, Transform } from "@tiptap/pm/transform";

/*
 * Le Calame — écrire à plusieurs : le suivi des changements entre l'éditeur et le serveur, selon le
 * principe d'une autorité centrale (celui de prosemirror-collab). Chaque changement local attend
 * d'être confirmé ; ceux des autres arrivent dans l'ordre du serveur, et les nôtres, pas encore
 * confirmés, sont rejoués par-dessus. Ainsi deux personnes peuvent taper au même moment.
 */

class Rejouable {
  constructor(
    readonly pas: Step,
    readonly inverse: Step,
    readonly origine: Transform | null,
  ) {}
}

function rejouer(pas: readonly Rejouable[], par: readonly Step[], transform: Transform): Rejouable[] {
  for (let i = pas.length - 1; i >= 0; i--) transform.step(pas[i].inverse);
  for (const p of par) transform.step(p);
  const resultat: Rejouable[] = [];
  for (let i = 0, depuis = pas.length; i < pas.length; i++) {
    const deplace = pas[i].pas.map(transform.mapping.slice(depuis));
    depuis--;
    if (deplace && !transform.maybeStep(deplace).failed) {
      // Le pas rejoué « reflète » son inverse : les positions qui le traversent restent stables (méthode interne de ProseMirror).
      (transform.mapping as unknown as { setMirror(n: number, m: number): void }).setMirror(depuis, transform.steps.length - 1);
      resultat.push(new Rejouable(deplace, deplace.invert(transform.docs[transform.docs.length - 1]), pas[i].origine));
    }
  }
  return resultat;
}

class EtatCollab {
  constructor(
    readonly version: number,
    readonly enAttente: readonly Rejouable[],
  ) {}
}

function enAttenteDe(transform: Transform): Rejouable[] {
  return transform.steps.map((p, i) => new Rejouable(p, p.invert(transform.docs[i]), transform));
}

export const CLE_COLLAB = new PluginKey<EtatCollab>("collabCalame");
/** Posé sur les transactions venues des autres : ni suggestion, ni journal d'écriture. */
export const META_DISTANT = "calameDistant";

export function pluginCollab(version: number, client: number): Plugin<EtatCollab> {
  return new Plugin<EtatCollab>({
    key: CLE_COLLAB,
    state: {
      init: () => new EtatCollab(version, []),
      apply(tr, collab) {
        const nouveau = tr.getMeta(CLE_COLLAB) as EtatCollab | undefined;
        if (nouveau) return nouveau;
        if (tr.docChanged) return new EtatCollab(collab.version, collab.enAttente.concat(enAttenteDe(tr)));
        return collab;
      },
    },
    // L'historique (Ctrl+Z) garde ses entrées quand des changements des autres s'intercalent.
    historyPreserveItems: true,
    client,
  });
}

const clientDe = (state: EditorState): number => (CLE_COLLAB.get(state)?.spec as { client?: number } | undefined)?.client ?? -1;

/** La transaction qui fait entrer les changements reçus (et confirme les nôtres qui en font partie). */
export function recevoir(state: EditorState, pas: Step[], clients: number[]): Transaction {
  const collab = CLE_COLLAB.getState(state) as EtatCollab;
  const version = collab.version + pas.length;
  const nous = clientDe(state);
  let notres = 0;
  while (notres < clients.length && clients[notres] === nous) notres++;
  let enAttente = collab.enAttente.slice(notres);
  const autres = notres ? pas.slice(notres) : pas;
  if (!autres.length) return state.tr.setMeta(CLE_COLLAB, new EtatCollab(version, enAttente)).setMeta("addToHistory", false);
  const nAttente = enAttente.length;
  const tr = state.tr;
  if (nAttente) enAttente = rejouer(enAttente, autres, tr);
  else for (const p of autres) tr.step(p);
  // La sélection reste du bon côté de ce qui arrive juste devant elle.
  if (state.selection instanceof TextSelection) {
    tr.setSelection(TextSelection.between(tr.doc.resolve(tr.mapping.map(state.selection.anchor, -1)), tr.doc.resolve(tr.mapping.map(state.selection.head, -1)), -1));
  }
  return tr.setMeta("rebased", nAttente).setMeta("addToHistory", false).setMeta(CLE_COLLAB, new EtatCollab(version, enAttente)).setMeta(META_DISTANT, true);
}

/** Nos changements pas encore confirmés, à envoyer (ou null). */
export function aEnvoyer(state: EditorState): { version: number; pas: Step[]; client: number } | null {
  const collab = CLE_COLLAB.getState(state);
  if (!collab || collab.enAttente.length === 0) return null;
  return { version: collab.version, pas: collab.enAttente.map((r) => r.pas), client: clientDe(state) };
}

/** La version confirmée (null : le document n'est pas partagé). */
export function versionCollab(state: EditorState): number | null {
  return CLE_COLLAB.getState(state)?.version ?? null;
}

export const enAttente = (state: EditorState): number => CLE_COLLAB.getState(state)?.enAttente.length ?? 0;
