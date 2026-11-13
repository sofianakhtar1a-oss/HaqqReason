import type { ChainedCommands, Editor } from "@tiptap/core";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import type { NoeudJSON } from "@/lib/document-schema";
import { ENCADRES } from "@/lib/document-schema";
import { GENRES_LOGIQUE, logiqueParDefaut } from "@/lib/logique/bloc";
import { schemaParDefaut, STYLES_GRAPHE, type GenreSchema } from "@/lib/schemas/modele";
import { drapeaux } from "./VuesBlocs";

/*
 * Tout ce qu'on peut insérer dans un article : utilisé par le menu « / », le bouton « Insérer » et les modèles.
 */

export type Commande = {
  cle: string;
  libelle: string;
  description: string;
  groupe: "Texte" | "Apologétique" | "Schémas" | "Logique" | "Liens et sources" | "Encadrés";
  motsCles: string;
  appliquer: (chaine: ChainedCommands) => ChainedCommands;
};

const p = (): NoeudJSON => ({ type: "paragraph" });
const titre = (niveau: 2 | 3 | 4, texte: string): NoeudJSON => ({ type: "heading", attrs: { level: niveau }, content: [{ type: "text", text: texte }] });

export const BLOCS = {
  verset: (): NoeudJSON => ({ type: "verset", attrs: { reference: "" }, content: [{ type: "versetArabe" }, { type: "versetTraduction" }] }),
  hadith: (): NoeudJSON => ({ type: "hadith", attrs: { recueil: "", numero: "", degre: "" }, content: [{ type: "hadithArabe" }, { type: "hadithTraduction" }] }),
  source: (): NoeudJSON => ({ type: "source", attrs: { auteur: "", ouvrage: "", edition: "", page: "", lien: "" } }),
  note: (): NoeudJSON => ({ type: "note", attrs: { texte: "" } }),
  objectionReponse: (): NoeudJSON => ({
    type: "objectionReponse",
    content: [
      { type: "objection", content: [p()] },
      { type: "reponse", content: [p()] },
    ],
  }),
  comparaison: (): NoeudJSON => ({
    type: "comparaison",
    content: [
      { type: "colonne", content: [titre(4, "Ce que dit le texte"), p()] },
      { type: "colonne", content: [titre(4, "Ce qu'en dit l'adversaire"), p()] },
    ],
  }),
  accordeon: (): NoeudJSON => ({ type: "accordeon", content: [{ type: "accordeonTitre" }, { type: "accordeonCorps", content: [p()] }] }),
  frise: (): NoeudJSON => ({ type: "frise", content: [BLOCS.evenement()] }),
  evenement: (): NoeudJSON => ({ type: "evenement", content: [{ type: "evenementDate" }, p()] }),
  encadre: (type: string): NoeudJSON => ({ type: "encadre", attrs: { type }, content: [p()] }),
};

/** Après une insertion : place le curseur dans le bloc inséré (ou le sélectionne s'il n'a pas de texte). */
export function placerCurseurDans(type: string) {
  return ({ tr, dispatch }: { tr: import("@tiptap/pm/state").Transaction; dispatch?: unknown }) => {
    const position = tr.selection.from;
    let cible = -1;
    tr.doc.nodesBetween(Math.max(0, position - 20000), Math.min(position, tr.doc.content.size), (noeud, pos) => {
      if (noeud.type.name === type) cible = pos;
    });
    if (cible < 0 || !dispatch) return true;
    const noeud = tr.doc.nodeAt(cible);
    if (!noeud) return true;
    if (noeud.isAtom) {
      tr.setSelection(NodeSelection.create(tr.doc, cible));
      return true;
    }
    let premier = -1;
    noeud.descendants((enfant, pos) => {
      if (premier >= 0) return false;
      if (enfant.isTextblock) {
        premier = cible + 1 + pos + 1;
        return false;
      }
      return true;
    });
    if (premier > 0) tr.setSelection(TextSelection.create(tr.doc, premier));
    return true;
  };
}

function insererBloc(json: NoeudJSON) {
  return (chaine: ChainedCommands) => chaine.insertContent(json).command(placerCurseurDans(json.type));
}

export const COMMANDES: Commande[] = [
  { cle: "titre-2", libelle: "Grand titre", description: "Titre de partie", groupe: "Texte", motsCles: "titre h2 partie", appliquer: (c) => c.setNode("heading", { level: 2 }) },
  { cle: "titre-3", libelle: "Titre moyen", description: "Titre de section", groupe: "Texte", motsCles: "titre h3 section", appliquer: (c) => c.setNode("heading", { level: 3 }) },
  { cle: "titre-4", libelle: "Petit titre", description: "Sous-section", groupe: "Texte", motsCles: "titre h4 sous-section", appliquer: (c) => c.setNode("heading", { level: 4 }) },
  { cle: "puces", libelle: "Liste à puces", description: "Éléments sans ordre", groupe: "Texte", motsCles: "liste puces", appliquer: (c) => c.toggleBulletList() },
  { cle: "numeros", libelle: "Liste numérotée", description: "Étapes, prémisses", groupe: "Texte", motsCles: "liste numerotee numeros etapes premisses", appliquer: (c) => c.toggleOrderedList() },
  { cle: "cases", libelle: "Liste de cases à cocher", description: "Points à vérifier", groupe: "Texte", motsCles: "cases cocher taches liste", appliquer: (c) => c.toggleTaskList() },
  { cle: "citation", libelle: "Citation", description: "Passage cité", groupe: "Texte", motsCles: "citation guillemets", appliquer: (c) => c.toggleBlockquote() },
  { cle: "separateur", libelle: "Séparateur", description: "Ornement entre deux parties", groupe: "Texte", motsCles: "separateur ligne ornement", appliquer: (c) => c.setHorizontalRule() },
  { cle: "sommaire", libelle: "Table des matières", description: "La liste des titres de l'article, cliquables", groupe: "Texte", motsCles: "sommaire table matieres plan titres navigation", appliquer: (c) => c.insertContent({ type: "sommaire", attrs: { titre: "", profondeur: 4 } }) },

  { cle: "verset", libelle: "Verset coranique", description: "Arabe, traduction et référence", groupe: "Apologétique", motsCles: "verset coran sourate ayat arabe", appliquer: insererBloc(BLOCS.verset()) },
  { cle: "hadith", libelle: "Hadith", description: "Arabe, traduction, recueil et degré", groupe: "Apologétique", motsCles: "hadith sunna recueil degre bukhari muslim", appliquer: insererBloc(BLOCS.hadith()) },
  { cle: "source", libelle: "Source", description: "Auteur, ouvrage, page ; ajoutée à la bibliographie", groupe: "Apologétique", motsCles: "source reference bibliographie livre auteur", appliquer: insererBloc(BLOCS.source()) },
  { cle: "note", libelle: "Note de bas de page", description: "Numérotée automatiquement", groupe: "Apologétique", motsCles: "note bas de page renvoi", appliquer: (c) => c.insertContent(BLOCS.note()).command(placerCurseurDans("note")) },
  { cle: "objection", libelle: "Objection → Réponse", description: "L'objection fidèlement formulée, puis la réponse", groupe: "Apologétique", motsCles: "objection reponse refutation", appliquer: insererBloc(BLOCS.objectionReponse()) },
  { cle: "comparaison", libelle: "Comparaison", description: "Deux colonnes côte à côte", groupe: "Apologétique", motsCles: "comparaison colonnes deux", appliquer: insererBloc(BLOCS.comparaison()) },
  { cle: "accordeon", libelle: "Section repliable", description: "Le lecteur l'ouvre s'il le souhaite", groupe: "Apologétique", motsCles: "accordeon repliable details deplier", appliquer: insererBloc(BLOCS.accordeon()) },
  { cle: "frise", libelle: "Frise chronologique", description: "Dates et événements", groupe: "Apologétique", motsCles: "frise chronologie dates histoire", appliquer: insererBloc(BLOCS.frise()) },

  ...ENCADRES.map(
    (e): Commande => ({
      cle: `encadre-${e.cle}`,
      libelle: `Encadré « ${e.libelle} »`,
      description: "Bloc mis en valeur",
      groupe: "Encadrés",
      motsCles: `encadre ${e.libelle.toLowerCase()}`,
      appliquer: insererBloc(BLOCS.encadre(e.cle)),
    }),
  ),
];

/**
 * Insertions qui demandent d'abord de choisir un fichier (image, PDF).
 * L'éditeur y branche ses fonctions ; la commande ne fait que les déclencher.
 */
export const actionsSpeciales: { image?: () => void; document?: () => void; lien?: (youtube: boolean) => void; reference?: () => void; citation?: () => void } = {};

function insererAtelier(json: NoeudJSON) {
  return (chaine: ChainedCommands) => {
    drapeaux.ouvrirAtelier = true;
    return chaine.insertContent(json).command(placerCurseurDans(json.type));
  };
}
const declencher = (f: () => void) => (c: ChainedCommands) => {
  setTimeout(f, 0);
  return c;
};

const SCHEMAS_AUTRES: { cle: GenreSchema; libelle: string; description: string; motsCles: string }[] = [
  { cle: "venn", libelle: "Diagramme de Venn", description: "Intersections et distinctions entre ensembles", motsCles: "venn ensembles intersection cercles" },
  { cle: "statistique", libelle: "Graphique statistique", description: "Histogramme, courbe, secteurs, nuage de points", motsCles: "graphique statistique histogramme barres courbe camembert secteurs nuage donnees chiffres" },
  { cle: "fonction", libelle: "Graphique mathématique", description: "Courbes de fonctions y = f(x)", motsCles: "fonction courbe mathematique equation math" },
  { cle: "matrice", libelle: "Matrice de comparaison", description: "Plusieurs positions selon plusieurs critères", motsCles: "matrice tableau comparatif comparaison criteres positions doctrines" },
];

COMMANDES.splice(
  COMMANDES.findIndex((c) => c.groupe === "Encadrés"),
  0,
  {
    cle: "image",
    libelle: "Image",
    description: "Envoyer une image et l'insérer, avec sa légende",
    groupe: "Apologétique",
    motsCles: "image photo illustration figure manuscrit",
    appliquer: (c) => {
      setTimeout(() => actionsSpeciales.image?.(), 0);
      return c;
    },
  },
  {
    cle: "document",
    libelle: "Document PDF",
    description: "Envoyer un PDF et placer un lien vers lui dans le texte",
    groupe: "Apologétique",
    motsCles: "document pdf livre fichier",
    appliquer: (c) => {
      setTimeout(() => actionsSpeciales.document?.(), 0);
      return c;
    },
  },
);

COMMANDES.splice(
  COMMANDES.findIndex((c) => c.groupe === "Encadrés"),
  0,
  ...STYLES_GRAPHE.map(
    (st): Commande => ({
      cle: `schema-${st.cle}`,
      libelle: st.libelle,
      description: st.aide,
      groupe: "Schémas",
      motsCles: `schema diagramme graphique ${st.libelle.toLowerCase()} ${st.cle.replace("-", " ")} carte`,
      appliquer: (c) => insererAtelier({ type: "schema", attrs: { donnees: schemaParDefaut("graphe", st.cle) } })(c),
    }),
  ),
  ...SCHEMAS_AUTRES.map(
    (st): Commande => ({
      cle: `schema-${st.cle}`,
      libelle: st.libelle,
      description: st.description,
      groupe: "Schémas",
      motsCles: `schema ${st.motsCles}`,
      appliquer: (c) => insererAtelier({ type: "schema", attrs: { donnees: schemaParDefaut(st.cle) } })(c),
    }),
  ),
  ...GENRES_LOGIQUE.map(
    (g): Commande => ({
      cle: `logique-${g.cle}`,
      libelle: g.libelle,
      description: g.aide,
      groupe: "Logique",
      motsCles: `logique raisonnement ${g.libelle.toLowerCase()} ${g.aide.toLowerCase()}`,
      appliquer: (c) => insererAtelier({ type: "logique", attrs: { donnees: logiqueParDefaut(g.cle) } })(c),
    }),
  ),
  {
    cle: "sophisme",
    libelle: "Sophisme identifié",
    description: "Nommer l'erreur de raisonnement d'un adversaire",
    groupe: "Logique",
    motsCles: "sophisme erreur raisonnement fallacy ad hominem homme de paille",
    appliquer: (c) => c.insertContent({ type: "sophisme", attrs: { cle: "ad-hominem", commentaire: "" } }).command(placerCurseurDans("sophisme")),
  },
  { cle: "lien", libelle: "Lien web (carte)", description: "Un site présenté avec son titre et son image", groupe: "Liens et sources", motsCles: "lien url site web carte signet bookmark internet", appliquer: declencher(() => actionsSpeciales.lien?.(false)) },
  { cle: "youtube", libelle: "Vidéo YouTube", description: "Une vidéo ou une playlist, avec sa vignette", groupe: "Liens et sources", motsCles: "youtube video playlist cours conference", appliquer: declencher(() => actionsSpeciales.lien?.(true)) },
  { cle: "reference", libelle: "Référence à un ouvrage", description: "Appel numéroté ; ajouté à la bibliographie", groupe: "Liens et sources", motsCles: "reference ouvrage livre page bibliographie citation source", appliquer: declencher(() => actionsSpeciales.reference?.()) },
  { cle: "citation-ouvrage", libelle: "Citation d'un ouvrage", description: "Le passage exact, avec sa source et son statut", groupe: "Liens et sources", motsCles: "citation extrait passage ouvrage livre auteur", appliquer: declencher(() => actionsSpeciales.citation?.()) },
);

/** Filtre pour le menu « / » : ignore les accents et la casse. */
export function filtrerCommandes(requete: string): Commande[] {
  const norme = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const q = norme(requete.trim());
  if (!q) return COMMANDES;
  return COMMANDES.filter((c) => norme(`${c.libelle} ${c.motsCles}`).includes(q));
}

export function executer(editor: Editor, commande: Commande): void {
  commande.appliquer(editor.chain().focus()).run();
}
