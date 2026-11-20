"use client";

import { Extension, Mark, mergeAttributes, Node, type Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { legendesDuDocument, titresNumerotes, CLE_NUMEROS, type Legende } from "../extensions/numeros";
import { useMiseEnPage } from "../pages-store";

/**
 * Le Calame — ce qui renvoie d'un endroit à un autre : renvois (« voir partie 2, p. 12 »),
 * table des figures, index alphabétique. Tout se met à jour seul quand le texte bouge.
 */

/** Une ancre stable sur les blocs qu'un renvoi peut viser (titres, légendes, images, tableaux). */
export const Ancres = Extension.create({
  name: "ancresCalame",
  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph", "image", "table"],
        attributes: {
          ancre: {
            default: null,
            parseHTML: (el) => el.getAttribute("data-ancre"),
            renderHTML: (a) => (a.ancre ? { "data-ancre": String(a.ancre) } : {}),
          },
        },
      },
    ];
  },
});

/** Les mots marqués pour l'index (l'entrée peut différer du texte : « Ghazali » pour « al-Ghazâlî »). */
export const Indexe = Mark.create({
  name: "indexe",
  inclusive: false,
  addAttributes() {
    return {
      terme: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-index") ?? "",
        renderHTML: (a) => ({ "data-index": String(a.terme ?? "") }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-index]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "calame-indexe" }), 0];
  },
});

// ---------------------------------------------------------------------------
// Cibles d'un renvoi
// ---------------------------------------------------------------------------

export type CibleRenvoi = { ancre: string | null; pos: number; genre: "titre" | "figure" | "tableau"; numero: string; texte: string; niveau?: number };

/** Tout ce qu'un renvoi peut viser, dans l'ordre du document. */
export function ciblesDuDocument(doc: NoeudPM): CibleRenvoi[] {
  const titres = titresNumerotes(doc, true).map<CibleRenvoi>((t) => ({ ancre: (doc.nodeAt(t.pos)?.attrs.ancre as string | null) ?? null, pos: t.pos, genre: "titre", numero: t.numero.replace(/\.$/, ""), texte: t.texte, niveau: t.niveau }));
  const legendes = legendesDuDocument(doc).map<CibleRenvoi>((l: Legende) => ({ ancre: (doc.nodeAt(l.pos)?.attrs.ancre as string | null) ?? null, pos: l.pos, genre: l.genre, numero: String(l.numero), texte: l.texte }));
  return [...titres, ...legendes].sort((a, b) => a.pos - b.pos);
}

function decrire(doc: NoeudPM, ancre: string, titresNumerotesActifs: boolean): CibleRenvoi | null {
  const c = ciblesDuDocument(doc).find((x) => x.ancre === ancre);
  if (!c) return null;
  if (c.genre === "titre" && !titresNumerotesActifs) return { ...c, numero: "" };
  return c;
}

export const FORMES_RENVOI = [
  { cle: "complet", libelle: "« partie 2.1, p. 12 »" },
  { cle: "numero", libelle: "« partie 2.1 » ou « figure 3 »" },
  { cle: "page", libelle: "« p. 12 »" },
] as const;

function texteDuRenvoi(c: CibleRenvoi | null, forme: string, page: string | undefined): string {
  if (!c) return "[renvoi introuvable]";
  const p = `p. ${page ?? "…"}`;
  if (forme === "page") return p;
  const nom = c.genre === "titre" ? (c.numero ? `partie ${c.numero}` : `« ${c.texte || "Sans titre"} »`) : `${c.genre} ${c.numero}`;
  return forme === "numero" ? nom : `${nom}, ${p}`;
}

function useDocument<T>(editor: Editor, lire: () => T): T {
  const [valeur, setValeur] = useState<T>(lire);
  useEffect(() => {
    const relire = ({ transaction }: { transaction: Transaction }) => {
      if (transaction.docChanged || transaction.getMeta(CLE_NUMEROS) !== undefined) setValeur(lire());
    };
    editor.on("transaction", relire);
    return () => {
      editor.off("transaction", relire);
    };
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps
  return valeur;
}

function VueRenvoi({ node, editor, selected }: NodeViewProps) {
  const ancre = String(node.attrs.cible ?? "");
  const forme = String(node.attrs.forme ?? "complet");
  const mep = useMiseEnPage(editor);
  const cible = useDocument(editor, () => decrire(editor.state.doc, ancre, CLE_NUMEROS.getState(editor.state)?.reglages.titres ?? false));
  return (
    <NodeViewWrapper as="span" className="calame-renvoi" data-selectionne={selected || undefined} data-introuvable={cible ? undefined : ""} title={cible ? `Renvoi vers : ${cible.texte || cible.genre}` : "La cible de ce renvoi a disparu"}>
      {texteDuRenvoi(cible, forme, mep.ancres.get(ancre))}
    </NodeViewWrapper>
  );
}

export const Renvoi = Node.create({
  name: "renvoi",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      cible: { default: "", parseHTML: (el) => el.getAttribute("data-cible") ?? "", renderHTML: (a) => ({ "data-cible": String(a.cible ?? "") }) },
      forme: { default: "complet", parseHTML: (el) => el.getAttribute("data-forme") ?? "complet", renderHTML: (a) => ({ "data-forme": String(a.forme ?? "complet") }) },
    };
  },
  parseHTML() {
    return [{ tag: "span.calame-renvoi[data-cible]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "calame-renvoi" }), "renvoi"];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueRenvoi, { as: "span" });
  },
});

/** Insère un renvoi vers une cible ; lui donne d'abord une ancre si elle n'en a pas. */
export function insererRenvoi(editor: Editor, cible: CibleRenvoi, forme: string): void {
  let ancre = cible.ancre;
  const { state } = editor;
  let tr = state.tr;
  if (!ancre) {
    const n = state.doc.nodeAt(cible.pos);
    if (!n) return;
    ancre = `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    tr = tr.setNodeMarkup(cible.pos, undefined, { ...n.attrs, ancre });
  }
  const noeud = state.schema.nodes.renvoi?.create({ cible: ancre, forme });
  if (!noeud) return;
  tr = tr.replaceSelectionWith(noeud, false);
  editor.view.dispatch(tr.scrollIntoView());
  editor.view.focus();
}

// ---------------------------------------------------------------------------
// Table des figures
// ---------------------------------------------------------------------------

function VueTableFigures({ editor, selected }: NodeViewProps) {
  const mep = useMiseEnPage(editor);
  const legendes = useDocument(editor, () => legendesDuDocument(editor.state.doc));
  const groupes = [
    { titre: "Figures", liste: legendes.filter((l) => l.genre === "figure") },
    { titre: "Tableaux", liste: legendes.filter((l) => l.genre === "tableau") },
  ].filter((g) => g.liste.length > 0);
  return (
    <NodeViewWrapper as="nav" className="calame-sommaire calame-table-figures" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false} aria-label="Table des figures">
      <p className="calame-sommaire-titre">Table des figures</p>
      {groupes.length === 0 && <p className="calame-sommaire-vide">Les images légendées et les paragraphes de style « Légende » viendront ici, avec leur page.</p>}
      {groupes.map((g) => (
        <div key={g.titre}>
          {groupes.length > 1 && <p className="calame-table-figures-groupe">{g.titre}</p>}
          <ol>
            {g.liste.map((l) => (
              <li key={l.cle} data-niveau="3">
                <span className="calame-sommaire-ligne">
                  <span className="calame-sommaire-texte">
                    <span className="calame-sommaire-numero">{`${l.genre === "tableau" ? "Tableau" : "Figure"} ${l.numero}`}</span>
                    {l.texte}
                  </span>
                  <span className="calame-sommaire-points" aria-hidden="true" />
                  <span className="calame-sommaire-page">{mep.legendes.get(l.cle) ?? ""}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </NodeViewWrapper>
  );
}

export const TableFigures = Node.create({
  name: "tableFigures",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  parseHTML() {
    return [{ tag: "nav.calame-table-figures" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["nav", mergeAttributes(HTMLAttributes, { class: "calame-table-figures" }), "Table des figures"];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueTableFigures);
  },
});

// ---------------------------------------------------------------------------
// Index alphabétique
// ---------------------------------------------------------------------------

/** Les entrées de l'index : chaque mot marqué, par son entrée (ou son texte), sans doublon. */
export function entreesIndex(doc: NoeudPM): string[] {
  const termes = new Set<string>();
  doc.descendants((n) => {
    if (!n.isText) return true;
    const m = n.marks.find((x) => x.type.name === "indexe");
    if (m) termes.add((String(m.attrs.terme ?? "") || n.text || "").trim());
    return false;
  });
  return [...termes].filter(Boolean).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

function VueIndex({ editor, selected }: NodeViewProps) {
  const mep = useMiseEnPage(editor);
  const termes = useDocument(editor, () => entreesIndex(editor.state.doc));
  // Une lettrine par initiale, comme dans un livre.
  const parLettre = new Map<string, string[]>();
  for (const t of termes) {
    const l = t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^[^a-zA-Z0-9]+/, "").charAt(0).toUpperCase() || "#";
    parLettre.set(l, [...(parLettre.get(l) ?? []), t]);
  }
  return (
    <NodeViewWrapper as="section" className="calame-index" data-selectionne={selected || undefined} data-drag-handle="" contentEditable={false} aria-label="Index">
      <p className="calame-sommaire-titre">Index</p>
      {termes.length === 0 ? (
        <p className="calame-sommaire-vide">Marque des mots pour l&apos;index (barre de commande, « Ajouter à l&apos;index ») : ils viendront ici, avec leurs pages.</p>
      ) : (
        <div className="calame-index-colonnes">
          {[...parLettre].map(([lettre, liste]) => (
            <div key={lettre} className="calame-index-groupe">
              <p className="calame-index-lettre">{lettre}</p>
              {liste.map((t) => (
                <p key={t} className="calame-index-entree">
                  {t}, <span className="calame-index-pages">{(mep.index.get(t) ?? []).join(", ")}</span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const IndexAlpha = Node.create({
  name: "indexAlpha",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  parseHTML() {
    return [{ tag: "section.calame-index" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["section", mergeAttributes(HTMLAttributes, { class: "calame-index" }), "Index"];
  },
  addNodeView() {
    return ReactNodeViewRenderer(VueIndex);
  },
});

/** Marque la sélection pour l'index (l'entrée par défaut : les mots eux-mêmes). */
export function ajouterALIndex(editor: Editor, terme?: string): boolean {
  const { from, to, empty } = editor.state.selection;
  if (empty) return false;
  const texte = editor.state.doc.textBetween(from, to, " ").trim();
  return editor.chain().focus().setMark("indexe", { terme: (terme ?? texte).slice(0, 80) }).run();
}
