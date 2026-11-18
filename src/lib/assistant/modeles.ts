/*
 * L'Assistant : les IA proposées (Claude, ChatGPT, Gemini), leurs modèles, les niveaux d'effort,
 * les tarifs et l'estimation des jetons. Module partagé entre le serveur et le navigateur ;
 * il ne touche ni à la base ni au réseau.
 *
 * Les tarifs servent seulement à AFFICHER une estimation : la facture qui fait foi est celle du
 * compte de l'utilisateur chez Anthropic, OpenAI ou Google. Dollars par million de jetons,
 * relevés en novembre 2026 (pages de tarifs d'Anthropic et d'OpenAI ; comparateur pour Gemini).
 */

export type Fournisseur = "anthropic" | "openai" | "google";
export const FOURNISSEURS_IDS: Fournisseur[] = ["anthropic", "openai", "google"];

export type InfoFournisseur = {
  id: Fournisseur;
  /** Le nom que tout le monde connaît. */
  nom: string;
  entreprise: string;
  console: string;
  pageCle: string;
  pageCredit: string;
  /** Exemple de début de clé, pour l'aide du champ. */
  exemple: string;
  etapes: string[];
};

export const FOURNISSEURS: InfoFournisseur[] = [
  {
    id: "anthropic",
    nom: "Claude",
    entreprise: "Anthropic",
    console: "https://platform.claude.com",
    pageCle: "https://platform.claude.com/settings/keys",
    pageCredit: "https://platform.claude.com/settings/billing",
    exemple: "sk-ant-api03-…",
    etapes: [
      "Ouvre la console Anthropic et connecte-toi (choisis « Individuel » si on te le demande).",
      "Ajoute du crédit (page « Billing ») : 5 $ suffisent pour commencer.",
      "Crée une clé (page « API keys ») et colle-la ci-dessous.",
    ],
  },
  {
    id: "openai",
    nom: "ChatGPT",
    entreprise: "OpenAI",
    console: "https://platform.openai.com",
    pageCle: "https://platform.openai.com/api-keys",
    pageCredit: "https://platform.openai.com/settings/organization/billing",
    exemple: "sk-proj-…",
    etapes: [
      "Ouvre la plateforme OpenAI (ce n'est pas l'abonnement ChatGPT Plus) et connecte-toi.",
      "Ajoute du crédit (page « Billing ») : 5 $ suffisent pour commencer.",
      "Crée une clé (page « API keys ») et colle-la ci-dessous.",
    ],
  },
  {
    id: "google",
    nom: "Gemini",
    entreprise: "Google",
    console: "https://aistudio.google.com",
    pageCle: "https://aistudio.google.com/apikey",
    pageCredit: "https://aistudio.google.com/usage",
    exemple: "AQ.Ab…",
    etapes: [
      "Ouvre Google AI Studio et connecte-toi avec ton compte Google.",
      "Clique sur « Get API key », puis « Create API key ».",
      "Colle la clé ci-dessous. Sans facturation activée, Google offre un usage gratuit limité ; pour plus, active la facturation dans AI Studio.",
    ],
  },
];

export function fournisseurValide(v: unknown): Fournisseur | null {
  return FOURNISSEURS_IDS.includes(v as Fournisseur) ? (v as Fournisseur) : null;
}

export function infoFournisseur(f: Fournisseur): InfoFournisseur {
  return FOURNISSEURS.find((x) => x.id === f) ?? FOURNISSEURS[0];
}

type Tarif = { entree: number; ecritureCache: number; lectureCache: number; sortie: number };

export type Modele = {
  id: string;
  fournisseur: Fournisseur;
  nom: string;
  role: string;
  /** Tarif normal ; certains modèles passent à un tarif « long » au-delà d'un seuil d'invite. */
  tarif: Tarif;
  tarifLong?: { seuil: number } & Tarif;
  /** Le modèle conseillé pour cette IA. */
  conseille?: boolean;
};

export const MODELES: Modele[] = [
  // Anthropic (claude.com/pricing)
  { id: "claude-sonnet-5-5", fournisseur: "anthropic", nom: "Claude Sonnet 5.5", role: "Recommandé : rapide et très capable", conseille: true, tarif: { entree: 2, ecritureCache: 2.5, lectureCache: 0.1, sortie: 10 } },
  {
    id: "claude-haiku-5-5",
    fournisseur: "anthropic",
    nom: "Claude Haiku 5.5",
    role: "Le plus rapide et le plus économique",
    tarif: { entree: 0.1, ecritureCache: 0.125, lectureCache: 0.01, sortie: 0.5 },
    tarifLong: { seuil: 100_000, entree: 0.5, ecritureCache: 0.625, lectureCache: 0.05, sortie: 2.5 },
  },
  { id: "claude-opus-5-5", fournisseur: "anthropic", nom: "Claude Opus 5.5", role: "Le plus approfondi, pour les questions difficiles", tarif: { entree: 4, ecritureCache: 5, lectureCache: 0.2, sortie: 20 } },
  // OpenAI (developers.openai.com/api/docs/pricing) : le cache est automatique, son écriture n'est pas facturée à part.
  { id: "gpt-6.2-sol", fournisseur: "openai", nom: "GPT-6.2 Sol", role: "Recommandé : le modèle polyvalent d'OpenAI", conseille: true, tarif: { entree: 2, ecritureCache: 2, lectureCache: 0.1, sortie: 10 } },
  { id: "gpt-6-luna", fournisseur: "openai", nom: "GPT-6 Luna", role: "Le plus rapide et le plus économique", tarif: { entree: 0.1, ecritureCache: 0.1, lectureCache: 0.01, sortie: 0.5 } },
  { id: "gpt-6.2-astra", fournisseur: "openai", nom: "GPT-6.2 Astra", role: "Le plus approfondi, pour les questions difficiles", tarif: { entree: 8, ecritureCache: 8, lectureCache: 0.4, sortie: 40 } },
  // Google (tarifs du Gemini API ; cache implicite)
  { id: "gemini-3.8-flash", fournisseur: "google", nom: "Gemini 3.8 Flash", role: "Recommandé : rapide et capable", conseille: true, tarif: { entree: 0.75, ecritureCache: 0.75, lectureCache: 0.075, sortie: 3.75 } },
  { id: "gemini-3.5-flash-lite", fournisseur: "google", nom: "Gemini 3.5 Flash-Lite", role: "Le plus économique", tarif: { entree: 0.3, ecritureCache: 0.3, lectureCache: 0.03, sortie: 2.5 } },
  {
    id: "gemini-3.1-pro-preview",
    fournisseur: "google",
    nom: "Gemini 3.1 Pro",
    role: "Le plus approfondi, pour les questions difficiles",
    tarif: { entree: 2, ecritureCache: 2, lectureCache: 0.2, sortie: 12 },
    tarifLong: { seuil: 200_000, entree: 4, ecritureCache: 4, lectureCache: 0.4, sortie: 18 },
  },
];

export type IdModele = string;
export const MODELE_PAR_DEFAUT: IdModele = "claude-sonnet-5-5";

export function modeleValide(valeur: unknown): IdModele | null {
  return MODELES.some((m) => m.id === valeur) ? (valeur as IdModele) : null;
}

export function modele(id: string): Modele {
  return MODELES.find((m) => m.id === id) ?? MODELES[0];
}

/** Le nom à afficher, même pour un modèle qui n'est plus proposé. */
export function nomModele(id: string): string {
  return MODELES.find((m) => m.id === id)?.nom ?? id;
}

export function modelesDe(f: Fournisseur): Modele[] {
  return MODELES.filter((m) => m.fournisseur === f);
}

export function modeleConseille(f: Fournisseur): Modele {
  const liste = modelesDe(f);
  return liste.find((m) => m.conseille) ?? liste[0];
}

/** Effort de réflexion et longueur maximale de réponse (chaque IA a son paramètre, voir fournisseurs/). */
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
 * Estimation du nombre de jetons d'un texte, sans appel réseau : environ 2,5 caractères par jeton,
 * une valeur un peu prudente pour le français, valable pour les trois IA.
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

/* ---------- Les clés : format, contrôlé aussi dans le navigateur pour un retour immédiat ---------- */

export type VerdictFormat = { ok: true; cle: string } | { ok: false; message: string };

export function controlerFormatCle(fournisseur: Fournisseur, brut: unknown): VerdictFormat {
  const cle = typeof brut === "string" ? brut.trim() : "";
  if (!cle) return { ok: false, message: "Colle ta clé API." };
  if (/\s/.test(cle) || cle.length > 400) return { ok: false, message: "Cette clé contient des espaces ou est trop longue : recopie-la telle quelle." };
  if (fournisseur === "anthropic") {
    if (/^sk-ant-admin/i.test(cle)) return { ok: false, message: "C'est une clé d'administration : elle donne la main sur toute ton organisation. Crée plutôt une clé API ordinaire." };
    if (/^sk-ant-(oat|ort|sid)/i.test(cle)) {
      return { ok: false, message: "Ce jeton vient d'un abonnement Claude (Pro, Max…). Anthropic interdit de l'utiliser dans une autre application : il faut une clé API de la console." };
    }
    if (!/^sk-ant-api\d{2}-[A-Za-z0-9_-]{20,300}$/.test(cle)) return { ok: false, message: "Ce n'est pas une clé API Anthropic. Elle commence par « sk-ant-api » et se copie dans la console (platform.claude.com)." };
  } else if (fournisseur === "openai") {
    if (/^sk-admin-/i.test(cle)) return { ok: false, message: "C'est une clé d'administration OpenAI : crée plutôt une clé API ordinaire (page « API keys »)." };
    if (!/^sk-[A-Za-z0-9_-]{20,380}$/.test(cle) || /^sk-ant-/.test(cle)) return { ok: false, message: "Ce n'est pas une clé API OpenAI. Elle commence par « sk- » (souvent « sk-proj- ») et se copie sur platform.openai.com." };
  } else if (!/^[A-Za-z0-9._-]{30,200}$/.test(cle) || /^sk-/.test(cle)) {
    return { ok: false, message: "Ce n'est pas une clé Gemini. Elle commence par « AQ. » (ou « AIza » pour les anciennes) et se copie dans Google AI Studio." };
  }
  return { ok: true, cle };
}

/** Ce que l'utilisateur voit de sa clé une fois enregistrée : jamais la clé entière. */
export function masquerCle(cle: string): string {
  const debut = cle.startsWith("sk-ant-") ? "sk-ant-" : cle.startsWith("sk-proj-") ? "sk-proj-" : cle.startsWith("sk-") ? "sk-" : cle.slice(0, 4);
  return `${debut}…${cle.slice(-4)}`;
}
