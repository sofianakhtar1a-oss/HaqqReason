"use server";

import { revalidatePath } from "next/cache";
import { sessionCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";

type Retour = { ok: true } | { ok: false; message: string };

/** Catégories où l'article apparaît aussi (sans être dupliqué). */
export async function definirCategoriesSecondaires(articleId: string, categories: string[]): Promise<Retour> {
  if (!(await sessionCreateur())) return { ok: false, message: "Ta session a expiré." };
  if (!estUuid(articleId)) return { ok: false, message: "Article introuvable." };
  const { data: article } = await dbAdmin().from("articles").select("categorie_id").eq("id", articleId).maybeSingle();
  if (!article) return { ok: false, message: "Article introuvable." };
  const ids = [...new Set((Array.isArray(categories) ? categories : []).filter(estUuid))].filter((c) => c !== article.categorie_id).slice(0, 30);
  await dbAdmin().from("articles_categories").delete().eq("article_id", articleId);
  if (ids.length > 0) {
    const { error } = await dbAdmin().from("articles_categories").insert(ids.map((categorie_id) => ({ article_id: articleId, categorie_id })));
    if (error) return { ok: false, message: "Enregistrement impossible." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Articles à lire avant celui-ci, dans l'ordre. */
export async function definirPrerequis(articleId: string, prerequis: string[]): Promise<Retour> {
  if (!(await sessionCreateur())) return { ok: false, message: "Ta session a expiré." };
  if (!estUuid(articleId)) return { ok: false, message: "Article introuvable." };
  const ids = [...new Set((Array.isArray(prerequis) ? prerequis : []).filter(estUuid))].filter((p) => p !== articleId).slice(0, 20);
  await dbAdmin().from("prerequis").delete().eq("article_id", articleId);
  if (ids.length > 0) {
    const { error } = await dbAdmin().from("prerequis").insert(ids.map((prerequis_id, ordre) => ({ article_id: articleId, prerequis_id, ordre })));
    if (error) return { ok: false, message: "Enregistrement impossible." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
