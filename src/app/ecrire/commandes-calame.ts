"use client";

import type { Commande } from "../createur/_composants/editeur/commandes";
import { COMMANDE_TABLEAU } from "./tableaux";

/**
 * Les blocs propres à l'atelier d'écriture, ajoutés au menu « / » et au bouton « Insérer »
 * (ceux des articles restent tous là).
 */
/** Les dialogues de l'atelier, ouverts depuis le menu « / » (qui ne connaît que des commandes d'éditeur). */
export type DialogueCalame = "verset" | "hadith" | "renvoi" | "lien" | "bibliotheque" | "article" | "glossaire";
export const EVENEMENT_DIALOGUE = "calame:dialogue";
export function ouvrirDialogue(nom: DialogueCalame): void {
  window.dispatchEvent(new CustomEvent(EVENEMENT_DIALOGUE, { detail: nom }));
}

export const COMMANDES_CALAME: Commande[] = [
  COMMANDE_TABLEAU,
  {
    cle: "verset-reference",
    libelle: "Verset par sa référence",
    description: "2:255 ou 2:1-5 : le texte arabe se remplit seul",
    groupe: "Sources",
    motsCles: "verset coran reference sourate ayat texte arabe",
    appliquer: (c) => {
      ouvrirDialogue("verset");
      return c;
    },
  },
  {
    cle: "hadith-reference",
    libelle: "Hadith par sa référence",
    description: "Recueil et numéro : texte arabe et degré",
    groupe: "Sources",
    motsCles: "hadith bukhari muslim recueil numero degre sahih",
    appliquer: (c) => {
      ouvrirDialogue("hadith");
      return c;
    },
  },
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
    cle: "formule",
    libelle: "Formule",
    description: "Équation ou notation logique (∀, ∃, →, ⊢), bien composée",
    groupe: "Mise en page",
    motsCles: "formule equation mathematiques logique latex katex symbole",
    appliquer: (c) => c.insertContent({ type: "formule", attrs: { source: "" } }),
  },
  {
    cle: "dessin",
    libelle: "Dessin à main levée",
    description: "Au doigt, au stylet ou à la souris",
    groupe: "Mise en page",
    motsCles: "dessin croquis main levee stylet crayon schema",
    appliquer: (c) => c.insertContent({ type: "dessin", attrs: { traits: "[]", hauteur: 420 } }),
  },
  {
    cle: "carte-pays",
    libelle: "Carte d'un pays",
    description: "Tirée des données du Portulan : le pays, ses voisins, sa capitale",
    groupe: "Mise en page",
    motsCles: "carte pays geographie region continent capitale portulan",
    appliquer: (c) => c.insertContent({ type: "carteGeo", attrs: { pays: "", cadrage: "voisins", capitale: true, titre: "" } }),
  },
  {
    cle: "deux-colonnes",
    libelle: "Deux colonnes",
    description: "Le paragraphe (ou la sélection) passe sur deux colonnes",
    groupe: "Mise en page",
    motsCles: "deux colonnes colonnes journal mise en page",
    appliquer: (c) => c.wrapIn("deuxColonnes"),
  },
  {
    cle: "section-paysage",
    libelle: "Section en paysage",
    description: "Les pages qui suivent passent en paysage (un grand tableau, une frise)",
    groupe: "Mise en page",
    motsCles: "section paysage orientation saut page large tableau",
    appliquer: (c) => c.insertContent({ type: "sautSection", attrs: { orientation: "paysage" } }),
  },
  {
    cle: "section-portrait",
    libelle: "Section en portrait",
    description: "Les pages qui suivent reviennent en portrait",
    groupe: "Mise en page",
    motsCles: "section portrait orientation saut page",
    appliquer: (c) => c.insertContent({ type: "sautSection", attrs: { orientation: "portrait" } }),
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
