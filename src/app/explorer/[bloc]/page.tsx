import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { BaseIndisponible } from "@/components/BaseIndisponible";
import { Dossier } from "@/components/Dossier";
import { EnTete } from "@/components/EnTete";
import { FilAriane } from "@/components/FilAriane";
import { compterContenus, lireBloc, listerCategories } from "@/lib/content";
import { porteJetonCreateur } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/explorer/[bloc]">): Promise<Metadata> {
  const { bloc: slug } = await params;
  const bloc = await lireBloc({ slug });
  return { title: bloc.ok && bloc.donnees ? bloc.donnees.titre : "Bloc introuvable" };
}

export default async function PageBloc({ params }: PageProps<"/explorer/[bloc]">) {
  const { bloc: slug } = await params;
  const bloc = await lireBloc({ slug });

  if (!bloc.ok) {
    return (
      <>
        <EnTete />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 sm:px-8">
          <BaseIndisponible />
        </main>
      </>
    );
  }
  if (!bloc.donnees) notFound();

  const [categories, createur] = await Promise.all([listerCategories(bloc.donnees.id, null), porteJetonCreateur()]);
  const compteurs = await compterContenus(categories.map((c) => c.id));

  return (
    <div data-accent={bloc.donnees.accent} className="flex flex-1 flex-col">
      <EnTete>
        {createur && (
          <Link href={`/createur/bloc/${bloc.donnees.slug}`} className="bouton bouton-discret !min-h-11">
            Gérer ce bloc
          </Link>
        )}
      </EnTete>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/explorer", libelle: "La bibliothèque" },
            { href: `/explorer/${bloc.donnees.slug}`, libelle: bloc.donnees.titre },
          ]}
        />
        <h1 className="mt-6 text-4xl font-extrabold text-accent md:text-6xl">{bloc.donnees.titre}</h1>
        <p className="mt-4 max-w-[58ch] text-lg text-encre-douce">{bloc.donnees.description}</p>

        {categories.length === 0 ? (
          <div className="verre panneau mt-10 max-w-2xl">
            <FolderOpen className="size-9 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-bold">Aucune catégorie publiée pour l&apos;instant</h2>
            <p className="mt-2 text-encre-douce">Les premiers dossiers de ce bloc apparaîtront ici dès leur publication.</p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
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
        )}
      </main>
    </div>
  );
}
