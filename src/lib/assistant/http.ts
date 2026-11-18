import "server-only";
import { NextResponse } from "next/server";
import type { Compte } from "@/lib/compte/jeton";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { ErreurDonnees } from "./donnees";

/* Ce que partagent toutes les routes de l'Assistant : contrôle d'entrée, réponses, erreurs. */

export const SANS_CACHE = { "Cache-Control": "private, no-store" };

export const refus = (statut: number, erreur: string, message?: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ erreur, ...(message ? { message } : {}), ...extra }, { status: statut, headers: SANS_CACHE });

export const repondre = (corps: unknown, statut = 200) => NextResponse.json(corps, { status: statut, headers: SANS_CACHE });

/**
 * À l'entrée de chaque route : la requête vient des pages du site, et le compte Google est
 * connecté ET toujours valide en base. Tout ce qui suit est rattaché à ce compte-là.
 */
export async function entree(requete: Request): Promise<{ compte: Compte } | { refus: NextResponse }> {
  if (process.env.ASSISTANT_FERME?.trim().toLowerCase() === "oui") {
    return { refus: refus(503, "ferme", "L'assistant est fermé pour le moment. Reviens un peu plus tard.") };
  }
  if (!memeOrigine(requete)) return { refus: refus(403, "refuse") };
  const compte = await compteVerifie();
  if (compte === "indisponible") return { refus: refus(503, "indisponible", "La base de données ne répond pas. Réessaie dans un instant.") };
  if (!compte) return { refus: refus(401, "deconnecte", "Connecte-toi avec ton compte Google pour utiliser l'assistant.") };
  return { compte };
}

/** Le corps JSON d'une requête, refusé au-delà de `maxOctets`. */
export async function lireCorps<T>(requete: Request, maxOctets: number): Promise<T | null> {
  const annonce = Number(requete.headers.get("content-length") ?? "0");
  if (Number.isFinite(annonce) && annonce > maxOctets) return null;
  try {
    const texte = await requete.text();
    if (Buffer.byteLength(texte, "utf8") > maxOctets) return null;
    const valeur = JSON.parse(texte) as unknown;
    return valeur && typeof valeur === "object" ? (valeur as T) : null;
  } catch {
    return null;
  }
}

export function erreurDonnees(e: unknown): NextResponse {
  if (e instanceof ErreurDonnees && e.raison === "installation") {
    return refus(503, "installation", "L'assistant n'est pas encore installé sur ce site : le créateur doit lancer la migration 016 dans Supabase.");
  }
  return refus(503, "indisponible", "La base de données ne répond pas. Réessaie dans un instant.");
}

/** Le texte saisi par l'utilisateur : sans caractère nul ni caractères de contrôle invisibles. */
export function texteLibre(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const propre = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return propre && propre.length <= max ? propre : null;
}
