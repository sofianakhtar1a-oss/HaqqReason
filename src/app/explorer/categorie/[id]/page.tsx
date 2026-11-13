import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Dossier } from "@/components/Dossier";
import { EnTete } from "@/components/EnTete";
import { FilAriane } from "@/components/FilAriane";
import { IconeCategorie } from "@/components/IconeCategorie";
import { Pagination, lirePage } from "@/components/Pagination";
import { ARTICLES_PAR_PAGE, ancetres, compterContenus, lireBloc, lireCategorie, listerArticles, listerCategories } from "@/lib/content";
import { porteJetonCreateur } from "@/lib/session";
import { DocumentsJoints } from "@/components/DocumentsJoints";
import { articlesAussiClasses } from "@/lib/navigation-donnees";
import { listerFichiers } from "@/lib/fichiers-donnees";
import { estUuid } from "@/lib/validation";
import { Printer } from "lucide-react";
import { BoutonPartage } from "@/components/lecture/BoutonPartage";

export async function generateMetadata({ params }: PageProps<"/explorer/categorie/[id]">): Promise<Metadata> {
  const { id } = await params;
  const categorie = estUuid(id) ? await lireCategorie(id) : null;
  if (!categorie) return { title: "Catégorie introuvable" };
  return {
    title: categorie.titre,
    description: categorie.description || undefined,
    alternates: { canonical: `/explorer/categorie/${id}` },
    openGraph: { title: categorie.titre, description: categorie.description || undefined, siteName: "HaqqReason", locale: "fr_FR", url: `/explorer/categorie/${id}` },
    twitter: { card: "summary_large_image", title: categorie.titre, description: categorie.description || undefined },
  };
}

export default async function PageCategorie({ params, searchParams }: PageProps<"/explorer/categorie/[id]">) {
  const { id } = await params;
  if (!estUuid(id)) notFound();
  // Une catégorie en brouillon, dans la corbeille ou sous une catégorie cachée est introuvable pour un lecteur.
  const categorie = await lireCategorie(id);
  if (!categorie) notFound();

  const page = lirePage((await searchParams).page);
  const aussi = await articlesAussiClasses(id, "public");
  const [bloc, chemin, sousCategories, { articles, total }, createur, fichiers] = await Promise.all([
    lireBloc({ id: categorie.bloc_id }),
    ancetres(id),
    listerCategories(categorie.bloc_id, id),
    listerArticles(id, page),
    porteJetonCreateur(),
    listerFichiers({ type: "categorie", id }, "public"),
  ]);
  if (!bloc.ok || !bloc.donnees) notFound();
  const compteurs = await compterContenus(sousCategories.map((c) => c.id));
  const pages = Math.max(1, Math.ceil(total / ARTICLES_PAR_PAGE));

  return (
    <div data-accent={bloc.donnees.accent} className="flex flex-1 flex-col">
      <EnTete>
        {createur && (
          <Link href={`/createur/categorie/${categorie.id}`} className="bouton bouton-discret !min-h-11">
            Modifier
          </Link>
        )}
      </EnTete>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/explorer", libelle: "La bibliothèque" },
            { href: `/explorer/${bloc.donnees.slug}`, libelle: bloc.donnees.titre },
            ...chemin.map((c) => ({ href: `/explorer/categorie/${c.id}`, libelle: c.titre })),
          ]}
        />
        <div className="mt-8 flex items-start gap-4">
          <span className="mt-2 hidden text-accent sm:block">
            <IconeCategorie icone={categorie.icone} className="size-10" />
          </span>
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">{categorie.titre}</h1>
            {categorie.description && <p className="mt-4 max-w-[60ch] text-lg text-encre-douce">{categorie.description}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <a href={`/explorer/categorie/${categorie.id}/imprimer`} target="_blank" rel="noopener" className="bouton bouton-discret !min-h-10 text-sm">
                <Printer className="size-4" aria-hidden="true" />
                Exporter toute la catégorie en PDF
              </a>
              <BoutonPartage titre={categorie.titre} />
            </div>
          </div>
        </div>

        {sousCategories.length > 0 && (
          <section className="mt-12" aria-labelledby="titre-sous-categories">
            <h2 id="titre-sous-categories" className="text-2xl font-bold">
              Sous-catégories
            </h2>
            <ul className="mt-6 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {sousCategories.map((c) => {
                const compte = compteurs.get(c.id) ?? { sous_categories: 0, articles: 0 };
                return (
                  <li key={c.id}>
                    <Dossier
                      href={`/explorer/categorie/${c.id}`}
                      titre={c.titre}
                      description={c.description}
                      icone={c.icone}
                      sousCategories={compte.sous_categories}
                      articles={compte.articles}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {total > 0 && (
          <section className="mt-12" aria-labelledby="titre-articles">
            <h2 id="titre-articles" className="text-2xl font-bold">
              {total === 1 ? "1 article" : `${total} articles`}
            </h2>
            <ul className="mt-6 grid max-w-3xl gap-3">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link href={`/explorer/article/${a.id}`} className="carte-article">
                    <h3 className="text-lg font-bold">{a.titre}</h3>
                    {a.resume && <p className="mt-1.5 line-clamp-2 text-encre-douce">{a.resume}</p>}
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination base={`/explorer/categorie/${categorie.id}`} page={page} pages={pages} />
          </section>
        )}

        {aussi.length > 0 && (
          <section className="mt-12" aria-labelledby="titre-aussi">
            <h2 id="titre-aussi" className="text-2xl font-bold">
              Aussi classés ici
            </h2>
            <ul className="mt-6 grid max-w-3xl gap-3">
              {aussi.map((a) => (
                <li key={a.id}>
                  <Link href={`/explorer/article/${a.id}`} className="carte-article">
                    <h3 className="text-lg font-bold">{a.titre}</h3>
                    {a.resume && <p className="mt-1.5 line-clamp-2 text-encre-douce">{a.resume}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DocumentsJoints fichiers={fichiers} titre="Documents" />

        {sousCategories.length === 0 && total === 0 && fichiers.length === 0 && aussi.length === 0 && (
          <p className="verre panneau mt-12 max-w-2xl text-lg">Cette catégorie ne contient encore aucun article publié.</p>
        )}
      </main>
    </div>
  );
}
