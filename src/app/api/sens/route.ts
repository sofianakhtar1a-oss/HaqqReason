import { NextResponse, type NextRequest } from "next/server";
import { infosRequete } from "@/lib/request-info";
import { rechercherParLeSens } from "@/lib/sens/recherche";
import { serviceActif } from "@/lib/sens/service";
import { porteJetonCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";

/*
 * Articles proches par le sens d'une question.
 * Chaque appel consomme une requête payante chez le service d'IA : il est donc limité
 * par visiteur et par heure, pour qu'un robot ne puisse pas faire grimper la facture.
 */

const PAR_HEURE = 30;

async function tropDeDemandes(ipHash: string): Promise<boolean> {
  try {
    const depuis = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await dbAdmin()
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "recherche_sens")
      .eq("ip_hash", ipHash)
      .gte("created_at", depuis);
    return (count ?? 0) >= PAR_HEURE;
  } catch {
    return false;
  }
}

export async function GET(requete: NextRequest) {
  const question = (requete.nextUrl.searchParams.get("q") ?? "").trim();
  if (question.length < 3) return NextResponse.json({ resultats: [] }, { headers: { "Cache-Control": "private, no-store" } });
  if (!serviceActif()) return NextResponse.json({ resultats: [], inactif: true }, { headers: { "Cache-Control": "private, no-store" } });

  const { ipHash } = await infosRequete();
  if (await tropDeDemandes(ipHash)) {
    return NextResponse.json({ resultats: [], limite: true }, { status: 429, headers: { "Cache-Control": "private, no-store" } });
  }

  const createur = await porteJetonCreateur();
  const resultats = await rechercherParLeSens(question, createur ? "createur" : "public");
  try {
    await dbAdmin().from("audit_log").insert({ action: "recherche_sens", details: { longueur: question.length, trouves: resultats.length }, ip_hash: ipHash, user_agent: "" });
  } catch {
    // Le comptage est un garde-fou, pas une obligation.
  }
  return NextResponse.json({ resultats }, { headers: { "Cache-Control": "private, no-store" } });
}
