"use client";

import type { Commande } from "../createur/_composants/editeur/commandes";
import { COMMANDE_TABLEAU } from "./tableaux";

/**
 * Les blocs propres à l'atelier d'écriture, ajoutés au menu « / » et au bouton « Insérer »
 * (ceux des articles restent tous là).
 */
/** Les dialogues de l'atelier, ouverts depuis le menu « / » (qui ne connaît que des commandes d'éditeur). */
export type DialogueCalame = "verset" | "hadith" | "renvoi" | "lien" | "bibliotheque" | "article" | "glossaire" | "lien-web" | "youtube" | "reference-ouvrage" | "citation-ouvrage" | "pdf";
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
    cle: "calame-reference",
    libelle: "Référence à un ouvrage",
    description: "Une note de bas de page tirée de ta bibliothèque",
    groupe: "Sources",
    motsCles: "reference ouvrage livre note bas de page bibliographie source page",
    appliquer: (c) => {
      ouvrirDialogue("reference-ouvrage");
      return c;
    },
  },
  {
    cle: "calame-citation",
    libelle: "Citation d'un ouvrage",
    description: "Le passage exact, en retrait, et sa note",
    groupe: "Sources",
    motsCles: "citation extrait passage ouvrage livre auteur guillemets",
    appliquer: (c) => {
      ouvrirDialogue("citation-ouvrage");
      return c;
    },
  },
  {
    cle: "calame-bibliotheque",
    libelle: "Ma bibliothèque",
    description: "Les ouvrages saisis une fois, pour tous tes documents",
    groupe: "Sources",
    motsCles: "bibliotheque ouvrages livres auteurs references personnelle",
    appliquer: (c) => {
      ouvrirDialogue("bibliotheque");
      return c;
    },
  },
  {
    cle: "bibliographie",
    libelle: "Bibliographie",
    description: "Les ouvrages cités, classés par auteur (Chicago, APA, ISO 690)",
    groupe: "Sources",
    motsCles: "bibliographie references ouvrages fin document auteur chicago apa iso",
    appliquer: (c) => c.insertContent({ type: "bibliographie" }),
  },
  {
    cle: "index-versets",
    libelle: "Index des versets",
    description: "Les versets cités, dans l'ordre du Coran, avec leurs pages",
    groupe: "Sources",
    motsCles: "index versets coran sourates cites fin document",
    appliquer: (c) => c.insertContent({ type: "indexSources", attrs: { genre: "versets" } }),
  },
  {
    cle: "index-hadiths",
    libelle: "Index des hadiths",
    description: "Les hadiths cités, par recueil et par numéro, avec leurs pages",
    groupe: "Sources",
    motsCles: "index hadiths recueils cites bukhari muslim fin document",
    appliquer: (c) => c.insertContent({ type: "indexSources", attrs: { genre: "hadiths" } }),
  },
  {
    cle: "glossaire-terme",
    libelle: "Expliquer au glossaire",
    description: "Le terme sélectionné : translittération et sens",
    groupe: "Sources",
    motsCles: "glossaire terme arabe translitteration sens definition vocabulaire",
    appliquer: (c) => {
      ouvrirDialogue("glossaire");
      return c;
    },
  },
  {
    cle: "glossaire",
    libelle: "Glossaire",
    description: "Les termes expliqués, rassemblés et classés tout seuls",
    groupe: "Sources",
    motsCles: "glossaire lexique termes arabes vocabulaire fin document",
    appliquer: (c) => c.insertContent({ type: "glossaire" }),
  },
  {
    cle: "calame-lien",
    libelle: "Carte de lien",
    description: "Une page web présentée avec son titre et sa vignette",
    groupe: "Sources",
    motsCles: "lien url site web carte signet internet",
    appliquer: (c) => {
      ouvrirDialogue("lien-web");
      return c;
    },
  },
  {
    cle: "calame-youtube",
    libelle: "Vidéo YouTube",
    description: "Une vidéo ou une playlist, avec sa vignette",
    groupe: "Sources",
    motsCles: "youtube video playlist cours conference",
    appliquer: (c) => {
      ouvrirDialogue("youtube");
      return c;
    },
  },
  {
    cle: "article-haqqreason",
    libelle: "Citer un article HaqqReason",
    description: "Titre, lien et extrait, sans quitter le document",
    groupe: "Sources",
    motsCles: "article haqqreason citer bibliotheque site extrait lien",
    appliquer: (c) => {
      ouvrirDialogue("article");
      return c;
    },
  },
  {
    cle: "pdf-a-cote",
    libelle: "Lire un PDF à côté",
    description: "Dans une colonne, avec « Citer la page » en un clic",
    groupe: "Sources",
    motsCles: "pdf lire a cote colonne document joint citer page",
    appliquer: (c) => {
      ouvrirDialogue("pdf");
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
