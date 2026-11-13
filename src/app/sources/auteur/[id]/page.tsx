import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { porteJetonCreateur, sessionCreateur } from "@/lib/session";
import { dbAdmin, dbPublic } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Auteur" };

/** Fiche publique d'un auteur : biographie et ouvrages cités dans la bibliothèque. */
export default async function PageAuteur({ params }: PageProps<"/sources/auteur/[id]">) {
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const createur = (await porteJetonCreateur()) && Boolean(await sessionCreateur());
  const db = createur ? dbAdmin() : dbPublic();
  const { data } = await db.from("auteurs").select("id, nom, nom_original, epoque, biographie").eq("id", id).maybeSingle();
  const a = data as { id: string; nom: string; nom_original: string; epoque: string; biographie: string } | null;
  if (!a) notFound();
  const { data: ouvrages } = await db.from("ouvrages").select("id, titre, annee").eq("auteur_id", id).order("titre");
  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <p className="flex items-center gap-2 text-encre-douce">
          <UserRound className="size-5 text-accent" aria-hidden="true" />
          Auteur
        </p>
        <h1 className="mt-2 text-4xl font-extrabold">{a.nom}</h1>
        {(a.nom_original || a.epoque) && (
          <p className="mt-2 text-lg text-encre-douce">
            {a.nom_original && <span dir="auto">{a.nom_original}</span>}
            {a.nom_original && a.epoque && ", "}
            {a.epoque}
          </p>
        )}
        {a.biographie && (
          <div className="lecture-corps mt-8 whitespace-pre-line">
            <p>{a.biographie}</p>
          </div>
        )}
        {(ouvrages ?? []).length > 0 && (
          <section className="mt-12" aria-labelledby="titre-ouvrages">
            <h2 id="titre-ouvrages" className="text-2xl font-bold">
              Ouvrages
            </h2>
            <ul className="mt-5 grid gap-3">
              {((ouvrages ?? []) as { id: string; titre: string; annee: string }[]).map((o) => (
                <li key={o.id}>
                  <Link href={`/sources/ouvrage/${o.id}`} className="carte-article">
                    <cite className="font-bold not-italic">{o.titre}</cite>
                    {o.annee && <span className="ml-2 text-encre-douce">{o.annee}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
