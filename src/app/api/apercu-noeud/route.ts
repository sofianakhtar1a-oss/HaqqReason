import { NextResponse, type NextRequest } from "next/server";
import { porteJetonCreateur } from "@/lib/session";
import { dbAdmin, dbPublic } from "@/lib/supabase";

/*
 * Aperçu d'un point du graphe : de quoi il s'agit, et un extrait à lire sur place.
 * La lecture passe par la base publique : un brouillon n'apparaît jamais à un lecteur,
 * exactement comme ailleurs sur le site.
 */

export type ApercuNoeud = {
  type: "bloc" | "categorie" | "article" | "etiquette";
  titre: string;
  resume: string;
  extrait: string;
  /** Pour une catégorie ou une étiquette : ce qu'elle contient. */
  compte?: number;
  /** Pour un article : sa catégorie, et combien de mots il fait. */
  contexte?: string;
  mots?: number;
};

const UUID = /^[0-9a-f-]{36}$/i;
/** Assez pour se faire une idée, trop peu pour remplacer la lecture de l'article. */
const EXTRAIT = 1800;

export async function GET(requete: NextRequest) {
  const id = (requete.nextUrl.searchParams.get("id") ?? "").replace(/^etiquette-/, "");
  const type = requete.nextUrl.searchParams.get("type") ?? "";
  if (!UUID.test(id) || !["bloc", "categorie", "article", "etiquette"].includes(type)) {
    return NextResponse.json({ erreur: "Demande invalide." }, { status: 400 });
  }

  // Le créateur voit aussi ses brouillons, comme sur le reste du site.
  const db = (await porteJetonCreateur()) ? dbAdmin() : dbPublic();
  const sansCache = { headers: { "Cache-Control": "private, max-age=30" } };

  try {
    if (type === "article") {
      // Un article a une catégorie de rangement et, séparément, des catégories secondaires :
      // on nomme donc la relation voulue, sinon la demande est ambiguë.
      const { data } = await db.from("articles").select("titre, resume, contenu_texte, categories!articles_categorie_id_fkey(titre)").eq("id", id).maybeSingle();
      if (!data) return NextResponse.json({ erreur: "Introuvable." }, { status: 404 });
      const a = data as unknown as { titre: string; resume: string; contenu_texte: string | null; categories: { titre: string } | null };
      const texte = (a.contenu_texte ?? "").replace(/\s+/g, " ").trim();
      const reponse: ApercuNoeud = {
        type: "article",
        titre: a.titre,
        resume: a.resume ?? "",
        extrait: texte.slice(0, EXTRAIT),
        contexte: a.categories?.titre ?? "",
        mots: texte ? texte.split(" ").length : 0,
      };
      return NextResponse.json(reponse, sansCache);
    }

    if (type === "categorie") {
      const [{ data }, { count }] = await Promise.all([
        db.from("categories").select("titre, description").eq("id", id).maybeSingle(),
        db.from("articles").select("id", { count: "exact", head: true }).eq("categorie_id", id),
      ]);
      if (!data) return NextResponse.json({ erreur: "Introuvable." }, { status: 404 });
      const c = data as { titre: string; description: string | null };
      const reponse: ApercuNoeud = { type: "categorie", titre: c.titre, resume: c.description ?? "", extrait: "", compte: count ?? 0 };
      return NextResponse.json(reponse, sansCache);
    }

    if (type === "bloc") {
      const [{ data }, { count }] = await Promise.all([
        db.from("blocs").select("titre, description").eq("id", id).maybeSingle(),
        db.from("categories").select("id", { count: "exact", head: true }).eq("bloc_id", id),
      ]);
      if (!data) return NextResponse.json({ erreur: "Introuvable." }, { status: 404 });
      const b = data as { titre: string; description: string | null };
      const reponse: ApercuNoeud = { type: "bloc", titre: b.titre, resume: b.description ?? "", extrait: "", compte: count ?? 0 };
      return NextResponse.json(reponse, sansCache);
    }

    const [{ data }, { count }] = await Promise.all([
      db.from("etiquettes").select("nom").eq("id", id).maybeSingle(),
      db.from("articles_etiquettes").select("article_id", { count: "exact", head: true }).eq("etiquette_id", id),
    ]);
    if (!data) return NextResponse.json({ erreur: "Introuvable." }, { status: 404 });
    const reponse: ApercuNoeud = { type: "etiquette", titre: (data as { nom: string }).nom, resume: "", extrait: "", compte: count ?? 0 };
    return NextResponse.json(reponse, sansCache);
  } catch {
    return NextResponse.json({ erreur: "Lecture impossible." }, { status: 500 });
  }
}
