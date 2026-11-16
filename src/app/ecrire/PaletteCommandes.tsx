"use client";

import type { Editor } from "@tiptap/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { COMMANDES } from "../createur/_composants/editeur/commandes";
import { COMMANDES_TABLEAU } from "./tableaux";

export type ActionPalette = { cle: string; libelle: string; description: string; groupe: string; faire: () => void };

type Props = {
  editor: Editor | null;
  actions: ActionPalette[];
  surFermer: () => void;
};

/** Les blocs qui n'ont pas de sens dans un document personnel. */
const GROUPES_ECARTES = new Set(["Liens et sources"]);

function sansAccents(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * La barre de commande : tout le logiciel au clavier, sans chercher dans un menu.
 * Ctrl+K (ou Cmd+K) l'ouvre, on tape, on choisit.
 */
export function PaletteCommandes({ editor, actions, surFermer }: Props) {
  const [q, setQ] = useState("");
  const [index, setIndex] = useState(0);
  const champ = useRef<HTMLInputElement>(null);
  const liste = useRef<HTMLUListElement>(null);

  const toutes = useMemo<ActionPalette[]>(() => {
    const insertions: ActionPalette[] = editor
      ? COMMANDES.filter((c) => !GROUPES_ECARTES.has(c.groupe)).map((c) => ({
          cle: `inserer-${c.cle}`,
          libelle: c.libelle,
          description: c.description,
          groupe: `Insérer — ${c.groupe}`,
          faire: () => c.appliquer(editor.chain().focus()).run(),
        }))
      : [];
    const tableaux: ActionPalette[] = editor
      ? COMMANDES_TABLEAU.map((c) => ({
          cle: c.cle,
          libelle: c.libelle,
          description: c.description,
          groupe: c.groupe,
          faire: () => c.appliquer(editor.chain().focus()).run(),
        }))
      : [];
    return [...actions, ...tableaux, ...insertions];
  }, [actions, editor]);

  const resultats = useMemo(() => {
    const mots = sansAccents(q).split(/\s+/).filter(Boolean);
    if (mots.length === 0) return toutes.slice(0, 40);
    return toutes
      .filter((a) => {
        const champs = sansAccents(`${a.libelle} ${a.description} ${a.groupe}`);
        return mots.every((m) => champs.includes(m));
      })
      .slice(0, 40);
  }, [q, toutes]);

  useEffect(() => {
    const minuteur = setTimeout(() => champ.current?.focus(), 30);
    // Échap ferme la fenêtre d'où que vienne la touche, même avant que le champ ait le focus.
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        surFermer();
      }
    };
    document.addEventListener("keydown", auClavier, true);
    return () => {
      clearTimeout(minuteur);
      document.removeEventListener("keydown", auClavier, true);
    };
  }, [surFermer]);

  useEffect(() => {
    liste.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [index]);

  const choisir = (action: ActionPalette | undefined) => {
    if (!action) return;
    surFermer();
    // On laisse la fenêtre se refermer avant d'agir : l'éditeur retrouve ainsi le curseur.
    setTimeout(() => action.faire(), 0);
  };

  return (
    <div className="calame-palette-fond" role="presentation" onMouseDown={surFermer}>
      <div className="calame-palette" role="dialog" aria-modal="true" aria-label="Barre de commande" onMouseDown={(e) => e.stopPropagation()}>
        <label className="calame-palette-champ">
          <Search className="size-5 shrink-0 text-encre-douce" aria-hidden="true" />
          <input
            ref={champ}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((i) => Math.min(resultats.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choisir(resultats[index]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                surFermer();
              }
            }}
            placeholder="Que veux-tu faire ? (insérer un tableau, exporter en PDF, changer les marges…)"
            aria-label="Chercher une commande"
            className="w-full bg-transparent text-lg outline-none"
          />
          <kbd className="calame-touche">Échap</kbd>
        </label>

        <ul ref={liste} className="calame-palette-liste" role="listbox" aria-label="Commandes">
          {resultats.map((a, i) => (
            <li key={a.cle} role="option" aria-selected={i === index}>
              <button type="button" onMouseEnter={() => setIndex(i)} onClick={() => choisir(a)}>
                <span className="min-w-0">
                  <span className="block font-semibold">{a.libelle}</span>
                  <span className="block truncate text-sm text-encre-douce">{a.description}</span>
                </span>
                <span className="calame-palette-groupe">{a.groupe}</span>
                {i === index && <CornerDownLeft className="size-4 shrink-0 text-accent" aria-hidden="true" />}
              </button>
            </li>
          ))}
          {resultats.length === 0 && <li className="calame-vide">Rien ne correspond à cette recherche.</li>}
        </ul>
      </div>
    </div>
  );
}
