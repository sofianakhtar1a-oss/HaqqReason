import type { Metadata } from "next";
import { EnTete } from "@/components/EnTete";
import { listerPubliees } from "@/lib/contributions/donnees";
import { lireReglages } from "@/lib/reglages-donnees";
import { dbPublic } from "@/lib/supabase";
import { Contribuer } from "./Contribuer";

export const metadata: Metadata = {
  title: "Contribuer",
  description:
    "Proposer un sujet à traiter, apporter un argument de plus à un article, suggérer une amélioration du site ou signaler un bug. Sans compte, en quelques lignes.",
};

export const dynamic = "force-dynamic";

export default async function PageContribuer() {
  const [{ data: blocs }, idees, propositions, ameliorations, reglages] = await Promise.all([
    dbPublic().from("blocs").select("id, slug, titre, accent").order("ordre"),
    listerPubliees("idee"),
    listerPubliees("argument"),
    listerPubliees("site"),
    lireReglages(),
  ]);

  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Contribuer</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Ce site se construit aussi avec ses lecteurs. Proposer un sujet qui manque, renforcer un article qui existe déjà, ou suggérer une
          amélioration du site et signaler un bug. Pas de compte à créer, pas d&apos;adresse à donner : mes réponses t&apos;attendent dans « Mes
          messages ».
        </p>
        <Contribuer
          blocs={(blocs ?? []) as { id: string; slug: string; titre: string; accent: string }[]}
          idees={idees}
          propositions={propositions}
          ameliorations={ameliorations}
          ouvertes={reglages.contributions_ouvertes}
        />
      </main>
    </>
  );
}
