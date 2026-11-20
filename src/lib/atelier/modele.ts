/**
 * Le Calame — atelier d'écriture.
 *
 * Modèle de données d'un document personnel : la géométrie de la page, les styles
 * globaux (des jetons, à la manière des « design tokens » : on change le jeton,
 * tout le document suit, sans retouche locale et donc sans dérive de mise en page),
 * et les bornes du format.
 *
 * Ce module ne touche ni à la base, ni au navigateur, ni au réseau : il est partagé
 * entre l'éditeur, l'export et les tests.
 */

export const VERSION_FORMAT = 1;

// ---------------------------------------------------------------------------
// Géométrie du papier
// ---------------------------------------------------------------------------

/** 1 mm en pixels CSS (96 points par pouce, 25,4 mm par pouce). */
export const MM = 96 / 25.4;

export const FORMATS = [
  { cle: "a4", libelle: "A4", largeur: 210, hauteur: 297 },
  { cle: "a5", libelle: "A5", largeur: 148, hauteur: 210 },
  { cle: "lettre", libelle: "Lettre (US)", largeur: 215.9, hauteur: 279.4 },
  { cle: "legal", libelle: "Legal (US)", largeur: 215.9, hauteur: 355.6 },
  // Formats de livre, tels que les demandent les imprimeurs.
  { cle: "livre-13x20", libelle: "Livre 13 × 20 cm", largeur: 130, hauteur: 200 },
  { cle: "livre-15x23", libelle: "Livre 15 × 23 cm", largeur: 150, hauteur: 230 },
  { cle: "livre-6x9", libelle: "Livre 6 × 9 pouces", largeur: 152.4, hauteur: 228.6 },
  { cle: "b5", libelle: "B5", largeur: 176, hauteur: 250 },
] as const;
export type Format = (typeof FORMATS)[number]["cle"];

export const ORIENTATIONS = [
  { cle: "portrait", libelle: "Portrait" },
  { cle: "paysage", libelle: "Paysage" },
] as const;
export type Orientation = (typeof ORIENTATIONS)[number]["cle"];

export type Marges = { haut: number; bas: number; gauche: number; droite: number };

export const MARGES_TYPES = [
  { cle: "normales", libelle: "Normales", marges: { haut: 25, bas: 25, gauche: 25, droite: 25 } },
  { cle: "etroites", libelle: "Étroites", marges: { haut: 13, bas: 13, gauche: 13, droite: 13 } },
  { cle: "larges", libelle: "Larges", marges: { haut: 25, bas: 25, gauche: 50, droite: 50 } },
  { cle: "reliure", libelle: "Pour reliure", marges: { haut: 25, bas: 25, gauche: 35, droite: 20 } },
] as const;

/** Taille de la page en millimètres, orientation comprise. */
export function tailleDuPapier(format: Format, orientation: Orientation): { largeur: number; hauteur: number } {
  const f = FORMATS.find((x) => x.cle === format) ?? FORMATS[0];
  return orientation === "paysage" ? { largeur: f.hauteur, hauteur: f.largeur } : { largeur: f.largeur, hauteur: f.hauteur };
}

/** Géométrie complète d'une page, en pixels CSS : ce que l'écran et l'impression partagent. */
export function geometrie(reglages: Pick<ReglagesPage, "format" | "orientation" | "marges">): {
  page: { largeur: number; hauteur: number };
  zone: { largeur: number; hauteur: number };
  marges: Marges;
} {
  const papier = tailleDuPapier(reglages.format, reglages.orientation);
  const m = reglages.marges;
  const largeur = papier.largeur * MM;
  const hauteur = papier.hauteur * MM;
  return {
    page: { largeur, hauteur },
    zone: {
      largeur: Math.max(40, largeur - (m.gauche + m.droite) * MM),
      hauteur: Math.max(40, hauteur - (m.haut + m.bas) * MM),
    },
    marges: m,
  };
}

// ---------------------------------------------------------------------------
// Jetons de style
// ---------------------------------------------------------------------------

/*
 * Chaque pile se termine par Amiri avant la famille générique : un ﷺ, un ﷻ ou un mot arabe
 * glissé dans un paragraphe français s'affiche toujours avec une vraie police arabe.
 */
export const POLICES = [
  { cle: "serif", libelle: "Garamond (serif)", pile: '"EB Garamond", Garamond, "Times New Roman", "Amiri", serif', word: "Garamond" },
  { cle: "sans", libelle: "Inter (sans serif)", pile: '"Instrument Sans Variable", "Helvetica Neue", Arial, "Amiri", sans-serif', word: "Arial" },
  { cle: "display", libelle: "Bricolage (titres)", pile: '"Bricolage Grotesque Variable", Georgia, "Amiri", serif', word: "Georgia" },
  { cle: "mono", libelle: "Monospace", pile: '"JetBrains Mono", "SFMono-Regular", Consolas, "Amiri", monospace', word: "Consolas" },
  { cle: "arabe", libelle: "Amiri (arabe)", pile: '"Amiri", "Scheherazade New", serif', word: "Amiri" },
  { cle: "literata", libelle: "Literata (livre)", pile: '"Literata Variable", Literata, Georgia, "Amiri", serif', word: "Literata" },
  { cle: "crimson", libelle: "Crimson Pro (classique)", pile: '"Crimson Pro", Garamond, Georgia, "Amiri", serif', word: "Crimson Pro" },
  { cle: "naskh", libelle: "Noto Naskh (arabe)", pile: '"Noto Naskh Arabic", "Amiri", serif', word: "Noto Naskh Arabic" },
  { cle: "scheherazade", libelle: "Scheherazade (arabe)", pile: '"Scheherazade New", "Amiri", serif', word: "Scheherazade New" },
] as const;
export type Police = (typeof POLICES)[number]["cle"];

export function pileDePolice(police: Police): string {
  return (POLICES.find((p) => p.cle === police) ?? POLICES[0]).pile;
}

/** Un jeton de style : tout ce qui décide de l'allure d'une famille de paragraphes. */
export type Jeton = {
  police: Police;
  /** Taille en points typographiques (comme dans un traitement de texte). */
  taille: number;
  /** Interligne, en multiple de la taille. */
  interligne: number;
  graisse: number;
  couleur: string;
  /** Espaces avant et après, en points. */
  avant: number;
  apres: number;
};

export type Styles = {
  corps: Jeton;
  titre1: Jeton;
  titre2: Jeton;
  titre3: Jeton;
  citation: Jeton;
};

export const NOMS_STYLES: Record<keyof Styles, string> = {
  corps: "Corps de texte",
  titre1: "Titre 1",
  titre2: "Titre 2",
  titre3: "Titre 3",
  citation: "Citation",
};

export const STYLES_PAR_DEFAUT: Styles = {
  corps: { police: "serif", taille: 11.5, interligne: 1.55, graisse: 400, couleur: "#1a1d2e", avant: 0, apres: 8 },
  titre1: { police: "display", taille: 22, interligne: 1.2, graisse: 700, couleur: "#0d1640", avant: 20, apres: 8 },
  titre2: { police: "display", taille: 16.5, interligne: 1.25, graisse: 700, couleur: "#0d1640", avant: 16, apres: 6 },
  titre3: { police: "display", taille: 13.5, interligne: 1.3, graisse: 600, couleur: "#0d1640", avant: 12, apres: 4 },
  citation: { police: "serif", taille: 11, interligne: 1.5, graisse: 400, couleur: "#424a6b", avant: 10, apres: 10 },
};

/** Bornes acceptées pour chaque réglage de jeton. */
export const BORNES_JETON = {
  taille: { min: 6, max: 72, pas: 0.5 },
  interligne: { min: 1, max: 3, pas: 0.05 },
  avant: { min: 0, max: 72, pas: 1 },
  apres: { min: 0, max: 72, pas: 1 },
} as const;

export const GRAISSES = [300, 400, 500, 600, 700, 800] as const;

// ---------------------------------------------------------------------------
// Réglages de page
// ---------------------------------------------------------------------------

export type ReglagesPage = {
  format: Format;
  orientation: Orientation;
  marges: Marges;
  styles: Styles;
  /** Texte d'en-tête ; les jetons {titre}, {page}, {pages}, {date} y sont remplacés. */
  entete: string;
  pied: string;
  /** Numéroter les pages dans le pied, à droite. */
  numeroter: boolean;
  /** Ne rien imprimer en en-tête et en pied sur la première page. */
  premierePageNue: boolean;
  /** Papier sombre pour écrire la nuit (l'export reste sur fond blanc). */
  papierSombre: boolean;
  /** Afficher la règle de page et les repères de coupe à l'écran. */
  reperes: boolean;
} & MiseEnPage;

/** Une ligne d'en-tête ou de pied en trois zones. La zone du centre est l'ancien champ unique. */
export type ZonesLigne = { gauche: string; centre: string; droite: string };

export const POSITIONS_NUMERO = [
  { cle: "bas-droite", libelle: "En bas, à droite" },
  { cle: "bas-centre", libelle: "En bas, au centre" },
  { cle: "bas-exterieur", libelle: "En bas, côté extérieur" },
  { cle: "haut-droite", libelle: "En haut, à droite" },
  { cle: "haut-exterieur", libelle: "En haut, côté extérieur" },
] as const;
export type PositionNumero = (typeof POSITIONS_NUMERO)[number]["cle"];

export const STYLES_NUMERO = [
  { cle: "arabe", libelle: "1, 2, 3" },
  { cle: "romain", libelle: "i, ii, iii" },
  { cle: "ROMAIN", libelle: "I, II, III" },
] as const;

export const PLACES_NOTES = [
  { cle: "bas", libelle: "En bas de page" },
  { cle: "fin-partie", libelle: "À la fin de chaque partie" },
  { cle: "fin-document", libelle: "À la fin du document" },
] as const;
export type PlaceNotes = (typeof PLACES_NOTES)[number]["cle"];

export const BORDURES = [
  { cle: "aucune", libelle: "Aucune" },
  { cle: "fine", libelle: "Filet fin" },
  { cle: "double", libelle: "Double filet" },
  { cle: "epaisse", libelle: "Cadre épais" },
] as const;
export type Bordure = (typeof BORDURES)[number]["cle"];

/**
 * Ce que la mise en page d'un livre ou d'un mémoire demande en plus. Tout est facultatif dans
 * un document plus ancien : les valeurs par défaut redonnent exactement l'allure d'avant.
 */
export type MiseEnPage = {
  /*
   * En-tête et pied en trois zones. Les anciens champs gardent leur place d'avant :
   * `entete` est la zone de droite de l'en-tête, `pied` la zone de gauche du pied.
   */
  enteteGauche: string;
  enteteCentre: string;
  piedCentre: string;
  piedDroite: string;
  /** En-têtes et pieds différents sur les pages paires (verso). */
  pairesDifferentes: boolean;
  paires: { entete: ZonesLigne; pied: ZonesLigne };
  numeroStyle: "arabe" | "romain" | "ROMAIN";
  numeroPosition: PositionNumero;
  /** Numéro de la première page du corps. */
  premierNumero: number;
  /** Pages liminaires (introduction, remerciements…) numérotées i, ii, iii avant le corps. */
  pagesLiminaires: number;
  /** Marges en miroir : la marge de gauche devient la marge intérieure (reliure), sur les deux faces. */
  miroir: boolean;
  /** Fond perdu pour l'imprimeur, en millimètres (0, 3 ou 5). */
  fondPerdu: number;
  /** Où vont les notes. */
  notes: PlaceNotes;
  filigrane: string;
  bordure: Bordure;
  numerosLignes: boolean;
  /** Titres numérotés 1, 1.1, 1.1.1. */
  numeroterTitres: boolean;
  /** Retrait de première ligne des paragraphes, en millimètres. */
  alinea: number;
  /** Lettrine au premier paragraphe de chaque partie. */
  lettrine: boolean;
  /** Césure du français dans les paragraphes. */
  cesure: boolean;
  /** Ni ligne seule en bas de page (orpheline), ni en haut de la suivante (veuve). */
  veuves: boolean;
  /** Paragraphes justifiés par défaut (un alignement choisi sur un paragraphe l'emporte). */
  justifier: boolean;
  /** Styles nommés, de paragraphe ou de caractère (Titre 4, Légende, Verset, et ceux de l'auteur). */
  stylesNommes: StyleNomme[];
  /** Style des références (notes, bibliographie) : Chicago, APA ou ISO 690. */
  styleCitation: "chicago" | "apa" | "iso690";
};

/** Un style nommé : on le pose sur un paragraphe (ou sur quelques mots), il se règle ici une fois pour toutes. */
export type StyleNomme = {
  id: string;
  nom: string;
  genre: "paragraphe" | "caractere";
  police: Police;
  taille: number;
  graisse: number;
  couleur: string;
  italique: boolean;
  majuscules: boolean;
  /** Paragraphe seulement. */
  interligne: number;
  avant: number;
  apres: number;
  alignement: "" | "left" | "center" | "right" | "justify";
  /** Retrait à gauche, en millimètres. */
  retrait: number;
};

const STYLE_BASE: Omit<StyleNomme, "id" | "nom" | "genre"> = {
  police: "serif",
  taille: 11.5,
  graisse: 400,
  couleur: "#1a1d2e",
  italique: false,
  majuscules: false,
  interligne: 1.5,
  avant: 0,
  apres: 8,
  alignement: "",
  retrait: 0,
};

export const STYLES_NOMMES_PAR_DEFAUT: StyleNomme[] = [
  { ...STYLE_BASE, id: "titre4", nom: "Titre 4", genre: "paragraphe", police: "display", taille: 12, graisse: 600, couleur: "#0d1640", interligne: 1.3, avant: 10, apres: 4 },
  { ...STYLE_BASE, id: "legende", nom: "Légende", genre: "paragraphe", taille: 9.5, italique: true, couleur: "#424a6b", interligne: 1.35, avant: 2, apres: 10, alignement: "center" },
  { ...STYLE_BASE, id: "verset", nom: "Verset", genre: "paragraphe", police: "arabe", taille: 15, couleur: "#0d1640", interligne: 1.9, avant: 8, apres: 8, alignement: "center" },
  { ...STYLE_BASE, id: "terme-arabe", nom: "Terme arabe", genre: "caractere", italique: true },
  { ...STYLE_BASE, id: "petites-capitales", nom: "Mise en valeur", genre: "caractere", majuscules: true, taille: 10.5, graisse: 600 },
];

const ID_STYLE = /^[a-z0-9-]{1,40}$/;

export function nettoyerStylesNommes(brut: unknown): StyleNomme[] {
  if (!Array.isArray(brut)) return structuredCloneSimple(STYLES_NOMMES_PAR_DEFAUT);
  const vus = new Set<string>();
  const styles: StyleNomme[] = [];
  for (const b of brut.slice(0, 60)) {
    const o = (b ?? {}) as Record<string, unknown>;
    const id = typeof o.id === "string" && ID_STYLE.test(o.id) ? o.id : "";
    if (!id || vus.has(id)) continue;
    vus.add(id);
    styles.push({
      id,
      nom: String(o.nom ?? id).trim().slice(0, 40) || id,
      genre: o.genre === "caractere" ? "caractere" : "paragraphe",
      police: dansLaListe(o.police, POLICES.map((x) => x.cle), STYLE_BASE.police),
      taille: nombre(o.taille, BORNES_JETON.taille.min, BORNES_JETON.taille.max, STYLE_BASE.taille),
      graisse: dansLaListe(String(o.graisse), GRAISSES.map(String), String(STYLE_BASE.graisse)) as unknown as number,
      couleur: couleur(o.couleur, STYLE_BASE.couleur),
      italique: o.italique === true,
      majuscules: o.majuscules === true,
      interligne: nombre(o.interligne, BORNES_JETON.interligne.min, BORNES_JETON.interligne.max, STYLE_BASE.interligne),
      avant: nombre(o.avant, 0, 72, STYLE_BASE.avant),
      apres: nombre(o.apres, 0, 72, STYLE_BASE.apres),
      alignement: dansLaListe(o.alignement, ["", "left", "center", "right", "justify"] as const, ""),
      retrait: nombre(o.retrait, 0, 60, 0),
    });
  }
  return styles;
}

/** La feuille de style des styles nommés (une règle par style, valable à l'écran comme à l'impression). */
export function cssStylesNommes(styles: StyleNomme[]): string {
  return styles
    .filter((s) => ID_STYLE.test(s.id))
    .map((s) => {
      const d = [
        `font-family: ${pileDePolice(s.police)}`,
        `font-size: ${s.taille}pt`,
        `font-weight: ${s.graisse}`,
        `color: ${s.couleur}`,
        `font-style: ${s.italique ? "italic" : "normal"}`,
      ];
      if (s.majuscules) d.push("font-variant-caps: all-small-caps", "letter-spacing: 0.04em");
      if (s.genre === "paragraphe") {
        d.push(`line-height: ${s.interligne}`, `margin-top: ${s.avant}pt`, `margin-bottom: ${s.apres}pt`);
        if (s.alignement) d.push(`text-align: ${s.alignement}`);
        if (s.retrait) d.push(`margin-left: ${s.retrait}mm`);
        return `.calame-texte .tiptap [data-style-nomme="${s.id}"] { ${d.join("; ")}; }`;
      }
      return `.calame-texte .tiptap [data-style-car="${s.id}"] { ${d.join("; ")}; }`;
    })
    .join("\n");
}

const ZONES_VIDES: ZonesLigne = { gauche: "", centre: "", droite: "" };

export const MISE_EN_PAGE_PAR_DEFAUT: MiseEnPage = {
  enteteGauche: "",
  enteteCentre: "",
  piedCentre: "",
  piedDroite: "",
  pairesDifferentes: false,
  paires: { entete: { ...ZONES_VIDES }, pied: { ...ZONES_VIDES } },
  numeroStyle: "arabe",
  numeroPosition: "bas-droite",
  premierNumero: 1,
  pagesLiminaires: 0,
  miroir: false,
  fondPerdu: 0,
  notes: "bas",
  filigrane: "",
  bordure: "aucune",
  numerosLignes: false,
  numeroterTitres: false,
  alinea: 0,
  lettrine: false,
  cesure: false,
  veuves: true,
  justifier: false,
  stylesNommes: STYLES_NOMMES_PAR_DEFAUT,
  styleCitation: "chicago",
};

export const REGLAGES_PAR_DEFAUT: ReglagesPage = {
  format: "a4",
  orientation: "portrait",
  marges: { haut: 25, bas: 25, gauche: 25, droite: 25 },
  styles: STYLES_PAR_DEFAUT,
  entete: "",
  pied: "",
  numeroter: true,
  premierePageNue: true,
  papierSombre: false,
  reperes: true,
  ...MISE_EN_PAGE_PAR_DEFAUT,
};

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export type DocumentAtelier = {
  id: string;
  titre: string;
  /** Document ProseMirror, exactement le même vocabulaire de blocs que le mode créateur. */
  contenu: unknown;
  reglages: ReglagesPage;
  /** Dossier de rangement, choisi librement par l'auteur. */
  dossier: string;
  cree: string;
  modifie: string;
  /** Compteurs tenus à jour à l'enregistrement, pour la liste. */
  mots: number;
  signes: number;
} & Partial<ExtrasDocument>;

export type VersionAtelier = {
  id: string;
  documentId: string;
  quand: string;
  /** Ce qui a changé, en nombre de mots, depuis la version précédente. */
  deltaMots: number;
  contenu: unknown;
  titre: string;
  /** Nom donné par l'auteur (« Envoyée au jury ») : une version nommée n'est jamais fondue avec les autres. */
  nom?: string;
};

export const LIMITES_ATELIER = {
  titre: 200,
  dossier: 80,
  entete: 160,
  /** Au-delà, on prévient l'auteur : ce n'est pas un blocage, c'est un garde-fou. */
  motsConfortables: 250_000,
  /** Versions gardées par document (les plus anciennes sont fondues dans la plus vieille). */
  versions: 60,
  /** Un fichier joint au-delà de cette taille ralentirait le navigateur. */
  fichierMo: 64,
} as const;

export function documentVide(id: string, titre = "Document sans titre"): DocumentAtelier {
  const maintenant = new Date().toISOString();
  return {
    id,
    titre,
    contenu: { type: "doc", content: [{ type: "paragraph" }] },
    reglages: structuredCloneSimple(REGLAGES_PAR_DEFAUT),
    dossier: "",
    cree: maintenant,
    modifie: maintenant,
    mots: 0,
    signes: 0,
  };
}

/** Copie profonde sans dépendre de structuredClone (absent de certains contextes de test). */
export function structuredCloneSimple<T>(valeur: T): T {
  return JSON.parse(JSON.stringify(valeur)) as T;
}

// ---------------------------------------------------------------------------
// Nettoyage : tout ce qui entre (fichier importé, base locale d'une version
// plus ancienne) repasse par ici avant d'atteindre l'éditeur.
// ---------------------------------------------------------------------------

function nombre(valeur: unknown, min: number, max: number, defaut: number): number {
  const n = Number(valeur);
  if (!Number.isFinite(n)) return defaut;
  return Math.min(max, Math.max(min, n));
}

function couleur(valeur: unknown, defaut: string): string {
  return typeof valeur === "string" && /^#[0-9a-f]{3,8}$/i.test(valeur) ? valeur : defaut;
}

function dansLaListe<T extends string>(valeur: unknown, liste: readonly T[], defaut: T): T {
  return liste.includes(valeur as T) ? (valeur as T) : defaut;
}

export function nettoyerJeton(brut: unknown, defaut: Jeton): Jeton {
  const o = (brut ?? {}) as Record<string, unknown>;
  return {
    police: dansLaListe(o.police, POLICES.map((p) => p.cle), defaut.police),
    taille: nombre(o.taille, BORNES_JETON.taille.min, BORNES_JETON.taille.max, defaut.taille),
    interligne: nombre(o.interligne, BORNES_JETON.interligne.min, BORNES_JETON.interligne.max, defaut.interligne),
    graisse: dansLaListe(String(o.graisse), GRAISSES.map(String), String(defaut.graisse)) as unknown as number,
    couleur: couleur(o.couleur, defaut.couleur),
    avant: nombre(o.avant, BORNES_JETON.avant.min, BORNES_JETON.avant.max, defaut.avant),
    apres: nombre(o.apres, BORNES_JETON.apres.min, BORNES_JETON.apres.max, defaut.apres),
  };
}

export function nettoyerReglages(brut: unknown): ReglagesPage {
  const o = (brut ?? {}) as Record<string, unknown>;
  const m = (o.marges ?? {}) as Record<string, unknown>;
  const s = (o.styles ?? {}) as Record<string, unknown>;
  const format = dansLaListe(o.format, FORMATS.map((f) => f.cle), REGLAGES_PAR_DEFAUT.format);
  const orientation = dansLaListe(o.orientation, ORIENTATIONS.map((x) => x.cle), REGLAGES_PAR_DEFAUT.orientation);
  const papier = tailleDuPapier(format, orientation);
  // Une marge ne peut jamais manger la page entière : on garde au moins 30 mm utiles.
  const maxH = Math.max(0, (papier.hauteur - 30) / 2);
  const maxL = Math.max(0, (papier.largeur - 30) / 2);
  return {
    format,
    orientation,
    marges: {
      haut: nombre(m.haut, 0, maxH, REGLAGES_PAR_DEFAUT.marges.haut),
      bas: nombre(m.bas, 0, maxH, REGLAGES_PAR_DEFAUT.marges.bas),
      gauche: nombre(m.gauche, 0, maxL, REGLAGES_PAR_DEFAUT.marges.gauche),
      droite: nombre(m.droite, 0, maxL, REGLAGES_PAR_DEFAUT.marges.droite),
    },
    styles: {
      corps: nettoyerJeton(s.corps, STYLES_PAR_DEFAUT.corps),
      titre1: nettoyerJeton(s.titre1, STYLES_PAR_DEFAUT.titre1),
      titre2: nettoyerJeton(s.titre2, STYLES_PAR_DEFAUT.titre2),
      titre3: nettoyerJeton(s.titre3, STYLES_PAR_DEFAUT.titre3),
      citation: nettoyerJeton(s.citation, STYLES_PAR_DEFAUT.citation),
    },
    entete: String(o.entete ?? "").slice(0, LIMITES_ATELIER.entete),
    pied: String(o.pied ?? "").slice(0, LIMITES_ATELIER.entete),
    numeroter: o.numeroter === undefined ? REGLAGES_PAR_DEFAUT.numeroter : Boolean(o.numeroter),
    premierePageNue: o.premierePageNue === undefined ? REGLAGES_PAR_DEFAUT.premierePageNue : Boolean(o.premierePageNue),
    papierSombre: Boolean(o.papierSombre),
    reperes: o.reperes === undefined ? REGLAGES_PAR_DEFAUT.reperes : Boolean(o.reperes),
    ...nettoyerMiseEnPage(o),
  };
}

function nettoyerZones(brut: unknown): ZonesLigne {
  const z = (brut ?? {}) as Record<string, unknown>;
  const t = (v: unknown) => String(v ?? "").slice(0, LIMITES_ATELIER.entete);
  return { gauche: t(z.gauche), centre: t(z.centre), droite: t(z.droite) };
}

/** Les réglages de mise en page avancée, chacun ramené dans ses bornes. */
export function nettoyerMiseEnPage(o: Record<string, unknown>): MiseEnPage {
  const d = MISE_EN_PAGE_PAR_DEFAUT;
  const t = (v: unknown) => String(v ?? "").slice(0, LIMITES_ATELIER.entete);
  const b = (v: unknown, defaut: boolean) => (v === undefined ? defaut : Boolean(v));
  const paires = (o.paires ?? {}) as Record<string, unknown>;
  return {
    enteteGauche: t(o.enteteGauche),
    enteteCentre: t(o.enteteCentre),
    piedCentre: t(o.piedCentre),
    piedDroite: t(o.piedDroite),
    pairesDifferentes: b(o.pairesDifferentes, d.pairesDifferentes),
    paires: { entete: nettoyerZones(paires.entete), pied: nettoyerZones(paires.pied) },
    numeroStyle: dansLaListe(o.numeroStyle, STYLES_NUMERO.map((x) => x.cle), d.numeroStyle),
    numeroPosition: dansLaListe(o.numeroPosition, POSITIONS_NUMERO.map((x) => x.cle), d.numeroPosition),
    premierNumero: Math.round(nombre(o.premierNumero, 0, 9999, d.premierNumero)),
    pagesLiminaires: Math.round(nombre(o.pagesLiminaires, 0, 60, d.pagesLiminaires)),
    miroir: b(o.miroir, d.miroir),
    fondPerdu: [0, 3, 5].includes(Number(o.fondPerdu)) ? Number(o.fondPerdu) : d.fondPerdu,
    notes: dansLaListe(o.notes, PLACES_NOTES.map((x) => x.cle), d.notes),
    filigrane: String(o.filigrane ?? "").slice(0, 40),
    bordure: dansLaListe(o.bordure, BORDURES.map((x) => x.cle), d.bordure),
    numerosLignes: b(o.numerosLignes, d.numerosLignes),
    numeroterTitres: b(o.numeroterTitres, d.numeroterTitres),
    alinea: nombre(o.alinea, 0, 30, d.alinea),
    lettrine: b(o.lettrine, d.lettrine),
    cesure: b(o.cesure, d.cesure),
    veuves: b(o.veuves, d.veuves),
    justifier: b(o.justifier, d.justifier),
    stylesNommes: nettoyerStylesNommes(o.stylesNommes),
    styleCitation: dansLaListe(o.styleCitation, ["chicago", "apa", "iso690"] as const, d.styleCitation),
  };
}

/** Les trois zones de l'en-tête et du pied d'une page (paire ou impaire). */
export function zonesDeLaPage(r: ReglagesPage, numero: number): { entete: ZonesLigne; pied: ZonesLigne } {
  if (r.pairesDifferentes && numero % 2 === 0) return r.paires;
  return {
    entete: { gauche: r.enteteGauche, centre: r.enteteCentre, droite: r.entete },
    pied: { gauche: r.pied, centre: r.piedCentre, droite: r.piedDroite },
  };
}

/** Les marges d'une page précise : en miroir, les pages paires (verso) échangent gauche et droite. */
export function margesDeLaPage(reglages: Pick<ReglagesPage, "marges" | "miroir">, numero: number): Marges {
  const m = reglages.marges;
  return reglages.miroir && numero % 2 === 0 ? { ...m, gauche: m.droite, droite: m.gauche } : m;
}

/** Remplit les jetons d'un en-tête ou d'un pied de page. */
export function remplirLigne(gabarit: string, contexte: { titre: string; page: number; pages: number; date?: Date }): string {
  const d = contexte.date ?? new Date();
  return gabarit
    .replace(/\{titre\}/g, contexte.titre)
    .replace(/\{page\}/g, String(contexte.page))
    .replace(/\{pages\}/g, String(contexte.pages))
    .replace(/\{date\}/g, d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));
}

/** Les variables CSS qui portent les jetons jusqu'à la page. Une seule source de vérité. */
export function variablesDeStyle(reglages: ReglagesPage): Record<string, string> {
  const g = geometrie(reglages);
  const vars: Record<string, string> = {
    "--page-largeur": `${g.page.largeur}px`,
    "--page-hauteur": `${g.page.hauteur}px`,
    "--page-marge-haut": `${reglages.marges.haut * MM}px`,
    "--page-marge-bas": `${reglages.marges.bas * MM}px`,
    "--page-marge-gauche": `${reglages.marges.gauche * MM}px`,
    "--page-marge-droite": `${reglages.marges.droite * MM}px`,
    "--zone-largeur": `${g.zone.largeur}px`,
    "--zone-hauteur": `${g.zone.hauteur}px`,
    "--alinea": `${(reglages.alinea ?? 0) * MM}px`,
  };
  for (const [nom, jeton] of Object.entries(reglages.styles) as [keyof Styles, Jeton][]) {
    const p = `--${nom}`;
    vars[`${p}-police`] = pileDePolice(jeton.police);
    vars[`${p}-taille`] = `${jeton.taille}pt`;
    vars[`${p}-interligne`] = String(jeton.interligne);
    vars[`${p}-graisse`] = String(jeton.graisse);
    vars[`${p}-couleur`] = jeton.couleur;
    vars[`${p}-avant`] = `${jeton.avant}pt`;
    vars[`${p}-apres`] = `${jeton.apres}pt`;
  }
  return vars;
}

// ---------------------------------------------------------------------------
// Rangement, propriétés et objectifs d'un document (tous facultatifs : un
// document d'une version plus ancienne reste valable tel quel).
// ---------------------------------------------------------------------------

export const STATUTS_DOCUMENT = [
  { cle: "brouillon", libelle: "Brouillon" },
  { cle: "relecture", libelle: "En relecture" },
  { cle: "termine", libelle: "Terminé" },
] as const;
export type StatutDocument = (typeof STATUTS_DOCUMENT)[number]["cle"];

export type ProprietesDocument = { auteur: string; sujet: string; motsCles: string; statut: StatutDocument };

export const PROPRIETES_VIDES: ProprietesDocument = { auteur: "", sujet: "", motsCles: "", statut: "brouillon" };

/** Ce qu'un document peut porter en plus de son texte, et que la liste et l'inspecteur exploitent. */
export type ExtrasDocument = {
  /** Noms d'étiquettes (leur couleur vit dans les préférences). */
  etiquettes: string[];
  epingle: boolean;
  archive: boolean;
  /** Date de mise à la corbeille ; null : document actif. */
  corbeille: string | null;
  proprietes: ProprietesDocument;
  /** Nombre de mots visé (0 : aucun objectif). */
  objectifMots: number;
  /** Échéance au format AAAA-MM-JJ, ou null. */
  echeance: string | null;
  /** Verrou par un code (appareil partagé) : le sel et l'empreinte du code, jamais le code lui-même. */
  verrou: { sel: string; empreinte: string } | null;
};

export const LIMITES_EXTRAS = { etiquettes: 20, etiquette: 40, propriete: 200, motsCles: 400, objectifMots: 10_000_000, corbeilleJours: 30 } as const;

const JOUR_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Remet d'aplomb les champs facultatifs d'un document (fichier importé, appareil plus ancien). */
export function nettoyerExtras(brut: unknown): ExtrasDocument {
  const o = (brut ?? {}) as Record<string, unknown>;
  const p = (o.proprietes ?? {}) as Record<string, unknown>;
  const texte = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const etiquettes = Array.isArray(o.etiquettes)
    ? [...new Set(o.etiquettes.filter((e): e is string => typeof e === "string").map((e) => e.trim().slice(0, LIMITES_EXTRAS.etiquette)).filter(Boolean))].slice(0, LIMITES_EXTRAS.etiquettes)
    : [];
  const corbeille = typeof o.corbeille === "string" && Number.isFinite(Date.parse(o.corbeille)) ? o.corbeille : null;
  const statut = STATUTS_DOCUMENT.some((s) => s.cle === p.statut) ? (p.statut as StatutDocument) : "brouillon";
  return {
    etiquettes,
    epingle: o.epingle === true,
    archive: o.archive === true,
    corbeille,
    proprietes: { auteur: texte(p.auteur, LIMITES_EXTRAS.propriete), sujet: texte(p.sujet, LIMITES_EXTRAS.propriete), motsCles: texte(p.motsCles, LIMITES_EXTRAS.motsCles), statut },
    objectifMots: nombre(o.objectifMots, 0, LIMITES_EXTRAS.objectifMots, 0),
    echeance: typeof o.echeance === "string" && JOUR_ISO.test(o.echeance) ? o.echeance : null,
    verrou: verrouValide(o.verrou),
  };
}

function verrouValide(v: unknown): ExtrasDocument["verrou"] {
  const o = (v ?? {}) as Record<string, unknown>;
  return typeof o.sel === "string" && /^[0-9a-f]{32}$/.test(o.sel) && typeof o.empreinte === "string" && /^[0-9a-f]{64}$/.test(o.empreinte) ? { sel: o.sel, empreinte: o.empreinte } : null;
}

/** Les champs facultatifs d'un document, valeurs par défaut comprises. */
export function extrasDe(doc: DocumentAtelier): ExtrasDocument {
  return nettoyerExtras(doc);
}

/** Un document à la corbeille depuis plus de 30 jours peut être effacé pour de bon. */
export function corbeilleExpiree(doc: Pick<ExtrasDocument, "corbeille">, maintenant = Date.now()): boolean {
  if (!doc.corbeille) return false;
  return maintenant - Date.parse(doc.corbeille) > LIMITES_EXTRAS.corbeilleJours * 86_400_000;
}
