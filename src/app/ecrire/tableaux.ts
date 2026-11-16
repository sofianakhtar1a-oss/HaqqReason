"use client";

import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import type { AnyExtension, ChainedCommands } from "@tiptap/core";

/**
 * Les tableaux de l'atelier d'écriture.
 *
 * Ils n'existent que dans Le Calame : les articles de la bibliothèque ont leur
 * propre vocabulaire (comparaisons, colonnes), qui se prête mieux à la lecture
 * en ligne. Ici, on écrit des documents destinés au papier : un tableau y est
 * indispensable.
 */
export const extensionsTableau: AnyExtension[] = [
  Table.configure({ resizable: true, allowTableNodeSelection: true, HTMLAttributes: { class: "calame-tableau" } }),
  TableRow,
  TableHeader,
  TableCell,
];

/** Les commandes de tableau ajoutées à la barre de commande. */
export const COMMANDES_TABLEAU = [
  {
    cle: "tableau",
    libelle: "Tableau",
    description: "Trois colonnes, avec une ligne d'en-tête",
    groupe: "Insérer — Texte",
    appliquer: (c: ChainedCommands) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
  },
  { cle: "tableau-colonne-apres", libelle: "Ajouter une colonne", description: "À droite de la colonne courante", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.addColumnAfter() },
  { cle: "tableau-ligne-apres", libelle: "Ajouter une ligne", description: "Sous la ligne courante", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.addRowAfter() },
  { cle: "tableau-colonne-moins", libelle: "Supprimer la colonne", description: "Celle où se trouve le curseur", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.deleteColumn() },
  { cle: "tableau-ligne-moins", libelle: "Supprimer la ligne", description: "Celle où se trouve le curseur", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.deleteRow() },
  { cle: "tableau-fusion", libelle: "Fusionner les cellules", description: "Les cellules sélectionnées n'en font plus qu'une", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.mergeCells() },
  { cle: "tableau-separer", libelle: "Séparer la cellule", description: "L'inverse de la fusion", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.splitCell() },
  { cle: "tableau-moins", libelle: "Supprimer le tableau", description: "Entièrement", groupe: "Tableau", appliquer: (c: ChainedCommands) => c.deleteTable() },
];
