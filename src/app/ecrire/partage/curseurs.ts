"use client";

import { Extension } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey, Selection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Presence } from "@/lib/atelier/partage-commun";

/*
 * Le Calame — le curseur de chacun, quand on écrit à plusieurs : un trait à sa couleur avec son
 * prénom, et sa sélection légèrement teintée. Rien de tout cela ne s'enregistre ni ne s'imprime.
 */

export const CLE_CURSEURS = new PluginKey<DecorationSet>("curseursCalame");

function trait(p: Presence, recent: boolean): HTMLElement {
  const el = document.createElement("span");
  el.className = "calame-curseur";
  el.style.setProperty("--curseur", p.couleur);
  el.setAttribute("aria-hidden", "true");
  if (recent) el.dataset.recent = "";
  const nom = document.createElement("span");
  nom.className = "calame-curseur-nom";
  nom.textContent = p.nom;
  el.appendChild(nom);
  return el;
}

/** Une position où un curseur peut se tenir (dans un paragraphe, pas entre deux blocs). */
function dansLeTexte(doc: NoeudPM, pos: number): number {
  const borne = Math.max(0, Math.min(doc.content.size, pos));
  const $p = doc.resolve(borne);
  if ($p.parent.inlineContent) return borne;
  try {
    return Selection.near($p).head;
  } catch {
    return borne;
  }
}

export const Curseurs = Extension.create({
  name: "curseursCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: CLE_CURSEURS,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, avant) {
            const presences = tr.getMeta(CLE_CURSEURS) as Presence[] | undefined;
            if (!presences) return avant.map(tr.mapping, tr.doc);
            const taille = tr.doc.content.size;
            const maintenant = Date.now();
            const decos: Decoration[] = [];
            for (const p of presences) {
              const de = Math.max(0, Math.min(taille, Math.min(p.de, p.a)));
              const a = Math.max(0, Math.min(taille, Math.max(p.de, p.a)));
              if (a > de) decos.push(Decoration.inline(de, a, { class: "calame-curseur-selection", style: `--curseur: ${p.couleur}` }, { compte: p.compte }));
              decos.push(Decoration.widget(dansLeTexte(tr.doc, p.a), () => trait(p, maintenant - p.quand < 6_000), { key: `${p.compte}-${p.client}-${p.quand}`, side: 1, ignoreSelection: true }));
            }
            return DecorationSet.create(tr.doc, decos);
          },
        },
        props: { decorations: (state) => CLE_CURSEURS.getState(state) },
      }),
    ];
  },
});
