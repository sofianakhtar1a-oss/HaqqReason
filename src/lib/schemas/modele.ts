/**
 * Atelier graphique : modèle des schémas enregistrés dans les articles (cartes mentales, cartes conceptuelles,
 * arbres argumentatifs, organigrammes, diagrammes de flux, de causalité, de classification, de dépendance,
 * diagrammes de Venn, graphiques statistiques, courbes de fonctions, matrices de comparaison).
 * Ce module est partagé entre l'éditeur, le serveur (nettoyage) et l'affichage.
 */

export const STYLES_GRAPHE = [
  { cle: "carte-mentale", libelle: "Carte mentale", aide: "Un sujet central et ses branches", disposition: "mentale" },
  { cle: "carte-conceptuelle", libelle: "Carte conceptuelle", aide: "Des concepts reliés par des liens nommés", disposition: "libre" },
  { cle: "arbre-argumentatif", libelle: "Arbre argumentatif", aide: "Thèse, prémisses, objections, réponses, conclusion", disposition: "verticale" },
  { cle: "organigramme", libelle: "Organigramme", aide: "Les étapes d'un raisonnement", disposition: "verticale" },
  { cle: "flux", libelle: "Diagramme de flux", aide: "Une démonstration étape par étape, avec des embranchements", disposition: "verticale" },
  { cle: "causalite", libelle: "Diagramme de causalité", aide: "Causes et effets", disposition: "horizontale" },
  { cle: "classification", libelle: "Classification", aide: "Les catégories d'un concept, hiérarchisées", disposition: "verticale" },
  { cle: "dependance", libelle: "Dépendance logique", aide: "Les prémisses nécessaires à une conclusion", disposition: "verticale" },
] as const;
export type StyleGraphe = (typeof STYLES_GRAPHE)[number]["cle"];

export const GENRES_SCHEMA = [
  { cle: "graphe", libelle: "Carte ou diagramme" },
  { cle: "venn", libelle: "Diagramme de Venn" },
  { cle: "statistique", libelle: "Graphique statistique" },
  { cle: "fonction", libelle: "Graphique mathématique" },
  { cle: "matrice", libelle: "Matrice de comparaison" },
] as const;
export type GenreSchema = (typeof GENRES_SCHEMA)[number]["cle"];

export const DISPOSITIONS = [
  { cle: "mentale", libelle: "Carte mentale (branches des deux côtés)" },
  { cle: "verticale", libelle: "Arbre de haut en bas" },
  { cle: "horizontale", libelle: "Arbre de gauche à droite" },
  { cle: "libre", libelle: "Libre (je place les éléments)" },
] as const;
export type Disposition = (typeof DISPOSITIONS)[number]["cle"];

export const FORMES = [
  { cle: "arrondi", libelle: "Arrondi" },
  { cle: "rectangle", libelle: "Rectangle" },
  { cle: "ellipse", libelle: "Ellipse" },
  { cle: "losange", libelle: "Losange (décision)" },
  { cle: "hexagone", libelle: "Hexagone" },
  { cle: "note", libelle: "Note" },
] as const;
export type Forme = (typeof FORMES)[number]["cle"];

export const TEINTES = [
  { cle: "or", libelle: "Or", hex: "#d9a645" },
  { cle: "emeraude", libelle: "Émeraude", hex: "#2fb48a" },
  { cle: "amethyste", libelle: "Améthyste", hex: "#8f78f0" },
  { cle: "bleu", libelle: "Bleu", hex: "#4a8fe0" },
  { cle: "rouge", libelle: "Rouge", hex: "#e05d5d" },
  { cle: "orange", libelle: "Orange", hex: "#e8893a" },
  { cle: "rose", libelle: "Rose", hex: "#e06aa8" },
  { cle: "turquoise", libelle: "Turquoise", hex: "#2bb5c2" },
  { cle: "gris", libelle: "Gris", hex: "#8a8fa8" },
] as const;
export type Teinte = (typeof TEINTES)[number]["cle"];
export const hexTeinte = (t: string) => TEINTES.find((x) => x.cle === t)?.hex ?? TEINTES[0].hex;

export const ROLES = [
  { cle: "", libelle: "Aucun", teinte: "gris" },
  { cle: "these", libelle: "Thèse", teinte: "or" },
  { cle: "premisse", libelle: "Prémisse", teinte: "bleu" },
  { cle: "preuve", libelle: "Preuve, source", teinte: "turquoise" },
  { cle: "objection", libelle: "Objection", teinte: "rouge" },
  { cle: "reponse", libelle: "Réponse", teinte: "emeraude" },
  { cle: "conclusion", libelle: "Conclusion", teinte: "amethyste" },
  { cle: "cause", libelle: "Cause", teinte: "orange" },
  { cle: "effet", libelle: "Effet", teinte: "rose" },
] as const;
export type Role = (typeof ROLES)[number]["cle"];

export const STYLES_TRAIT = ["plein", "tirets", "pointille"] as const;
export const NATURES_LIEN = [
  { cle: "", libelle: "Neutre" },
  { cle: "soutient", libelle: "Soutient" },
  { cle: "conteste", libelle: "Conteste" },
  { cle: "cause", libelle: "Cause" },
] as const;

export type NoeudSchema = {
  id: string;
  texte: string;
  x: number;
  y: number;
  forme: Forme;
  teinte: Teinte;
  role: Role;
  article: string;
  lien: string;
  commentaire: string;
  replie: boolean;
};
export type LienSchema = { id: string; de: string; vers: string; texte: string; trait: (typeof STYLES_TRAIT)[number]; fleche: boolean; nature: (typeof NATURES_LIEN)[number]["cle"] };

export type SerieStat = { nom: string; teinte: Teinte; valeurs: number[] };

export type DonneesSchema = {
  genre: GenreSchema;
  titre: string;
  // graphe
  style: StyleGraphe;
  disposition: Disposition;
  noeuds: NoeudSchema[];
  liens: LienSchema[];
  // venn
  ensembles: { nom: string; teinte: Teinte }[];
  zones: Record<string, string>;
  // statistique
  typeStat: "barres" | "courbe" | "secteurs" | "nuage";
  etiquettes: string[];
  series: SerieStat[];
  titreX: string;
  titreY: string;
  // fonction
  fonctions: { expression: string; teinte: Teinte }[];
  fenetre: { xmin: number; xmax: number; ymin: number; ymax: number };
  // matrice
  criteres: string[];
  positions: string[];
  cellules: { valeur: "oui" | "non" | "partiel" | "inconnu" | ""; note: string }[][];
};

export const LIMITES_SCHEMA = { noeuds: 300, liens: 600, texte: 500, series: 8, points: 60, criteres: 25, positions: 8, fonctions: 6 } as const;
export const ZONES_VENN = ["A", "B", "C", "AB", "AC", "BC", "ABC"] as const;

let compteurId = 0;
export const nouvelId = () => `n${Date.now().toString(36)}${(compteurId++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function noeud(texte: string, x = 0, y = 0, extra: Partial<NoeudSchema> = {}): NoeudSchema {
  return { id: nouvelId(), texte, x, y, forme: "arrondi", teinte: "or", role: "", article: "", lien: "", commentaire: "", replie: false, ...extra };
}
export function lien(de: string, vers: string, extra: Partial<LienSchema> = {}): LienSchema {
  return { id: nouvelId(), de, vers, texte: "", trait: "plein", fleche: true, nature: "", ...extra };
}

const BASE: Omit<DonneesSchema, "genre"> = {
  titre: "",
  style: "carte-mentale",
  disposition: "mentale",
  noeuds: [],
  liens: [],
  ensembles: [
    { nom: "Ensemble A", teinte: "or" },
    { nom: "Ensemble B", teinte: "bleu" },
  ],
  zones: {},
  typeStat: "barres",
  etiquettes: ["Premier", "Deuxième", "Troisième"],
  series: [{ nom: "Série 1", teinte: "or", valeurs: [3, 5, 2] }],
  titreX: "",
  titreY: "",
  fonctions: [{ expression: "x^2", teinte: "or" }],
  fenetre: { xmin: -5, xmax: 5, ymin: -5, ymax: 5 },
  criteres: ["Critère 1", "Critère 2"],
  positions: ["Position A", "Position B"],
  cellules: [
    [
      { valeur: "", note: "" },
      { valeur: "", note: "" },
    ],
    [
      { valeur: "", note: "" },
      { valeur: "", note: "" },
    ],
  ],
};

/** Schéma de départ pour chaque type (avec un petit exemple à remplacer). */
export function schemaParDefaut(genre: GenreSchema, style: StyleGraphe = "carte-mentale"): DonneesSchema {
  const d: DonneesSchema = { ...structuredClone(BASE), genre, style, disposition: STYLES_GRAPHE.find((s) => s.cle === style)?.disposition ?? "mentale" };
  if (genre !== "graphe") return d;
  const ajouter = (texte: string, extra: Partial<NoeudSchema> = {}) => {
    const n = noeud(texte, 0, 0, extra);
    d.noeuds.push(n);
    return n;
  };
  const relier = (a: NoeudSchema, b: NoeudSchema, extra: Partial<LienSchema> = {}) => d.liens.push(lien(a.id, b.id, extra));
  switch (style) {
    case "carte-mentale": {
      const centre = ajouter("Sujet central", { forme: "ellipse" });
      ["Première idée", "Deuxième idée", "Troisième idée", "Quatrième idée"].forEach((t, i) => relier(centre, ajouter(t, { teinte: (["bleu", "emeraude", "amethyste", "orange"] as const)[i] }), { fleche: false }));
      break;
    }
    case "arbre-argumentatif": {
      const these = ajouter("Thèse défendue", { role: "these", teinte: "or" });
      const p1 = ajouter("Première prémisse", { role: "premisse", teinte: "bleu" });
      const p2 = ajouter("Deuxième prémisse", { role: "premisse", teinte: "bleu" });
      const o = ajouter("Objection", { role: "objection", teinte: "rouge" });
      const r = ajouter("Réponse à l'objection", { role: "reponse", teinte: "emeraude" });
      relier(these, p1, { nature: "soutient", texte: "soutient" });
      relier(these, p2, { nature: "soutient", texte: "soutient" });
      relier(p2, o, { nature: "conteste", texte: "conteste", trait: "tirets" });
      relier(o, r, { nature: "conteste", texte: "réfute", trait: "tirets" });
      break;
    }
    case "organigramme":
    case "flux": {
      const a = ajouter("Point de départ", { forme: "ellipse", teinte: "emeraude" });
      const b = ajouter("Étape", { forme: "rectangle", teinte: "bleu" });
      const c = ajouter("Question ?", { forme: "losange", teinte: "orange" });
      const oui = ajouter("Si oui", { forme: "rectangle", teinte: "bleu" });
      const non = ajouter("Si non", { forme: "rectangle", teinte: "bleu" });
      relier(a, b);
      relier(b, c);
      relier(c, oui, { texte: "oui" });
      relier(c, non, { texte: "non" });
      break;
    }
    case "causalite": {
      const c1 = ajouter("Cause", { role: "cause", teinte: "orange" });
      const c2 = ajouter("Autre cause", { role: "cause", teinte: "orange" });
      const e = ajouter("Effet", { role: "effet", teinte: "rose" });
      relier(c1, e, { nature: "cause", texte: "entraîne" });
      relier(c2, e, { nature: "cause", texte: "entraîne" });
      break;
    }
    case "classification": {
      const r = ajouter("Concept", { forme: "rectangle", teinte: "or" });
      ["Catégorie 1", "Catégorie 2", "Catégorie 3"].forEach((t) => relier(r, ajouter(t, { forme: "rectangle", teinte: "bleu" }), { fleche: false }));
      break;
    }
    case "dependance": {
      const c = ajouter("Conclusion", { role: "conclusion", teinte: "amethyste" });
      relier(c, ajouter("Prémisse nécessaire 1", { role: "premisse", teinte: "bleu" }), { texte: "repose sur" });
      relier(c, ajouter("Prémisse nécessaire 2", { role: "premisse", teinte: "bleu" }), { texte: "repose sur" });
      break;
    }
    case "carte-conceptuelle": {
      const a = ajouter("Concept A", { x: -220, y: 0 });
      const b = ajouter("Concept B", { x: 220, y: -90, teinte: "bleu" });
      const c = ajouter("Concept C", { x: 220, y: 110, teinte: "emeraude" });
      relier(a, b, { texte: "implique" });
      relier(a, c, { texte: "s'oppose à", trait: "tirets" });
      break;
    }
  }
  return d;
}

// ----------------------------------------------------------------------
// Nettoyage strict (serveur)
// ----------------------------------------------------------------------

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max) : "");
const num = (v: unknown, min: number, max: number, defaut: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : defaut);
const parmi = <T extends string>(v: unknown, liste: readonly T[], defaut: T): T => (liste.includes(v as T) ? (v as T) : defaut);
const objet = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const tableau = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const cles = <T extends readonly { cle: string }[]>(l: T) => l.map((x) => x.cle) as T[number]["cle"][];
const lienWeb = (v: unknown) => {
  if (typeof v !== "string" || !v.trim()) return "";
  try {
    const u = new URL(v.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.href.slice(0, 2000) : "";
  } catch {
    return "";
  }
};
const idSur = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : "");

export function nettoyerSchema(brut: unknown): DonneesSchema {
  const d = objet(brut);
  const genre = parmi(d.genre, cles(GENRES_SCHEMA), "graphe");
  const style = parmi(d.style, cles(STYLES_GRAPHE), "carte-mentale");
  const noeuds: NoeudSchema[] = [];
  const vus = new Set<string>();
  for (const n of tableau(d.noeuds, LIMITES_SCHEMA.noeuds)) {
    const x = objet(n);
    const id = idSur(x.id);
    if (!id || vus.has(id)) continue;
    vus.add(id);
    noeuds.push({
      id,
      texte: txt(x.texte, LIMITES_SCHEMA.texte),
      x: num(x.x, -20000, 20000, 0),
      y: num(x.y, -20000, 20000, 0),
      forme: parmi(x.forme, cles(FORMES), "arrondi"),
      teinte: parmi(x.teinte, cles(TEINTES), "or"),
      role: parmi(x.role, cles(ROLES), ""),
      article: typeof x.article === "string" && UUID.test(x.article) ? x.article.toLowerCase() : "",
      lien: lienWeb(x.lien),
      commentaire: txt(x.commentaire, 1000),
      replie: x.replie === true,
    });
  }
  const liens: LienSchema[] = [];
  const idsLiens = new Set<string>();
  for (const l of tableau(d.liens, LIMITES_SCHEMA.liens)) {
    const x = objet(l);
    const id = idSur(x.id);
    const de = idSur(x.de);
    const vers = idSur(x.vers);
    if (!id || idsLiens.has(id) || !vus.has(de) || !vus.has(vers) || de === vers) continue;
    idsLiens.add(id);
    liens.push({ id, de, vers, texte: txt(x.texte, 200), trait: parmi(x.trait, STYLES_TRAIT, "plein"), fleche: x.fleche !== false, nature: parmi(x.nature, cles(NATURES_LIEN), "") });
  }
  const zonesBrutes = objet(d.zones);
  const zones: Record<string, string> = {};
  for (const z of ZONES_VENN) if (typeof zonesBrutes[z] === "string") zones[z] = txt(zonesBrutes[z], 300);
  const etiquettes = tableau(d.etiquettes, LIMITES_SCHEMA.points).map((e) => txt(e, 60));
  const series = tableau(d.series, LIMITES_SCHEMA.series).map((s) => {
    const x = objet(s);
    return { nom: txt(x.nom, 60), teinte: parmi(x.teinte, cles(TEINTES), "or"), valeurs: tableau(x.valeurs, LIMITES_SCHEMA.points).map((v) => num(v, -1e12, 1e12, 0)) };
  });
  const f = objet(d.fenetre);
  let xmin = num(f.xmin, -1e6, 1e6, -5);
  let xmax = num(f.xmax, -1e6, 1e6, 5);
  let ymin = num(f.ymin, -1e6, 1e6, -5);
  let ymax = num(f.ymax, -1e6, 1e6, 5);
  if (xmax <= xmin) [xmin, xmax] = [-5, 5];
  if (ymax <= ymin) [ymin, ymax] = [-5, 5];
  const criteres = tableau(d.criteres, LIMITES_SCHEMA.criteres).map((c) => txt(c, 160));
  const positions = tableau(d.positions, LIMITES_SCHEMA.positions).map((c) => txt(c, 120));
  const cellules = criteres.map((_, i) =>
    positions.map((__, j) => {
      const c = objet(tableau(tableau(d.cellules, LIMITES_SCHEMA.criteres)[i], LIMITES_SCHEMA.positions)[j]);
      return { valeur: parmi(c.valeur, ["oui", "non", "partiel", "inconnu", ""] as const, ""), note: txt(c.note, 300) };
    }),
  );
  return {
    genre,
    titre: txt(d.titre, 200),
    style,
    disposition: parmi(d.disposition, cles(DISPOSITIONS), "mentale"),
    noeuds,
    liens,
    ensembles: tableau(d.ensembles, 3)
      .map((e) => ({ nom: txt(objet(e).nom, 80), teinte: parmi(objet(e).teinte, cles(TEINTES), "or") }))
      .concat(tableau(d.ensembles, 3).length < 2 ? [{ nom: "B", teinte: "bleu" as Teinte }] : [])
      .slice(0, 3),
    zones,
    typeStat: parmi(d.typeStat, ["barres", "courbe", "secteurs", "nuage"] as const, "barres"),
    etiquettes,
    series,
    titreX: txt(d.titreX, 80),
    titreY: txt(d.titreY, 80),
    fonctions: tableau(d.fonctions, LIMITES_SCHEMA.fonctions).map((x) => ({ expression: txt(objet(x).expression, 200), teinte: parmi(objet(x).teinte, cles(TEINTES), "or") })),
    fenetre: { xmin, xmax, ymin, ymax },
    criteres,
    positions,
    cellules,
  };
}

/** Texte du schéma (pour la recherche et le temps de lecture). */
export function texteSchema(d: DonneesSchema): string {
  const morceaux: string[] = [d.titre];
  if (d.genre === "graphe") morceaux.push(...d.noeuds.map((n) => `${n.texte} ${n.commentaire}`), ...d.liens.map((l) => l.texte));
  if (d.genre === "venn") morceaux.push(...d.ensembles.map((e) => e.nom), ...Object.values(d.zones));
  if (d.genre === "statistique") morceaux.push(d.titreX, d.titreY, ...d.etiquettes, ...d.series.map((s) => s.nom));
  if (d.genre === "matrice") morceaux.push(...d.criteres, ...d.positions, ...d.cellules.flat().map((c) => c.note));
  return morceaux.filter(Boolean).join(" ");
}
