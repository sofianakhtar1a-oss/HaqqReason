import "server-only";
import { dbPublic } from "./supabase";

/*
 * Lectures du mode utilisateur. Elles passent toutes par la clé publique :
 * la base applique ses règles et ne renvoie QUE le contenu publié, quoi qu'il arrive dans ce code.
 */

export type Accent = "or" | "emeraude" | "amethyste";

export type Bloc = { id: string; slug: string; titre: string; description: string; accent: Accent };

export type Categorie = {
  id: string;
  bloc_id: string;
  parent_id: string | null;
  titre: string;
  description: string;
  icone: string;
};

export type ArticleCarte = { id: string; titre: string; resume: string; updated_at: string };

export type Article = ArticleCarte & {
  bloc_id: string;
  categorie_id: string;
  contenu: unknown;
  publie_le: string | null;
  etiquettes: string[];
};

export type Resultat<T> = { ok: true; donnees: T } | { ok: false };

export const ARTICLES_PAR_PAGE = 30;

const CHAMPS_CATEGORIE = "id, bloc_id, parent_id, titre, description, icone";

export async function listerBlocs(): Promise<Resultat<Bloc[]>> {
  const { data, error } = await dbPublic().from("blocs").select("id, slug, titre, description, accent").order("ordre");
  if (error) return { ok: false };
  return { ok: true, donnees: data as Bloc[] };
}

export async function lireBloc(critere: { slug: string } | { id: string }): Promise<Resultat<Bloc | null>> {
  let requete = dbPublic().from("blocs").select("id, slug, titre, description, accent");
  requete = "slug" in critere ? requete.eq("slug", critere.slug) : requete.eq("id", critere.id);
  const { data, error } = await requete.maybeSingle();
  if (error) return { ok: false };
  return { ok: true, donnees: data as Bloc | null };
}

/** Nombre de catégories de premier niveau publiées, par bloc. */
export async function compterCategoriesParBloc(): Promise<Record<string, number>> {
  const { data } = await dbPublic().from("categories").select("bloc_id").is("parent_id", null);
  const compte: Record<string, number> = {};
  for (const ligne of data ?? []) {
    compte[ligne.bloc_id as string] = (compte[ligne.bloc_id as string] ?? 0) + 1;
  }
  return compte;
}

export async function lireCategorie(id: string): Promise<Categorie | null> {
  const { data } = await dbPublic().from("categories").select(CHAMPS_CATEGORIE).eq("id", id).maybeSingle();
  return (data as Categorie | null) ?? null;
}

/** Catégories publiées d'un niveau (racine d'un bloc si parentId est null). */
export async function listerCategories(blocId: string, parentId: string | null): Promise<Categorie[]> {
  let requete = dbPublic().from("categories").select(CHAMPS_CATEGORIE).eq("bloc_id", blocId);
  requete = parentId ? requete.eq("parent_id", parentId) : requete.is("parent_id", null);
  const { data } = await requete.order("ordre").order("created_at");
  return (data ?? []) as Categorie[];
}

export async function compterContenus(ids: string[]): Promise<Map<string, { sous_categories: number; articles: number }>> {
  const resultat = new Map<string, { sous_categories: number; articles: number }>();
  if (ids.length === 0) return resultat;
  const { data } = await dbPublic().rpc("compter_contenus", { p_categories: ids });
  for (const l of (data ?? []) as { categorie_id: string; sous_categories: number; articles: number }[]) {
    resultat.set(l.categorie_id, { sous_categories: Number(l.sous_categories), articles: Number(l.articles) });
  }
  return resultat;
}

export async function ancetres(categorieId: string): Promise<{ id: string; titre: string }[]> {
  const { data } = await dbPublic().rpc("ancetres_categorie", { p_categorie: categorieId });
  return ((data ?? []) as { id: string; titre: string }[]).map(({ id, titre }) => ({ id, titre }));
}

export async function listerArticles(categorieId: string, page: number): Promise<{ articles: ArticleCarte[]; total: number }> {
  const debut = (page - 1) * ARTICLES_PAR_PAGE;
  const { data, count } = await dbPublic()
    .from("articles")
    .select("id, titre, resume, updated_at", { count: "exact" })
    .eq("categorie_id", categorieId)
    .order("ordre")
    .order("created_at")
    .range(debut, debut + ARTICLES_PAR_PAGE - 1);
  return { articles: (data ?? []) as ArticleCarte[], total: count ?? 0 };
}

export async function lireArticle(id: string): Promise<Article | null> {
  const { data } = await dbPublic()
    .from("articles")
    .select("id, bloc_id, categorie_id, titre, resume, contenu, publie_le, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { data: liens } = await dbPublic().from("articles_etiquettes").select("etiquettes(nom)").eq("article_id", id);
  const etiquettes = ((liens ?? []) as unknown as { etiquettes: { nom: string } | null }[])
    .map((l) => l.etiquettes?.nom)
    .filter((nom): nom is string => Boolean(nom))
    .sort((a, b) => a.localeCompare(b, "fr"));
  return { ...(data as Omit<Article, "etiquettes">), etiquettes };
}
