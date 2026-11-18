/*
 * Les modules modifiables depuis le mode créateur : la page « Par où veux-tu commencer ? »,
 * Le Calame, L'Alambic et Le Truchement (la bibliothèque a son propre éditeur).
 *
 * Chaque module décrit ici ses textes (avec leur valeur d'origine), ses listes (outils, onglets, cartes :
 * renommer, réordonner, masquer, supprimer) et, pour Le Truchement, son vocabulaire.
 * Le créateur enregistre un brouillon, puis le publie ; rien n'est perdu : une suppression va
 * dans la corbeille du module, et chaque publication garde la précédente dans l'historique.
 *
 * Ce fichier est partagé entre le serveur et le navigateur ; il ne touche pas à la base.
 */
import { THEMES } from "@/lib/langues/themes/index";
import type { Entree, Niveau, Theme } from "@/lib/langues/types";

export type ModuleId = "accueil" | "calame" | "alambic" | "langues";
export const IDS_MODULES: ModuleId[] = ["accueil", "calame", "alambic", "langues"];

export type Champ = { cle: string; libelle: string; defaut: string; long?: boolean; aide?: string; nombre?: { min: number; max: number } };
export type Section = { titre: string; champs: Champ[] };
export type DefListe = {
  id: string;
  titre: string;
  aide: string;
  /** Les champs modifiables de chaque élément. */
  champs: { cle: string; libelle: string; long?: boolean; aide?: string }[];
  /** Les éléments d'origine, avec leurs valeurs. */
  elements: { id: string; valeurs: Record<string, string> }[];
  /** Le champ qui nomme l'élément dans l'éditeur. */
  nom: string;
};
export type DefModule = {
  id: ModuleId;
  nom: string;
  description: string;
  adresse: string;
  accent: "or" | "emeraude" | "amethyste" | "azur";
  sections: Section[];
  listes: DefListe[];
  vocabulaire?: boolean;
};

/* ---------- Ce qui est enregistré ---------- */

export type ElementListe = { id: string; visible: boolean; valeurs: Record<string, string> };
export type ThemeEdite = { id: string; nom: string; description: string; icone: string; visible: boolean; entrees: Entree[] };
export type Supprime =
  | { id: string; type: "element"; liste: string; libelle: string; le: number; donnees: ElementListe; position: number }
  | { id: string; type: "theme"; libelle: string; le: number; donnees: ThemeEdite; position: number }
  | { id: string; type: "mot"; theme: string; libelle: string; le: number; donnees: Entree; position: number };

export type Contenu = {
  v: 1;
  /** Seuls les textes changés sont gardés ; les autres suivent la valeur d'origine. */
  textes: Record<string, string>;
  listes: Record<string, ElementListe[]>;
  /** Absent : le vocabulaire d'origine. Présent : les thèmes modifiés ; les mots ajoutés au code depuis s'y ajoutent à l'affichage. */
  themes?: ThemeEdite[];
  /** Thèmes (« id ») et mots (« theme:mot ») d'origine retirés exprès : ils ne reviennent pas, même corbeille vidée. */
  retires?: string[];
  corbeille: Supprime[];
};

export const contenuVide = (): Contenu => ({ v: 1, textes: {}, listes: {}, corbeille: [] });

/* ---------- Les définitions ---------- */

const ACCUEIL: DefModule = {
  id: "accueil",
  nom: "Page « Par où veux-tu commencer ? »",
  description: "La page qui présente les espaces aux visiteurs : son titre, son introduction, et une carte par espace.",
  adresse: "/utilisateur",
  accent: "or",
  sections: [
    {
      titre: "En-tête de la page",
      champs: [
        { cle: "titre", libelle: "Titre", defaut: "Par où veux-tu commencer ?" },
        { cle: "intro", libelle: "Introduction", defaut: "Cinq espaces : écrire, transformer tes fichiers, apprendre une langue, lire, et comprendre l'islam en vidéo. Tu passes de l'un à l'autre quand tu veux.", long: true },
        { cle: "meta.description", libelle: "Description pour Google", defaut: "Cinq espaces : Le Calame pour écrire, L'Alambic pour convertir ses fichiers, Le Truchement pour apprendre une langue, la bibliothèque des preuves de la véracité de l'islam, et L'Islam authentique en vidéos.", long: true },
      ],
    },
  ],
  listes: [
    {
      id: "cartes",
      titre: "Les cartes des espaces",
      aide: "Une carte par espace. Change l'ordre, les textes, ou masque une carte : l'espace reste accessible par son adresse.",
      nom: "titre",
      champs: [
        { cle: "marque", libelle: "Petit mot en haut à droite" },
        { cle: "soustitre", libelle: "Sur-titre" },
        { cle: "titre", libelle: "Titre" },
        { cle: "texte", libelle: "Texte", long: true, aide: "Dans la carte du Truchement, {mots} et {themes} sont remplacés par les nombres réels du vocabulaire." },
      ],
      elements: [
        {
          id: "calame",
          valeurs: {
            titre: "Le Calame",
            soustitre: "Atelier d'écriture",
            marque: "Écrire",
            texte: "Un traitement de texte complet, dans ton navigateur : pages A4 réelles, styles, tableaux, images, PDF, frises chronologiques et cartes mentales. Tes documents s'enregistrent tout seuls, te suivent sur tous tes appareils avec ton compte, et s'exportent en PDF, Word ou Markdown.",
          },
        },
        {
          id: "alambic",
          valeurs: {
            titre: "L'Alambic",
            soustitre: "Studio de fichiers",
            marque: "Transformer",
            texte: "Convertir d'un format à l'autre (documents, tableurs, images, sons, vidéos, archives), fusionner, découper et protéger par mot de passe. Tout se fait dans ton navigateur : aucun fichier n'est envoyé.",
          },
        },
        {
          id: "langues",
          valeurs: {
            titre: "Le Truchement",
            soustitre: "Apprendre les langues",
            marque: "Apprendre",
            texte: "L'anglais pour commencer : {mots} mots en {themes} thèmes, du niveau A1 au C2, révisés au bon moment, des vidéos et des PDF où chaque mot se traduit d'un toucher, et ton propre dictionnaire. Ta progression te suit sur tous tes appareils avec ton compte.",
          },
        },
        {
          id: "bibliotheque",
          valeurs: {
            titre: "Les preuves de la véracité de l'islam",
            soustitre: "La bibliothèque",
            marque: "Lire",
            texte: "Les trois grands ensembles de la bibliothèque : la véracité de l'islam, la défense de l'islam et la réfutation des autres croyances. Articles, dossiers, sources et outils de lecture.",
          },
        },
        {
          id: "islam",
          valeurs: {
            titre: "L'Islam authentique",
            soustitre: "Vidéos",
            marque: "Regarder",
            texte: "Des vidéos qui expliquent chaque aspect de l'islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs : la croyance, les actes d'adoration et le comportement.",
          },
        },
      ],
    },
  ],
};

const CALAME: DefModule = {
  id: "calame",
  nom: "Le Calame",
  description: "L'atelier d'écriture : ses textes d'accueil, ses onglets, ses messages.",
  adresse: "/ecrire",
  accent: "or",
  sections: [
    {
      titre: "Présentation",
      champs: [
        { cle: "meta.titre", libelle: "Titre de l'onglet du navigateur", defaut: "Le Calame — atelier d'écriture" },
        { cle: "meta.description", libelle: "Description pour Google", defaut: "Un traitement de texte complet dans le navigateur : pages A4 réelles, styles, tableaux, images, frises et cartes mentales. Les documents te suivent sur tous tes appareils.", long: true },
        { cle: "premier", libelle: "Titre du tout premier document", defaut: "Mon premier document" },
      ],
    },
    {
      titre: "Colonne de gauche",
      champs: [
        { cle: "onglet.documents", libelle: "Onglet des documents", defaut: "Documents" },
        { cle: "onglet.plan", libelle: "Onglet du plan", defaut: "Plan" },
        { cle: "nouveau", libelle: "Bouton de création", defaut: "Nouveau" },
        { cle: "recherche", libelle: "Champ de recherche", defaut: "Chercher un document…" },
        { cle: "recherche.vide", libelle: "Recherche sans résultat", defaut: "Aucun document à ce nom." },
        { cle: "plan.vide", libelle: "Plan vide", defaut: "Le plan se remplit tout seul : donne des titres à tes parties (Grand titre, Titre moyen…) et elles apparaîtront ici.", long: true },
        { cle: "sansTitre", libelle: "Document sans titre", defaut: "Sans titre" },
      ],
    },
    {
      titre: "Messages",
      champs: [
        { cle: "attente", libelle: "Pendant l'ouverture", defaut: "Ouverture de l'atelier…" },
        {
          cle: "impossible",
          libelle: "Navigateur qui refuse le stockage",
          defaut: "Cet atelier garde tes documents dans la mémoire du navigateur, et ce navigateur ne le permet pas — souvent à cause d'une navigation privée ou d'un réglage de confidentialité. Rouvre la page dans une fenêtre ordinaire.",
          long: true,
        },
      ],
    },
  ],
  listes: [],
};

const ALAMBIC: DefModule = {
  id: "alambic",
  nom: "L'Alambic",
  description: "Le studio de fichiers : ses outils (nom, aide, ordre, présence) et ses textes de présentation.",
  adresse: "/alambic",
  accent: "amethyste",
  sections: [
    {
      titre: "Présentation",
      champs: [
        { cle: "meta.titre", libelle: "Titre de l'onglet du navigateur", defaut: "L'Alambic, studio de fichiers" },
        { cle: "meta.description", libelle: "Description pour Google", defaut: "Convertir, fusionner, découper et protéger tes fichiers, dans ton navigateur : documents, tableurs, images, sons, vidéos et archives. Rien n'est envoyé.", long: true },
        { cle: "tete.titre", libelle: "Nom dans la barre du haut", defaut: "L'Alambic" },
        { cle: "badge.local", libelle: "Pastille « rien n'est envoyé »", defaut: "Rien ne quitte ton appareil" },
        { cle: "badge.nuage", libelle: "Pastille de l'outil Transcrire", defaut: "Le son passe par Groq" },
      ],
    },
    {
      titre: "Colonne de droite",
      champs: [
        { cle: "formats", libelle: "Mot sous le nombre de formats", defaut: "formats" },
        { cle: "local.titre", libelle: "Carte « tout se fait ici » : titre", defaut: "Tout se fait ici" },
        { cle: "local.texte", libelle: "Carte « tout se fait ici » : texte", defaut: "Tes fichiers sont lus et transformés par ton propre appareil. Rien n'est envoyé, rien n'est gardé : ferme la page, il ne reste rien.", long: true },
        { cle: "nuage.titre", libelle: "Carte de Transcrire : titre", defaut: "Une exception, annoncée" },
        { cle: "nuage.texte", libelle: "Carte de Transcrire : texte", defaut: "Pour transcrire, le son est allégé ici puis envoyé à Groq, qui l'écoute avec Whisper. Les textes et leurs traductions sont rangés dans ta bibliothèque, qui te suit avec ton compte.", long: true },
      ],
    },
  ],
  listes: [
    {
      id: "outils",
      titre: "Les outils",
      aide: "Renomme un outil, change son texte d'aide ou sa place. Un outil masqué ou supprimé disparaît du menu (tu peux le remettre).",
      nom: "nom",
      champs: [
        { cle: "nom", libelle: "Nom" },
        { cle: "aide", libelle: "Texte d'aide" },
      ],
      elements: [
        { id: "convertir", valeurs: { nom: "Convertir", aide: "D'un format à l'autre, dans les deux sens" } },
        { id: "fusionner", valeurs: { nom: "Fusionner", aide: "Plusieurs fichiers, un seul PDF" } },
        { id: "decouper", valeurs: { nom: "Découper", aide: "Des pages, ou un passage d'un son, d'une vidéo" } },
        { id: "proteger", valeurs: { nom: "Protéger", aide: "Un mot de passe, chiffré en AES-256" } },
        { id: "transcrire", valeurs: { nom: "Transcrire", aide: "Un son ou une vidéo devient un livre à lire" } },
      ],
    },
  ],
};

const LANGUES: DefModule = {
  id: "langues",
  nom: "Le Truchement",
  description: "L'espace pour apprendre l'anglais : ses textes, ses onglets, l'objectif du jour, et tout le vocabulaire (thèmes et mots).",
  adresse: "/langues",
  accent: "azur",
  vocabulaire: true,
  sections: [
    {
      titre: "Présentation",
      champs: [
        { cle: "meta.titre", libelle: "Titre de l'onglet du navigateur", defaut: "Le Truchement, apprendre l'anglais" },
        {
          cle: "meta.description",
          libelle: "Description pour Google",
          defaut: "Apprendre l'anglais depuis le français : {mots} mots en {themes} thèmes, du niveau A1 au C2, révisés au bon moment, des vidéos et des PDF où chaque mot se traduit d'un toucher, et ton dictionnaire personnel. Ta progression te suit sur tous tes appareils.",
          aide: "{mots} et {themes} sont remplacés par les nombres réels.",
          long: true,
        },
        { cle: "tete.titre", libelle: "Nom dans la barre du haut", defaut: "Le Truchement" },
        { cle: "tete.langues", libelle: "Pastille des langues", defaut: "Anglais › français" },
        { cle: "objectif", libelle: "Objectif de révisions par jour", defaut: "20", nombre: { min: 5, max: 200 } },
      ],
    },
    {
      titre: "Aujourd'hui",
      champs: [
        { cle: "accueil.motDuJour", libelle: "Titre du mot du jour", defaut: "Le mot du jour" },
        { cle: "accueil.journee", libelle: "Titre du suivi du jour", defaut: "Ta journée" },
        { cle: "accueil.reprendre", libelle: "Titre « reprendre »", defaut: "Reprendre" },
        { cle: "accueil.themes", libelle: "Titre des thèmes", defaut: "Tes thèmes" },
        { cle: "accueil.dico", libelle: "Carte du dictionnaire : titre", defaut: "Mon dictionnaire" },
        { cle: "accueil.dicoVide", libelle: "Carte du dictionnaire : texte (dictionnaire vide)", defaut: "Range ici les mots rencontrés dans les vidéos et les PDF." },
      ],
    },
    {
      titre: "Vocabulaire",
      champs: [
        { cle: "vocabulaire.titre", libelle: "Titre", defaut: "Vocabulaire" },
        {
          cle: "vocabulaire.chapo",
          libelle: "Introduction",
          defaut: "{mots} mots et expressions du quotidien, en {themes} thèmes, du niveau A1 au C2. Chaque mot revient au moment où ta mémoire allait le perdre.",
          long: true,
          aide: "{mots} et {themes} sont remplacés par les nombres réels.",
        },
      ],
    },
    {
      titre: "Écouter",
      champs: [
        { cle: "ecouter.titre", libelle: "Titre", defaut: "Écouter" },
        { cle: "ecouter.chapo", libelle: "Introduction", defaut: "Une vidéo ou un son en anglais ou en français devient une leçon : sous-titres synchronisés, chaque mot traduit d'un toucher dans l'autre langue, et les mots utiles rangés dans ton dictionnaire.", long: true },
        { cle: "ecouter.lien", libelle: "Champ du lien", defaut: "Colle un lien YouTube" },
        { cle: "ecouter.vide", libelle: "Aucune vidéo", defaut: "Rien pour l'instant. Commence par une vidéo courte (5 à 10 minutes) que tu aimerais comprendre : une conférence, un reportage, un entretien.", long: true },
      ],
    },
    {
      titre: "Lire",
      champs: [
        { cle: "lire.titre", libelle: "Titre", defaut: "Lire" },
        { cle: "lire.chapo", libelle: "Introduction", defaut: "Un livre, un article ou un cours en PDF, mis en page pour la lecture. Touche un mot pour sa traduction, sélectionne un passage pour le traduire en entier.", long: true },
        { cle: "lire.depot", libelle: "Zone de dépôt", defaut: "Choisis ou dépose un PDF" },
        { cle: "lire.vide", libelle: "Aucune lecture", defaut: "Aucune lecture pour l'instant. Un texte un peu en dessous de ton niveau est idéal : tu comprends l'essentiel, et chaque mot nouveau se retient mieux.", long: true },
      ],
    },
    {
      titre: "Dictionnaire",
      champs: [
        { cle: "dico.titre", libelle: "Titre", defaut: "Mon dictionnaire" },
        { cle: "dico.vide", libelle: "Dictionnaire vide", defaut: "Ton dictionnaire est vide. Dans une vidéo ou un PDF, touche un mot puis « Ajouter au dictionnaire » ; dans un thème, utilise le signet à côté de chaque mot.", long: true },
      ],
    },
  ],
  listes: [
    {
      id: "onglets",
      titre: "Les onglets",
      aide: "Renomme un onglet, change sa place, ou masque-le. Il en faut au moins un.",
      nom: "nom",
      champs: [{ cle: "nom", libelle: "Nom" }],
      elements: [
        { id: "accueil", valeurs: { nom: "Aujourd'hui" } },
        { id: "vocabulaire", valeurs: { nom: "Vocabulaire" } },
        { id: "ecouter", valeurs: { nom: "Écouter" } },
        { id: "lire", valeurs: { nom: "Lire" } },
        { id: "dictionnaire", valeurs: { nom: "Dictionnaire" } },
        { id: "regles", valeurs: { nom: "Règles" } },
      ],
    },
  ],
};

export const MODULES: Record<ModuleId, DefModule> = { accueil: ACCUEIL, calame: CALAME, alambic: ALAMBIC, langues: LANGUES };
export const estModule = (id: string): id is ModuleId => (IDS_MODULES as string[]).includes(id);

export const ICONES_DISPONIBLES = ["Users", "Plane", "Briefcase", "Sun", "UtensilsCrossed", "HeartPulse", "House", "Smile", "CloudSun", "GraduationCap", "Building2", "Trees", "BookOpen", "Moon", "Star", "Globe", "Music", "Car", "ShoppingBag", "Dumbbell", "Landmark", "Laptop", "Leaf", "Heart", "Clapperboard", "Coffee", "Cpu", "Factory", "Hammer", "Lightbulb", "MapPin", "Newspaper", "Plug", "ShieldCheck", "Sparkles", "Sprout", "Tent", "Trophy", "UserRound", "Vote", "Wallet", "Zap", "PersonStanding", "Shirt", "PawPrint", "Scale", "TrendingUp", "Brain", "Clock", "Puzzle", "Quote", "Link2", "Activity", "Palette", "Feather", "Blocks", "Shapes", "Gauge", "Gem"];
export const NIVEAUX_MOTS: Niveau[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const NATURES_MOTS = ["nom", "verbe", "adjectif", "adverbe", "expression", "préposition", "pronom", "conjonction", "déterminant"] as const;

export const themesDOrigine = (): ThemeEdite[] => THEMES.map((t) => ({ id: t.id, nom: t.nom, description: t.description, icone: t.icone, visible: true, entrees: t.entrees }));

/**
 * Le vocabulaire tel qu'il s'affiche : les thèmes modifiés par le créateur, complétés des thèmes et des mots
 * ajoutés au code depuis leur publication. Ce qui a été retiré exprès (liste « retires », ou corbeille) ne revient pas.
 */
export function themesComplets(c: Contenu): ThemeEdite[] {
  const origine = themesDOrigine();
  if (!c.themes) return origine;
  const retires = new Set(c.retires ?? []);
  for (const s of c.corbeille) {
    if (s.type === "theme") retires.add(s.donnees.id);
    else if (s.type === "mot") retires.add(s.donnees.id);
  }
  const parId = new Map(origine.map((t) => [t.id, t]));
  const sortie = c.themes.map((t) => {
    const o = parId.get(t.id);
    if (!o) return t;
    const presents = new Set(t.entrees.map((e) => e.id));
    const ajouts = o.entrees.filter((e) => !presents.has(e.id) && !retires.has(e.id));
    return ajouts.length ? { ...t, entrees: [...t.entrees, ...ajouts] } : t;
  });
  const connus = new Set(c.themes.map((t) => t.id));
  for (const o of origine) if (!connus.has(o.id) && !retires.has(o.id)) sortie.push(o);
  return sortie;
}

/* ---------- Résolution : ce que voit le visiteur ---------- */

export type Resolu = {
  textes: Record<string, string>;
  listes: Record<string, { id: string; valeurs: Record<string, string> }[]>;
  themes?: Theme[];
};

/** La liste telle qu'enregistrée, complétée des éléments d'origine qu'elle ne connaît pas encore (ajoutés au code depuis). */
export function listeComplete(def: DefListe, c: Contenu): ElementListe[] {
  const gardee = c.listes[def.id];
  const enCorbeille = new Set(c.corbeille.filter((s) => s.type === "element" && s.liste === def.id).map((s) => (s.donnees as ElementListe).id));
  const base: ElementListe[] = gardee ? gardee.filter((e) => def.elements.some((d) => d.id === e.id)) : [];
  for (const d of def.elements) if (!base.some((e) => e.id === d.id) && !enCorbeille.has(d.id)) base.push({ id: d.id, visible: true, valeurs: {} });
  return base;
}

export function valeurElement(def: DefListe, e: ElementListe, cle: string): string {
  const v = e.valeurs[cle];
  return v !== undefined && v.trim() !== "" ? v : (def.elements.find((d) => d.id === e.id)?.valeurs[cle] ?? "");
}

export function resoudre(id: ModuleId, c: Contenu | null): Resolu {
  const def = MODULES[id];
  const contenu = c ?? contenuVide();
  const textes: Record<string, string> = {};
  for (const s of def.sections) for (const ch of s.champs) textes[ch.cle] = contenu.textes[ch.cle]?.trim() ? contenu.textes[ch.cle] : ch.defaut;
  const listes: Resolu["listes"] = {};
  for (const l of def.listes) {
    listes[l.id] = listeComplete(l, contenu)
      .filter((e) => e.visible)
      .map((e) => ({ id: e.id, valeurs: Object.fromEntries(l.champs.map((ch) => [ch.cle, valeurElement(l, e, ch.cle)])) }));
  }
  const r: Resolu = { textes, listes };
  if (def.vocabulaire) {
    r.themes = themesComplets(contenu).filter((t) => t.visible).map((t) => ({ id: t.id, nom: t.nom, description: t.description, icone: t.icone, entrees: t.entrees }));
  }
  return r;
}

/** Remplace {nom} par sa valeur. */
export const remplir = (texte: string, vars?: Record<string, string | number>) => (vars ? texte.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : texte);

/* ---------- Nettoyage : ce que le serveur accepte ---------- */

const chaine = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\u0000/g, "").slice(0, max) : "");
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

function nettoyerEntree(brut: unknown, themeId: string): Entree | null {
  const o = (brut ?? {}) as Record<string, unknown>;
  const en = chaine(o.en, 200).trim();
  const fr = chaine(o.fr, 300).trim();
  if (!en || !fr) return null;
  const id = chaine(o.id, 140);
  const nature = (NATURES_MOTS as readonly string[]).includes(String(o.nature)) ? (o.nature as Entree["nature"]) : "nom";
  const niveau = NIVEAUX_MOTS.includes(o.niveau as Niveau) ? (o.niveau as Niveau) : "A1";
  return {
    id: /^[a-z0-9-]+:[a-z0-9-]+$/.test(id) ? id : `${themeId}:${slug(en) || "mot"}`,
    en,
    fr,
    nature,
    niveau,
    api: chaine(o.api, 120).trim(),
    exEn: chaine(o.exEn, 400).trim(),
    exFr: chaine(o.exFr, 400).trim(),
  };
}

function nettoyerTheme(brut: unknown): ThemeEdite | null {
  const o = (brut ?? {}) as Record<string, unknown>;
  const id = slug(chaine(o.id, 60));
  const nom = chaine(o.nom, 120).trim();
  if (!id || !nom) return null;
  const vus = new Set<string>();
  const entrees: Entree[] = [];
  for (const e of Array.isArray(o.entrees) ? o.entrees.slice(0, 3000) : []) {
    const n = nettoyerEntree(e, id);
    if (!n || vus.has(n.id)) continue;
    vus.add(n.id);
    entrees.push(n);
  }
  return {
    id,
    nom,
    description: chaine(o.description, 400).trim(),
    icone: ICONES_DISPONIBLES.includes(String(o.icone)) ? String(o.icone) : "BookOpen",
    visible: o.visible !== false,
    entrees,
  };
}

function nettoyerElement(def: DefListe, brut: unknown): ElementListe | null {
  const o = (brut ?? {}) as Record<string, unknown>;
  const id = String(o.id ?? "");
  if (!def.elements.some((d) => d.id === id)) return null;
  const v = (o.valeurs ?? {}) as Record<string, unknown>;
  const valeurs: Record<string, string> = {};
  for (const ch of def.champs) if (typeof v[ch.cle] === "string") valeurs[ch.cle] = chaine(v[ch.cle], ch.long ? 2000 : 300);
  return { id, visible: o.visible !== false, valeurs };
}

/** Ramène n'importe quel objet reçu à un contenu sûr pour ce module. */
export function nettoyerContenu(id: ModuleId, brut: unknown): Contenu {
  const def = MODULES[id];
  const o = (brut ?? {}) as Record<string, unknown>;
  const c = contenuVide();
  const t = (o.textes ?? {}) as Record<string, unknown>;
  for (const s of def.sections)
    for (const ch of s.champs) {
      if (typeof t[ch.cle] !== "string") continue;
      let v = chaine(t[ch.cle], ch.long ? 4000 : 400);
      if (ch.nombre) {
        const n = Math.round(Number(v));
        v = Number.isFinite(n) ? String(Math.min(ch.nombre.max, Math.max(ch.nombre.min, n))) : "";
      }
      if (v.trim() && v !== ch.defaut) c.textes[ch.cle] = v;
    }
  const listes = (o.listes ?? {}) as Record<string, unknown>;
  for (const l of def.listes) {
    if (!Array.isArray(listes[l.id])) continue;
    const vus = new Set<string>();
    c.listes[l.id] = (listes[l.id] as unknown[]).map((e) => nettoyerElement(l, e)).filter((e): e is ElementListe => e !== null && !vus.has(e.id) && Boolean(vus.add(e.id)));
  }
  if (def.vocabulaire && Array.isArray(o.themes)) {
    const vus = new Set<string>();
    c.themes = (o.themes as unknown[])
      .slice(0, 80)
      .map(nettoyerTheme)
      .filter((x): x is ThemeEdite => x !== null && !vus.has(x.id) && Boolean(vus.add(x.id)));
  }
  if (def.vocabulaire && Array.isArray(o.retires)) {
    const r = [...new Set((o.retires as unknown[]).filter((x): x is string => typeof x === "string" && /^[a-z0-9-]+(:[a-z0-9-]+)?$/.test(x)))].slice(0, 10000);
    if (r.length) c.retires = r;
  }
  for (const s of Array.isArray(o.corbeille) ? (o.corbeille as unknown[]).slice(-300) : []) {
    const x = (s ?? {}) as Record<string, unknown>;
    const base = { id: chaine(x.id, 60) || `${Date.now()}`, libelle: chaine(x.libelle, 200), le: Number(x.le) || Date.now(), position: Math.max(0, Number(x.position) || 0) };
    if (x.type === "element") {
      const l = def.listes.find((d) => d.id === x.liste);
      const e = l && nettoyerElement(l, x.donnees);
      if (l && e) c.corbeille.push({ ...base, type: "element", liste: l.id, donnees: e });
    } else if (x.type === "theme" && def.vocabulaire) {
      const th = nettoyerTheme(x.donnees);
      if (th) c.corbeille.push({ ...base, type: "theme", donnees: th });
    } else if (x.type === "mot" && def.vocabulaire) {
      const theme = slug(chaine(x.theme, 60));
      const e = nettoyerEntree(x.donnees, theme);
      if (theme && e) c.corbeille.push({ ...base, type: "mot", theme, donnees: e });
    }
  }
  return c;
}

/** Deux contenus disent-ils la même chose ? (pour savoir s'il reste des modifications à publier). */
export const memeContenu = (a: Contenu | null, b: Contenu | null) => JSON.stringify(a ?? contenuVide()) === JSON.stringify(b ?? contenuVide());
