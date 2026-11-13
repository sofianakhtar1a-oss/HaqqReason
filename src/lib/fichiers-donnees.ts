import "server-only";
import type { Annotation } from "@/app/createur/fichiers-actions";
import { dbAdmin, dbPublic } from "./supabase";

export type FichierResume = {
  id: string;
  nom: string;
  type_mime: string;
  taille: number;
  pages: number | null;
  statut_texte: "en_attente" | "extrait" | "scanne" | "ocr" | "non_applicable";
  created_at: string;
};

export type FichierDetail = FichierResume & { article_id: string | null; categorie_id: string | null };

const CHAMPS = "id, nom, type_mime, taille, pages, statut_texte, created_at";

/** Fichiers listés d'un article ou d'une catégorie. « public » : seulement ce que la base montre aux lecteurs. */
export async function listerFichiers(cible: { type: "article" | "categorie"; id: string }, mode: "public" | "createur"): Promise<FichierResume[]> {
  const base = mode === "public" ? dbPublic() : dbAdmin();
  const { data } = await base
    .from("fichiers")
    .select(CHAMPS)
    .eq(cible.type === "article" ? "article_id" : "categorie_id", cible.id)
    .eq("etat", "pret")
    .eq("dans_liste", true)
    .order("ordre")
    .order("created_at");
  return (data ?? []) as FichierResume[];
}

export async function lireFichier(id: string, mode: "public" | "createur"): Promise<FichierDetail | null> {
  const base = mode === "public" ? dbPublic() : dbAdmin();
  const { data } = await base.from("fichiers").select(`${CHAMPS}, article_id, categorie_id`).eq("id", id).eq("etat", "pret").maybeSingle();
  return (data as FichierDetail | null) ?? null;
}

export async function lireAnnotations(fichierId: string, mode: "public" | "createur"): Promise<Annotation[]> {
  const base = mode === "public" ? dbPublic() : dbAdmin();
  const { data } = await base
    .from("annotations")
    .select("id, page, type, x, y, largeur, hauteur, couleur, texte, visible")
    .eq("fichier_id", fichierId)
    .order("created_at");
  return (data ?? []) as Annotation[];
}
