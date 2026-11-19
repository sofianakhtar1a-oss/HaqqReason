import { NextResponse } from "next/server";
import { editionPortulan } from "@/lib/monde/atelier";

/*
 * GET : ce que le créateur a réglé pour le Portulan (corrections des fiches, pays du jour,
 * population à jour, nouveautés). Public et court : les mêmes données pour tout le monde.
 */
export async function GET() {
  const e = await editionPortulan();
  return NextResponse.json(e, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=600" } });
}
