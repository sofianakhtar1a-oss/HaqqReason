/*
 * L'Assistant : modèles proposés, niveaux d'effort, tarifs et estimation des jetons.
 * Module partagé entre le serveur et le navigateur ; il ne touche ni à la base ni au réseau.
 *
 * Les tarifs servent seulement à AFFICHER une estimation à l'utilisateur : la facture qui fait
 * foi est celle de son compte Anthropic. Tarifs publics de novembre 2026, en dollars par million
 * de jetons (https://platform.claude.com/docs/en/about-claude/pricing).
 */

export type IdModele = "claude-haiku-5-5" | "claude-sonnet-5-5" | "claude-opus-5-5";

type Tarif = { entree: number; ecritureCache: number; lectureCache: number; sortie: number };

export type Modele = {
  id: IdModele;
  nom: string;
  role: string;
  /** Tarif normal ; Haiku 5.5 passe au tarif « long » quand l'invite dépasse 100 000 jetons. */
  tarif: Tarif;
  tarifLong?: { seuil: number } & Tarif;
};

export const MODELES: Modele[] = [
  {
    id: "claude-sonnet-5-5",
    nom: "Sonnet 5.5",
    role: "Recommandé : rapide et très capable",
    tarif: { entree: 2, ecritureCache: 2.5, lectureCache: 0.1, sortie: 10 },
  },
  {
    id: "claude-haiku-5-5",
    nom: "Haiku 5.5",
    role: "Le plus rapide et le plus économique",
    tarif: { entree: 0.1, ecritureCache: 0.125, lectureCache: 0.01, sortie: 0.5 },
    tarifLong: { seuil: 100_000, entree: 0.5, ecritureCache: 0.625, lectureCache: 0.05, sortie: 2.5 },
  },
  {
    id: "claude-opus-5-5",
    nom: "Opus 5.5",
    role: "Le plus approfondi, pour les questions difficiles",
    tarif: { entree: 4, ecritureCache: 5, lectureCache: 0.2, sortie: 20 },
  },
];

export const MODELE_PAR_DEFAUT: IdModele = "claude-sonnet-5-5";

export function modeleValide(valeur: unknown): IdModele | null {
  return MODELES.some((m) => m.id === valeur) ? (valeur as IdModele) : null;
}

export function modele(id: string): Modele {
  return MODELES.find((m) => m.id === id) ?? MODELES[0];
}

/** Effort de réflexion (paramètre output_config.effort de l'API) et longueur maximale de réponse. */
export type Effort = "low" | "medium" | "high";
export const EFFORTS: { id: Effort; nom: string; aide: string; maxJetons: number }[] = [
  { id: "low", nom: "Rapide", aide: "Réponses directes, les moins coûteuses", maxJetons: 8_192 },
  { id: "medium", nom: "Équilibré", aide: "Le bon réglage pour la plupart des questions", maxJetons: 16_000 },
  { id: "high", nom: "Approfondi", aide: "Plus de réflexion avant de répondre (plus long, plus cher)", maxJetons: 32_000 },
];
export const EFFORT_PAR_DEFAUT: Effort = "medium";

export function effortValide(valeur: unknown): Effort | null {
  return EFFORTS.some((e) => e.id === valeur) ? (valeur as Effort) : null;
}

export type Usage = {
  entree: number;
  sortie: number;
  ecritureCache: number;
  lectureCache: number;
};

export const USAGE_VIDE: Usage = { entree: 0, sortie: 0, ecritureCache: 0, lectureCache: 0 };

/** Coût estimé d'un appel, en dollars. */
export function coutEstime(id: string, u: Usage): number {
  const m = modele(id);
  const invite = u.entree + u.ecritureCache + u.lectureCache;
  const t = m.tarifLong && invite > m.tarifLong.seuil ? m.tarifLong : m.tarif;
  const cout = (u.entree * t.entree + u.ecritureCache * t.ecritureCache + u.lectureCache * t.lectureCache + u.sortie * t.sortie) / 1_000_000;
  return Math.round(cout * 1_000_000) / 1_000_000;
}

/**
 * Estimation du nombre de jetons d'un texte, sans appel réseau.
 * Le tokenizer actuel de Claude compte environ 2,5 caractères par jeton (1 million de jetons ≈ 2,5 millions
 * de caractères) : on retient cette valeur, un peu prudente pour le français.
 */
export function estimerJetons(texte: string | number): number {
  const n = typeof texte === "number" ? texte : texte.length;
  return Math.ceil(n / 2.5);
}

/** « 0,0042 $ », « 1,25 $ » : assez de chiffres pour les petites sommes. */
export function formaterCout(usd: number): string {
  const chiffres = usd === 0 ? 2 : usd < 0.01 ? 4 : usd < 1 ? 3 : 2;
  return `${usd.toLocaleString("fr-FR", { minimumFractionDigits: chiffres, maximumFractionDigits: chiffres })} $`;
}

export function formaterJetons(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (n >= 10_000) return `${Math.round(n / 1000).toLocaleString("fr-FR")} k`;
  return n.toLocaleString("fr-FR");
}

/* ---------- La clé API : format, contrôlé aussi dans le navigateur pour un retour immédiat ---------- */

export type VerdictFormat = { ok: true; cle: string } | { ok: false; message: string };

/** Une clé de la console Anthropic : « sk-ant-api03-… ». Les clés d'administration et les jetons d'abonnement sont refusés. */
export function controlerFormatCle(brut: unknown): VerdictFormat {
  const cle = typeof brut === "string" ? brut.trim() : "";
  if (!cle) return { ok: false, message: "Colle ta clé API." };
  if (/^sk-ant-admin/i.test(cle)) {
    return { ok: false, message: "C'est une clé d'administration : elle donne la main sur toute ton organisation. Crée plutôt une clé API ordinaire." };
  }
  if (/^sk-ant-(oat|ort|sid)/i.test(cle)) {
    return {
      ok: false,
      message: "Ce jeton vient d'un abonnement Claude (Pro, Max…). Anthropic interdit de l'utiliser dans une autre application : il faut une clé API de la console.",
    };
  }
  if (!/^sk-ant-api\d{2}-[A-Za-z0-9_-]{20,300}$/.test(cle)) {
    return { ok: false, message: "Ce n'est pas une clé API Anthropic. Elle commence par « sk-ant-api » et se copie dans la console (platform.claude.com)." };
  }
  return { ok: true, cle };
}

/** Ce que l'utilisateur voit de sa clé une fois enregistrée : jamais la clé entière. */
export function masquerCle(cle: string): string {
  return `sk-ant-…${cle.slice(-4)}`;
}
