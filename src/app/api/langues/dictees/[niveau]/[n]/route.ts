import { NextResponse, type NextRequest } from "next/server";
import { memeOrigine } from "@/lib/compte/session";
import { estNiveau, lireDictees } from "@/lib/langues/contenus";
import { consommer, contextePremium } from "@/lib/premium/droits";

/** Une dictée numérotée, après vérification des droits (rouvrir la même dictée dans la période ne compte pas). */
export async function GET(requete: NextRequest, { params }: RouteContext<"/api/langues/dictees/[niveau]/[n]">) {
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "refuse" }, { status: 403 });
  const { niveau, n } = await params;
  const numero = Number(n);
  if (!estNiveau(niveau) || !Number.isInteger(numero) || numero < 1 || numero > 999) return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  const dictee = (await lireDictees(niveau)).find((d) => d.n === numero);
  if (!dictee) return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  const verdict = await consommer(await contextePremium(), "truchement.dictees", `${niveau}-${numero}`);
  if (!verdict.ok) return NextResponse.json({ erreur: "premium", fonction: "truchement.dictees", ...verdict }, { status: 402, headers: { "Cache-Control": "private, no-store" } });
  return NextResponse.json(dictee, { headers: { "Cache-Control": "private, no-store" } });
}
