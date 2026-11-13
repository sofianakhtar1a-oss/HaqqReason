"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import { lireCategorieAdmin } from "@/lib/contenu-admin";
import { documentVersTexteBrut } from "@/lib/document";
import { textesParType } from "@/lib/document-schema";
import { validerDocument } from "@/lib/editeur/validation-serveur";
import { extraireLiens } from "@/lib/liens";
import { sessionCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { estUuid, LIMITES, ligne, slugifier } from "@/lib/validation";

type Retour = { ok: true; id: string } | { ok: false; message: string };

/** Retrouve (ou crée en brouillon) la sous-catégorie « chemin » sous la catégorie de départ. */
async function dossier(racine: { id: string; bloc_id: string }, chemin: string[]): Promise<string> {
  let parent = racine.id;
  for (const brut of chemin.slice(0, 12)) {
    const titre = ligne(brut).slice(0, LIMITES.titreCategorie);
    if (!titre) continue;
    const { data } = await dbAdmin().from("categories").select("id").eq("parent_id", parent).eq("titre", titre).is("supprime_le", null).limit(1);
    if (data?.[0]) {
      parent = data[0].id as string;
      continue;
    }
    const { data: cree, error } = await dbAdmin()
      .from("categories")
      .insert({ bloc_id: racine.bloc_id, parent_id: parent, titre, slug: slugifier(titre), statut: "brouillon", ordre: Date.now() % 2147483647 })
      .select("id")
      .single();
    if (error || !cree) throw new Error("Création de dossier impossible.");
    parent = cree.id as string;
  }
  return parent;
}

/** Crée un article en brouillon à partir d'un document converti dans le navigateur (puis revérifié ici). */
export async function importerArticle(donnees: { categorieId: string; titre: string; contenu: unknown; chemin: string[] }): Promise<Retour> {
  if (!(await sessionCreateur())) return { ok: false, message: "Ta session a expiré. Reconnecte-toi, puis relance l'import." };
  if (!estUuid(donnees.categorieId)) return { ok: false, message: "Choisis une catégorie de destination." };
  const titre = ligne(String(donnees.titre ?? "")).slice(0, LIMITES.titreArticle) || "Article importé";
  const categorie = await lireCategorieAdmin(donnees.categorieId);
  if (!categorie || categorie.supprime_le) return { ok: false, message: "Catégorie introuvable." };
  const valide = validerDocument(donnees.contenu);
  if (!valide.ok) return { ok: false, message: `« ${titre} » : contenu non reconnu.` };
  const texte = documentVersTexteBrut(valide.document);
  if (texte.length > LIMITES.texte) return { ok: false, message: `« ${titre} » est trop long : découpe-le avant de l'importer.` };

  const chemin = Array.isArray(donnees.chemin) ? donnees.chemin.map(String) : [];
  let categorieId = categorie.id;
  try {
    categorieId = await dossier(categorie, chemin);
  } catch {
    return { ok: false, message: `« ${titre} » : impossible de créer son dossier.` };
  }
  const types = textesParType(valide.document);
  const { data, error } = await dbAdmin()
    .from("articles")
    .insert({
      bloc_id: categorie.bloc_id,
      categorie_id: categorieId,
      titre,
      slug: slugifier(titre),
      statut: "brouillon",
      ordre: Date.now() % 2147483647,
      contenu: valide.document,
      contenu_texte: texte,
      texte_versets: types.versets,
      texte_hadiths: types.hadiths,
      texte_objections: types.objections,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, message: `« ${titre} » : enregistrement impossible.` };
  await dbAdmin().rpc("enregistrer_liens", { p_source: data.id, p_cibles: extraireLiens(texte) });
  return { ok: true, id: data.id as string };
}

export async function terminerImport(nombre: number): Promise<void> {
  if (!(await sessionCreateur())) return;
  await journaliser("import_en_masse", { articles: Math.max(0, Math.floor(Number(nombre) || 0)) });
  revalidatePath("/", "layout");
}
