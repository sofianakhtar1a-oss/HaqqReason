import Link from "next/link";
import { Eye, FolderPlus } from "lucide-react";
import { FilAriane } from "@/components/FilAriane";
import { compterContenusAdmin, listerCategoriesAdmin, type BlocAdmin } from "@/lib/contenu-admin";
import { EnTeteCreateur } from "./EnTeteCreateur";
import { FormulaireCreation } from "./FormulaireCreation";
import { ListeDossiers } from "./ListeDossiers";
import { creerCategorie } from "../contenu-actions";
import { ESPACES, etapesBloc } from "@/lib/espaces";

/** Les catégories racines d'un bloc, avec le formulaire pour en créer. Sert aux blocs des preuves et à « L'Islam authentique ». */
export async function GestionBloc({ bloc }: { bloc: BlocAdmin }) {
  const islam = bloc.espace === "islam";

  const categories = await listerCategoriesAdmin(bloc.id, null);
  const compteurs = await compterContenusAdmin(categories.map((c) => c.id));

  return (
    <div data-accent={bloc.accent} className="flex flex-1 flex-col">
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={islam ? [{ href: "/createur", libelle: "Espace créateur" }, ...etapesBloc(bloc, "createur")] : etapesBloc(bloc, "createur")}
        />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-extrabold text-accent md:text-5xl">{islam ? ESPACES.islam.titre : bloc.titre}</h1>
          <Link href={islam ? "/islam" : `/explorer/${bloc.slug}`} className="bouton bouton-discret">
            <Eye className="size-5" aria-hidden="true" />
            Voir comme un lecteur
          </Link>
        </div>
        <p className="mt-3 max-w-[60ch] text-lg text-encre-douce">{bloc.description}</p>
        {islam && <p className="mt-2 max-w-[60ch] text-encre-douce">Crée tes catégories, puis tes articles vidéo dedans : tape « / » puis « Vidéo YouTube » dans un article.</p>}

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
                <p className="mt-3 text-lg">{islam ? "Aucune catégorie pour l'instant." : "Ce bloc est vide."} Crée la première juste en dessous.</p>
              </div>
            )}
          </div>
          <div className="verre panneau mt-8 max-w-2xl">
            <FormulaireCreation
              action={creerCategorie}
              champsCaches={{ blocId: bloc.id }}
              libelle="Nouvelle catégorie"
              bouton="Créer"
              exemple={islam ? "Par exemple : Le tawhid" : "Par exemple : Le christianisme"}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
