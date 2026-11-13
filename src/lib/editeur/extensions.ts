/**
 * Définition du format des articles pour l'éditeur (TipTap / ProseMirror).
 * Ce fichier ne contient aucun élément d'interface : il est aussi chargé par le serveur
 * pour vérifier la structure de chaque document avant de l'enregistrer.
 */
import { Extension, Mark, Node, mergeAttributes, type AnyExtension } from "@tiptap/core";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";
import { ENCADRES, lienSur, libelleDe, DEGRES_HADITH } from "../document-schema";

// ----------------------------------------------------------------------
// Outils
// ----------------------------------------------------------------------

/** Attribut texte stocké dans un attribut HTML data-*. */
function attributData(nom: string, defaut: string | null = "") {
  return {
    default: defaut,
    parseHTML: (el: HTMLElement) => el.getAttribute(`data-${nom}`) ?? defaut,
    renderHTML: (attrs: Record<string, unknown>) => (attrs[nom] ? { [`data-${nom}`]: String(attrs[nom]) } : {}),
  };
}

/** Bloc simple qui ne fait que contenir d'autres blocs, avec une classe CSS. */
function conteneur(nom: string, balise: string, classe: string, contenu: string, options: { groupe?: string; libelle?: string; isolant?: boolean } = {}) {
  return Node.create({
    name: nom,
    group: options.groupe,
    content: contenu,
    defining: true,
    isolating: options.isolant ?? false,
    parseHTML() {
      return [{ tag: `${balise}.${classe}` }];
    },
    renderHTML({ HTMLAttributes }) {
      return [balise, mergeAttributes(HTMLAttributes, { class: classe, ...(options.libelle ? { "data-libelle": options.libelle } : {}) }), 0];
    },
  });
}

/** Ligne de texte sans mise en forme (texte arabe, date d'un événement…). */
function ligneSimple(nom: string, balise: string, classe: string, extra: Record<string, string> = {}) {
  return Node.create({
    name: nom,
    content: "text*",
    marks: "",
    defining: true,
    parseHTML() {
      return [{ tag: `${balise}.${classe}` }];
    },
    renderHTML({ HTMLAttributes }) {
      return [balise, mergeAttributes(HTMLAttributes, { class: classe, ...extra }), 0];
    },
  });
}

/** Ligne de texte qui accepte la mise en forme (traductions, titres d'accordéon). */
function ligneRiche(nom: string, balise: string, classe: string) {
  return Node.create({
    name: nom,
    content: "inline*",
    defining: true,
    parseHTML() {
      return [{ tag: `${balise}.${classe}` }];
    },
    renderHTML({ HTMLAttributes }) {
      return [balise, mergeAttributes(HTMLAttributes, { class: classe }), 0];
    },
  });
}

// ----------------------------------------------------------------------
// Marques (mise en valeur du texte)
// ----------------------------------------------------------------------

const Surligne = Mark.create({
  name: "surligne",
  addAttributes() {
    return { couleur: attributData("couleur", "jaune") };
  },
  parseHTML() {
    return [{ tag: "mark[data-couleur]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(HTMLAttributes, { class: `fluo fluo-${HTMLAttributes["data-couleur"] ?? "jaune"}` }), 0];
  },
});

const Souligne = Mark.create({
  name: "souligne",
  addAttributes() {
    return { style: attributData("souligne", "simple"), couleur: attributData("couleur", null) };
  },
  parseHTML() {
    return [{ tag: "span[data-souligne]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const couleur = HTMLAttributes["data-couleur"];
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: `souligne souligne-${HTMLAttributes["data-souligne"] ?? "simple"}${couleur ? ` souligne-${couleur}` : ""}`,
      }),
      0,
    ];
  },
});

const CouleurTexte = Mark.create({
  name: "couleur",
  addAttributes() {
    return { couleur: { default: "jaune", parseHTML: (el: HTMLElement) => el.getAttribute("data-texte"), renderHTML: (a: Record<string, unknown>) => ({ "data-texte": a.couleur }) } };
  },
  parseHTML() {
    return [{ tag: "span[data-texte]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: `texte-${HTMLAttributes["data-texte"]}` }), 0];
  },
});

const Effet = Mark.create({
  name: "effet",
  addAttributes() {
    return { type: { default: "degrade", parseHTML: (el: HTMLElement) => el.getAttribute("data-effet"), renderHTML: (a: Record<string, unknown>) => ({ "data-effet": a.type }) } };
  },
  parseHTML() {
    return [{ tag: "span[data-effet]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: `effet-${HTMLAttributes["data-effet"]}` }), 0];
  },
});

// ----------------------------------------------------------------------
// Blocs propres à HaqqReason
// ----------------------------------------------------------------------

const Encadre = Node.create({
  name: "encadre",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { type: { default: "point-cle", parseHTML: (el: HTMLElement) => el.getAttribute("data-encadre"), renderHTML: (a: Record<string, unknown>) => ({ "data-encadre": a.type }) } };
  },
  parseHTML() {
    return [{ tag: "aside[data-encadre]" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["aside", mergeAttributes(HTMLAttributes, { class: "encadre", "data-libelle": libelleDe(ENCADRES, node.attrs.type) }), 0];
  },
});

const ObjectionReponse = conteneur("objectionReponse", "section", "objection-reponse", "objection reponse", { groupe: "block", isolant: true });
const Objection = conteneur("objection", "div", "objection", "block+", { libelle: "Objection" });
const Reponse = conteneur("reponse", "div", "reponse", "block+", { libelle: "Réponse" });

const Comparaison = conteneur("comparaison", "div", "comparaison", "colonne colonne", { groupe: "block", isolant: true });
const Colonne = conteneur("colonne", "div", "colonne", "block+");

const Accordeon = conteneur("accordeon", "div", "accordeon", "accordeonTitre accordeonCorps", { groupe: "block", isolant: true });
const AccordeonTitre = ligneRiche("accordeonTitre", "p", "accordeon-titre");
const AccordeonCorps = conteneur("accordeonCorps", "div", "accordeon-corps", "block+");

const Frise = conteneur("frise", "ol", "frise", "evenement+", { groupe: "block", isolant: true });
const Evenement = Node.create({
  name: "evenement",
  content: "evenementDate paragraph+",
  defining: true,
  parseHTML() {
    return [{ tag: "li.evenement" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["li", mergeAttributes(HTMLAttributes, { class: "evenement" }), 0];
  },
});
const EvenementDate = ligneSimple("evenementDate", "p", "evenement-date");

const Verset = Node.create({
  name: "verset",
  group: "block",
  content: "versetArabe versetTraduction",
  defining: true,
  isolating: true,
  addAttributes() {
    return { reference: attributData("reference") };
  },
  parseHTML() {
    return [{ tag: "figure.verset" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return ["figure", mergeAttributes(HTMLAttributes, { class: "verset", "data-legende": node.attrs.reference ? `Coran, ${node.attrs.reference}` : "Coran, référence à préciser" }), 0];
  },
});
const VersetArabe = ligneSimple("versetArabe", "p", "verset-arabe", { lang: "ar", dir: "rtl" });
const VersetTraduction = ligneRiche("versetTraduction", "p", "verset-traduction");

const Hadith = Node.create({
  name: "hadith",
  group: "block",
  content: "hadithArabe hadithTraduction",
  defining: true,
  isolating: true,
  addAttributes() {
    return { recueil: attributData("recueil"), numero: attributData("numero"), degre: attributData("degre") };
  },
  parseHTML() {
    return [{ tag: "figure.hadith" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const { recueil, numero, degre } = node.attrs as { recueil: string; numero: string; degre: string };
    const legende = [recueil || "Recueil à préciser", numero ? `n° ${numero}` : ""].filter(Boolean).join(", ");
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { class: "hadith", "data-legende": legende, "data-badge": degre ? libelleDe(DEGRES_HADITH, degre) : "Degré à préciser" }),
      0,
    ];
  },
});
const HadithArabe = ligneSimple("hadithArabe", "p", "hadith-arabe", { lang: "ar", dir: "rtl" });
const HadithTraduction = ligneRiche("hadithTraduction", "p", "hadith-traduction");

const Source = Node.create({
  name: "source",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      auteur: attributData("auteur"),
      ouvrage: attributData("ouvrage"),
      edition: attributData("edition"),
      page: attributData("page"),
      lien: attributData("lien"),
    };
  },
  parseHTML() {
    return [{ tag: "div.source-bloc" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const a = node.attrs as Record<string, string>;
    const resume = [a.auteur, a.ouvrage, a.edition, a.page ? `p. ${a.page}` : ""].filter(Boolean).join(", ");
    return ["div", mergeAttributes(HTMLAttributes, { class: "source-bloc" }), ["span", { class: "source-libelle" }, "Source"], ["span", {}, resume || "Clique ici pour renseigner la source"]];
  },
});

const Note = Node.create({
  name: "note",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return { texte: attributData("note") };
  },
  parseHTML() {
    return [{ tag: "sup.note-marqueur" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sup", mergeAttributes(HTMLAttributes, { class: "note-marqueur", title: HTMLAttributes["data-note"] || "Note vide" })];
  },
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const Image = Node.create({
  name: "image",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { fichier: attributData("fichier"), legende: attributData("legende"), alt: attributData("alt"), largeur: attributData("largeur", "normale") };
  },
  parseHTML() {
    return [{ tag: "figure.image-bloc" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const a = node.attrs as Record<string, string>;
    const src = UUID.test(a.fichier) ? `/fichiers/${a.fichier}` : "";
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { class: "image-bloc", "data-largeur": a.largeur || "normale" }),
      ["img", { src, alt: a.alt || "", loading: "lazy" }],
      ["figcaption", {}, a.legende || "Clique sur l'image pour ajouter une légende"],
    ];
  },
});

const DocumentPdf = Node.create({
  name: "documentPdf",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { fichier: attributData("fichier"), nom: attributData("nom"), page: attributData("page", "1") };
  },
  parseHTML() {
    return [{ tag: "div.document-bloc" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const a = node.attrs as Record<string, string>;
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "document-bloc" }),
      ["span", { class: "source-libelle" }, "Document PDF"],
      ["span", {}, `${a.nom || "Document"}${Number(a.page) > 1 ? `, à partir de la page ${a.page}` : ""}`],
    ];
  },
});

// ----------------------------------------------------------------------
// Phase 7 : cartes de liens, schémas, logique, sophismes, références
// ----------------------------------------------------------------------

/** Attribut JSON (schéma, logique) : rangé dans data-donnees sous forme de texte. */
function attributJson() {
  return {
    default: null,
    parseHTML: (el: HTMLElement) => {
      try {
        return JSON.parse(el.getAttribute("data-donnees") ?? "null");
      } catch {
        return null;
      }
    },
    renderHTML: (attrs: Record<string, unknown>) => (attrs.donnees ? { "data-donnees": JSON.stringify(attrs.donnees) } : {}),
  };
}

function blocAtome(nom: string, classe: string, attributs: Record<string, ReturnType<typeof attributData> | ReturnType<typeof attributJson>>, libelle: (a: Record<string, unknown>) => string) {
  return Node.create({
    name: nom,
    group: "block",
    atom: true,
    selectable: true,
    draggable: true,
    addAttributes() {
      return attributs;
    },
    parseHTML() {
      return [{ tag: `div.${classe}` }];
    },
    renderHTML({ HTMLAttributes, node }) {
      return ["div", mergeAttributes(HTMLAttributes, { class: classe }), libelle(node.attrs as Record<string, unknown>)];
    },
  });
}

export const LienCarte = blocAtome(
  "lienCarte",
  "carte-lien-bloc",
  {
    url: attributData("url"),
    titre: attributData("titre"),
    description: attributData("description"),
    site: attributData("site"),
    auteur: attributData("auteur"),
    genre: attributData("genre", "web"),
    video: attributData("video"),
    liste: attributData("liste"),
    image: attributData("image"),
  },
  (a) => String(a.titre || a.url || "Lien"),
);
export const Schema = blocAtome("schema", "schema-bloc-editeur", { donnees: attributJson() }, () => "Schéma");
export const Logique = blocAtome("logique", "logique-bloc-editeur", { donnees: attributJson() }, () => "Atelier de logique");
export const SophismeBloc = blocAtome("sophisme", "sophisme-bloc", { cle: attributData("cle", "ad-hominem"), commentaire: attributData("commentaire") }, (a) => `Sophisme : ${String(a.cle)}`);
export const CitationOuvrage = blocAtome("citationOuvrage", "citation-ouvrage-bloc", { citation: attributData("citation") }, () => "Citation d'un ouvrage");
export const SommaireBloc = blocAtome(
  "sommaire",
  "table-matieres-bloc",
  { titre: attributData("titre"), profondeur: attributData("profondeur", "4") },
  () => "Table des matières",
);

export const ReferenceSource = Node.create({
  name: "reference",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return { ouvrage: attributData("ouvrage"), citation: attributData("citation"), page: attributData("page"), tome: attributData("tome") };
  },
  parseHTML() {
    return [{ tag: "sup.reference-appel" }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const a = node.attrs as Record<string, string>;
    return ["sup", mergeAttributes(HTMLAttributes, { class: "reference-appel" }), `[réf.${a.page ? ` p. ${a.page}` : ""}]`];
  },
});

// ----------------------------------------------------------------------
// Touche Entrée dans les blocs structurés
// ----------------------------------------------------------------------

/** Lignes uniques (texte arabe, date, titre) : Entrée passe à la ligne suivante du bloc. */
const LIGNES_SUIVANT = new Set(["versetArabe", "hadithArabe", "evenementDate", "accordeonTitre"]);
/** Dernière ligne d'un bloc (traduction) : Entrée sort du bloc et crée un paragraphe après lui. */
const LIGNES_SORTIE = new Set(["versetTraduction", "hadithTraduction"]);

const NavigationBlocs = Extension.create({
  name: "navigationBlocs",
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { $from, empty } = editor.state.selection;
        if (!empty) return false;
        const type = $from.parent.type.name;
        if (LIGNES_SUIVANT.has(type)) {
          return editor.commands.setTextSelection($from.after() + 1);
        }
        if (LIGNES_SORTIE.has(type)) {
          const apresBloc = $from.after($from.depth - 1);
          return editor.chain().insertContentAt(apresBloc, { type: "paragraph" }).setTextSelection(apresBloc + 1).run();
        }
        return false;
      },
    };
  },
});

// ----------------------------------------------------------------------
// Assemblage
// ----------------------------------------------------------------------

/** Toutes les extensions qui définissent la structure d'un article (utilisées aussi par le serveur). */
export function extensionsDocument(): AnyExtension[] {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      code: false,
      codeBlock: false,
      underline: false,
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        protocols: ["http", "https", "mailto"],
        isAllowedUri: (url) => lienSur(url) !== null,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: null },
      },
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Subscript,
    Superscript,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Surligne,
    Souligne,
    CouleurTexte,
    Effet,
    Encadre,
    ObjectionReponse,
    Objection,
    Reponse,
    Comparaison,
    Colonne,
    Accordeon,
    AccordeonTitre,
    AccordeonCorps,
    Frise,
    Evenement,
    EvenementDate,
    Verset,
    VersetArabe,
    VersetTraduction,
    Hadith,
    HadithArabe,
    HadithTraduction,
    Source,
    Note,
    Image,
    DocumentPdf,
    LienCarte,
    Schema,
    Logique,
    SophismeBloc,
    CitationOuvrage,
    SommaireBloc,
    ReferenceSource,
    NavigationBlocs,
  ];
}
