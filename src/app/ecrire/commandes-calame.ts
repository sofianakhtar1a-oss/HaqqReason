"use client";

import type { Commande } from "../createur/_composants/editeur/commandes";
import { COMMANDE_TABLEAU } from "./tableaux";

/**
 * Les blocs propres à l'atelier d'écriture, ajoutés au menu « / » et au bouton « Insérer »
 * (ceux des articles restent tous là).
 */
export const COMMANDES_CALAME: Commande[] = [
  COMMANDE_TABLEAU,
  {
    cle: "page-de-garde",
    libelle: "Page de garde",
    description: "Titre, auteur, établissement et date, sur une page entière",
    groupe: "Mise en page",
    motsCles: "page garde couverture titre memoire these livre rapport",
    appliquer: (c) => c.insertContent({ type: "pageDeGarde", attrs: { modele: "classique" } }),
  },
  {
    cle: "table-figures",
    libelle: "Table des figures",
    description: "Images et tableaux légendés, avec leur page",
    groupe: "Mise en page",
    motsCles: "table figures illustrations tableaux legendes liste",
    appliquer: (c) => c.insertContent({ type: "tableFigures" }),
  },
  {
    cle: "index",
    libelle: "Index alphabétique",
    description: "Les mots marqués pour l'index, avec leurs pages",
    groupe: "Mise en page",
    motsCles: "index alphabetique mots termes fin livre",
    appliquer: (c) => c.insertContent({ type: "indexAlpha" }),
  },
  {
    cle: "legende",
    libelle: "Légende numérotée",
    description: "Sous un tableau : « Tableau 2 » ; ailleurs : « Figure 3 »",
    groupe: "Mise en page",
    motsCles: "legende figure tableau numero",
    appliquer: (c) => c.setNode("paragraph", { styleNomme: "legende" }),
  },
];
