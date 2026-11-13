"use server";

import { journaliser } from "@/lib/audit";
import { indexerArticle } from "@/lib/sens/indexation";
import { serviceActif } from "@/lib/sens/service";
import { sessionCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";

/*
 * Indexation des articles déjà écrits, par petits paquets.
 * Le navigateur rappelle cette action tant qu'il reste des articles : chaque appel reste
 * court, la page ne se bloque pas, et l'avancement s'affiche.
 */

const PAR_PAQUET = 3;

export type Avancement = { ok: boolean; traites: number; restants: number; calcules: number; message?: string };

export async function indexerUnPaquet(): Promise<Avancement> {
  if (!(await sessionCreateur())) return { ok: false, traites: 0, restants: 0, calcules: 0, message: "Ta session a expiré. Reconnecte-toi." };
  if (!serviceActif()) return { ok: false, traites: 0, restants: 0, calcules: 0, message: "Aucune clé n'est configurée : la recherche par le sens est inactive." };

  const base = dbAdmin();
  // Articles publiés qui n'ont aucun vecteur, ou dont le texte a changé depuis.
  const { data: articles, error } = await base
    .from("articles")
    .select("id, titre, resume, contenu_texte, updated_at, vecteurs_articles(updated_at)")
    .is("supprime_le", null)
    .order("updated_at", { ascending: true })
    .limit(200);
  if (error) return { ok: false, traites: 0, restants: 0, calcules: 0, message: "Lecture des articles impossible." };

  type Ligne = { id: string; titre: string; resume: string; contenu_texte: string; updated_at: string; vecteurs_articles: { updated_at: string }[] };
  const aFaire = ((articles ?? []) as unknown as Ligne[]).filter((a) => {
    const vecteurs = a.vecteurs_articles ?? [];
    if (vecteurs.length === 0) return true;
    const dernier = Math.max(...vecteurs.map((v) => new Date(v.updated_at).getTime()));
    return dernier < new Date(a.updated_at).getTime();
  });

  let calcules = 0;
  let traites = 0;
  let message: string | undefined;
  for (const article of aFaire.slice(0, PAR_PAQUET)) {
    const bilan = await indexerArticle(article.id, article.titre, article.resume, article.contenu_texte ?? "");
    traites++;
    calcules += bilan.calcules;
    if (!bilan.ok) {
      message = bilan.message;
      break;
    }
  }
  if (traites > 0 && !message) await journaliser("indexation_sens", { articles: traites, morceaux: calcules });
  return { ok: !message, traites, restants: Math.max(0, aFaire.length - traites), calcules, message };
}
