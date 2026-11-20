/**
 * Le Calame — export Markdown.
 *
 * Parcourt le document ProseMirror et en écrit le texte structuré. Les blocs
 * propres à la bibliothèque (verset, hadith, encadré, frise, schéma) n'ont pas
 * d'équivalent en Markdown : ils sont rendus par la construction la plus proche,
 * avec leur étiquette, pour que rien ne se perde en route.
 *
 * Module pur : aucune dépendance au navigateur, donc testable au banc d'essai.
 */

type Noeud = { type?: string; text?: string; content?: Noeud[]; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[] };

/** Options de l'export : où trouver les images jointes (archive .zip), et les notes rassemblées en fin de texte. */
export type OptionsMarkdown = {
  /** Le chemin, dans l'archive, de l'image d'un fichier joint (null : l'image n'est pas jointe). */
  cheminImage?: (fichier: string) => string | null;
};

/** Le travail en cours : les notes de bas de page rencontrées, dans l'ordre. */
let enCours: { notes: string[]; options: OptionsMarkdown } = { notes: [], options: {} };

const ECHAPPER = /([\\`*_[\]])/g;

function texteAvecMarques(noeud: Noeud): string {
  let sortie = (noeud.text ?? "").replace(ECHAPPER, "\\$1");
  for (const marque of noeud.marks ?? []) {
    switch (marque.type) {
      case "bold":
        sortie = `**${sortie}**`;
        break;
      case "italic":
        sortie = `*${sortie}*`;
        break;
      case "strike":
        sortie = `~~${sortie}~~`;
        break;
      case "code":
        sortie = `\`${sortie}\``;
        break;
      case "link": {
        const href = String(marque.attrs?.href ?? "");
        sortie = href ? `[${sortie}](${href})` : sortie;
        break;
      }
      default:
        break;
    }
  }
  return sortie;
}

function enLigne(noeuds: Noeud[] | undefined): string {
  return (noeuds ?? [])
    .map((n) => {
      if (n.type === "text") return texteAvecMarques(n);
      if (n.type === "hardBreak") return "  \n";
      // Une note de bas de page : l'appel [^n], et le texte rassemblé à la fin du document.
      if (n.type === "note") {
        enCours.notes.push(String(n.attrs?.texte ?? "").replace(/\s+/g, " ").trim() || "…");
        return `[^${enCours.notes.length}]`;
      }
      return enLigne(n.content);
    })
    .join("");
}

function prefixer(texte: string, prefixe: string): string {
  return texte
    .split("\n")
    .map((ligne) => (ligne ? `${prefixe}${ligne}` : prefixe.trimEnd()))
    .join("\n");
}

function tableau(noeud: Noeud): string {
  const lignes = (noeud.content ?? []).map((ligne) => (ligne.content ?? []).map((cellule) => enLigne(cellule.content).replace(/\n+/g, " ").trim()));
  if (lignes.length === 0) return "";
  const colonnes = Math.max(...lignes.map((l) => l.length));
  const normalisee = lignes.map((l) => [...l, ...Array(colonnes - l.length).fill("")]);
  const [entete, ...corps] = normalisee;
  return [`| ${entete.join(" | ")} |`, `| ${Array(colonnes).fill("---").join(" | ")} |`, ...corps.map((l) => `| ${l.join(" | ")} |`)].join("\n");
}

function liste(noeud: Noeud, ordonnee: boolean, profondeur: number): string {
  return (noeud.content ?? [])
    .map((item, i) => {
      const marque = ordonnee ? `${i + 1}. ` : item.type === "taskItem" ? `- [${item.attrs?.checked ? "x" : " "}] ` : "- ";
      const dedans = bloc(item.content ?? [], profondeur + 1).trim();
      const [premiere, ...suite] = dedans.split("\n");
      const retrait = " ".repeat(marque.length);
      return [`${"  ".repeat(profondeur)}${marque}${premiere}`, ...suite.map((l) => `${"  ".repeat(profondeur)}${retrait}${l}`)].join("\n");
    })
    .join("\n");
}

function etiquette(noeud: Noeud): string {
  const a = noeud.attrs ?? {};
  switch (noeud.type) {
    case "verset":
      return a.reference ? `Coran — ${a.reference}` : "Coran";
    case "hadith":
      return [a.recueil, a.numero].filter(Boolean).join(" ") || "Hadith";
    case "encadre":
      return String(a.type ?? "encadré").replace(/-/g, " ");
    case "objection":
      return "Objection";
    case "reponse":
      return "Réponse";
    default:
      return "";
  }
}

function unBloc(noeud: Noeud, profondeur: number): string {
  const a = noeud.attrs ?? {};
  switch (noeud.type) {
    case "heading": {
      const niveau = Math.min(6, Math.max(1, Number(a.level ?? 2)));
      return `${"#".repeat(niveau)} ${enLigne(noeud.content)}`;
    }
    case "paragraph":
      return enLigne(noeud.content);
    case "bulletList":
      return liste(noeud, false, profondeur);
    case "orderedList":
      return liste(noeud, true, profondeur);
    case "taskList":
      return liste(noeud, false, profondeur);
    case "blockquote":
      return prefixer(bloc(noeud.content ?? [], profondeur), "> ");
    case "horizontalRule":
      return "---";
    case "codeBlock":
      return `\`\`\`\n${enLigne(noeud.content)}\n\`\`\``;
    case "table":
      return tableau(noeud);
    case "image": {
      const chemin = enCours.options.cheminImage?.(String(a.fichier ?? ""));
      return `![${String(a.alt ?? a.legende ?? "")}](${chemin ?? String(a.fichier ?? "")})${a.legende ? `\n*${a.legende}*` : ""}`;
    }
    case "documentPdf":
      return `> **Document PDF** — ${String(a.nom ?? "document")}`;
    case "verset":
    case "hadith":
    case "encadre":
    case "objection":
    case "reponse": {
      const titre = etiquette(noeud);
      const dedans = bloc(noeud.content ?? [], profondeur);
      return prefixer(titre ? `**${titre}**\n\n${dedans}` : dedans, "> ");
    }
    case "evenement": {
      const dedans = bloc(noeud.content ?? [], profondeur).replace(/\n+/g, " ").trim();
      return `- ${dedans}`;
    }
    case "frise":
      return bloc(noeud.content ?? [], profondeur);
    case "sommaire":
      return `<!-- Table des matières -->`;
    case "schema":
      return `<!-- Schéma : ${String((a.donnees as { titre?: string } | undefined)?.titre ?? "carte")} -->`;
    case "logique":
      return `<!-- Démonstration logique -->`;
    case "sautPage":
      return `<!-- Saut de page -->`;
    default:
      return bloc(noeud.content ?? [], profondeur);
  }
}

function bloc(noeuds: Noeud[], profondeur: number): string {
  return noeuds
    .map((n) => unBloc(n, profondeur))
    .filter((t) => t.trim() !== "")
    .join("\n\n");
}

/** Document complet en Markdown, titre compris (les notes de bas de page à la fin). */
export function enMarkdown(contenu: unknown, titre: string, options: OptionsMarkdown = {}): string {
  const racine = (contenu ?? {}) as Noeud;
  const avant = enCours;
  enCours = { notes: [], options };
  try {
    const corps = bloc(racine.content ?? [], 0);
    const notes = enCours.notes.length ? `\n\n${enCours.notes.map((t, i) => `[^${i + 1}]: ${t}`).join("\n")}` : "";
    return titre.trim() ? `# ${titre}\n\n${corps}${notes}\n` : `${corps}${notes}\n`;
  } finally {
    enCours = avant;
  }
}
