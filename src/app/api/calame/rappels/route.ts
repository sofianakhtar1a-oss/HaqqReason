import { NextResponse } from "next/server";
import { envoyerRappels } from "@/lib/atelier/rappels-serveur";

/*
 * Le passage des rappels d'écriture du Calame, tous les quarts d'heure (GitHub Actions, voir
 * .github/workflows/rappels-calame.yml). Sans secret : il n'envoie que ce qui est dû, une fois,
 * et un nouvel appel moins de quatre minutes après le précédent ne fait rien.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function passer() {
  try {
    const r = await envoyerRappels();
    return NextResponse.json(r, { status: "erreur" in r ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ erreur: "indisponible" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = passer;
export const POST = passer;
