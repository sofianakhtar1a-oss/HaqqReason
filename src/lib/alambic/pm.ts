/*
 * Le modèle intermédiaire des documents : le JSON de l'éditeur (ProseMirror), le même que Le Calame.
 * Tous les lecteurs y mènent, tous les écrivains en partent. Pur.
 */

export type Noeud = { type: string; attrs?: Record<string, unknown>; content?: Noeud[]; text?: string; marks?: { type: string; attrs?: Record<string, unknown> }[] };

export type Morceau = {
  texte: string;
  gras: boolean;
  italique: boolean;
  souligne: boolean;
  barre: boolean;
  exposant: boolean;
  indice: boolean;
  lien: string | null;
  /** Retour à la ligne forcé (et non du texte). */
  saut?: boolean;
};

/** Le texte d'un bloc, découpé en morceaux de même mise en forme. */
export function morceaux(noeud: Noeud): Morceau[] {
  const sortie: Morceau[] = [];
  const marquer = (n: Noeud) => {
    const m = new Set((n.marks ?? []).map((x) => x.type));
    const lien = (n.marks ?? []).find((x) => x.type === "link")?.attrs?.href;
    return {
      gras: m.has("bold"),
      italique: m.has("italic"),
      souligne: m.has("souligne") || m.has("underline"),
      barre: m.has("strike"),
      exposant: m.has("superscript"),
      indice: m.has("subscript"),
      lien: typeof lien === "string" ? lien : null,
    };
  };
  const parcourir = (n: Noeud) => {
    if (n.type === "text") sortie.push({ texte: n.text ?? "", ...marquer(n) });
    else if (n.type === "hardBreak") sortie.push({ texte: "\n", gras: false, italique: false, souligne: false, barre: false, exposant: false, indice: false, lien: null, saut: true });
    else if (n.type === "note") sortie.push({ texte: ` (${String(n.attrs?.texte ?? "")})`, gras: false, italique: false, souligne: false, barre: false, exposant: false, indice: false, lien: null });
    else for (const e of n.content ?? []) parcourir(e);
  };
  for (const e of noeud.content ?? []) parcourir(e);
  return sortie;
}

export function texteDe(noeud: Noeud): string {
  if (noeud.type === "text") return noeud.text ?? "";
  if (noeud.type === "hardBreak") return "\n";
  return (noeud.content ?? []).map(texteDe).join(noeud.type === "tableRow" ? "\t" : "");
}

/** Niveau de titre affiché (1 à 3) : l'éditeur range les titres aux niveaux 2 à 4. */
export function niveauTitre(n: Noeud): 1 | 2 | 3 {
  const l = Number(n.attrs?.level ?? 2);
  return (Math.min(3, Math.max(1, l - 1)) as 1 | 2 | 3);
}

/** Les lignes d'un tableau : cellules en blocs, et indication des cellules d'en-tête. */
export function lignesDuTableau(table: Noeud): { entete: boolean; cellules: Noeud[] }[] {
  return (table.content ?? [])
    .filter((r) => r.type === "tableRow")
    .map((r) => {
      const cellules = (r.content ?? []).filter((c) => c.type === "tableCell" || c.type === "tableHeader");
      return { entete: cellules.length > 0 && cellules.every((c) => c.type === "tableHeader"), cellules };
    });
}

export function echapperXml(t: string): string {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Caractères de contrôle interdits en XML 1.0 (sauf tabulation et retours).
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
}

/** Un document de l'éditeur fait d'un seul tableau par feuille (données → documents). */
export function documentDeTableaux(feuilles: { nom: string; colonnes: string[]; lignes: unknown[][] }[]): Noeud {
  const cellule = (type: "tableHeader" | "tableCell", v: unknown): Noeud => ({
    type,
    content: [{ type: "paragraph", content: v === null || v === undefined || v === "" ? [] : [{ type: "text", text: String(v) }] }],
  });
  const content: Noeud[] = [];
  for (const f of feuilles) {
    if (feuilles.length > 1) content.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: f.nom }] });
    content.push({
      type: "table",
      content: [
        { type: "tableRow", content: f.colonnes.map((c) => cellule("tableHeader", c)) },
        ...f.lignes.map((l) => ({ type: "tableRow", content: f.colonnes.map((_, i) => cellule("tableCell", l[i])) })),
      ],
    });
  }
  return { type: "doc", content };
}
