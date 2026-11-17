import type { Metadata } from "next";
import { FilAriane } from "@/components/FilAriane";
import { exigerCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";
import { GestionSources, type Donnees } from "./GestionSources";

export const metadata: Metadata = { title: "Sources et références", robots: { index: false } };

export default async function Sources({ searchParams }: PageProps<"/createur/sources">) {
  await exigerCreateur();
  const p = await searchParams;
  const [ouvrages, auteurs, citations, refs] = await Promise.all([
    dbAdmin().from("ouvrages").select("*").order("titre").limit(5000),
    dbAdmin().from("auteurs").select("*").order("nom").limit(5000),
    dbAdmin().from("citations").select("*").order("created_at", { ascending: false }).limit(5000),
    dbAdmin().from("references_articles").select("ouvrage_id, citation_id").limit(50000),
  ]);
  const usages: Record<string, number> = {};
  for (const r of (refs.data ?? []) as { ouvrage_id: string; citation_id: string | null }[]) {
    usages[r.ouvrage_id] = (usages[r.ouvrage_id] ?? 0) + 1;
    if (r.citation_id) usages[r.citation_id] = (usages[r.citation_id] ?? 0) + 1;
  }
  const donnees: Donnees = {
    ouvrages: (ouvrages.data ?? []) as Donnees["ouvrages"],
    auteurs: (auteurs.data ?? []) as Donnees["auteurs"],
    citations: (citations.data ?? []) as Donnees["citations"],
    usages,
  };
  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: "/createur/outils", libelle: "Outils" },
            { href: "/createur/sources", libelle: "Sources" },
          ]}
        />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Sources et références</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Ta bibliothèque d&apos;ouvrages, d&apos;auteurs et de citations. Enregistre une source une fois, cite-la dans autant d&apos;articles que tu veux :
          la bibliographie se construit toute seule.
        </p>
        <GestionSources donnees={donnees} ouvrir={typeof p.ouvrage === "string" ? p.ouvrage : null} />
      </main>
    </>
  );
}
