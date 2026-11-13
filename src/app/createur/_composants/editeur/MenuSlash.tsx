"use client";

import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { filtrerCommandes, type Commande } from "./commandes";

/*
 * Menu « / » : taper une barre oblique ouvre la liste des blocs, filtrée au fil de la frappe.
 * Flèches pour choisir, Entrée pour insérer, Échap pour fermer.
 */

type Etat = {
  ouvert: boolean;
  elements: Commande[];
  index: number;
  position: { gauche: number; haut: number } | null;
  choisir: ((c: Commande) => void) | null;
};

let etat: Etat = { ouvert: false, elements: [], index: 0, position: null, choisir: null };
const abonnes = new Set<() => void>();
function publier(suite: Partial<Etat>) {
  etat = { ...etat, ...suite };
  abonnes.forEach((f) => f());
}
const ETAT_SERVEUR: Etat = { ouvert: false, elements: [], index: 0, position: null, choisir: null };

function placer(props: SuggestionProps<Commande>) {
  const rect = props.clientRect?.();
  return rect ? { gauche: rect.left, haut: rect.bottom + 6 } : null;
}

const LIGNES_SANS_MENU = new Set(["versetArabe", "hadithArabe", "evenementDate"]);

export const MenuSlash = Extension.create({
  name: "menuSlash",
  addProseMirrorPlugins() {
    return [
      Suggestion<Commande>({
        editor: this.editor,
        pluginKey: new PluginKey("menuSlash"),
        char: "/",
        allow: ({ state, range }) => !LIGNES_SANS_MENU.has(state.doc.resolve(range.from).parent.type.name),
        items: ({ query }) => filtrerCommandes(query).slice(0, 40),
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: Commande }) => {
          props.appliquer(editor.chain().focus().deleteRange(range)).run();
        },
        render: () => ({
          onStart: (props) => publier({ ouvert: true, elements: props.items, index: 0, position: placer(props), choisir: (c) => props.command(c) }),
          onUpdate: (props) => publier({ elements: props.items, index: 0, position: placer(props), choisir: (c) => props.command(c) }),
          onKeyDown: ({ event }: SuggestionKeyDownProps) => {
            if (!etat.ouvert) return false;
            if (event.key === "Escape") {
              publier({ ouvert: false });
              return true;
            }
            if (etat.elements.length === 0) return false;
            if (event.key === "ArrowDown") {
              publier({ index: (etat.index + 1) % etat.elements.length });
              return true;
            }
            if (event.key === "ArrowUp") {
              publier({ index: (etat.index - 1 + etat.elements.length) % etat.elements.length });
              return true;
            }
            if (event.key === "Enter") {
              const choix = etat.elements[etat.index];
              if (choix && etat.choisir) etat.choisir(choix);
              return true;
            }
            return false;
          },
          onExit: () => publier({ ouvert: false, elements: [], choisir: null }),
        }),
      }),
    ];
  },
});

/** Affichage du menu « / » (placé une fois dans la page de l'éditeur). */
export function ListeSlash() {
  const e = useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => etat,
    () => ETAT_SERVEUR,
  );
  const liste = useRef<HTMLDivElement>(null);

  useEffect(() => {
    liste.current?.querySelector('[data-actif="true"]')?.scrollIntoView({ block: "nearest" });
  }, [e.index]);

  if (!e.ouvert || !e.position) return null;
  return (
    <div
      ref={liste}
      className="panneau-flottant !fixed w-80"
      style={{ left: Math.min(e.position.gauche, window.innerWidth - 336), top: e.position.haut }}
      role="listbox"
      aria-label="Blocs à insérer"
    >
      {e.elements.length === 0 ? (
        <p className="p-3 text-encre-douce">Aucun bloc ne correspond.</p>
      ) : (
        e.elements.map((c, i) => (
          <button
            key={c.cle}
            type="button"
            role="option"
            aria-selected={i === e.index}
            data-actif={i === e.index}
            className="choix-menu"
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => e.choisir?.(c)}
          >
            <span>
              <span className="block font-semibold">{c.libelle}</span>
              <span className="block text-sm text-encre-douce">{c.description}</span>
            </span>
          </button>
        ))
      )}
    </div>
  );
}
