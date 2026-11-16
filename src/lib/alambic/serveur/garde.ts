import "server-only";
import { NextResponse } from "next/server";
import { infosRequete } from "@/lib/request-info";
import { dbAdmin } from "@/lib/supabase";
import { ErreurGroq } from "./groq";

/*
 * Garde-fous communs aux routes de transcription :
 * - seule la page de l'application peut les appeler (même origine) ;
 * - chaque visiteur a un quota horaire, pour qu'un robot n'épuise pas le palier gratuit de Groq.
 */

export type Usage = "transcription" | "traduction" | "analyse" | "youtube" | "carnet" | "vecteurs";

/** Appels permis par visiteur et par heure. Un morceau de transcription = 10 minutes de son. */
const QUOTAS: Record<Usage, number> = {
  transcription: 60,
  traduction: 240,
  analyse: 400,
  youtube: 120,
  carnet: 60,
  vecteurs: 300,
};

export const SANS_CACHE = { "Cache-Control": "private, no-store" };

export function erreur(message: string, statut: number, attente?: number) {
  return NextResponse.json({ erreur: message, attente }, { status: statut, headers: { ...SANS_CACHE, ...(attente ? { "Retry-After": String(attente) } : {}) } });
}

function memeOrigine(requete: Request): boolean {
  const site = requete.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origine = requete.headers.get("origin");
  if (!origine) return requete.method === "GET";
  try {
    return new URL(origine).host === new URL(requete.url).host;
  } catch {
    return false;
  }
}

/** Renvoie une réponse d'erreur si l'appel est refusé, sinon null (et l'appel est compté). */
export async function garder(requete: Request, usage: Usage): Promise<NextResponse | null> {
  if (!memeOrigine(requete)) return erreur("Appel refusé.", 403);
  const { ipHash } = await infosRequete();
  try {
    const depuis = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await dbAdmin()
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", `alambic_${usage}`)
      .eq("ip_hash", ipHash)
      .gte("created_at", depuis);
    if ((count ?? 0) >= QUOTAS[usage]) return erreur("Tu as atteint la limite de l'heure pour cet outil. Réessaie un peu plus tard.", 429, 600);
    await dbAdmin().from("audit_log").insert({ action: `alambic_${usage}`, details: {}, ip_hash: ipHash, user_agent: "" });
  } catch {
    // Base indisponible : le quota de Groq reste le dernier garde-fou.
  }
  return null;
}

export function reponseErreur(e: unknown) {
  if (e instanceof ErreurGroq) return erreur(e.message, e.statut, e.attente);
  if (e instanceof DOMException && e.name === "AbortError") return erreur("Demande annulée.", 499);
  return erreur("Une erreur inattendue a interrompu la demande. Réessaie.", 500);
}
