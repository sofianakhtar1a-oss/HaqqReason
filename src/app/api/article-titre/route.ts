import { NextResponse } from "next/server";
import { porteJetonCreateur, sessionCreateur } from "@/lib/session";
import { dbAdmin, dbPublic } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";

/** Titre d'un article (pour afficher un lien déjà choisi dans les ateliers). */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!estUuid(id)) return NextResponse.json({ titre: null }, { status: 400 });
  const createur = (await porteJetonCreateur()) && (await sessionCreateur());
  const { data } = await (createur ? dbAdmin() : dbPublic()).from("articles").select("titre").eq("id", id).maybeSingle();
  return NextResponse.json({ titre: data?.titre ?? null }, { headers: { "Cache-Control": "private, no-store" } });
}
