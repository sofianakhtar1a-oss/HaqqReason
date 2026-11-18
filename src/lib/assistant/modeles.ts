/*
 * L'Assistant : les IA proposées (Claude, ChatGPT, Gemini), les modèles de la passerelle IA de
 * Vercel qui les servent, leurs tarifs et l'estimation des jetons. Module partagé entre le serveur
 * et le navigateur ; il ne touche ni à la base ni au réseau.
 *
 * Personne n'a de clé à fournir : le site passe par la passerelle IA de Vercel (voir passerelle.ts),
 * et la dépense est prise sur son crédit gratuit. Les tarifs servent seulement à ESTIMER la part de
 * ce crédit que chaque compte consomme (son quota du mois). Dollars par million de jetons, relevés
 * sur les pages des modèles de la passerelle (vercel.com/ai-gateway/models) en novembre 2026.
 */

export type Fournisseur = "anthropic" | "openai" | "google";
export const FOURNISSEURS_IDS: Fournisseur[] = ["anthropic", "openai", "google"];

export type InfoFournisseur = { id: Fournisseur; nom: string; entreprise: string };

export const FOURNISSEURS: InfoFournisseur[] = [
  { id: "anthropic", nom: "Claude", entreprise: "Anthropic" },
  { id: "openai", nom: "ChatGPT", entreprise: "OpenAI" },
  { id: "google", nom: "Gemini", entreprise: "Google" },
];

/** L'IA proposée d'abord à un nouveau compte. */
export const IA_PAR_DEFAUT: Fournisseur = "openai";

export function fournisseurValide(v: unknown): Fournisseur | null {
  return FOURNISSEURS_IDS.includes(v as Fournisseur) ? (v as Fournisseur) : null;
}

export function infoFournisseur(f: Fournisseur): InfoFournisseur {
  return FOURNISSEURS.find((x) => x.id === f) ?? FOURNISSEURS[0];
}

type Tarif = { entree: number; ecritureCache: number; lectureCache: number; sortie: number };

export type ModelePasserelle = { id: string; fournisseur: Fournisseur; nom: string; tarif: Tarif };

/** Les modèles que le Vizir peut demander à la passerelle (identifiants « fournisseur/modèle »). */
export const MODELES: ModelePasserelle[] = [
  { id: "anthropic/claude-haiku-5.5", fournisseur: "anthropic", nom: "Claude Haiku 5.5", tarif: { entree: 0.1, ecritureCache: 0.125, lectureCache: 0.01, sortie: 0.5 } },
  { id: "openai/gpt-6-luna", fournisseur: "openai", nom: "GPT-6 Luna", tarif: { entree: 0.1, ecritureCache: 0.1, lectureCache: 0.01, sortie: 0.5 } },
  { id: "openai/gpt-5.4-mini", fournisseur: "openai", nom: "GPT-5.4 mini", tarif: { entree: 0.75, ecritureCache: 0.75, lectureCache: 0.075, sortie: 4.5 } },
  { id: "openai/gpt-5.4-nano", fournisseur: "openai", nom: "GPT-5.4 nano", tarif: { entree: 0.2, ecritureCache: 0.2, lectureCache: 0.02, sortie: 1.25 } },
  { id: "google/gemini-3.5-flash-lite", fournisseur: "google", nom: "Gemini 3.5 Flash-Lite", tarif: { entree: 0.3, ecritureCache: 0.3, lectureCache: 0.03, sortie: 2.5 } },
  { id: "google/gemini-2.5-flash", fournisseur: "google", nom: "Gemini 2.5 Flash", tarif: { entree: 0.3, ecritureCache: 0.3, lectureCache: 0.03, sortie: 2.5 } },
];

/**
 * Pour chaque IA, les modèles essayés dans l'ordre : le meilleur rapport qualité-prix d'abord, puis
 * un modèle que l'offre gratuite de la passerelle sert à coup sûr. Un modèle refusé (offre gratuite,
 * modèle retiré) est sauté, et la réponse dit quel modèle a répondu.
 */
export const CANDIDATS: Record<Fournisseur, string[]> = {
  anthropic: ["anthropic/claude-haiku-5.5"],
  openai: ["openai/gpt-6-luna", "openai/gpt-5.4-mini", "openai/gpt-5.4-nano"],
  google: ["google/gemini-3.5-flash-lite", "google/gemini-2.5-flash"],
};

/** Longueur maximale d'une réponse, en jetons. */
export const MAX_JETONS_REPONSE = 8_000;

/** Les noms des modèles des anciennes réponses (quand chacun reliait sa clé). */
const ANCIENS: Record<string, string> = {
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
  "claude-opus-5-5": "Claude Opus 5.5",
  "gpt-6.2-sol": "GPT-6.2 Sol",
  "gpt-6-luna": "GPT-6 Luna",
  "gpt-6.2-astra": "GPT-6.2 Astra",
  "gemini-3.8-flash": "Gemini 3.8 Flash",
  "gemini-3.5-flash-lite": "Gemini 3.5 Flash-Lite",
  "gemini-3.1-pro-preview": "Gemini 3.1 Pro",
};

/** Le nom à afficher sous une réponse, même pour un modèle qui n'est plus proposé. */
export function nomModele(id: string): string {
  return MODELES.find((m) => m.id === id)?.nom ?? ANCIENS[id] ?? id.replace(/^[a-z]+\//, "");
}

/** L'IA d'un modèle, d'après son identifiant (nouveau « openai/… » ou ancien « gpt-… »). */
export function fournisseurDuModele(id: string): Fournisseur | null {
  const connu = MODELES.find((m) => m.id === id);
  if (connu) return connu.fournisseur;
  const nom = id.replace(/^[a-z]+\//, "");
  if (id.startsWith("anthropic/") || nom.startsWith("claude")) return "anthropic";
  if (id.startsWith("openai/") || nom.startsWith("gpt") || /^o\d/.test(nom)) return "openai";
  if (id.startsWith("google/") || nom.startsWith("gemini")) return "google";
  return null;
}

/** L'IA enregistrée dans les réglages : son nom (« openai »), ou un ancien modèle (« gpt-6-luna »). */
export function iaDuReglage(valeur: string | null | undefined): Fournisseur {
  if (!valeur) return IA_PAR_DEFAUT;
  return fournisseurValide(valeur) ?? fournisseurDuModele(valeur) ?? IA_PAR_DEFAUT;
}

export type Usage = {
  entree: number;
  sortie: number;
  ecritureCache: number;
  lectureCache: number;
};

export const USAGE_VIDE: Usage = { entree: 0, sortie: 0, ecritureCache: 0, lectureCache: 0 };

/** Coût estimé d'un appel, en dollars, au tarif du modèle qui a répondu. */
export function coutEstime(id: string, u: Usage): number {
  const m = MODELES.find((x) => x.id === id);
  // Modèle inconnu : on compte au tarif le plus élevé de la liste, pour rester prudent.
  const t = m?.tarif ?? { entree: 0.75, ecritureCache: 0.75, lectureCache: 0.075, sortie: 4.5 };
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

export function formaterJetons(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (n >= 10_000) return `${Math.round(n / 1000).toLocaleString("fr-FR")} k`;
  return n.toLocaleString("fr-FR");
}
