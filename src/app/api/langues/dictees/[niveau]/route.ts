import { NextResponse, type NextRequest } from "next/server";
import { memeOrigine } from "@/lib/compte/session";
import { estNiveau, lireDictees } from "@/lib/langues/contenus";

/** La liste des dictées d'un niveau (numéro et titre seulement : le texte ne sort qu'à l'ouverture). */
export async function GET(requete: NextRequest, { params }: RouteContext<"/api/langues/dictees/[niveau]">) {
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "refuse" }, { status: 403 });
  const { niveau } = await params;
  if (!estNiveau(niveau)) return NextResponse.json({ erreur: "introuvable" }, { status: 404 });
  const liste = (await lireDictees(niveau)).map((d) => ({ n: d.n, titre: d.titre }));
  return NextResponse.json(liste, { headers: { "Cache-Control": "public, max-age=3600" } });
}
