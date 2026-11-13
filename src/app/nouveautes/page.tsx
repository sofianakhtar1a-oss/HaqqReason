import type { Metadata } from "next";
import Link from "next/link";
import { EnTete } from "@/components/EnTete";
import { dbPublic } from "@/lib/supabase";

export const metadata: Metadata = { title: "Nouveautés", description: "Les derniers articles publiés et mis à jour dans HaqqReason." };

/** Les articles publiés ou modifiés récemment. */
export default async function Nouveautes() {
  const { data } = await dbPublic().from("articles").select("id, titre, resume, publie_le, updated_at").order("updated_at", { ascending: false }).limit(40);
  const articles = (data ?? []) as { id: string; titre: string; resume: string; publie_le: string | null; updated_at: string }[];
  const format = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Nouveautés</h1>
        <p className="mt-3 text-lg text-encre-douce">Les articles publiés ou enrichis récemment.</p>
        {articles.length === 0 ? (
          <p className="verre mt-8 rounded-3xl p-6 text-encre-douce">Aucun article publié pour l&apos;instant.</p>
        ) : (
          <ol className="mt-8 grid gap-3">
            {articles.map((a) => {
              const nouveau = a.publie_le && new Date(a.updated_at).getTime() - new Date(a.publie_le).getTime() < 3600_000;
              return (
                <li key={a.id}>
                  <Link href={`/explorer/article/${a.id}`} className="carte-article">
                    <span className="text-sm text-encre-douce">
                      {nouveau ? "Publié" : "Mis à jour"} le {format(a.updated_at)}
                    </span>
                    <span className="mt-1 block text-lg font-bold">{a.titre}</span>
                    {a.resume && <span className="mt-1.5 line-clamp-2 block text-encre-douce">{a.resume}</span>}
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}
