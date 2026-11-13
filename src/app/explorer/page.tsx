import type { Metadata } from "next";
import { ArcheBloc } from "@/components/ArcheBloc";
import { BaseIndisponible } from "@/components/BaseIndisponible";
import { EnTete } from "@/components/EnTete";
import { compterCategoriesParBloc, listerBlocs } from "@/lib/content";

export const metadata: Metadata = { title: "La bibliothèque" };

function pied(nombre: number): string {
  if (nombre === 0) return "Bientôt disponible";
  return nombre === 1 ? "1 catégorie" : `${nombre} catégories`;
}

export default async function Explorer() {
  const [blocs, compte] = await Promise.all([listerBlocs(), compterCategoriesParBloc()]);

  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">La bibliothèque</h1>
        <p className="mt-3 max-w-[52ch] text-lg text-encre-douce">
          Trois portes, trois démarches. Entre par celle qui correspond à ta question.
        </p>

        {blocs.ok ? (
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {blocs.donnees.map((bloc) => (
              <li key={bloc.id}>
                <ArcheBloc
                  href={`/explorer/${bloc.slug}`}
                  titre={bloc.titre}
                  description={bloc.description}
                  accent={bloc.accent}
                  pied={pied(compte[bloc.id] ?? 0)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <BaseIndisponible />
        )}
      </main>
    </>
  );
}
