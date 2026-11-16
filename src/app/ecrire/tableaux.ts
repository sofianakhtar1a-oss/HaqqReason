"use client";

import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import type { AnyExtension, ChainedCommands } from "@tiptap/core";
import type { Commande } from "../createur/_composants/editeur/commandes";

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
];
