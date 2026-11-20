import { NextResponse, type NextRequest } from "next/server";
import { essayerRappel } from "@/lib/atelier/rappels-serveur";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";

/** Une notification d'essai, sur tous les appareils abonnés du compte. */
export async function POST(requete: NextRequest) {
  const sansCache = { "Cache-Control": "private, no-store" };
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "Requête refusée." }, { status: 403, headers: sansCache });
  const c = await compteVerifie();
  if (c === "indisponible") return NextResponse.json({ erreur: "Le serveur ne répond pas." }, { status: 503, headers: sansCache });
  if (!c) return NextResponse.json({ erreur: "Connecte-toi d'abord." }, { status: 401, headers: sansCache });
  await essayerRappel(c.id);
  return NextResponse.json({ ok: true }, { headers: sansCache });
}
