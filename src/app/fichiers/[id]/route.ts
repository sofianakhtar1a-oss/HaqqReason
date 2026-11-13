import { NextResponse, type NextRequest } from "next/server";
import { sessionCreateur } from "@/lib/session";
import { lienLecture } from "@/lib/stockage";
import { dbAdmin, dbPublic } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";

/**
 * Délivre un fichier : vérifie qu'il est visible (contenu publié) ou que le créateur est connecté,
 * puis redirige vers un lien temporaire de 10 minutes. Le stockage lui-même reste privé.
 */
export async function GET(requete: NextRequest, { params }: RouteContext<"/fichiers/[id]">) {
  const { id } = await params;
  if (!estUuid(id)) return new NextResponse("Fichier introuvable.", { status: 404 });

  // La clé publique ne voit que les fichiers rattachés à un contenu publié (règles de la base).
  let { data: fichier } = await dbPublic().from("fichiers").select("chemin, nom").eq("id", id).maybeSingle();
  if (!fichier && (await sessionCreateur())) {
    ({ data: fichier } = await dbAdmin().from("fichiers").select("chemin, nom").eq("id", id).maybeSingle());
  }
  if (!fichier) return new NextResponse("Fichier introuvable.", { status: 404 });

  const telecharger = requete.nextUrl.searchParams.has("telecharger");
  const lien = await lienLecture(fichier.chemin, telecharger ? fichier.nom : undefined);
  if (!lien) return new NextResponse("Fichier momentanément indisponible.", { status: 503 });

  // « ?lien » : renvoie le lien au lieu de rediriger (le lecteur PDF lit ensuite le fichier par morceaux).
  if (requete.nextUrl.searchParams.has("lien")) {
    return NextResponse.json({ url: lien }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const reponse = NextResponse.redirect(lien, 307);
  reponse.headers.set("Cache-Control", "private, no-store");
  reponse.headers.set("Referrer-Policy", "no-referrer");
  return reponse;
}
