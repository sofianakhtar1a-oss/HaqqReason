import "server-only";
import type { Etape } from "@/components/FilAriane";
import type { FichierDetail } from "./fichiers-donnees";
import { dbAdmin, dbPublic } from "./supabase";

/** Fil d'Ariane et couleur d'un document, d'après l'article ou la catégorie qui le contient. */
export async function contexteDocument(
  f: FichierDetail,
  mode: "public" | "createur",
): Promise<{ etapes: Etape[]; accent: string; parent: { type: "article" | "categorie"; id: string; titre: string } }> {
  const base = mode === "public" ? dbPublic() : dbAdmin();
  const racine = mode === "public" ? "/explorer" : "/createur";
  let categorieId = f.categorie_id;
  let parent: { type: "article" | "categorie"; id: string; titre: string } = { type: "categorie", id: f.categorie_id ?? "", titre: "" };
  if (f.article_id) {
    const { data } = await base.from("articles").select("id, titre, categorie_id").eq("id", f.article_id).maybeSingle();
    categorieId = data?.categorie_id ?? null;
    parent = { type: "article", id: f.article_id, titre: data?.titre ?? "Article" };
  }
  const { data: chemin } = categorieId ? await base.rpc("ancetres_categorie", { p_categorie: categorieId }) : { data: [] };
  const { data: categorie } = categorieId ? await base.from("categories").select("bloc_id").eq("id", categorieId).maybeSingle() : { data: null };
  const { data: bloc } = categorie ? await base.from("blocs").select("slug, titre, accent").eq("id", categorie.bloc_id).maybeSingle() : { data: null };
  const ancetres = (chemin ?? []) as { id: string; titre: string }[];
  if (parent.type === "categorie") parent.titre = ancetres[ancetres.length - 1]?.titre ?? "";

  const etapes: Etape[] = [
    mode === "public" ? { href: "/explorer", libelle: "La bibliothèque" } : { href: "/createur", libelle: "Espace créateur" },
    ...(bloc ? [{ href: mode === "public" ? `/explorer/${bloc.slug}` : `/createur/bloc/${bloc.slug}`, libelle: bloc.titre }] : []),
    ...ancetres.map((c) => ({ href: `${racine}/categorie/${c.id}`, libelle: c.titre })),
    ...(f.article_id ? [{ href: `${racine}/article/${f.article_id}`, libelle: parent.titre }] : []),
    { href: `${racine}/document/${f.id}`, libelle: f.nom },
  ];
  return { etapes, accent: bloc?.accent ?? "or", parent };
}
