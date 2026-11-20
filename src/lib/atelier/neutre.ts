/**
 * Le Calame — un document « neutre » pour les sorties (Word, Markdown, EPUB, HTML, texte).
 *
 * Les blocs propres à l'atelier n'existent pas ailleurs : on les remplace, avant d'écrire
 * le fichier, par ce qui s'en rapproche le plus — une image pour ce qui se dessine
 * (schéma, frise, carte mentale, dessin, carte, formule, démonstration logique), du texte
 * pour ce qui se lit (bibliographie, index, glossaire, page de garde, carte de lien…).
 * Rien ne se perd en route : un bloc qu'on ne sait pas dessiner garde au moins son nom.
 *
 * Module pur : le navigateur prépare les images et les listes, ce module ne fait que réécrire.
 */

import type { Morceau } from "./bibliotheque";

export type Noeud = { type?: string; text?: string; content?: Noeud[]; attrs?: Record<string, unknown>; marks?: { type: string; attrs?: Record<string, unknown> }[] };

/** Les blocs qui se dessinent : à l'export, une image prise à l'écran les remplace. */
export const TYPES_DESSINES = new Set(["schema", "logique", "frise", "dessin", "carteGeo", "formule"]);

export type DonneesNeutre = {
  /** L'image (fichier joint ou image préparée) du k-ième bloc dessiné, dans l'ordre du document. */
  imageDuBloc?: (ordinal: number) => { fichier: string; alt: string; legende?: string } | null;
  /** Les entrées de la bibliographie, déjà mises en forme. */
  bibliographie?: (portee: "citees" | "toute") => Morceau[][];
  versets?: { libelle: string }[];
  hadiths?: { libelle: string }[];
  glossaire?: { entree: string; translitteration: string; sens: string }[];
  /** Numéroter les titres (1., 1.1., 1.1.1.) comme à l'écran. */
  numeroterTitres?: boolean;
  /** Pour Word : la table des matières, l'index et la table des figures restent des champs que Word remplit. */
  pourWord?: boolean;
  /** Le nom d'un sophisme d'après sa clé. */
  nomSophisme?: (cle: string) => string;
};

const texte = (t: string, marks?: Noeud["marks"]): Noeud => ({ type: "text", text: t, ...(marks && marks.length ? { marks } : {}) });
const para = (contenu: Noeud[], attrs?: Record<string, unknown>): Noeud => ({ type: "paragraph", ...(attrs ? { attrs } : {}), content: contenu.filter((n) => n.text !== "") });
const titre = (t: string, niveau = 2): Noeud => ({ type: "heading", attrs: { level: niveau }, content: [texte(t)] });

/** Le texte brut d'un nœud (pour les titres, les légendes, le texte seul). */
export function texteDe(n: Noeud | undefined): string {
  if (!n) return "";
  if (n.type === "text") return n.text ?? "";
  if (n.type === "hardBreak") return "\n";
  return (n.content ?? []).map(texteDe).join("");
}

function libelleDessin(n: Noeud): string {
  const a = n.attrs ?? {};
  switch (n.type) {
    case "schema": {
      let d = a.donnees as { titre?: string } | string | undefined;
      if (typeof d === "string") {
        try {
          d = JSON.parse(d) as { titre?: string };
        } catch {
          d = undefined;
        }
      }
      return (typeof d === "object" && d?.titre) || "Schéma";
    }
    case "logique":
      return "Démonstration logique";
    case "frise":
      return "Frise chronologique";
    case "dessin":
      return "Dessin";
    case "carteGeo":
      return String(a.titre || "Carte");
    case "formule":
      return "Formule";
    default:
      return "Illustration";
  }
}

/** Ce qui reste d'un bloc dessiné quand son image manque : la frise en texte, la formule en LaTeX, sinon son nom. */
function sansImage(n: Noeud): Noeud[] {
  if (n.type === "frise") {
    return (n.content ?? []).map((ev) => {
      const [date, ...reste] = ev.content ?? [];
      return para([texte(texteDe(date), [{ type: "bold" }]), texte(" — "), texte(reste.map(texteDe).join(" "))]);
    });
  }
  if (n.type === "formule") return [para([texte(String(n.attrs?.source ?? ""), [{ type: "code" }])], { textAlign: "center" })];
  return [para([texte(`[${libelleDessin(n)}]`, [{ type: "italic" }])])];
}

function enMarques(m: Morceau[]): Noeud[] {
  return m.filter((x) => x.texte).map((x) => texte(x.texte, x.italique ? [{ type: "italic" }] : undefined));
}

/** Réécrit le document pour une sortie hors de l'atelier. */
export function versNeutre(contenu: unknown, d: DonneesNeutre = {}): Noeud {
  const racine = (contenu ?? { type: "doc", content: [] }) as Noeud;
  let ordinal = 0;
  const compteurs = [0, 0, 0];

  const marques = (n: Noeud): Noeud => {
    if (!n.marks?.length) return n;
    // Les marques propres à l'atelier (glossaire, index, commentaire, style de caractère) ne voyagent pas : le texte reste.
    const gardees = n.marks.filter((m) => !["termeGlossaire", "commentaire", "styleCaractere"].includes(m.type) && !(m.type === "indexe" && !d.pourWord));
    return { ...n, marks: gardees };
  };

  const blocs = (noeuds: Noeud[] | undefined): Noeud[] => (noeuds ?? []).flatMap(bloc);

  const bloc = (n: Noeud): Noeud[] => {
    const a = n.attrs ?? {};
    if (n.type === "text") return [marques(n)];
    if (TYPES_DESSINES.has(n.type ?? "")) {
      const image = d.imageDuBloc?.(ordinal++) ?? null;
      if (!image) return sansImage(n);
      return [{ type: "image", attrs: { fichier: image.fichier, alt: image.alt || libelleDessin(n), legende: image.legende ?? (n.type === "carteGeo" ? String(a.titre ?? "") : ""), largeur: "pleine" } }];
    }
    switch (n.type) {
      case "heading": {
        const niveau = Math.min(4, Math.max(2, Number(a.level) || 2));
        const i = niveau - 2;
        compteurs[i]++;
        for (let j = i + 1; j < compteurs.length; j++) compteurs[j] = 0;
        const contenuTitre = blocs(n.content);
        if (!d.numeroterTitres) return [{ ...n, content: contenuTitre }];
        const numero = `${compteurs.slice(0, i + 1).map((c) => Math.max(1, c)).join(".")}. `;
        return [{ ...n, content: [texte(numero), ...contenuTitre] }];
      }
      case "bibliographie": {
        const entrees = d.bibliographie?.(a.portee === "toute" ? "toute" : "citees") ?? [];
        if (entrees.length === 0) return [];
        return [titre(String(a.titre || "Bibliographie")), ...entrees.map((e) => para(enMarques(e), { styleNomme: "bibliographie" }))];
      }
      case "indexSources": {
        const hadiths = a.genre === "hadiths";
        const liste = (hadiths ? d.hadiths : d.versets) ?? [];
        if (liste.length === 0) return [];
        return [titre(hadiths ? "Index des hadiths" : "Index des versets"), ...liste.map((e) => para([texte(e.libelle)]))];
      }
      case "glossaire": {
        const liste = d.glossaire ?? [];
        if (liste.length === 0) return [];
        return [
          titre(String(a.titre || "Glossaire")),
          ...liste.map((t) =>
            para([texte(t.entree, [{ type: "bold" }]), ...(t.translitteration && t.translitteration !== t.entree ? [texte(` (${t.translitteration})`, [{ type: "italic" }])] : []), ...(t.sens ? [texte(` : ${t.sens}`)] : [])]),
          ),
        ];
      }
      case "pageDeGarde": {
        const lignes: Noeud[] = [];
        if (a.etablissement) lignes.push(para([texte(String(a.etablissement))], { textAlign: "center" }));
        lignes.push(para([texte(String(a.titre || "Titre du document"), [{ type: "bold" }])], { textAlign: "center", styleNomme: "titre-garde" }));
        if (a.sousTitre) lignes.push(para([texte(String(a.sousTitre), [{ type: "italic" }])], { textAlign: "center" }));
        if (a.auteur) lignes.push(para([texte(String(a.auteur))], { textAlign: "center" }));
        if (a.direction) lignes.push(para([texte(String(a.direction))], { textAlign: "center" }));
        if (a.date) lignes.push(para([texte(String(a.date))], { textAlign: "center" }));
        return [...lignes, { type: "sautPage" }];
      }
      case "lienCarte": {
        const url = String(a.url ?? "");
        const titreLien = String(a.titre || url);
        const site = a.genre === "youtube" ? (a.auteur ? `${a.auteur} sur YouTube` : "YouTube") : String(a.site ?? "");
        return [
          para([texte(titreLien, url ? [{ type: "link", attrs: { href: url } }] : undefined), ...(site ? [texte(` — ${site}`)] : []), ...(a.description ? [texte(`. ${String(a.description)}`, [{ type: "italic" }])] : [])]),
        ];
      }
      case "source": {
        const morceaux = [a.auteur, a.ouvrage, a.edition, a.page ? `p. ${a.page}` : ""].filter(Boolean).join(", ");
        if (!morceaux && !a.lien) return [];
        return [para([texte("Source : ", [{ type: "bold" }]), texte(morceaux), ...(a.lien ? [texte(" "), texte(String(a.lien), [{ type: "link", attrs: { href: String(a.lien) } }])] : [])])];
      }
      case "sophisme": {
        const nom = d.nomSophisme?.(String(a.cle ?? "")) || String(a.cle ?? "");
        return [para([texte("Sophisme identifié : ", [{ type: "bold" }]), texte(nom)]), ...(a.commentaire ? [para([texte(String(a.commentaire), [{ type: "italic" }])])] : [])];
      }
      case "citationOuvrage":
      case "reference":
        // Liés à la bibliothèque partagée du site : sans elle, un repère suffit.
        return n.type === "reference" ? [texte(`[réf.${a.page ? ` p. ${a.page}` : ""}]`)] : [para([texte("[Citation d'un ouvrage]", [{ type: "italic" }])])];
      case "deuxColonnes":
      case "galerie":
        return blocs(n.content);
      case "sautSection":
        return d.pourWord ? [n] : [{ type: "sautPage" }];
      case "sommaire":
      case "indexAlpha":
      case "tableFigures":
        // Word les fabrique lui-même (champs) ; ailleurs, la table des matières est réécrite par chaque format.
        return d.pourWord || n.type === "sommaire" ? [n] : [];
      default:
        return n.content ? [{ ...n, content: blocs(n.content) }] : [marques(n)];
    }
  };

  return { ...racine, content: blocs(racine.content) };
}

/** Les titres du document neutre (pour une table des matières écrite à la main). */
export function titresDuNeutre(doc: Noeud): { niveau: number; texte: string; ordinal: number }[] {
  const titres: { niveau: number; texte: string; ordinal: number }[] = [];
  const visiter = (n: Noeud) => {
    if (n.type === "heading") titres.push({ niveau: Math.min(4, Math.max(2, Number(n.attrs?.level) || 2)), texte: texteDe(n).trim(), ordinal: titres.length + 1 });
    else (n.content ?? []).forEach(visiter);
  };
  visiter(doc);
  return titres;
}

/** Les notes de bas de page du document neutre, dans l'ordre. */
export function notesDuNeutre(doc: Noeud): string[] {
  const notes: string[] = [];
  const visiter = (n: Noeud) => {
    if (n.type === "note") notes.push(String(n.attrs?.texte ?? "").trim());
    (n.content ?? []).forEach(visiter);
  };
  visiter(doc);
  return notes;
}

/** Le texte seul, pour le format .txt : titres soulignés, listes à tirets, notes en fin de texte. */
export function enTexteBrut(doc: Noeud, titreDoc: string): string {
  let appel = 0;
  const notes: string[] = [];
  const ligne = (noeuds: Noeud[] | undefined): string =>
    (noeuds ?? [])
      .map((n) => {
        if (n.type === "text") return n.text ?? "";
        if (n.type === "hardBreak") return "\n";
        if (n.type === "note") {
          notes.push(String(n.attrs?.texte ?? "").trim());
          return `[${++appel}]`;
        }
        return ligne(n.content);
      })
      .join("");
  const blocs = (noeuds: Noeud[] | undefined, retrait = ""): string[] =>
    (noeuds ?? []).flatMap((n): string[] => {
      const a = n.attrs ?? {};
      switch (n.type) {
        case "heading": {
          const t = ligne(n.content).trim();
          const soulignement = Number(a.level) <= 2 ? "=" : "-";
          return [`${t}\n${soulignement.repeat(Math.min(72, Math.max(3, t.length)))}`];
        }
        case "paragraph":
          return [retrait + ligne(n.content)];
        case "bulletList":
        case "taskList":
        case "orderedList":
          return (n.content ?? []).map((item, i) => {
            const puce = n.type === "orderedList" ? `${i + 1}. ` : "- ";
            return blocs(item.content, retrait + "   ").join("\n").replace(/^\s*/, retrait + puce);
          });
        case "blockquote":
        case "encadre":
        case "objection":
        case "reponse":
          return [blocs(n.content, retrait + "    ").join("\n\n")];
        case "verset":
        case "hadith": {
          const legende = n.type === "verset" ? `Coran, ${a.reference || "référence à préciser"}` : [a.recueil, a.numero ? `n° ${a.numero}` : ""].filter(Boolean).join(", ");
          return [blocs(n.content, retrait + "    ").filter((t) => t.trim()).join("\n") + `\n${retrait}    (${legende})`];
        }
        case "table":
          return [(n.content ?? []).map((r) => (r.content ?? []).map((c) => ligne(c.content?.flatMap((p) => p.content ?? []))).join(" | ")).join("\n")];
        case "image":
          return a.legende ? [`[Image : ${a.legende}]`] : a.alt ? [`[Image : ${a.alt}]`] : ["[Image]"];
        case "horizontalRule":
          return ["* * *"];
        case "sautPage":
          return ["\f"];
        case "sommaire":
          return [];
        default:
          return n.content ? (n.content.some((c) => c.type === "text") ? [retrait + ligne(n.content)] : blocs(n.content, retrait)) : [];
      }
    });
  const corps = blocs(doc.content).filter((t) => t.trim() !== "" || t === "\f").join("\n\n");
  const fin = notes.length ? `\n\n----\nNotes\n\n${notes.map((t, i) => `[${i + 1}] ${t}`).join("\n")}` : "";
  return `${titreDoc.trim() ? `${titreDoc.trim()}\n${"=".repeat(Math.min(72, titreDoc.trim().length))}\n\n` : ""}${corps}${fin}\n`;
}
