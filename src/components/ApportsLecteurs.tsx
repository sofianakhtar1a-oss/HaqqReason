import Link from "next/link";
import { MessageSquarePlus } from "lucide-react";
import type { ContributionPublique } from "@/lib/contributions/modele";

function quand(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Ce que les lecteurs ont proposé pour renforcer cet article.
 * Affiché en bas de l'article, et seulement s'il y a quelque chose à montrer.
 */
export function ApportsLecteurs({ apports }: { apports: ContributionPublique[] }) {
  if (apports.length === 0) return null;

  return (
    <section className="sans-impression mt-12" aria-labelledby="titre-apports">
      <h2 id="titre-apports" className="flex items-center gap-2 text-2xl font-bold">
        <MessageSquarePlus className="size-6 text-accent" aria-hidden="true" />
        Proposé par les lecteurs
      </h2>
      <p className="mt-2 max-w-[70ch] text-encre-douce">
        Des arguments et des références envoyés par d&apos;autres lecteurs pour appuyer cet article. Ils ne font pas partie du texte : à lire comme des
        pistes.
      </p>
      <div className="contrib-cartes">
        {apports.map((a) => (
          <article key={a.id} className="contrib-carte">
            <header className="contrib-carte-tete">
              <span className="font-semibold">{a.pseudo || "Un lecteur"}</span>
              <time dateTime={a.created_at} className="text-sm text-encre-douce">
                {quand(a.created_at)}
              </time>
            </header>
            <h3 className="contrib-carte-titre">{a.titre}</h3>
            <p className="contrib-carte-texte">{a.texte}</p>
          </article>
        ))}
      </div>
      <Link href="/contribuer" className="bouton bouton-discret mt-5">
        Proposer un argument à ton tour
      </Link>
    </section>
  );
}
