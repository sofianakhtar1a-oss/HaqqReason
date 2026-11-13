import { NextResponse, type NextRequest } from "next/server";
import { infosRequete } from "@/lib/request-info";
import { dbAdmin } from "@/lib/supabase";

/*
 * « Je n'ai pas trouvé ma réponse » : la question du lecteur est notée pour le créateur,
 * qui la retrouve dans ses statistiques et peut décider d'écrire l'article correspondant.
 * Rien d'identifiant n'est conservé : seulement le terme cherché et le jour.
 */

const PAR_HEURE = 20;

export async function POST(requete: NextRequest) {
  let question = "";
  try {
    const corps = (await requete.json()) as { question?: unknown };
    question = typeof corps.question === "string" ? corps.question.trim().slice(0, 300) : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (question.length < 3) return NextResponse.json({ ok: false }, { status: 400 });

  const { ipHash } = await infosRequete();
  try {
    const depuis = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await dbAdmin()
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("action", "sujet_demande")
      .eq("ip_hash", ipHash)
      .gte("created_at", depuis);
    if ((count ?? 0) >= PAR_HEURE) return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });

    await dbAdmin().rpc("noter_recherche_vide", { p_terme: question });
    await dbAdmin().from("audit_log").insert({ action: "sujet_demande", details: { question }, ip_hash: ipHash, user_agent: "" });
  } catch {
    // Le lecteur n'a pas à subir un incident côté base : on lui répond normalement.
  }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
