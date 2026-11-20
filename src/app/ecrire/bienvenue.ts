/**
 * Le Calame — le document de bienvenue : une page qui montre, en vrai, ce que sait
 * faire l'atelier. Il remplace la page blanche du tout premier document, et se rouvre
 * depuis l'aide (une copie neuve à chaque fois).
 */

type N = { type: string; attrs?: Record<string, unknown>; content?: N[]; text?: string; marks?: { type: string; attrs?: Record<string, unknown> }[] };

const t = (text: string, marks?: N["marks"]): N => ({ type: "text", text, ...(marks ? { marks } : {}) });
const p = (...contenu: (string | N)[]): N => ({ type: "paragraph", content: contenu.map((c) => (typeof c === "string" ? t(c) : c)) });
const h = (niveau: 2 | 3 | 4, texte: string): N => ({ type: "heading", attrs: { level: niveau }, content: [t(texte)] });
const gras = (texte: string) => t(texte, [{ type: "bold" }]);
const italique = (texte: string) => t(texte, [{ type: "italic" }]);
const liste = (...items: (string | N)[][]): N => ({ type: "bulletList", content: items.map((i) => ({ type: "listItem", content: [p(...i)] })) });
const cases = (...items: [string, boolean][]): N => ({ type: "taskList", content: items.map(([texte, coche]) => ({ type: "taskItem", attrs: { checked: coche }, content: [p(texte)] })) });

export function documentDeBienvenue(): N {
  return {
    type: "doc",
    content: [
      p(
        "Bienvenue dans le Calame, ton atelier d'écriture. Ce document est le tien : modifie-le, efface-le, ou garde-le comme aide-mémoire. Tape ",
        gras("Ctrl + K"),
        " pour tout faire au clavier, et ",
        gras("F1"),
        " pour la liste des raccourcis.",
      ),
      { type: "sommaire", attrs: { titre: "", profondeur: 4 } },
      h(2, "Écrire comme sur du papier"),
      p("Ce que tu vois est exactement ce qui sortira de l'imprimante : la page, les marges, les en-têtes et les numéros. Change le format et les marges dans l'onglet « Page » de la colonne de droite, et les polices dans « Styles » : tout le document suit d'un coup."),
      p(
        "Pendant la frappe, la typographie française se règle toute seule : « des guillemets », des espaces fines avant ; ! ? et l’apostrophe typographique. Écris « saws » suivi d’une espace : cela donne ﷺ. Les formules de respect et les lettres de translittération (ā, ḥ, ʿ) sont aussi dans ",
        gras("Ctrl + Maj + C"),
        ".",
      ),
      h(3, "Des blocs pour argumenter"),
      p("Tape « / » au début d'une ligne pour insérer un bloc : verset, hadith, source, objection et réponse, frise chronologique, carte mentale, tableau, formule…"),
      {
        type: "verset",
        attrs: { reference: "Al-ʿAlaq (96), 1" },
        content: [
          { type: "versetArabe", content: [t("اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ")] },
          { type: "versetTraduction", content: [t("Lis, au nom de ton Seigneur qui a créé.")] },
        ],
      },
      p("Un paragraphe qui commence en arabe s'écrit de droite à gauche, sans rien régler :"),
      p("الحمد لله رب العالمين"),
      {
        type: "objectionReponse",
        content: [
          { type: "objection", content: [p("On dit parfois que l'écriture soignée prend trop de temps.")] },
          { type: "reponse", content: [p("Le Calame s'occupe de la mise en page : il ne te reste qu'à penser et à écrire.")] },
        ],
      },
      h(2, "Retrouver, relire, ne rien perdre"),
      liste(
        [gras("Ctrl + F"), " cherche dans le texte (sans se soucier des accents), ", gras("Ctrl + H"), " remplace."],
        ["L'onglet « Relire » signale les répétitions, les phrases trop longues, les mots faibles, et peut lire ton texte à voix haute."],
        ["L'onglet « Versions » garde l'historique : compare deux états mot à mot, et reviens en arrière quand tu veux."],
        ["Dans la colonne de gauche : dossiers, étiquettes, recherche dans tous tes documents, corbeille de 30 jours."],
      ),
      {
        type: "encadre",
        attrs: { type: "remarque" },
        content: [p(italique("Astuce : "), "le plan (colonne de gauche) se réorganise en glissant les titres ; toute la partie suit.")],
      },
      h(2, "Ta liste pour commencer"),
      cases(["Donner un titre à ce document", false], ["Essayer « / » pour insérer un bloc", false], ["Ouvrir la barre de commande avec Ctrl + K", false], ["Écrire la première page de ton propre texte", false]),
      {
        type: "table",
        content: [
          { type: "tableRow", content: [{ type: "tableHeader", content: [p("Pour…")] }, { type: "tableHeader", content: [p("Fais…")] }] },
          { type: "tableRow", content: [{ type: "tableCell", content: [p("Imprimer ou enregistrer en PDF")] }, { type: "tableCell", content: [p("Ctrl + P")] }] },
          { type: "tableRow", content: [{ type: "tableCell", content: [p("Un fichier Word")] }, { type: "tableCell", content: [p("Onglet « Sortie »")] }] },
          { type: "tableRow", content: [{ type: "tableCell", content: [p("Écrire sans distraction")] }, { type: "tableCell", content: [p("Ctrl + Maj + F")] }] },
        ],
      },
      p("Bonne écriture."),
    ],
  };
}
