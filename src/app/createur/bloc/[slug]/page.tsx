import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, FolderPlus } from "lucide-react";
import { FilAriane } from "@/components/FilAriane";
import { compterContenusAdmin, lireBlocAdmin, listerCategoriesAdmin } from "@/lib/contenu-admin";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../../_composants/EnTeteCreateur";
import { FormulaireCreation } from "../../_composants/FormulaireCreation";
import { ListeDossiers } from "../../_composants/ListeDossiers";
import { creerCategorie } from "../../contenu-actions";

export const metadata: Metadata = { title: "Gérer un bloc", robots: { index: false } };

export default async function GererBloc({ params }: PageProps<"/createur/bloc/[slug]">) {
  await exigerCreateur();
  const { slug } = await params;
  const bloc = await lireBlocAdmin({ slug });
  if (!bloc) notFound();

  const categories = await listerCategoriesAdmin(bloc.id, null);
  const compteurs = await compterContenusAdmin(categories.map((c) => c.id));

  return (
    <div data-accent={bloc.accent} className="flex flex-1 flex-col">
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: `/createur/bloc/${bloc.slug}`, libelle: bloc.titre },
          ]}
        />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-extrabold text-accent md:text-5xl">{bloc.titre}</h1>
          <Link href={`/explorer/${bloc.slug}`} className="bouton bouton-discret">
            <Eye className="size-5" aria-hidden="true" />
            Voir comme un lecteur
          </Link>
        </div>
        <p className="mt-3 max-w-[60ch] text-lg text-encre-douce">{bloc.description}</p>

        <section className="mt-10" aria-labelledby="titre-categories">
          <h2 id="titre-categories" className="text-2xl font-bold">
            Catégories
          </h2>
          <div className="mt-6">
            {categories.length > 0 ? (
              <ListeDossiers categories={categories} compteurs={Object.fromEntries(compteurs)} />
            ) : (
              <div className="verre panneau max-w-2xl">
                <FolderPlus className="size-9 text-accent" strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-3 text-lg">Ce bloc est vide. Crée sa première catégorie juste en dessous.</p>
              </div>
            )}
          </div>
          <div className="verre panneau mt-8 max-w-2xl">
            <FormulaireCreation
              action={creerCategorie}
              champsCaches={{ blocId: bloc.id }}
              libelle="Nouvelle catégorie"
              bouton="Créer"
              exemple="Par exemple : Le christianisme"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
