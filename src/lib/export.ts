import "server-only";
import { lireLiens } from "./liens-donnees";
import type { LiensResolus } from "./liens";
import { dbPublic } from "./supabase";
import type { DonneesSources } from "./sources";
import { sourcesDuDocument } from "./sources-donnees";

export type ArticleExport = { id: string; titre: string; resume: string; contenu: unknown; updated_at: string; liens: LiensResolus; sources?: DonneesSources };
export type SectionExport = { id: string; chemin: string[]; articles: ArticleExport[] };

const MAX_ARTICLES = 300;

/** Tout le contenu publié d'une catégorie et de ses sous-catégories, dans l'ordre de lecture. */
export async function contenuCategorie(categorieId: string, titreRacine: string): Promise<{ sections: SectionExport[]; tronque: boolean }> {
  const sections: SectionExport[] = [];
  let total = 0;
  let tronque = false;

  const visiter = async (id: string, chemin: string[], profondeur: number): Promise<void> => {
    if (profondeur > 30 || tronque) return;
    const { data: arts } = await dbPublic()
      .from("articles")
      .select("id, titre, resume, contenu, updated_at")
      .eq("categorie_id", id)
      .order("ordre")
      .order("created_at");
    const liste = (arts ?? []) as Omit<ArticleExport, "liens">[];
    const gardes = liste.slice(0, Math.max(0, MAX_ARTICLES - total));
    if (gardes.length < liste.length) tronque = true;
    total += gardes.length;
    const avecLiens = await Promise.all(gardes.map(async (a) => ({ ...a, liens: await lireLiens(a.id, "public"), sources: await sourcesDuDocument(a.contenu, "public") })));
    if (avecLiens.length > 0) sections.push({ id, chemin, articles: avecLiens });
    const { data: enfants } = await dbPublic().from("categories").select("id, titre").eq("parent_id", id).order("ordre").order("created_at");
    for (const e of (enfants ?? []) as { id: string; titre: string }[]) await visiter(e.id, [...chemin, e.titre], profondeur + 1);
  };

  await visiter(categorieId, [titreRacine], 0);
  return { sections, tronque };
}
