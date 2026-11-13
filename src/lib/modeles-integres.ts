import type { NoeudJSON } from "./document-schema";

/*
 * Modèles fournis avec HaqqReason. Ils ne contiennent AUCUN contenu religieux :
 * seulement une structure et des consignes, que le créateur remplace par son propre texte.
 */

export type ModeleIntegre = { cle: string; nom: string; description: string; contenu: NoeudJSON };

const t = (texte: string): NoeudJSON[] => [{ type: "text", text: texte }];
const p = (texte = ""): NoeudJSON => (texte ? { type: "paragraph", content: t(texte) } : { type: "paragraph" });
const h = (niveau: 2 | 3, texte: string): NoeudJSON => ({ type: "heading", attrs: { level: niveau }, content: t(texte) });
const encadre = (type: string, ...contenu: NoeudJSON[]): NoeudJSON => ({ type: "encadre", attrs: { type }, content: contenu });
const source = (): NoeudJSON => ({ type: "source", attrs: { auteur: "", ouvrage: "", edition: "", page: "", lien: "" } });
const liste = (ordonnee: boolean, ...elements: string[]): NoeudJSON => ({
  type: ordonnee ? "orderedList" : "bulletList",
  content: elements.map((e) => ({ type: "listItem", content: [p(e)] })),
});
const verset = (): NoeudJSON => ({ type: "verset", attrs: { reference: "" }, content: [{ type: "versetArabe" }, { type: "versetTraduction" }] });
const hadith = (): NoeudJSON => ({ type: "hadith", attrs: { recueil: "", numero: "", degre: "" }, content: [{ type: "hadithArabe" }, { type: "hadithTraduction" }] });

export const MODELES_INTEGRES: ModeleIntegre[] = [
  {
    cle: "reponse-objection",
    nom: "Réponse à une objection",
    description: "L'objection fidèlement formulée, la réponse développée, la conclusion et les sources.",
    contenu: {
      type: "doc",
      content: [
        {
          type: "objectionReponse",
          content: [
            { type: "objection", content: [p("Formule ici l'objection telle que la présentent ses meilleurs défenseurs, avec leurs propres mots.")] },
            { type: "reponse", content: [p("Résume ici la réponse en quelques phrases.")] },
          ],
        },
        h(2, "Développement de la réponse"),
        p("Développe la réponse point par point."),
        h(2, "Conclusion"),
        encadre("conclusion", p("Résume la réponse en une ou deux phrases.")),
        h(2, "Sources"),
        source(),
      ],
    },
  },
  {
    cle: "demonstration",
    nom: "Démonstration",
    description: "Une thèse, ses prémisses, les preuves textuelles et la conclusion.",
    contenu: {
      type: "doc",
      content: [
        h(2, "Thèse"),
        encadre("point-cle", p("Énonce la thèse en une phrase.")),
        h(2, "Prémisses"),
        liste(true, "Première prémisse.", "Deuxième prémisse.", "Conclusion qui en découle."),
        h(2, "Preuves"),
        verset(),
        hadith(),
        h(2, "Objections possibles"),
        p("Liste les objections que l'on pourrait opposer à cette démonstration, puis renvoie vers les articles qui y répondent."),
        h(2, "Conclusion"),
        encadre("conclusion", p("Résume la démonstration.")),
        h(2, "Sources"),
        source(),
      ],
    },
  },
  {
    cle: "etude-doctrine",
    nom: "Étude critique d'une doctrine",
    description: "La doctrine exposée fidèlement avec ses sources, puis examinée.",
    contenu: {
      type: "doc",
      content: [
        h(2, "La doctrine telle que l'exposent ses défenseurs"),
        encadre("citation-adverse", p("Cite ici la formulation officielle de la doctrine, avec sa source.")),
        source(),
        h(2, "Examen"),
        {
          type: "comparaison",
          content: [
            { type: "colonne", content: [{ type: "heading", attrs: { level: 4 }, content: t("Ce que dit le texte") }, p()] },
            { type: "colonne", content: [{ type: "heading", attrs: { level: 4 }, content: t("Ce qu'en dit l'adversaire") }, p()] },
          ],
        },
        p("Développe l'examen critique."),
        h(2, "Conclusion"),
        encadre("conclusion", p("Résume les conclusions de l'examen.")),
      ],
    },
  },
  {
    cle: "fiche-debat",
    nom: "Fiche de débat express",
    description: "Une fiche courte à consulter en quelques secondes pendant une discussion.",
    contenu: {
      type: "doc",
      content: [
        encadre("a-retenir", liste(false, "Premier argument clé.", "Deuxième argument clé.", "Troisième argument clé.")),
        {
          type: "objectionReponse",
          content: [
            { type: "objection", content: [p("L'objection, en une phrase.")] },
            { type: "reponse", content: [p("La réponse, en deux ou trois phrases.")] },
          ],
        },
        { type: "accordeon", content: [{ type: "accordeonTitre", content: t("Pour aller plus loin") }, { type: "accordeonCorps", content: [p("Détails, références, nuances.")] }] },
      ],
    },
  },
];
