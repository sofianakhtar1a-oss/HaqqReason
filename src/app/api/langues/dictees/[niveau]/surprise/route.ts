import { NextResponse, type NextRequest } from "next/server";
import { memeOrigine } from "@/lib/compte/session";
import { estNiveau, lireHistoire } from "@/lib/langues/contenus";
import { phrasesSurprise } from "@/lib/langues/dictees/surprise";
import { HISTOIRES } from "@/lib/langues/histoires/catalogue";
import { consommer, contextePremium } from "@/lib/premium/droits";

/** La dictée surprise : le serveur tire six phrases dans les histoires du niveau (une utilisation par tirage). */
export async function POST(requete: NextRequest, { params }: RouteContext<"/api/langues/dictees/[niveau]/surprise">) {
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "refuse" }, { status: 403 });
  const { niveau } = await params;
  if (!estNiveau(niveau)) return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  const verdict = await consommer(await contextePremium(), "truchement.dictee-surprise");
  if (!verdict.ok) return NextResponse.json({ erreur: "premium", fonction: "truchement.dictee-surprise", ...verdict }, { status: 402, headers: { "Cache-Control": "private, no-store" } });
  const lues = await Promise.all(HISTOIRES.filter((h) => h.niveau === niveau).map((h) => lireHistoire(h.id)));
  const phrases = phrasesSurprise(
    lues.flatMap((x) => (x ? [x.histoire] : [])),
    niveau,
  );
  return NextResponse.json({ phrases }, { headers: { "Cache-Control": "private, no-store" } });
}
