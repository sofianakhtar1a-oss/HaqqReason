/**
 * Format des articles : liste blanche de tout ce qu'un document peut contenir.
 *
 * Ce fichier sert à trois endroits :
 * - l'éditeur (menus et options proposés) ;
 * - le serveur, qui NETTOIE chaque document avant de l'enregistrer ;
 * - le lecteur, qui n'affiche que ce qui figure ici.
 * Tout ce qui n'est pas listé ici est ignoré : c'est la principale protection contre l'injection de code.
 *
 * Il ne dépend que de modules sans dépendance (schémas, logique, sophismes) : il est partagé entre le serveur et le navigateur.
 */
import { analyserLogique, nettoyerLogique, texteLogique, type DonneesLogique } from "./logique/bloc";
import { nettoyerSchema, texteSchema, type DonneesSchema } from "./schemas/modele";
import { SOPHISMES, sophismeParCle } from "./sophismes";

// ----------------------------------------------------------------------
// Listes de valeurs
// ----------------------------------------------------------------------

export const COULEURS = [
  { cle: "jaune", libelle: "Jaune" },
  { cle: "bleu", libelle: "Bleu" },
  { cle: "vert", libelle: "Vert" },
  { cle: "rose", libelle: "Rose" },
  { cle: "orange", libelle: "Orange" },
  { cle: "violet", libelle: "Violet" },
  { cle: "rouge", libelle: "Rouge" },
  { cle: "turquoise", libelle: "Turquoise" },
] as const;

export const STYLES_SOULIGNE = [
  { cle: "simple", libelle: "Simple" },
  { cle: "double", libelle: "Double" },
  { cle: "pointille", libelle: "Pointillé" },
  { cle: "tirets", libelle: "Tirets" },
  { cle: "ondule", libelle: "Ondulé" },
] as const;

export const EFFETS = [
  { cle: "degrade", libelle: "Dégradé doré" },
  { cle: "lueur", libelle: "Lueur" },
  { cle: "petites-capitales", libelle: "Petites capitales" },
] as const;

export const ENCADRES = [
  { cle: "point-cle", libelle: "Point clé" },
  { cle: "definition", libelle: "Définition" },
  { cle: "argument", libelle: "Argument" },
  { cle: "objection", libelle: "Objection" },
  { cle: "reponse", libelle: "Réponse" },
  { cle: "attention", libelle: "Attention" },
  { cle: "remarque", libelle: "Remarque" },
  { cle: "conclusion", libelle: "Conclusion" },
  { cle: "citation-adverse", libelle: "Citation adverse" },
  { cle: "a-retenir", libelle: "À retenir" },
] as const;

export const DEGRES_HADITH = [
  { cle: "", libelle: "Non précisé" },
  { cle: "sahih", libelle: "Sahih (authentique)" },
  { cle: "sahih-li-ghayrihi", libelle: "Sahih li-ghayrihi" },
  { cle: "hasan", libelle: "Hasan (bon)" },
  { cle: "hasan-li-ghayrihi", libelle: "Hasan li-ghayrihi" },
  { cle: "daif", libelle: "Da'if (faible)" },
  { cle: "mawdu", libelle: "Mawdu' (forgé)" },
] as const;

export const ALIGNEMENTS = ["left", "center", "right", "justify"] as const;

export type CleCouleur = (typeof COULEURS)[number]["cle"];

export function libelleDe<T extends readonly { cle: string; libelle: string }[]>(liste: T, cle: unknown): string {
  return liste.find((e) => e.cle === cle)?.libelle ?? "";
}

// ----------------------------------------------------------------------
// Contrôle des valeurs
// ----------------------------------------------------------------------

/** Un validateur renvoie la valeur nettoyée (ou la valeur par défaut si l'entrée est invalide). */
type Validateur = (valeur: unknown) => unknown;

const enumere =
  (valeurs: readonly string[], defaut: string | null): Validateur =>
  (v) =>
    typeof v === "string" && valeurs.includes(v) ? v : defaut;

const texte =
  (max: number): Validateur =>
  (v) =>
    typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, max) : "";

const entier =
  (min: number, max: number, defaut: number): Validateur =>
  (v) => {
    const n = typeof v === "number" ? v : Number.parseInt(String(v), 10);
    return Number.isInteger(n) && n >= min && n <= max ? n : defaut;
  };

const booleen: Validateur = (v) => v === true;

/** N'accepte qu'un lien web (http ou https), un e-mail, ou une adresse interne commençant par « / ». */
export function lienSur(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const lien = v.trim().slice(0, 2000);
  if (!lien) return null;
  if (/^\/(?!\/)/.test(lien)) return lien;
  if (/^#[\w-]{1,100}$/.test(lien)) return lien;
  try {
    const url = new URL(lien);
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") return url.href;
  } catch {
    // Adresse illisible : refusée.
  }
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Identifiant d'un fichier ; une valeur invalide devient une chaîne vide (le bloc n'est alors pas affiché). */
const idFichier: Validateur = (v) => (typeof v === "string" && UUID.test(v) ? v.toLowerCase() : "");

export const LARGEURS_IMAGE = [
  { cle: "normale", libelle: "Normale" },
  { cle: "large", libelle: "Large" },
  { cle: "pleine", libelle: "Pleine largeur" },
] as const;

const COULEUR_OBLIGATOIRE = enumere(
  COULEURS.map((c) => c.cle),
  "jaune",
);
const COULEUR_FACULTATIVE = enumere(
  COULEURS.map((c) => c.cle),
  null,
);
const ALIGNEMENT = enumere(ALIGNEMENTS, null);

// ----------------------------------------------------------------------
// Liste blanche des blocs (nœuds) et des marques
// ----------------------------------------------------------------------

export const NOEUDS: Record<string, Record<string, Validateur>> = {
  doc: {},
  text: {},
  paragraph: { textAlign: ALIGNEMENT },
  heading: { level: entier(2, 4, 2), textAlign: ALIGNEMENT },
  hardBreak: {},
  bulletList: {},
  orderedList: { start: entier(1, 100000, 1) },
  listItem: {},
  taskList: {},
  taskItem: { checked: booleen },
  blockquote: {},
  horizontalRule: {},
  // Blocs propres à HaqqReason
  encadre: { type: enumere(ENCADRES.map((e) => e.cle), "point-cle") },
  objectionReponse: {},
  objection: {},
  reponse: {},
  comparaison: {},
  colonne: {},
  accordeon: {},
  accordeonTitre: {},
  accordeonCorps: {},
  frise: {},
  evenement: {},
  evenementDate: {},
  verset: { reference: texte(120) },
  versetArabe: {},
  versetTraduction: {},
  hadith: { recueil: texte(160), numero: texte(40), degre: enumere(DEGRES_HADITH.map((d) => d.cle), "") },
  hadithArabe: {},
  hadithTraduction: {},
  source: { auteur: texte(300), ouvrage: texte(400), edition: texte(300), page: texte(60), lien: (v) => lienSur(v) },
  note: { texte: texte(2000) },
  image: { fichier: idFichier, legende: texte(300), alt: texte(300), largeur: enumere(LARGEURS_IMAGE.map((l) => l.cle), "normale") },
  documentPdf: { fichier: idFichier, nom: texte(200), page: entier(1, 100000, 1) },
  // Phase 7
  lienCarte: {
    url: (v) => {
      const l = lienSur(v);
      return l && /^https?:/.test(l) ? l : "";
    },
    titre: texte(300),
    description: texte(500),
    site: texte(120),
    auteur: texte(120),
    genre: enumere(["web", "youtube"], "web"),
    video: (v) => (typeof v === "string" && /^[A-Za-z0-9_-]{11}$/.test(v) ? v : ""),
    liste: (v) => (typeof v === "string" && /^[A-Za-z0-9_-]{10,64}$/.test(v) ? v : ""),
    image: idFichier,
  },
  schema: { donnees: (v) => nettoyerSchema(typeof v === "string" ? lireJson(v) : v) },
  logique: { donnees: (v) => nettoyerLogique(typeof v === "string" ? lireJson(v) : v) },
  sophisme: { cle: enumere(SOPHISMES.map((x) => x.cle), "ad-hominem"), commentaire: texte(1000) },
  reference: { ouvrage: idFichier, citation: idFichier, page: texte(60), tome: texte(30) },
  citationOuvrage: { citation: idFichier },
  /** Table des matières : construite à l'affichage à partir des titres de l'article. */
  sommaire: { titre: texte(120), profondeur: entier(2, 4, 4) },
};

function lireJson(v: string): unknown {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export const MARQUES: Record<string, Record<string, Validateur>> = {
  bold: {},
  italic: {},
  strike: {},
  superscript: {},
  subscript: {},
  link: { href: (v) => lienSur(v) },
  surligne: { couleur: COULEUR_OBLIGATOIRE },
  souligne: { style: enumere(STYLES_SOULIGNE.map((s) => s.cle), "simple"), couleur: COULEUR_FACULTATIVE },
  couleur: { couleur: COULEUR_OBLIGATOIRE },
  effet: { type: enumere(EFFETS.map((e) => e.cle), "degrade") },
};

// ----------------------------------------------------------------------
// Nettoyage
// ----------------------------------------------------------------------

export type NoeudJSON = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NoeudJSON[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

export const LIMITES_DOCUMENT = {
  noeuds: 60_000,
  profondeur: 40,
  texteParNoeud: 50_000,
} as const;

function nettoyerAttributs(attrs: unknown, regles: Record<string, Validateur>): Record<string, unknown> | undefined {
  const cles = Object.keys(regles);
  if (cles.length === 0) return undefined;
  const source = attrs && typeof attrs === "object" ? (attrs as Record<string, unknown>) : {};
  const propres: Record<string, unknown> = {};
  for (const cle of cles) propres[cle] = regles[cle](source[cle]);
  return propres;
}

/**
 * Renvoie une copie du document ne contenant que des éléments autorisés, avec des valeurs contrôlées.
 * Les éléments inconnus sont retirés ; un lien dangereux (javascript:, data:…) perd son lien.
 */
export function nettoyerDocument(entree: unknown): NoeudJSON {
  let compteur = 0;

  const nettoyer = (brut: unknown, profondeur: number): NoeudJSON | null => {
    if (!brut || typeof brut !== "object" || profondeur > LIMITES_DOCUMENT.profondeur) return null;
    compteur++;
    if (compteur > LIMITES_DOCUMENT.noeuds) return null;
    const noeud = brut as Record<string, unknown>;
    const type = typeof noeud.type === "string" ? noeud.type : "";
    if (!Object.hasOwn(NOEUDS, type) || type === "doc") return null;

    if (type === "text") {
      const valeur = typeof noeud.text === "string" ? noeud.text.slice(0, LIMITES_DOCUMENT.texteParNoeud) : "";
      if (!valeur) return null;
      const resultat: NoeudJSON = { type: "text", text: valeur };
      const marques = Array.isArray(noeud.marks) ? noeud.marks : [];
      const propres: NonNullable<NoeudJSON["marks"]> = [];
      const vues = new Set<string>();
      for (const m of marques) {
        if (!m || typeof m !== "object") continue;
        const typeMarque = (m as { type?: unknown }).type;
        if (typeof typeMarque !== "string" || !Object.hasOwn(MARQUES, typeMarque) || vues.has(typeMarque)) continue;
        const attrs = nettoyerAttributs((m as { attrs?: unknown }).attrs, MARQUES[typeMarque]);
        if (typeMarque === "link" && !attrs?.href) continue;
        vues.add(typeMarque);
        propres.push(attrs ? { type: typeMarque, attrs } : { type: typeMarque });
      }
      if (propres.length > 0) resultat.marks = propres;
      return resultat;
    }

    const resultat: NoeudJSON = { type };
    const attrs = nettoyerAttributs(noeud.attrs, NOEUDS[type]);
    if (attrs) resultat.attrs = attrs;
    if (Array.isArray(noeud.content)) {
      const enfants = noeud.content.map((e) => nettoyer(e, profondeur + 1)).filter((e): e is NoeudJSON => e !== null);
      if (enfants.length > 0) resultat.content = enfants;
    }
    return resultat;
  };

  const racine = entree && typeof entree === "object" ? (entree as { content?: unknown }) : {};
  const contenu = Array.isArray(racine.content)
    ? racine.content.map((e) => nettoyer(e, 1)).filter((e): e is NoeudJSON => e !== null)
    : [];
  return { type: "doc", content: contenu };
}

// ----------------------------------------------------------------------
// Texte brut (recherche, temps de lecture, comparaison des versions)
// ----------------------------------------------------------------------

const BLOCS_TEXTE = new Set([
  "paragraph",
  "heading",
  "versetArabe",
  "versetTraduction",
  "hadithArabe",
  "hadithTraduction",
  "evenementDate",
  "accordeonTitre",
]);

/** Texte d'un document, un bloc par ligne (les paragraphes sont séparés par une ligne vide si « aere »). */
export function texteDuDocument(document: unknown, aere = false): string {
  const lignes: string[] = [];
  let courante = "";

  const vider = () => {
    if (courante.trim()) lignes.push(courante.trim());
    courante = "";
  };

  const parcourir = (brut: unknown, profondeur: number) => {
    if (!brut || typeof brut !== "object" || profondeur > LIMITES_DOCUMENT.profondeur) return;
    const n = brut as NoeudJSON;
    if (n.type === "text") {
      courante += n.text ?? "";
      return;
    }
    if (n.type === "hardBreak") {
      courante += aere ? "\n" : " ";
      return;
    }
    if (n.type === "note") {
      courante += ` (${String(n.attrs?.texte ?? "")})`;
      return;
    }
    if (n.type === "source") {
      vider();
      const a = n.attrs ?? {};
      courante = [a.auteur, a.ouvrage, a.edition, a.page].filter((x) => typeof x === "string" && x).join(", ");
      vider();
      return;
    }
    if (n.type === "schema" || n.type === "logique" || n.type === "lienCarte" || n.type === "sophisme") {
      vider();
      const a = n.attrs ?? {};
      if (n.type === "schema") courante = texteSchema(nettoyerSchema(a.donnees));
      else if (n.type === "logique") courante = texteLogique(nettoyerLogique(a.donnees));
      else if (n.type === "lienCarte") courante = [a.titre, a.description, a.site].filter((x) => typeof x === "string" && x).join(" ");
      else courante = `${sophismeParCle(String(a.cle))?.nom ?? ""} ${String(a.commentaire ?? "")}`;
      vider();
      return;
    }
    if (n.type === "image" || n.type === "documentPdf") {
      vider();
      courante = String(n.attrs?.legende ?? n.attrs?.nom ?? "");
      vider();
      return;
    }
    if (n.type === "verset" && n.attrs?.reference) {
      vider();
      courante = `Coran, ${String(n.attrs.reference)}`;
      vider();
    }
    if (n.type === "hadith") {
      vider();
      courante = [n.attrs?.recueil, n.attrs?.numero].filter((x) => typeof x === "string" && x).join(" ");
      vider();
    }
    const bloc = BLOCS_TEXTE.has(n.type) || n.type === "listItem" || n.type === "taskItem";
    if (bloc) vider();
    for (const enfant of n.content ?? []) parcourir(enfant, profondeur + 1);
    if (bloc) vider();
  };

  parcourir(document, 0);
  vider();
  return lignes.join(aere ? "\n\n" : "\n");
}

/** Textes des versets, des hadiths et des objections, pour chercher dans un seul type de bloc. */
export function textesParType(document: unknown): { versets: string; hadiths: string; objections: string } {
  const propre = nettoyerDocument(document);
  const parts = { versets: [] as string[], hadiths: [] as string[], objections: [] as string[] };
  const parcourir = (n: NoeudJSON, profondeur: number) => {
    if (profondeur > LIMITES_DOCUMENT.profondeur) return;
    const texte = () => texteDuDocument({ type: "doc", content: [n] });
    if (n.type === "verset") parts.versets.push(texte());
    else if (n.type === "hadith") parts.hadiths.push(texte());
    else if (n.type === "objectionReponse") parts.objections.push(texte());
    else for (const e of n.content ?? []) parcourir(e, profondeur + 1);
  };
  parcourir(propre, 0);
  return { versets: parts.versets.join("\n"), hadiths: parts.hadiths.join("\n"), objections: parts.objections.join("\n") };
}

export function compterMots(texteBrut: string): number {
  return texteBrut.split(/\s+/).filter(Boolean).length;
}

// ----------------------------------------------------------------------
// Contrôle qualité (affiché dans l'éditeur)
// ----------------------------------------------------------------------

export type Alerte = { cle: string; message: string };

function texteDe(n: NoeudJSON | undefined): string {
  return n ? texteDuDocument({ type: "doc", content: [n] }) : "";
}

/** Signale ce qu'il manque pour qu'un article soit irréprochable. */
export function controlerDocument(document: unknown): Alerte[] {
  let versetsSansTraduction = 0;
  let versetsSansReference = 0;
  let hadithsSansDegre = 0;
  let hadithsSansTraduction = 0;
  let hadithsSansRecueil = 0;
  let sourcesIncompletes = 0;
  let sources = 0;
  let objectionsSansReponse = 0;
  let raisonnementsInvalides = 0;
  let etapesNonVerifiees = 0;
  let referencesSansPage = 0;

  const parcourir = (n: NoeudJSON, profondeur: number) => {
    if (profondeur > LIMITES_DOCUMENT.profondeur) return;
    if (n.type === "verset") {
      if (!texteDe(n.content?.[1]).trim()) versetsSansTraduction++;
      if (!String(n.attrs?.reference ?? "").trim()) versetsSansReference++;
    }
    if (n.type === "hadith") {
      if (!n.attrs?.degre) hadithsSansDegre++;
      if (!texteDe(n.content?.[1]).trim()) hadithsSansTraduction++;
      if (!String(n.attrs?.recueil ?? "").trim()) hadithsSansRecueil++;
    }
    if (n.type === "source") {
      sources++;
      if (!String(n.attrs?.auteur ?? "").trim() || !String(n.attrs?.ouvrage ?? "").trim()) sourcesIncompletes++;
    }
    if (n.type === "objectionReponse" && !texteDe(n.content?.[1]).trim()) objectionsSansReponse++;
    if (n.type === "reference" || n.type === "citationOuvrage") sources++;
    if (n.type === "reference" && !String(n.attrs?.page ?? "").trim() && !n.attrs?.citation) referencesSansPage++;
    if (n.type === "logique") {
      const r = analyserLogique(n.attrs?.donnees as DonneesLogique);
      if ((r.genre === "validite" && r.valide === false) || (r.genre === "syllogisme" && !r.valide && !r.erreur)) raisonnementsInvalides++;
      if (r.genre === "demonstration" && r.verifications.includes("faux")) etapesNonVerifiees++;
    }
    for (const e of n.content ?? []) parcourir(e, profondeur + 1);
  };
  parcourir(nettoyerDocument(document), 0);

  const alertes: Alerte[] = [];
  const pluriel = (n: number, un: string, plusieurs: string) => (n === 1 ? un : plusieurs.replace("{n}", String(n)));
  if (versetsSansTraduction) alertes.push({ cle: "verset-traduction", message: pluriel(versetsSansTraduction, "Un verset n'a pas de traduction.", "{n} versets n'ont pas de traduction.") });
  if (versetsSansReference) alertes.push({ cle: "verset-reference", message: pluriel(versetsSansReference, "Un verset n'a pas de référence.", "{n} versets n'ont pas de référence.") });
  if (hadithsSansDegre) alertes.push({ cle: "hadith-degre", message: pluriel(hadithsSansDegre, "Un hadith n'a pas de degré d'authenticité.", "{n} hadiths n'ont pas de degré d'authenticité.") });
  if (hadithsSansTraduction) alertes.push({ cle: "hadith-traduction", message: pluriel(hadithsSansTraduction, "Un hadith n'a pas de traduction.", "{n} hadiths n'ont pas de traduction.") });
  if (hadithsSansRecueil) alertes.push({ cle: "hadith-recueil", message: pluriel(hadithsSansRecueil, "Un hadith n'indique pas son recueil.", "{n} hadiths n'indiquent pas leur recueil.") });
  if (sourcesIncompletes) alertes.push({ cle: "source", message: pluriel(sourcesIncompletes, "Une source n'a pas d'auteur ou d'ouvrage.", "{n} sources n'ont pas d'auteur ou d'ouvrage.") });
  if (objectionsSansReponse) alertes.push({ cle: "objection", message: pluriel(objectionsSansReponse, "Une objection n'a pas encore de réponse.", "{n} objections n'ont pas encore de réponse.") });
  if (raisonnementsInvalides) alertes.push({ cle: "logique-invalide", message: pluriel(raisonnementsInvalides, "Un raisonnement analysé est invalide (vérifie que c'est voulu, par exemple pour montrer l'erreur adverse).", "{n} raisonnements analysés sont invalides.") });
  if (etapesNonVerifiees) alertes.push({ cle: "logique-etape", message: pluriel(etapesNonVerifiees, "Une démonstration contient une étape qui ne découle pas de ses appuis.", "{n} démonstrations contiennent une étape non justifiée.") });
  if (referencesSansPage) alertes.push({ cle: "reference-page", message: pluriel(referencesSansPage, "Une référence n'indique pas de page.", "{n} références n'indiquent pas de page.") });
  if (sources === 0) alertes.push({ cle: "sans-source", message: "Aucune source citée dans l'article." });
  return alertes;
}

export type { DonneesSchema, DonneesLogique };
