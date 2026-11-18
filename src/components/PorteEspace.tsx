import { ArcheBloc } from "@/components/ArcheBloc";
import { BaseIndisponible } from "@/components/BaseIndisponible";
import { EnTete } from "@/components/EnTete";
import { EtoileVide } from "@/components/EtoileVide";
import { compterCategoriesParBloc, listerBlocs } from "@/lib/content";
import type { Espace } from "@/lib/espaces";

function pied(nombre: number): string {
  if (nombre === 0) return "Bientôt disponible";
  return nombre === 1 ? "1 catégorie" : `${nombre} catégories`;
}

/** Page d'entrée d'un espace : ses blocs, présentés comme des portes. */
export async function PorteEspace({ espace, titre, intro }: { espace: Espace; titre: string; intro: string }) {
  const [blocs, compte] = await Promise.all([listerBlocs(espace), compterCategoriesParBloc()]);

  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">{titre}</h1>
        <p className="mt-3 max-w-[56ch] text-lg text-encre-douce">{intro}</p>

        {blocs.ok ? (
          blocs.donnees.length > 0 ? (
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {blocs.donnees.map((bloc) => (
                <li key={bloc.id}>
                  <ArcheBloc
                    href={`/explorer/${bloc.slug}`}
                    titre={bloc.titre}
                    description={bloc.description}
                    accent={bloc.accent}
                    pied={pied(compte[bloc.id] ?? 0)}
                    espace={espace}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="verre panneau mt-10 max-w-2xl text-encre-douce">
              <EtoileVide />
              Ce module ouvre bientôt ses portes.
            </p>
          )
        ) : (
          <BaseIndisponible />
        )}
      </main>
    </>
  );
}
