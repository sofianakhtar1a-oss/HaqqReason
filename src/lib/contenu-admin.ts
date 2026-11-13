import "server-only";
import { dbAdmin } from "./supabase";

/*
 * Lectures réservées au mode créateur : elles voient tout (brouillons compris).
 * Chaque page qui les utilise appelle exigerCreateur() AVANT.
 */

export type Statut = "brouillon" | "publie";

export type BlocAdmin = { id: string; slug: string; titre: string; description: string; accent: "or" | "emeraude" | "amethyste" };

export type CategorieAdmin = {
  id: string;
  bloc_id: string;
  parent_id: string | null;
  titre: string;
  description: string;
  icone: string;
  statut: Statut;
  ordre: number;
  supprime_le: string | null;
  updated_at: string;
};

export type ArticleResume = {
  id: string;
  titre: string;
  resume: string;
  statut: Statut;
  ordre: number;
  updated_at: string;
};

export type ArticleAdmin = ArticleResume & {
  bloc_id: string;
  categorie_id: string;
  contenu: unknown;
  supprime_le: string | null;
  publie_le: string | null;
  etiquettes: string[];
};

export type Compteur = { sous_categories: number; articles: number };

export const ARTICLES_PAR_PAGE = 50;

const CHAMPS_CATEGORIE = "id, bloc_id, parent_id, titre, description, icone, statut, ordre, supprime_le, updated_at";

function verifier<T>(resultat: { data: T | null; error: { message: string } | null }, contexte: string): T {
  if (resultat.error) throw new Error(`${contexte} : ${resultat.error.message}`);
  return resultat.data as T;
}

export async function listerBlocsAdmin(): Promise<BlocAdmin[]> {
  return verifier(await dbAdmin().from("blocs").select("id, slug, titre, description, accent").order("ordre"), "Lecture des blocs");
}

export async function lireBlocAdmin(critere: { slug: string } | { id: string }): Promise<BlocAdmin | null> {
  let requete = dbAdmin().from("blocs").select("id, slug, titre, description, accent");
  requete = "slug" in critere ? requete.eq("slug", critere.slug) : requete.eq("id", critere.id);
  return verifier(await requete.maybeSingle(), "Lecture du bloc");
}

export async function lireCategorieAdmin(id: string): Promise<CategorieAdmin | null> {
  return verifier(await dbAdmin().from("categories").select(CHAMPS_CATEGORIE).eq("id", id).maybeSingle(), "Lecture de la catégorie");
}

/** Catégories d'un niveau (racine d'un bloc si parentId est null), hors corbeille. */
export async function listerCategoriesAdmin(blocId: string, parentId: string | null): Promise<CategorieAdmin[]> {
  let requete = dbAdmin().from("categories").select(CHAMPS_CATEGORIE).eq("bloc_id", blocId).is("supprime_le", null);
  requete = parentId ? requete.eq("parent_id", parentId) : requete.is("parent_id", null);
  return verifier(await requete.order("ordre").order("created_at"), "Lecture des catégories");
}

export async function compterContenusAdmin(ids: string[]): Promise<Map<string, Compteur>> {
  const resultat = new Map<string, Compteur>();
  if (ids.length === 0) return resultat;
  const lignes = verifier(
    await dbAdmin().rpc("compter_contenus", { p_categories: ids }),
    "Comptage des contenus",
  ) as { categorie_id: string; sous_categories: number; articles: number }[];
  for (const l of lignes) {
    resultat.set(l.categorie_id, { sous_categories: Number(l.sous_categories), articles: Number(l.articles) });
  }
  return resultat;
}

export async function listerArticlesAdmin(categorieId: string, page: number): Promise<{ articles: ArticleResume[]; total: number }> {
  const debut = (page - 1) * ARTICLES_PAR_PAGE;
  const { data, error, count } = await dbAdmin()
    .from("articles")
    .select("id, titre, resume, statut, ordre, updated_at", { count: "exact" })
    .eq("categorie_id", categorieId)
    .is("supprime_le", null)
    .order("ordre")
    .order("created_at")
    .range(debut, debut + ARTICLES_PAR_PAGE - 1);
  if (error) throw new Error(`Lecture des articles : ${error.message}`);
  return { articles: (data ?? []) as ArticleResume[], total: count ?? 0 };
}

export async function ancetresAdmin(categorieId: string): Promise<{ id: string; titre: string; supprime_le: string | null }[]> {
  return verifier(await dbAdmin().rpc("ancetres_categorie", { p_categorie: categorieId }), "Lecture du fil d'Ariane");
}

/** Vrai si la catégorie et tous ses parents sont publiés et hors corbeille. */
export async function categorieVisible(categorieId: string): Promise<boolean> {
  return Boolean(verifier(await dbAdmin().rpc("categorie_visible", { cat: categorieId }), "Contrôle de visibilité"));
}

export async function lireArticleAdmin(id: string): Promise<ArticleAdmin | null> {
  const article = verifier(
    await dbAdmin()
      .from("articles")
      .select("id, bloc_id, categorie_id, titre, resume, contenu, statut, ordre, supprime_le, publie_le, updated_at")
      .eq("id", id)
      .maybeSingle(),
    "Lecture de l'article",
  ) as Omit<ArticleAdmin, "etiquettes"> | null;
  if (!article) return null;
  const liens = verifier(
    await dbAdmin().from("articles_etiquettes").select("etiquettes(nom)").eq("article_id", id),
    "Lecture des étiquettes",
  ) as unknown as { etiquettes: { nom: string } | null }[];
  const etiquettes = liens.map((l) => l.etiquettes?.nom).filter((nom): nom is string => Boolean(nom));
  etiquettes.sort((a, b) => a.localeCompare(b, "fr"));
  return { ...article, etiquettes };
}

export type NoeudArbre = { id: string; titre: string; bloc_id: string; parent_id: string | null; profondeur: number };

/**
 * Toutes les catégories hors corbeille (et hors des catégories mises à la corbeille), dans l'ordre de l'arbre.
 * Sert à choisir une destination lors d'un déplacement.
 */
export async function arbreCategories(): Promise<NoeudArbre[]> {
  const toutes: Omit<NoeudArbre, "profondeur">[] = [];
  const PAQUET = 1000;
  for (let debut = 0; ; debut += PAQUET) {
    const paquet = verifier(
      await dbAdmin()
        .from("categories")
        .select("id, titre, bloc_id, parent_id")
        .is("supprime_le", null)
        .order("ordre")
        .order("created_at")
        .range(debut, debut + PAQUET - 1),
      "Lecture de l'arborescence",
    ) as Omit<NoeudArbre, "profondeur">[];
    toutes.push(...paquet);
    if (paquet.length < PAQUET) break;
  }

  const enfants = new Map<string, Omit<NoeudArbre, "profondeur">[]>();
  for (const c of toutes) {
    const cle = c.parent_id ?? `bloc:${c.bloc_id}`;
    enfants.set(cle, [...(enfants.get(cle) ?? []), c]);
  }

  // Parcours depuis les racines : une catégorie dont un parent est dans la corbeille n'est jamais atteinte.
  const resultat: NoeudArbre[] = [];
  const parcourir = (cle: string, profondeur: number) => {
    for (const c of enfants.get(cle) ?? []) {
      resultat.push({ ...c, profondeur });
      if (profondeur < 200) parcourir(c.id, profondeur + 1);
    }
  };
  const blocs = [...new Set(toutes.filter((c) => !c.parent_id).map((c) => c.bloc_id))];
  for (const bloc of blocs) parcourir(`bloc:${bloc}`, 0);
  return resultat;
}

export type ElementCorbeille = {
  type: "categorie" | "article";
  id: string;
  titre: string;
  supprime_le: string;
  bloc_id: string;
  parent_id: string | null;
};

export async function contenuCorbeille(): Promise<ElementCorbeille[]> {
  const [categories, articles] = await Promise.all([
    dbAdmin()
      .from("categories")
      .select("id, titre, supprime_le, bloc_id, parent_id")
      .not("supprime_le", "is", null)
      .order("supprime_le", { ascending: false })
      .limit(500),
    dbAdmin()
      .from("articles")
      .select("id, titre, supprime_le, bloc_id, categorie_id")
      .not("supprime_le", "is", null)
      .order("supprime_le", { ascending: false })
      .limit(500),
  ]);
  const elements: ElementCorbeille[] = [
    ...(verifier(categories, "Lecture de la corbeille") as Omit<ElementCorbeille, "type">[]).map((c) => ({ ...c, type: "categorie" as const })),
    ...(verifier(articles, "Lecture de la corbeille") as (Omit<ElementCorbeille, "type" | "parent_id"> & { categorie_id: string })[]).map(
      ({ categorie_id, ...a }) => ({ ...a, parent_id: categorie_id, type: "article" as const }),
    ),
  ];
  return elements.sort((a, b) => b.supprime_le.localeCompare(a.supprime_le));
}

export async function tailleSousArbre(categorieId: string): Promise<{ categories: number; articles: number }> {
  const lignes = verifier(await dbAdmin().rpc("taille_sous_arbre", { p_categorie: categorieId }), "Calcul du contenu") as {
    categories: number;
    articles: number;
  }[];
  return { categories: Number(lignes[0]?.categories ?? 0), articles: Number(lignes[0]?.articles ?? 0) };
}

export async function articlesRecents(limite = 8): Promise<(ArticleResume & { categorie_id: string })[]> {
  return verifier(
    await dbAdmin()
      .from("articles")
      .select("id, titre, resume, statut, ordre, updated_at, categorie_id")
      .is("supprime_le", null)
      .order("updated_at", { ascending: false })
      .limit(limite),
    "Lecture des articles récents",
  );
}
