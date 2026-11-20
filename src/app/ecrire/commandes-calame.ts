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
];
