import "server-only";
import { controlerDocument, type Alerte } from "./document-schema";
import { dbAdmin } from "./supabase";

export type ArticleAVerifier = { id: string; titre: string; statut: string; alertes: Alerte[] };

/** Contrôle qualité de tous les articles (hors corbeille). */
export async function articlesAVerifier(): Promise<{ articles: ArticleAVerifier[]; total: number }> {
  const articles: ArticleAVerifier[] = [];
  let total = 0;
  for (let debut = 0; debut < 5000; debut += 500) {
    const { data } = await dbAdmin()
      .from("articles")
      .select("id, titre, statut, contenu")
      .is("supprime_le", null)
      .order("updated_at", { ascending: false })
      .range(debut, debut + 499);
    for (const a of (data ?? []) as { id: string; titre: string; statut: string; contenu: unknown }[]) {
      total++;
      const alertes = controlerDocument(a.contenu);
      if (alertes.length > 0) articles.push({ id: a.id, titre: a.titre, statut: a.statut, alertes });
    }
    if (!data || data.length < 500) break;
  }
  return { articles, total };
}

export async function liensCasses(): Promise<{ source_id: string; source_titre: string; cible_texte: string }[]> {
  const { data } = await dbAdmin().rpc("liens_casses");
  return (data ?? []) as { source_id: string; source_titre: string; cible_texte: string }[];
}

export async function articlesParBloc(): Promise<Map<string, { publies: number; brouillons: number }>> {
  const compte = new Map<string, { publies: number; brouillons: number }>();
  for (let debut = 0; debut < 20000; debut += 1000) {
    const { data } = await dbAdmin().from("articles").select("bloc_id, statut").is("supprime_le", null).range(debut, debut + 999);
    for (const a of (data ?? []) as { bloc_id: string; statut: string }[]) {
      const c = compte.get(a.bloc_id) ?? { publies: 0, brouillons: 0 };
      if (a.statut === "publie") c.publies++;
      else c.brouillons++;
      compte.set(a.bloc_id, c);
    }
    if (!data || data.length < 1000) break;
  }
  return compte;
}

export async function brouillonsEnAttente(limite = 8): Promise<{ id: string; titre: string; updated_at: string }[]> {
  const { data } = await dbAdmin()
    .from("articles")
    .select("id, titre, updated_at")
    .is("supprime_le", null)
    .eq("statut", "brouillon")
    .order("updated_at", { ascending: false })
    .limit(limite);
  return (data ?? []) as { id: string; titre: string; updated_at: string }[];
}

export async function plusLus(jours: number, limite: number): Promise<{ id: string; titre: string; vues: number }[]> {
  const { data } = await dbAdmin().rpc("articles_les_plus_lus", { p_jours: jours, p_limite: limite });
  return ((data ?? []) as { id: string; titre: string; vues: number }[]).map((l) => ({ ...l, vues: Number(l.vues) }));
}

export async function recherchesSansResultat(jours: number, limite: number): Promise<{ terme: string; nombre: number }[]> {
  const { data } = await dbAdmin().rpc("recherches_sans_resultat", { p_jours: jours, p_limite: limite });
  return ((data ?? []) as { terme: string; nombre: number }[]).map((l) => ({ ...l, nombre: Number(l.nombre) }));
}

export async function vuesParJour(jours: number): Promise<{ jour: string; vues: number }[]> {
  const depuis = new Date(Date.now() - jours * 86400000).toISOString().slice(0, 10);
  const totaux = new Map<string, number>();
  for (let debut = 0; debut < 50000; debut += 1000) {
    const { data } = await dbAdmin().from("vues_articles").select("jour, nombre").gte("jour", depuis).range(debut, debut + 999);
    for (const v of (data ?? []) as { jour: string; nombre: number }[]) totaux.set(v.jour, (totaux.get(v.jour) ?? 0) + v.nombre);
    if (!data || data.length < 1000) break;
  }
  const serie: { jour: string; vues: number }[] = [];
  for (let i = jours - 1; i >= 0; i--) {
    const jour = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    serie.push({ jour, vues: totaux.get(jour) ?? 0 });
  }
  return serie;
}

/** Vérificateur de références : ouvrages incomplets ou à vérifier, et citations sans page. */
export async function referencesAVerifier(): Promise<{ ouvrages: { id: string; titre: string; statut: string; manques: string[]; usages: number }[]; citations: { id: string; texte: string; ouvrage: string }[] }> {
  const [o, c, r] = await Promise.all([
    dbAdmin().from("ouvrages").select("id, titre, statut, auteur_id, auteur_texte, editeur, annee").limit(5000),
    dbAdmin().from("citations").select("id, texte, page, ouvrages(titre)").eq("page", "").limit(500),
    dbAdmin().from("references_articles").select("ouvrage_id").limit(50000),
  ]);
  const usages = new Map<string, number>();
  for (const x of (r.data ?? []) as { ouvrage_id: string }[]) usages.set(x.ouvrage_id, (usages.get(x.ouvrage_id) ?? 0) + 1);
  const { manquesOuvrage } = await import("./sources");
  const ouvrages = ((o.data ?? []) as { id: string; titre: string; statut: string; auteur_id: string | null; auteur_texte: string; editeur: string; annee: string }[])
    .map((x) => ({ id: x.id, titre: x.titre, statut: x.statut, manques: manquesOuvrage(x), usages: usages.get(x.id) ?? 0 }))
    .filter((x) => x.manques.length > 0 || ["a-verifier", "incomplete", "contestee"].includes(x.statut))
    .sort((a, b) => b.usages - a.usages);
  const citations = ((c.data ?? []) as unknown as { id: string; texte: string; ouvrages: { titre: string } | null }[]).map((x) => ({ id: x.id, texte: x.texte, ouvrage: x.ouvrages?.titre ?? "" }));
  return { ouvrages, citations };
}
