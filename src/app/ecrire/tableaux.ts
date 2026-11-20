"use client";

import { Table, TableCell, TableHeader, TableRow, TableView } from "@tiptap/extension-table";
import { Extension, type AnyExtension, type ChainedCommands } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection, type EditorState } from "@tiptap/pm/state";
import { isInTable, selectedRect } from "@tiptap/pm/tables";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import type { Commande } from "../createur/_composants/editeur/commandes";

/**
 * Les tableaux de l'atelier d'écriture.
 *
 * Ils n'existent que dans Le Calame : les articles de la bibliothèque ont leur
 * propre vocabulaire (comparaisons, colonnes), qui se prête mieux à la lecture
 * en ligne. Ici, on écrit des documents destinés au papier : un tableau y est
 * indispensable.
 */
// ---------------------------------------------------------------------------
// Styles prêts, fond de cellule, alignement, totaux
// ---------------------------------------------------------------------------

export const STYLES_TABLEAU = [
  { cle: "grille", libelle: "Grille", description: "Toutes les bordures" },
  { cle: "rayures", libelle: "Rayures", description: "Une ligne sur deux teintée" },
  { cle: "sobre", libelle: "Sobre", description: "Seulement des filets horizontaux" },
  { cle: "encadre", libelle: "En-tête foncé", description: "La première ligne en blanc sur fond foncé" },
] as const;

/** La vue d'un tableau, qui porte en plus son style et sa ligne de totaux. */
class VueTableau extends TableView {
  constructor(node: NoeudPM, cellMinWidth: number, view?: EditorView, HTMLAttributes: Record<string, unknown> = {}) {
    super(node, cellMinWidth, view as EditorView, HTMLAttributes);
    this.table.classList.add("calame-tableau");
    this.table.dataset.style = String(node.attrs.styleTableau || "grille");
    if (node.attrs.totaux) this.table.dataset.totaux = "";
  }
}

const attributCellule = {
  fond: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute("data-fond"),
    renderHTML: (a: Record<string, unknown>) => (a.fond ? { "data-fond": String(a.fond), style: `background-color: ${String(a.fond)}` } : {}),
  },
  alignement: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute("data-alignement"),
    renderHTML: (a: Record<string, unknown>) => (a.alignement ? { "data-alignement": String(a.alignement), style: `text-align: ${String(a.alignement)}` } : {}),
  },
};

/** « 1 234,50 € » → 1234.5 ; null si ce n'est pas un nombre. */
export function lireNombre(texte: string): number | null {
  const t = texte.replace(/[\s\u00a0\u202f€$%]/g, "").replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

/** Les totaux d'un tableau, colonne par colonne (null : colonne sans nombre). */
export function totauxDuTableau(table: NoeudPM): (number | null)[] {
  const totaux: (number | null)[] = [];
  table.forEach((rangee, _o, i) => {
    if (i === 0 && rangee.childCount > 0 && rangee.content.content.every((c) => c.type.name === "tableHeader")) return;
    let col = 0;
    rangee.forEach((cellule) => {
      const n = lireNombre(cellule.textContent);
      if (n !== null) totaux[col] = (totaux[col] ?? 0) + n;
      else if (totaux[col] === undefined) totaux[col] = null;
      col += Number(cellule.attrs.colspan) || 1;
    });
  });
  return totaux;
}

const CLE_TOTAUX = new PluginKey<DecorationSet>("totauxTableaux");

function decorerTotaux(etat: EditorState): DecorationSet {
  const decorations: Decoration[] = [];
  etat.doc.descendants((n, pos) => {
    if (n.type.name !== "table") return true;
    if (n.attrs.totaux) {
      const totaux = totauxDuTableau(n);
      let colonnes = 0;
      n.firstChild?.forEach((c) => (colonnes += Number(c.attrs.colspan) || 1));
      const cle = `totaux-${pos}-${totaux.join("|")}-${colonnes}`;
      decorations.push(
        Decoration.widget(
          pos + n.nodeSize - 1,
          () => {
            const rangee = document.createElement("tr");
            rangee.className = "calame-totaux";
            rangee.setAttribute("contenteditable", "false");
            rangee.setAttribute("data-widget", "");
            for (let i = 0; i < Math.max(1, colonnes); i++) {
              const cellule = document.createElement("td");
              const t = totaux[i];
              cellule.textContent = i === 0 && (t === null || t === undefined) ? "Total" : t === null || t === undefined ? "" : t.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
              if (t !== null && t !== undefined) cellule.className = "calame-totaux-nombre";
              rangee.appendChild(cellule);
            }
            return rangee;
          },
          { side: 1, key: cle, ignoreSelection: true },
        ),
      );
    }
    return false;
  });
  return DecorationSet.create(etat.doc, decorations);
}

/** La ligne de totaux, recalculée à chaque frappe ; elle n'entre pas dans le document. */
export const TotauxTableaux = Extension.create({
  name: "totauxTableaux",
  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: CLE_TOTAUX,
        state: {
          init: (_, etat) => decorerTotaux(etat),
          apply: (tr, valeur, _avant, apres) => (tr.docChanged ? decorerTotaux(apres) : valeur),
        },
        props: { decorations: (etat) => CLE_TOTAUX.getState(etat) ?? DecorationSet.empty },
      }),
    ];
  },
});

export const extensionsTableau: AnyExtension[] = [
  Table.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        styleTableau: { default: "grille", parseHTML: (el) => el.getAttribute("data-style") ?? "grille", renderHTML: (a) => ({ "data-style": String(a.styleTableau ?? "grille") }) },
        totaux: { default: false, parseHTML: (el) => el.hasAttribute("data-totaux"), renderHTML: (a) => (a.totaux ? { "data-totaux": "" } : {}) },
      };
    },
  }).configure({ resizable: true, allowTableNodeSelection: true, HTMLAttributes: { class: "calame-tableau" }, View: VueTableau }),
  TableRow,
  TableHeader.extend({
    addAttributes() {
      return { ...this.parent?.(), ...attributCellule };
    },
  }),
  TableCell.extend({
    addAttributes() {
      return { ...this.parent?.(), ...attributCellule };
    },
  }),
  TotauxTableaux,
];

// ---------------------------------------------------------------------------
// Commandes : colonne, tri, style, totaux, texte ↔ tableau
// ---------------------------------------------------------------------------

/** Le tableau qui contient le curseur : sa position et son nœud. */
function tableauCourant(etat: EditorState): { pos: number; noeud: NoeudPM } | null {
  const { $from } = etat.selection;
  for (let d = $from.depth; d > 0; d--) {
    const n = $from.node(d);
    if (n.type.name === "table") return { pos: $from.before(d), noeud: n };
  }
  return null;
}

const alignerColonne = (alignement: string | null) => (c: ChainedCommands) =>
  c.command(({ state, tr, dispatch }) => {
    if (!isInTable(state)) return false;
    const rect = selectedRect(state);
    if (dispatch) {
      const vus = new Set<number>();
      for (let col = rect.left; col < rect.right; col++) {
        for (let rangee = 0; rangee < rect.map.height; rangee++) {
          const pos = rect.map.map[rangee * rect.map.width + col];
          if (vus.has(pos)) continue;
          vus.add(pos);
          const cellule = rect.table.nodeAt(pos);
          if (cellule) tr.setNodeMarkup(rect.tableStart + pos, undefined, { ...cellule.attrs, alignement });
        }
      }
    }
    return true;
  });

const trier = (sens: 1 | -1) => (c: ChainedCommands) =>
  c.command(({ state, tr, dispatch }) => {
    if (!isInTable(state)) return false;
    const rect = selectedRect(state);
    const table = rect.table;
    const rangees: NoeudPM[] = [];
    table.forEach((r) => rangees.push(r));
    // Des cellules fusionnées sur plusieurs rangées ne se trient pas sans casser le tableau.
    let fusion = false;
    table.descendants((n) => {
      if (Number(n.attrs.rowspan) > 1) fusion = true;
      return n.type.name === "table" || n.type.name === "tableRow";
    });
    if (fusion) return false;
    const entete = rangees[0]?.childCount > 0 && rangees[0].content.content.every((c) => c.type.name === "tableHeader") ? 1 : 0;
    const colonne = rect.left;
    const cle = (r: NoeudPM) => {
      let col = 0;
      let texte = "";
      r.forEach((cellule) => {
        if (col <= colonne && colonne < col + (Number(cellule.attrs.colspan) || 1)) texte = cellule.textContent.trim();
        col += Number(cellule.attrs.colspan) || 1;
      });
      return texte;
    };
    const collation = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });
    const corps = rangees.slice(entete).sort((a, b) => {
      const ta = cle(a);
      const tb = cle(b);
      const na = lireNombre(ta);
      const nb = lireNombre(tb);
      if (na !== null && nb !== null) return sens * (na - nb);
      return sens * collation.compare(ta, tb);
    });
    if (dispatch) {
      const debut = rect.tableStart - 1;
      const tete = state.selection.head;
      const nouveau = table.type.create(table.attrs, [...rangees.slice(0, entete), ...corps]);
      tr.replaceWith(debut, debut + table.nodeSize, nouveau);
      // Le curseur reste dans le tableau : on peut enchaîner (totaux, style, alignement).
      tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(debut + 1, Math.min(tete, debut + nouveau.nodeSize - 2)))));
    }
    return true;
  });

const attributTableau = (modif: Record<string, unknown> | ((a: Record<string, unknown>) => Record<string, unknown>)) => (c: ChainedCommands) =>
  c.command(({ state, tr, dispatch }) => {
    const t = tableauCourant(state);
    if (!t) return false;
    if (dispatch) tr.setNodeMarkup(t.pos, undefined, { ...t.noeud.attrs, ...(typeof modif === "function" ? modif(t.noeud.attrs) : modif) });
    return true;
  });

/** Le tableau devient du texte : une ligne par rangée, les cellules séparées par des tabulations. */
const tableauEnTexte = (c: ChainedCommands) =>
  c.command(({ state, tr, dispatch }) => {
    const t = tableauCourant(state);
    if (!t) return false;
    const paragraphe = state.schema.nodes.paragraph;
    const lignes: NoeudPM[] = [];
    t.noeud.forEach((rangee) => {
      const cellules: string[] = [];
      rangee.forEach((cellule) => cellules.push(cellule.textContent.trim()));
      const texte = cellules.join("\t");
      lignes.push(paragraphe.create(null, texte ? state.schema.text(texte) : undefined));
    });
    if (dispatch) tr.replaceWith(t.pos, t.pos + t.noeud.nodeSize, lignes);
    return true;
  });

/** Les paragraphes sélectionnés deviennent un tableau : une rangée par ligne, colonnes coupées aux tabulations, « ; » ou « | ». */
export const texteEnTableau = (c: ChainedCommands) =>
  c.command(({ state, tr, dispatch }) => {
    const { from, to } = state.selection;
    const lignes: string[] = [];
    let debut = -1;
    let fin = -1;
    state.doc.nodesBetween(from, to, (n, pos, parent) => {
      if (n.type.name !== "paragraph" || parent !== state.doc) return true;
      if (debut < 0) debut = pos;
      fin = pos + n.nodeSize;
      lignes.push(n.textContent);
      return false;
    });
    if (lignes.length === 0 || debut < 0) return false;
    const separateur = lignes.some((l) => l.includes("\t")) ? "\t" : lignes.some((l) => l.includes(";")) ? ";" : lignes.some((l) => l.includes("|")) ? "|" : null;
    const lignesCoupees = lignes.map((l) => (separateur ? l.split(separateur).map((x) => x.trim()) : [l.trim()]));
    const colonnes = Math.max(1, ...lignesCoupees.map((l) => l.length));
    const { table, tableRow, tableHeader, tableCell, paragraph } = state.schema.nodes;
    if (!table || !tableRow || !tableCell || !tableHeader) return false;
    const rangees = lignesCoupees.map((cellules, i) =>
      tableRow.create(
        null,
        Array.from({ length: colonnes }, (_, k) => {
          const texte = cellules[k] ?? "";
          return (i === 0 && lignesCoupees.length > 1 ? tableHeader : tableCell).create(null, paragraph.create(null, texte ? state.schema.text(texte) : undefined));
        }),
      ),
    );
    if (dispatch) tr.replaceWith(debut, fin, table.create(null, rangees));
    return true;
  });

/** Couleurs de fond proposées pour les cellules (douces, lisibles en noir). */
export const FONDS_CELLULE = [
  { cle: "#fdf3d7", libelle: "Or pâle" },
  { cle: "#e8eefc", libelle: "Bleu pâle" },
  { cle: "#e6f4ea", libelle: "Vert pâle" },
  { cle: "#fde8e7", libelle: "Rose pâle" },
  { cle: "#eeeef2", libelle: "Gris clair" },
] as const;

/** Insérer un nouveau tableau : affiché partout où on insère du contenu (barre d'outils, barre de commande). */
export const COMMANDE_TABLEAU: Commande = {
  cle: "tableau",
  libelle: "Tableau",
  description: "Trois colonnes, avec une ligne d'en-tête",
  groupe: "Texte",
  motsCles: "tableau colonnes lignes grille",
  appliquer: (c: ChainedCommands) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
};

/** Les blocs qui n'ont pas de sens dans un document personnel (liés à la bibliographie partagée du site). */
export const GROUPES_ECARTES_ATELIER = new Set(["Liens et sources"]);

/** Les commandes d'édition d'un tableau existant (curseur déjà à l'intérieur), ajoutées à la barre de commande. */
export const COMMANDES_TABLEAU: { cle: string; libelle: string; description: string; groupe: string; appliquer: (c: ChainedCommands) => ChainedCommands }[] = [
  { cle: "tableau-colonne-apres", libelle: "Ajouter une colonne", description: "À droite de la colonne courante", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.addColumnAfter() },
  { cle: "tableau-ligne-apres", libelle: "Ajouter une ligne", description: "Sous la ligne courante", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.addRowAfter() },
  { cle: "tableau-colonne-moins", libelle: "Supprimer la colonne", description: "Celle où se trouve le curseur", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.deleteColumn() },
  { cle: "tableau-ligne-moins", libelle: "Supprimer la ligne", description: "Celle où se trouve le curseur", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.deleteRow() },
  { cle: "tableau-fusion", libelle: "Fusionner les cellules", description: "Les cellules sélectionnées n'en font plus qu'une", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.mergeCells() },
  { cle: "tableau-separer", libelle: "Séparer la cellule", description: "L'inverse de la fusion", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.splitCell() },
  { cle: "tableau-moins", libelle: "Supprimer le tableau", description: "Entièrement", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.deleteTable() },
  ...STYLES_TABLEAU.map((st) => ({ cle: `tableau-style-${st.cle}`, libelle: `Style du tableau : ${st.libelle}`, description: st.description, groupe: "Tableau", appliquer: attributTableau({ styleTableau: st.cle }) })),
  ...FONDS_CELLULE.map((f) => ({ cle: `tableau-fond-${f.cle}`, libelle: `Fond de cellule : ${f.libelle}`, description: "Les cellules sélectionnées", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.setCellAttribute("fond", f.cle) })),
  { cle: "tableau-fond-aucun", libelle: "Fond de cellule : aucun", description: "Retirer la couleur des cellules sélectionnées", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.setCellAttribute("fond", null) },
  { cle: "tableau-aligner-gauche", libelle: "Colonne alignée à gauche", description: "Toute la colonne du curseur", groupe: "Tableau", appliquer: alignerColonne("left") },
  { cle: "tableau-aligner-centre", libelle: "Colonne centrée", description: "Toute la colonne du curseur", groupe: "Tableau", appliquer: alignerColonne("center") },
  { cle: "tableau-aligner-droite", libelle: "Colonne alignée à droite", description: "Pratique pour les nombres", groupe: "Tableau", appliquer: alignerColonne("right") },
  { cle: "tableau-trier-croissant", libelle: "Trier les lignes (A → Z, 1 → 9)", description: "Selon la colonne du curseur, l'en-tête reste en haut", groupe: "Tableau", appliquer: trier(1) },
  { cle: "tableau-trier-decroissant", libelle: "Trier les lignes (Z → A, 9 → 1)", description: "Selon la colonne du curseur", groupe: "Tableau", appliquer: trier(-1) },
  { cle: "tableau-totaux", libelle: "Ligne de totaux", description: "Additionne les colonnes de nombres (afficher ou cacher)", groupe: "Tableau", appliquer: attributTableau((a) => ({ totaux: !a.totaux })) },
  { cle: "tableau-en-texte", libelle: "Convertir le tableau en texte", description: "Une ligne par rangée, les cellules séparées par des tabulations", groupe: "Tableau", appliquer: tableauEnTexte },
];

/** Hors d'un tableau : transformer des lignes de texte en tableau. */
export const COMMANDE_TEXTE_EN_TABLEAU: Commande = {
  cle: "texte-en-tableau",
  libelle: "Convertir le texte en tableau",
  description: "Les lignes sélectionnées ; colonnes coupées aux tabulations, « ; » ou « | »",
  groupe: "Texte",
  motsCles: "convertir texte tableau colonnes lignes",
  appliquer: texteEnTableau,
};
