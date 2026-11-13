import { NextResponse, type NextRequest } from "next/server";
import { lireCriteres, rechercher } from "@/lib/recherche";

/** Résultats instantanés pour la page de recherche et la palette Ctrl+K. */
export async function GET(requete: NextRequest) {
  const criteres = lireCriteres(requete.nextUrl.searchParams);
  const limite = Math.min(20, Math.max(1, Number.parseInt(requete.nextUrl.searchParams.get("limite") ?? "20", 10) || 20));
  const resultat = await rechercher(criteres, limite);
  return NextResponse.json(resultat, { headers: { "Cache-Control": "private, no-store" } });
}
