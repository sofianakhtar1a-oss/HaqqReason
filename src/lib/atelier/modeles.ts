/**
 * Le Calame — les modèles prêts : une structure déjà posée pour les écrits les plus courants
 * (lettre, exposé, mémoire, fiche de lecture, réfutation, sermon, plan de cours). Chaque modèle
 * apporte son texte d'amorce et ses réglages de page ; l'auteur n'a plus qu'à remplir.
 *
 * Les textes entre crochets sont des indications, à remplacer. Module pur.
 */

import type { ReglagesPage } from "./modele";

type N = { type: string; attrs?: Record<string, unknown>; content?: N[]; text?: string; marks?: { type: string; attrs?: Record<string, unknown> }[] };

const t = (text: string, marks?: N["marks"]): N => ({ type: "text", text, ...(marks ? { marks } : {}) });
const indication = (texte: string): N => t(texte, [{ type: "italic" }]);
const p = (...contenu: (string | N)[]): N => ({ type: "paragraph", content: contenu.map((c) => (typeof c === "string" ? t(c) : c)) });
const pa = (alignement: "left" | "center" | "right" | "justify", ...contenu: (string | N)[]): N => ({ ...p(...contenu), attrs: { textAlign: alignement } });
const vide = (): N => ({ type: "paragraph" });
const h = (niveau: 2 | 3 | 4, texte: string): N => ({ type: "heading", attrs: { level: niveau }, content: [t(texte)] });
const gras = (texte: string) => t(texte, [{ type: "bold" }]);
const liste = (...items: string[]): N => ({ type: "bulletList", content: items.map((i) => ({ type: "listItem", content: [p(indication(i))] })) });
const numerotee = (...items: string[]): N => ({ type: "orderedList", content: items.map((i) => ({ type: "listItem", content: [p(indication(i))] })) });
const cases = (...items: string[]): N => ({ type: "taskList", content: items.map((i) => ({ type: "taskItem", attrs: { checked: false }, content: [p(i)] })) });
const citation = (texte: string): N => ({ type: "blockquote", content: [p(indication(texte))] });
const encadre = (genre: string, ...contenu: N[]): N => ({ type: "encadre", attrs: { type: genre }, content: contenu });
const verset = (reference: string): N => ({ type: "verset", attrs: { reference }, content: [{ type: "versetArabe" }, { type: "versetTraduction", content: [indication("[Traduction du verset — « / » puis « Verset par sa référence » remplit le texte arabe seul.]")] }] });
const hadith = (): N => ({ type: "hadith", attrs: { recueil: "", numero: "", degre: "" }, content: [{ type: "hadithArabe" }, { type: "hadithTraduction", content: [indication("[Traduction du hadith — « / » puis « Hadith par sa référence » remplit le texte arabe et le degré.]")] }] });
const objectionReponse = (objection: string, reponse: string): N => ({ type: "objectionReponse", content: [{ type: "objection", content: [p(indication(objection))] }, { type: "reponse", content: [p(indication(reponse))] }] });
const tableau = (entetes: string[], lignes: string[][]): N => ({
  type: "table",
  content: [
    { type: "tableRow", content: entetes.map((e) => ({ type: "tableHeader", content: [p(e)] })) },
    ...lignes.map((l) => ({ type: "tableRow", content: l.map((c) => ({ type: "tableCell", content: [c ? p(c) : vide()] })) })),
  ],
});
const sommaire = (): N => ({ type: "sommaire", attrs: { titre: "Table des matières", profondeur: 4 } });
const saut = (): N => ({ type: "sautPage" });

export type ModeleDocument = {
  cle: string;
  titre: string;
  description: string;
  /** Le titre donné au document créé. */
  titreDocument: string;
  contenu: () => N;
  reglages?: Partial<ReglagesPage>;
};

const aujourdHui = () => new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export const MODELES: ModeleDocument[] = [
  {
    cle: "lettre",
    titre: "Lettre",
    description: "Expéditeur, destinataire, objet, formule de politesse",
    titreDocument: "Lettre",
    reglages: { numeroter: false, premierePageNue: true },
    contenu: () => ({
      type: "doc",
      content: [
        p(gras("[Prénom Nom]")),
        p(indication("[Adresse]")),
        p(indication("[Code postal, ville]")),
        p(indication("[Téléphone · adresse e-mail]")),
        vide(),
        pa("right", gras("[Destinataire]")),
        pa("right", indication("[Fonction, organisme]")),
        pa("right", indication("[Adresse, code postal, ville]")),
        vide(),
        pa("right", `[Ville], le ${aujourdHui()}`),
        vide(),
        p(gras("Objet : "), indication("[l'objet de la lettre en une ligne]")),
        vide(),
        p("Madame, Monsieur,"),
        pa("justify", indication("[Premier paragraphe : la raison de votre lettre.]")),
        pa("justify", indication("[Deuxième paragraphe : les faits, les arguments, ce que vous proposez.]")),
        pa("justify", indication("[Dernier paragraphe : ce que vous attendez, et dans quel délai.]")),
        pa("justify", "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées."),
        vide(),
        pa("right", gras("[Prénom Nom]")),
        pa("right", indication("[Signature]")),
      ],
    }),
  },
  {
    cle: "expose",
    titre: "Exposé",
    description: "Introduction, trois parties, conclusion, bibliographie",
    titreDocument: "Exposé",
    reglages: { numeroterTitres: true },
    contenu: () => ({
      type: "doc",
      content: [
        p(indication("[Sous-titre ou question traitée]")),
        p(gras("Présenté par : "), indication("[noms]"), " · ", gras("Date : "), aujourdHui()),
        sommaire(),
        h(2, "Introduction"),
        pa("justify", indication("[Amorce : un fait, une citation ou une question qui accroche.]")),
        pa("justify", indication("[Problématique : la question à laquelle l'exposé répond.]")),
        pa("justify", indication("[Annonce du plan : les trois parties, en une phrase chacune.]")),
        h(2, "[Première partie]"),
        h(3, "[Premier point]"),
        pa("justify", indication("[Idée, preuve, exemple.]")),
        h(3, "[Deuxième point]"),
        pa("justify", indication("[Idée, preuve, exemple.]")),
        h(2, "[Deuxième partie]"),
        h(3, "[Premier point]"),
        pa("justify", indication("[Idée, preuve, exemple.]")),
        h(3, "[Deuxième point]"),
        pa("justify", indication("[Idée, preuve, exemple.]")),
        h(2, "[Troisième partie]"),
        pa("justify", indication("[Idée, preuve, exemple.]")),
        h(2, "Conclusion"),
        pa("justify", indication("[Réponse à la problématique, puis ouverture.]")),
        encadre("a-retenir", p(indication("[Les trois idées à retenir.]"))),
        { type: "bibliographie", attrs: { titre: "Bibliographie", portee: "citees" } },
      ],
    }),
  },
  {
    cle: "memoire",
    titre: "Mémoire",
    description: "Page de garde, remerciements, parties, bibliographie, glossaire, index",
    titreDocument: "Mémoire",
    reglages: { numeroterTitres: true, notes: "bas", justifier: true, cesure: true, entete: "{partie}", enteteGauche: "{titre}", premierePageNue: true, styleCitation: "chicago" },
    contenu: () => ({
      type: "doc",
      content: [
        { type: "pageDeGarde", attrs: { titre: "[Titre du mémoire]", sousTitre: "[Sous-titre]", auteur: "[Prénom Nom]", etablissement: "[Établissement — formation]", direction: "Sous la direction de [Nom]", date: `Année ${new Date().getFullYear()}–${new Date().getFullYear() + 1}`, modele: "classique" } },
        h(2, "Remerciements"),
        pa("justify", indication("[Les personnes qui ont accompagné ce travail.]")),
        saut(),
        sommaire(),
        saut(),
        h(2, "Introduction"),
        pa("justify", indication("[Contexte et intérêt du sujet.]")),
        pa("justify", indication("[État de la question : ce qu'en disent les travaux existants.]")),
        pa("justify", indication("[Problématique et hypothèses.]")),
        pa("justify", indication("[Méthode et sources : corpus, textes, entretiens…]")),
        pa("justify", indication("[Annonce du plan.]")),
        h(2, "[Première partie]"),
        h(3, "[Chapitre 1]"),
        pa("justify", indication("[Développement. « / » puis « Référence à un ouvrage » pour une note tirée de ta bibliothèque.]")),
        h(3, "[Chapitre 2]"),
        pa("justify", indication("[Développement.]")),
        h(2, "[Deuxième partie]"),
        h(3, "[Chapitre 3]"),
        pa("justify", indication("[Développement.]")),
        h(3, "[Chapitre 4]"),
        pa("justify", indication("[Développement.]")),
        h(2, "Conclusion"),
        pa("justify", indication("[Résultats, limites, perspectives.]")),
        saut(),
        { type: "bibliographie", attrs: { titre: "Bibliographie", portee: "citees" } },
        { type: "glossaire", attrs: { titre: "Glossaire", pages: true } },
        { type: "indexSources", attrs: { genre: "versets" } },
        { type: "indexSources", attrs: { genre: "hadiths" } },
        h(2, "Annexes"),
        pa("justify", indication("[Documents, tableaux, transcriptions.]")),
      ],
    }),
  },
  {
    cle: "fiche-lecture",
    titre: "Fiche de lecture",
    description: "Référence, résumé, idées, citations, avis",
    titreDocument: "Fiche de lecture",
    contenu: () => ({
      type: "doc",
      content: [
        { type: "source", attrs: { auteur: "[Auteur]", ouvrage: "[Titre de l'ouvrage]", edition: "[Éditeur, année]", page: "", lien: "" } },
        h(2, "L'auteur et le contexte"),
        pa("justify", indication("[Qui est l'auteur, à quelle époque et pour qui il écrit.]")),
        h(2, "Résumé"),
        pa("justify", indication("[L'ouvrage en dix lignes, dans ses propres termes.]")),
        h(2, "Idées principales"),
        numerotee("[Première thèse]", "[Deuxième thèse]", "[Troisième thèse]"),
        h(2, "Citations marquantes"),
        citation("[Citation exacte] (p. [page])"),
        citation("[Citation exacte] (p. [page])"),
        h(2, "Analyse critique"),
        pa("justify", indication("[Forces, faiblesses, présupposés, réception.]")),
        h(2, "Ce que j'en retiens"),
        liste("[Pour mon travail]", "[À vérifier]", "[À lire ensuite]"),
      ],
    }),
  },
  {
    cle: "refutation",
    titre: "Réfutation",
    description: "Thèse adverse, sources, réponse argumentée, preuves",
    titreDocument: "Réfutation",
    reglages: { numeroterTitres: true, notes: "bas" },
    contenu: () => ({
      type: "doc",
      content: [
        encadre("citation-adverse", p(indication("[La thèse adverse, citée exactement, avec sa source.]"))),
        h(2, "Présentation de la thèse"),
        pa("justify", indication("[Qui la défend, où, avec quels arguments — exposés honnêtement, dans leur meilleure forme.]")),
        h(2, "Réponse"),
        objectionReponse("[Premier argument adverse]", "[Réponse : prémisses, preuve, conclusion.]"),
        objectionReponse("[Deuxième argument adverse]", "[Réponse.]"),
        h(2, "Preuves"),
        verset("[Sourate (n°), verset]"),
        hadith(),
        h(2, "Erreurs de raisonnement relevées"),
        liste("[Sophisme : nom, et où il apparaît]"),
        h(2, "Conclusion"),
        encadre("conclusion", p(indication("[Ce qui est établi, et ce qui reste ouvert.]"))),
        { type: "bibliographie", attrs: { titre: "Sources", portee: "citees" } },
      ],
    }),
  },
  {
    cle: "sermon",
    titre: "Sermon (khoutba)",
    description: "Ouverture, première et seconde khoutba, invocations",
    titreDocument: "Sermon",
    contenu: () => ({
      type: "doc",
      content: [
        p(gras("Thème : "), indication("[le sujet du sermon]"), " · ", gras("Date : "), aujourdHui()),
        h(2, "Ouverture"),
        pa("justify", indication("[Louange à Allah, attestation de foi, prière sur le Prophète ﷺ — avec la formule d'ouverture habituelle (khoutbat al-ḥāja).]")),
        h(2, "Première khoutba"),
        h(3, "Le verset du jour"),
        verset("[Sourate (n°), verset]"),
        h(3, "Le hadith"),
        hadith(),
        h(3, "Explication"),
        pa("justify", indication("[Le sens du verset et du hadith, et ce qu'en ont dit les savants.]")),
        h(3, "Application"),
        liste("[Ce que l'on peut changer dès cette semaine]", "[Un exemple concret]"),
        h(2, "Seconde khoutba"),
        pa("justify", indication("[Louange, rappel bref, exhortation à la piété.]")),
        h(2, "Invocations"),
        pa("justify", indication("[Les invocations de clôture.]")),
        encadre("a-retenir", p(indication("[Durée visée : 15 à 20 minutes. Points à ne pas oublier.]"))),
      ],
    }),
  },
  {
    cle: "plan-cours",
    titre: "Plan de cours",
    description: "Objectifs, prérequis, déroulé minuté, évaluation",
    titreDocument: "Plan de cours",
    contenu: () => ({
      type: "doc",
      content: [
        p(gras("Public : "), indication("[niveau, nombre]"), " · ", gras("Durée : "), indication("[1 h 30]"), " · ", gras("Date : "), aujourdHui()),
        h(2, "Objectifs"),
        cases("À la fin de la séance, l'élève saura […]", "Il pourra expliquer […]", "Il saura répondre à l'objection […]"),
        h(2, "Prérequis"),
        liste("[Notion déjà vue]", "[Vocabulaire à connaître]"),
        h(2, "Déroulé"),
        tableau(["Durée", "Étape", "Activité", "Support"], [
          ["10 min", "Accroche", "[Question ou situation de départ]", "[Image, verset]"],
          ["30 min", "Apport", "[Exposé du cours]", "[Diaporama, texte]"],
          ["30 min", "Exercice", "[Travail en groupe]", "[Fiche]"],
          ["15 min", "Mise en commun", "[Correction]", ""],
          ["5 min", "Bilan", "[Ce qu'il faut retenir]", ""],
        ]),
        h(2, "Contenu"),
        pa("justify", indication("[Les notions, définitions et exemples, dans l'ordre du cours.]")),
        h(2, "Évaluation"),
        liste("[Questions de vérification]", "[Exercice à rendre]"),
        h(2, "Ressources"),
        liste("[Ouvrages, articles HaqqReason, vidéos]"),
      ],
    }),
  },
];

export function modeleParCle(cle: string): ModeleDocument | undefined {
  return MODELES.find((m) => m.cle === cle);
}
