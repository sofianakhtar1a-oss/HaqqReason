import "server-only";
import { dbAdmin, dbPublic } from "./supabase";

type Mode = "public" | "createur";
const base = (mode: Mode) => (mode === "createur" ? dbAdmin() : dbPublic());
export type ArticleCourt = { id: string; titre: string; resume: string };

/** Articles à lire avant celui-ci, dans l'ordre choisi. */
export async function lirePrerequis(id: string, mode: Mode): Promise<ArticleCourt[]> {
  const { data } = await base(mode).from("prerequis").select("ordre, articles!prerequis_prerequis_id_fkey(id, titre, resume, supprime_le)").eq("article_id", id).order("ordre");
  return ((data ?? []) as unknown as { articles: (ArticleCourt & { supprime_le: string | null }) | null }[]).flatMap((r) => (r.articles && !r.articles.supprime_le ? [{ id: r.articles.id, titre: r.articles.titre, resume: r.articles.resume }] : []));
}

/** Articles qui supposent la lecture de celui-ci (« pour aller plus loin »). */
export async function lireSuites(id: string, mode: Mode): Promise<ArticleCourt[]> {
  const { data } = await base(mode).from("prerequis").select("articles!prerequis_article_id_fkey(id, titre, resume, supprime_le)").eq("prerequis_id", id).limit(20);
  return ((data ?? []) as unknown as { articles: (ArticleCourt & { supprime_le: string | null }) | null }[]).flatMap((r) => (r.articles && !r.articles.supprime_le ? [{ id: r.articles.id, titre: r.articles.titre, resume: r.articles.resume }] : []));
}

export async function articlesLies(id: string, mode: Mode, limite = 6): Promise<ArticleCourt[]> {
  const { data } = await base(mode).rpc("articles_lies", { p_article: id, p_limite: limite });
  return (data ?? []) as ArticleCourt[];
}

/** Catégories où l'article est aussi classé (en plus de sa catégorie principale). */
export async function categoriesSecondaires(id: string, mode: Mode): Promise<{ id: string; titre: string }[]> {
  const { data } = await base(mode).from("articles_categories").select("categories(id, titre, supprime_le)").eq("article_id", id);
  return ((data ?? []) as unknown as { categories: { id: string; titre: string; supprime_le: string | null } | null }[]).flatMap((r) => (r.categories && !r.categories.supprime_le ? [{ id: r.categories.id, titre: r.categories.titre }] : []));
}

/** Articles classés aussi dans cette catégorie (multi-classement). */
export async function articlesAussiClasses(categorieId: string, mode: Mode): Promise<(ArticleCourt & { statut: string })[]> {
  const { data } = await base(mode).from("articles_categories").select("articles(id, titre, resume, statut, supprime_le)").eq("categorie_id", categorieId).limit(200);
  return ((data ?? []) as unknown as { articles: (ArticleCourt & { statut: string; supprime_le: string | null }) | null }[]).flatMap((r) => (r.articles && !r.articles.supprime_le ? [{ id: r.articles.id, titre: r.articles.titre, resume: r.articles.resume, statut: r.articles.statut }] : []));
}
