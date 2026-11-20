import "server-only";
import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { ESPACE } from "@/lib/stockage";
import { dbAdmin } from "@/lib/supabase";

/*
 * Le Calame — un document publié en page web, en lecture seule : retirable à tout moment, avec ou
 * sans mot de passe. Chaque publication est un fichier JSON de l'espace de stockage privé (dossier
 * « calame-publications ») ; seule la page /lire/[id] la montre, rendue par le serveur à partir du
 * document (jamais à partir d'un HTML venu du navigateur).
 */

const DOSSIER = "calame-publications";
const POIDS_MAX = 4_500_000;
const IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

export type Publication = {
  id: string;
  compte: string;
  documentId: string;
  titre: string;
  auteur: string;
  contenu: unknown;
  images: Record<string, string>;
  styles: unknown;
  motDePasse: { sel: string; empreinte: string } | null;
  publie: string;
  maj: string;
};

const valideId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

export async function lirePublication(id: string): Promise<Publication | null> {
  if (!valideId(id)) return null;
  const { data } = await dbAdmin().storage.from(ESPACE).download(`${DOSSIER}/${id}.json`);
  if (!data) return null;
  try {
    return JSON.parse(await data.text()) as Publication;
  } catch {
    return null;
  }
}

function empreinte(motDePasse: string, sel: string): string {
  return scryptSync(motDePasse.normalize("NFC"), sel, 32).toString("hex");
}

export function motDePasseJuste(p: Publication, essai: string): boolean {
  if (!p.motDePasse) return true;
  const attendu = Buffer.from(p.motDePasse.empreinte, "hex");
  const calcule = Buffer.from(empreinte(essai, p.motDePasse.sel), "hex");
  return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
}

/** Le jeton de lecture d'une page protégée : lié à la publication ET à son mot de passe (le changer ferme les anciennes lectures). */
export function jetonDeLecture(p: Publication): string {
  const secret = process.env.SESSION_SECRET?.trim() || "calame";
  return createHmac("sha256", secret).update(`${p.id}:${p.motDePasse?.empreinte ?? ""}`).digest("base64url");
}

export const nomCookieLecture = (id: string) => `calame_lire_${id.replace(/-/g, "").slice(0, 16)}`;

type Envoi = { id?: unknown; documentId?: unknown; titre?: unknown; auteur?: unknown; contenu?: unknown; images?: unknown; styles?: unknown; motDePasse?: unknown };

/**
 * Publie (ou met à jour) un document. motDePasse : une chaîne pour en poser un, null pour le retirer,
 * absent pour garder celui d'avant. Rend l'identifiant, ou un message d'erreur.
 */
export async function publier(compte: string, envoi: Envoi): Promise<{ id: string } | { erreur: string }> {
  const contenu = envoi.contenu as { type?: string; content?: unknown[] } | undefined;
  if (!contenu || contenu.type !== "doc" || !Array.isArray(contenu.content)) return { erreur: "Document illisible." };
  const images: Record<string, string> = {};
  if (envoi.images && typeof envoi.images === "object") {
    for (const [cle, valeur] of Object.entries(envoi.images as Record<string, unknown>)) {
      if (/^[\w-]{1,80}$/.test(cle) && typeof valeur === "string" && valeur.length < 2_000_000 && IMAGE.test(valeur)) images[cle] = valeur;
    }
  }
  const id = typeof envoi.id === "string" && valideId(envoi.id) ? envoi.id : randomUUID();
  const avant = typeof envoi.id === "string" ? await lirePublication(id) : null;
  if (avant && avant.compte !== compte) return { erreur: "Cette publication appartient à un autre compte." };
  let motDePasse = avant?.motDePasse ?? null;
  if (envoi.motDePasse === null) motDePasse = null;
  else if (typeof envoi.motDePasse === "string" && envoi.motDePasse.length > 0) {
    if (envoi.motDePasse.length < 4 || envoi.motDePasse.length > 100) return { erreur: "Le mot de passe doit faire entre 4 et 100 caractères." };
    const sel = randomBytes(16).toString("hex");
    motDePasse = { sel, empreinte: empreinte(envoi.motDePasse, sel) };
  }
  const maintenant = new Date().toISOString();
  const publication: Publication = {
    id,
    compte,
    documentId: typeof envoi.documentId === "string" ? envoi.documentId.slice(0, 80) : "",
    titre: typeof envoi.titre === "string" ? envoi.titre.slice(0, 200) : "",
    auteur: typeof envoi.auteur === "string" ? envoi.auteur.slice(0, 200) : "",
    contenu,
    images,
    styles: envoi.styles && typeof envoi.styles === "object" ? envoi.styles : null,
    motDePasse,
    publie: avant?.publie ?? maintenant,
    maj: maintenant,
  };
  const texte = JSON.stringify(publication);
  if (texte.length > POIDS_MAX) return { erreur: "Ce document est trop lourd pour être publié (images comprises, 4 Mo au plus)." };
  const { error } = await dbAdmin()
    .storage.from(ESPACE)
    .upload(`${DOSSIER}/${id}.json`, new Blob([texte], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  return error ? { erreur: "Le stockage n'a pas répondu : réessaie dans un instant." } : { id };
}

export async function retirerPublication(compte: string, id: string): Promise<boolean> {
  const p = await lirePublication(id);
  if (!p || p.compte !== compte) return false;
  const { error } = await dbAdmin().storage.from(ESPACE).remove([`${DOSSIER}/${id}.json`]);
  return !error;
}
