import type { Metadata } from "next";
import { EnTete } from "@/components/EnTete";
import { donneesFiltres, lireCriteres, rechercher } from "@/lib/recherche";
import { RechercheAvancee } from "./RechercheAvancee";

export const metadata: Metadata = { title: "Recherche" };

export default async function PageRecherche({ searchParams }: PageProps<"/recherche">) {
  const sp = await searchParams;
  const parametres = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(sp)) if (typeof valeur === "string") parametres.set(cle, valeur);
  const criteres = lireCriteres(parametres);
  const premiers = await rechercher(criteres);
  const filtres = await donneesFiltres(premiers.createur);

  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Recherche</h1>
        <RechercheAvancee criteres={criteres} premiers={premiers} filtres={filtres} />
      </main>
    </>
  );
}
