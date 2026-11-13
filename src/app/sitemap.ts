import type { MetadataRoute } from "next";
import { dbPublic } from "@/lib/supabase";
import { adresseDuSite } from "@/lib/site";

export const revalidate = 3600;

/** Plan du site pour Google, Bing… : uniquement ce que le public peut lire (la base filtre les brouillons). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = adresseDuSite();
  const url = (chemin: string) => new URL(chemin, site).toString();
  const fixes: MetadataRoute.Sitemap = ["/", "/explorer", "/recherche", "/debat", "/graphe", "/sophismes", "/nouveautes"].map((c) => ({ url: url(c), changeFrequency: "weekly", priority: c === "/" ? 1 : 0.6 }));
  try {
    const db = dbPublic();
    const [blocs, categories, articles] = await Promise.all([
      db.from("blocs").select("slug"),
      db.from("categories").select("id, updated_at").limit(5000),
      db.from("articles").select("id, updated_at").limit(45000),
    ]);
    return [
      ...fixes,
      ...((blocs.data ?? []) as { slug: string }[]).map((b) => ({ url: url(`/explorer/${b.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
      ...((categories.data ?? []) as { id: string; updated_at: string }[]).map((c) => ({ url: url(`/explorer/categorie/${c.id}`), lastModified: c.updated_at, priority: 0.7 })),
      ...((articles.data ?? []) as { id: string; updated_at: string }[]).map((a) => ({ url: url(`/explorer/article/${a.id}`), lastModified: a.updated_at, priority: 0.9 })),
    ];
  } catch {
    return fixes;
  }
}
