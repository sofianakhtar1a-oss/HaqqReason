import { NextResponse } from "next/server";
import { dbPublic } from "@/lib/supabase";

/**
 * Liste des articles publiés, pour que le lecteur choisisse celui dont il parle.
 * Lecture par la clé publique : un brouillon n'apparaît jamais ici.
 */
export async function GET(requete: Request) {
  const url = new URL(requete.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const bloc = (url.searchParams.get("bloc") ?? "").trim();

  let requeteSql = dbPublic().from("articles").select("id, titre, bloc_id").order("publie_le", { ascending: false }).limit(40);
  if (q) requeteSql = requeteSql.ilike("titre", `%${q.replace(/[%_]/g, "")}%`);
  if (/^[0-9a-f-]{36}$/i.test(bloc)) requeteSql = requeteSql.eq("bloc_id", bloc);

  const { data, error } = await requeteSql;
  if (error) return NextResponse.json({ articles: [] }, { status: 200 });

  return NextResponse.json(
    { articles: data ?? [] },
    { headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" } },
  );
}
