import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleLecture } from "@/components/ArticleLecture";
import { EnTete } from "@/components/EnTete";
import { FilAriane } from "@/components/FilAriane";
import { ancetres, lireArticle, lireBloc } from "@/lib/content";
import { porteJetonCreateur } from "@/lib/session";
import { DocumentsJoints } from "@/components/DocumentsJoints";
import { listerFichiers } from "@/lib/fichiers-donnees";
import { estUuid } from "@/lib/validation";
import { after } from "next/server";
import { lireLiens, lireRetroliens } from "@/lib/liens-donnees";
import { dbAdmin } from "@/lib/supabase";
import { sourcesDuDocument } from "@/lib/sources-donnees";
import { articlesLies, categoriesSecondaires, lirePrerequis, lireSuites } from "@/lib/navigation-donnees";

export async function generateMetadata({
  params,
}: PageProps<"/explorer/article/[id]">): Promise<Metadata> {
  const { id } = await params;
  const article = estUuid(id) ? await lireArticle(id) : null;
  if (!article) return { title: "Article introuvable" };
  return {
    title: article.titre,
    description: article.resume || undefined,
    alternates: { canonical: `/explorer/article/${id}` },
    openGraph: {
      title: article.titre,
      description: article.resume || undefined,
      type: "article",
      siteName: "HaqqReason",
      locale: "fr_FR",
      url: `/explorer/article/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: article.titre,
      description: article.resume || undefined,
    },
  };
}

export default async function PageArticle({
  params,
}: PageProps<"/explorer/article/[id]">) {
  const { id } = await params;
  if (!estUuid(id)) notFound();
  // Un brouillon, un article dans la corbeille ou rangé dans une catégorie cachée est introuvable pour un lecteur.
  const article = await lireArticle(id);
  if (!article) notFound();

  const [bloc, chemin, createur, fichiers, liens, retroliens] =
    await Promise.all([
      lireBloc({ id: article.bloc_id }),
      ancetres(article.categorie_id),
      porteJetonCreateur(),
      listerFichiers({ type: "article", id }, "public"),
      lireLiens(id, "public"),
      lireRetroliens(id, "public"),
    ]);
  const [sources, prerequis, suites, lies, aussi] = await Promise.all([
    sourcesDuDocument(article.contenu, "public"),
    lirePrerequis(id, "public"),
    lireSuites(id, "public"),
    articlesLies(id, "public"),
    categoriesSecondaires(id, "public"),
  ]);
  if (!bloc.ok || !bloc.donnees) notFound();
  // Statistique anonyme : un compteur par article et par jour, sans rien sur le lecteur. Le créateur n'est pas compté.
  if (!createur) {
    after(async () => {
      await dbAdmin().rpc("compter_vue", { p_article: id });
    });
  }

  return (
    <div data-accent={bloc.donnees.accent} className="flex flex-1 flex-col">
      <div className="masque-immersif">
        <EnTete>
          {createur && (
            <Link
              href={`/createur/article/${article.id}`}
              className="bouton bouton-discret !min-h-11"
            >
              Modifier
            </Link>
          )}
        </EnTete>
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <div className="masque-immersif">
          <FilAriane
            etapes={[
              { href: "/explorer", libelle: "La bibliothèque" },
              {
                href: `/explorer/${bloc.donnees.slug}`,
                libelle: bloc.donnees.titre,
              },
              ...chemin.map((c) => ({
                href: `/explorer/categorie/${c.id}`,
                libelle: c.titre,
              })),
              {
                href: `/explorer/article/${article.id}`,
                libelle: article.titre,
              },
            ]}
          />
        </div>
        <div className="mt-10">
          <ArticleLecture
            id={article.id}
            liens={liens}
            retroliens={retroliens}
            sources={sources}
            prerequis={prerequis}
            suites={suites}
            lies={lies.filter((l) => !retroliens.some((r) => r.id === l.id) && !suites.some((x) => x.id === l.id) && !prerequis.some((x) => x.id === l.id))}
            aussiDans={aussi}
            apres={<DocumentsJoints fichiers={fichiers} />}
            titre={article.titre}
            resume={article.resume}
            contenu={article.contenu}
            etiquettes={article.etiquettes}
            misAJour={article.updated_at}
          />
        </div>
      </main>
    </div>
  );
}
