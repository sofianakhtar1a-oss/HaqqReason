import "server-only";
import { createHash } from "node:crypto";
import { dbAdmin } from "../supabase";
import { decouperArticle } from "./decoupage";
import { calculerVecteurs, nomModele, serviceActif } from "./service";

/*
 * Calcul et mise à jour des vecteurs d'un article.
 *
 * Deux règles qui font tout l'intérêt :
 *  - on ne recalcule QUE les morceaux dont le texte a changé (comparaison d'empreintes),
 *    donc corriger une faute de frappe ne coûte presque rien ;
 *  - une panne du service n'empêche jamais d'enregistrer un article : l'indexation est
 *    rattrapée au prochain enregistrement, ou depuis la page Outils.
 */

export type Bilan = { ok: boolean; calcules: number; inchanges: number; message?: string };

function empreinteDe(modele: string, texte: string): string {
  return createHash("sha256").update(`${modele}\n${texte}`).digest("hex");
}

/** Recalcule ce qui doit l'être pour un article. Ne lève jamais. */
export async function indexerArticle(articleId: string, titre: string, resume: string, texte: string): Promise<Bilan> {
  if (!serviceActif()) return { ok: false, calcules: 0, inchanges: 0, message: "Recherche par le sens inactive." };

  const morceaux = decouperArticle(titre, resume, texte);
  const base = dbAdmin();
  const modele = nomModele();

  if (morceaux.length === 0) {
    await base.from("vecteurs_articles").delete().eq("article_id", articleId);
    return { ok: true, calcules: 0, inchanges: 0 };
  }

  const { data: existants } = await base.from("vecteurs_articles").select("morceau, empreinte").eq("article_id", articleId);
  const deja = new Map(((existants ?? []) as { morceau: number; empreinte: string }[]).map((v) => [v.morceau, v.empreinte]));

  const aCalculer: { morceau: number; texte: string; empreinte: string }[] = [];
  morceaux.forEach((texteMorceau, morceau) => {
    const empreinte = empreinteDe(modele, texteMorceau);
    if (deja.get(morceau) !== empreinte) aCalculer.push({ morceau, texte: texteMorceau, empreinte });
  });

  // Les morceaux en trop (article raccourci) sont retirés.
  const enTrop = [...deja.keys()].filter((m) => m >= morceaux.length);
  if (enTrop.length > 0) await base.from("vecteurs_articles").delete().eq("article_id", articleId).in("morceau", enTrop);

  const inchanges = morceaux.length - aCalculer.length;
  if (aCalculer.length === 0) return { ok: true, calcules: 0, inchanges };

  const resultat = await calculerVecteurs(aCalculer.map((m) => m.texte));
  if (!resultat.ok) return { ok: false, calcules: 0, inchanges, message: resultat.message };

  const lignes = aCalculer.map((m, i) => ({
    article_id: articleId,
    morceau: m.morceau,
    texte: m.texte,
    vecteur: resultat.vecteurs[i],
    modele,
    empreinte: m.empreinte,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await base.from("vecteurs_articles").upsert(lignes, { onConflict: "article_id,morceau" });
  if (error) return { ok: false, calcules: 0, inchanges, message: "Enregistrement des vecteurs impossible." };
  return { ok: true, calcules: lignes.length, inchanges };
}

/** Retire les vecteurs d'un article (corbeille, suppression définitive). */
export async function oublierArticle(articleId: string): Promise<void> {
  try {
    await dbAdmin().from("vecteurs_articles").delete().eq("article_id", articleId);
  } catch {
    // Sans importance : l'article disparaîtra des résultats de toute façon.
  }
}

export type EtatIndexation = { total: number; publies: number; indexes: number; morceaux: number; actif: boolean; raison?: string };

export async function etatIndexation(): Promise<EtatIndexation> {
  const { reglageService } = await import("./service");
  const reglage = reglageService();
  try {
    const { data } = await dbAdmin().rpc("etat_indexation");
    const ligne = (Array.isArray(data) ? data[0] : data) as { articles_total: number; articles_publies: number; articles_indexes: number; morceaux: number } | undefined;
    return {
      total: Number(ligne?.articles_total ?? 0),
      publies: Number(ligne?.articles_publies ?? 0),
      indexes: Number(ligne?.articles_indexes ?? 0),
      morceaux: Number(ligne?.morceaux ?? 0),
      actif: reglage.actif,
      raison: reglage.raison,
    };
  } catch {
    return { total: 0, publies: 0, indexes: 0, morceaux: 0, actif: reglage.actif, raison: reglage.raison };
  }
}
