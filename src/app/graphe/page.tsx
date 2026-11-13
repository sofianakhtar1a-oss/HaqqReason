import type { Metadata } from "next";
import { EnTete } from "@/components/EnTete";
import { dbPublic } from "@/lib/supabase";
import { GrapheConnaissances, type Arete, type Noeud } from "./GrapheConnaissances";

export const metadata: Metadata = {
  title: "Graphe de connaissances",
  description: "Les liens entre les articles, les catégories et les étiquettes de HaqqReason.",
};

export default async function PageGraphe() {
  const db = dbPublic();
  const [blocs, categories, articles, etiquettes, liens] = await Promise.all([
    db.from("blocs").select("id, titre, accent, slug").order("ordre"),
    db.from("categories").select("id, bloc_id, parent_id, titre").limit(5000),
    db.from("articles").select("id, categorie_id, bloc_id, titre").limit(5000),
    db.from("articles_etiquettes").select("article_id, etiquettes(id, nom)").limit(20000),
    db.rpc("graphe_liens"),
  ]);

  const noeuds: Noeud[] = [];
  const aretes: Arete[] = [];
  const accents = new Map<string, string>();
  for (const b of (blocs.data ?? []) as { id: string; titre: string; accent: string; slug: string }[]) {
    accents.set(b.id, b.accent);
    noeuds.push({ id: b.id, type: "bloc", titre: b.titre, accent: b.accent, href: `/explorer/${b.slug}` });
  }
  for (const c of (categories.data ?? []) as { id: string; bloc_id: string; parent_id: string | null; titre: string }[]) {
    noeuds.push({ id: c.id, type: "categorie", titre: c.titre, accent: accents.get(c.bloc_id) ?? "or", href: `/explorer/categorie/${c.id}` });
    aretes.push({ source: c.id, cible: c.parent_id ?? c.bloc_id, type: "rangement" });
  }
  for (const a of (articles.data ?? []) as { id: string; categorie_id: string; bloc_id: string; titre: string }[]) {
    noeuds.push({ id: a.id, type: "article", titre: a.titre, accent: accents.get(a.bloc_id) ?? "or", href: `/explorer/article/${a.id}` });
    aretes.push({ source: a.id, cible: a.categorie_id, type: "rangement" });
  }
  const vues = new Set<string>();
  for (const l of (etiquettes.data ?? []) as unknown as { article_id: string; etiquettes: { id: string; nom: string } | null }[]) {
    if (!l.etiquettes) continue;
    const id = `etiquette-${l.etiquettes.id}`;
    if (!vues.has(id)) {
      vues.add(id);
      noeuds.push({ id, type: "etiquette", titre: l.etiquettes.nom, accent: "neutre", href: `/recherche?etiquettes=${encodeURIComponent(l.etiquettes.nom)}` });
    }
    aretes.push({ source: l.article_id, cible: id, type: "etiquette" });
  }
  for (const l of (liens.data ?? []) as { source_id: string; cible_id: string }[]) aretes.push({ source: l.source_id, cible: l.cible_id, type: "lien" });

  const ids = new Set(noeuds.map((n) => n.id));
  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-12 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Graphe de connaissances</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Chaque point est un bloc, une catégorie, un article ou une étiquette. Les traits dorés relient les articles qui se citent. Survole un
          point pour voir ses voisins, clique pour l&apos;ouvrir.
        </p>
        <GrapheConnaissances noeuds={noeuds} aretes={aretes.filter((a) => ids.has(a.source) && ids.has(a.cible))} />
      </main>
    </>
  );
}
