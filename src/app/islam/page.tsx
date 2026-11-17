import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { BaseIndisponible } from "@/components/BaseIndisponible";
import { Dossier } from "@/components/Dossier";
import { EnTete } from "@/components/EnTete";
import { compterContenus, listerBlocs, listerCategories } from "@/lib/content";
import { porteJetonCreateur } from "@/lib/session";

export const metadata: Metadata = {
  title: "L'Islam authentique",
  description: "Des vidéos qui expliquent l'islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs.",
};

/** « L'Islam authentique » : les catégories créées par le créateur, sans niveau de blocs. */
export default async function IslamAuthentique() {
  const [blocs, createur] = await Promise.all([listerBlocs("islam"), porteJetonCreateur()]);
  const bloc = blocs.ok ? blocs.donnees[0] : undefined;
  const categories = bloc ? await listerCategories(bloc.id, null) : [];
  const compteurs = await compterContenus(categories.map((c) => c.id));

  return (
    <div data-accent={bloc?.accent ?? "or"} className="flex flex-1 flex-col">
      <EnTete>
        {createur && (
          <Link href="/createur/islam" className="bouton bouton-discret !min-h-11">
            Gérer ce module
          </Link>
        )}
      </EnTete>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">L&apos;Islam authentique</h1>
        <p className="mt-3 max-w-[56ch] text-lg text-encre-douce">
          Des vidéos qui expliquent chaque aspect de l&apos;islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs.
        </p>

        {!blocs.ok ? (
          <BaseIndisponible />
        ) : categories.length === 0 ? (
          <div className="verre panneau mt-10 max-w-2xl">
            <FolderOpen className="size-9 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-bold">Les premières vidéos arrivent bientôt</h2>
            <p className="mt-2 text-encre-douce">Les catégories apparaîtront ici dès leur publication.</p>
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
