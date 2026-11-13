import "server-only";
import { normaliser, vecteurValide } from "./decoupage";

/*
 * Appel au service qui transforme un texte en vecteur (« embeddings »).
 *
 * Le service est interchangeable : toute interface compatible OpenAI convient
 * (OpenAI, Mistral, Voyage, un serveur auto-hébergé…). Rien ne part si aucune clé
 * n'est configurée : la recherche par le sens est alors simplement inactive, et la
 * recherche par mots continue de fonctionner comme avant.
 *
 * Variables d'environnement (toutes facultatives) :
 *   EMBEDDINGS_CLE         la clé du service. Sans elle, la fonction est désactivée.
 *   EMBEDDINGS_URL         adresse du service (défaut : OpenAI).
 *   EMBEDDINGS_MODELE      nom du modèle (défaut : text-embedding-3-small).
 *   EMBEDDINGS_DIMENSIONS  taille des vecteurs (défaut : 768).
 */

const URL_PAR_DEFAUT = "https://api.openai.com/v1/embeddings";
const MODELE_PAR_DEFAUT = "text-embedding-3-small";
const DIMENSIONS_PAR_DEFAUT = 768;
const DELAI_MS = 20000;
/** Réservé aux tests automatiques : ne jamais définir cette variable sur le site en ligne. */
const LOCAL_AUTORISE = process.env.EMBEDDINGS_AUTORISER_LOCAL === "1";

export type Reglage = { actif: boolean; url: string; modele: string; dimensions: number; raison?: string };

export function reglageService(): Reglage {
  const cle = process.env.EMBEDDINGS_CLE?.trim() ?? "";
  const url = process.env.EMBEDDINGS_URL?.trim() || URL_PAR_DEFAUT;
  const modele = process.env.EMBEDDINGS_MODELE?.trim() || MODELE_PAR_DEFAUT;
  const dimensions = Math.min(3072, Math.max(8, Number.parseInt(process.env.EMBEDDINGS_DIMENSIONS ?? "", 10) || DIMENSIONS_PAR_DEFAUT));
  const base = { url, modele, dimensions };
  if (!cle) return { ...base, actif: false, raison: "Aucune clé EMBEDDINGS_CLE n'est configurée." };
  try {
    const adresse = new URL(url);
    if (adresse.protocol !== "https:" && !LOCAL_AUTORISE) return { ...base, actif: false, raison: "L'adresse du service doit commencer par https://." };
  } catch {
    return { ...base, actif: false, raison: "L'adresse du service est invalide." };
  }
  return { ...base, actif: true };
}

export function serviceActif(): boolean {
  return reglageService().actif;
}

/** Identifiant du modèle tel qu'il est enregistré en base, pour ne recalculer que l'utile. */
export function nomModele(): string {
  const r = reglageService();
  return `${r.modele}@${r.dimensions}`;
}

export type ResultatVecteurs = { ok: true; vecteurs: number[][] } | { ok: false; message: string };

/**
 * Transforme des textes en vecteurs normalisés, dans le même ordre.
 * Ne lève jamais : renvoie un message lisible en cas de problème.
 */
export async function calculerVecteurs(textes: string[]): Promise<ResultatVecteurs> {
  const reglage = reglageService();
  if (!reglage.actif) return { ok: false, message: reglage.raison ?? "Service indisponible." };
  if (textes.length === 0) return { ok: true, vecteurs: [] };

  const abandon = AbortSignal.timeout(DELAI_MS);
  let reponse: Response;
  try {
    reponse = await fetch(reglage.url, {
      method: "POST",
      signal: abandon,
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.EMBEDDINGS_CLE?.trim()}` },
      body: JSON.stringify({ model: reglage.modele, dimensions: reglage.dimensions, input: textes, encoding_format: "float" }),
    });
  } catch {
    return { ok: false, message: "Le service de recherche par le sens n'a pas répondu." };
  }

  if (!reponse.ok) {
    const details = reponse.status === 401 ? " (clé refusée)" : reponse.status === 429 ? " (quota atteint ou trop de demandes)" : "";
    return { ok: false, message: `Le service a répondu ${reponse.status}${details}.` };
  }

  let charge: unknown;
  try {
    charge = await reponse.json();
  } catch {
    return { ok: false, message: "Réponse illisible du service." };
  }

  const liste = (charge as { data?: unknown }).data;
  if (!Array.isArray(liste) || liste.length !== textes.length) return { ok: false, message: "Le service n'a pas renvoyé autant de vecteurs que de textes." };

  const vecteurs: number[][] = [];
  for (const entree of liste) {
    const brut = (entree as { embedding?: unknown }).embedding;
    if (!vecteurValide(brut)) return { ok: false, message: "Le service a renvoyé un vecteur inutilisable." };
    vecteurs.push(normaliser(brut));
  }
  // Les services respectant l'ordre d'entrée, on s'y fie, mais on vérifie l'index quand il est fourni.
  const index = liste.map((e) => (e as { index?: unknown }).index);
  if (index.every((i) => typeof i === "number")) {
    const ordonnes: number[][] = new Array(vecteurs.length);
    index.forEach((i, position) => {
      const place = i as number;
      if (place >= 0 && place < vecteurs.length) ordonnes[place] = vecteurs[position];
    });
    if (ordonnes.every(Array.isArray)) return { ok: true, vecteurs: ordonnes };
  }
  return { ok: true, vecteurs };
}
