import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ExternalLink } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { porteJetonCreateur, sessionCreateur } from "@/lib/session";
import { localisation, statutSource, type CitationAffichee, type OuvrageAffiche } from "@/lib/sources";
import { dbAdmin, dbPublic } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Ouvrage" };

const COLONNES = "id, titre, titre_original, auteur_id, auteur_texte, editeur, edition, lieu, annee, volumes, langue, isbn, lien, statut";

/** Fiche publique d'un ouvrage : références, citations utilisées et articles qui le citent. */
export default async function PageOuvrage({ params }: PageProps<"/sources/ouvrage/[id]">) {
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const createur = (await porteJetonCreateur()) && Boolean(await sessionCreateur());
  const db = createur ? dbAdmin() : dbPublic();
  const { data } = await db.from("ouvrages").select(COLONNES).eq("id", id).maybeSingle();
  const o = data as OuvrageAffiche | null;
  if (!o) notFound();
  const [auteur, citations, refs] = await Promise.all([
    o.auteur_id ? db.from("auteurs").select("id, nom, nom_original, epoque").eq("id", o.auteur_id).maybeSingle() : Promise.resolve({ data: null }),
    db.from("citations").select("id, ouvrage_id, texte, texte_original, tome, page, contexte, statut").eq("ouvrage_id", id).order("page"),
    db.from("references_articles").select("article_id, page, articles(id, titre, statut, supprime_le)").eq("ouvrage_id", id),
  ]);
  const a = auteur.data as { id: string; nom: string; nom_original: string; epoque: string } | null;
  const statut = statutSource(o.statut);
  const articles = new Map<string, { titre: string; pages: Set<string> }>();
  for (const r of (refs.data ?? []) as unknown as { article_id: string; page: string; articles: { id: string; titre: string; statut: string; supprime_le: string | null } | null }[]) {
    if (!r.articles || r.articles.supprime_le) continue;
    const e = articles.get(r.article_id) ?? { titre: r.articles.titre, pages: new Set<string>() };
    if (r.page) e.pages.add(r.page);
    articles.set(r.article_id, e);
  }
  const details = [
    ["Titre original", o.titre_original],
    ["Éditeur", o.editeur],
    ["Édition", o.edition],
    ["Lieu", o.lieu],
    ["Année", o.annee],
    ["Volumes", o.volumes],
    ["Langue", o.langue],
    ["ISBN", o.isbn],
  ].filter(([, v]) => v);

  return (
    <>
      <EnTete>
        {createur && (
          <Link href={`/createur/sources?ouvrage=${o.id}`} className="bouton bouton-discret !min-h-11">
            Modifier
          </Link>
        )}
      </EnTete>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <p className="flex items-center gap-2 text-encre-douce">
          <BookOpen className="size-5 text-accent" aria-hidden="true" />
          Ouvrage
        </p>
        <h1 className="mt-2 text-4xl font-extrabold">{o.titre}</h1>
        <p className="mt-3 text-lg">
          {a ? (
            <Link href={`/sources/auteur/${a.id}`} className="font-semibold underline underline-offset-4">
              {a.nom}
            </Link>
          ) : (
            o.auteur_texte
          )}
          {a?.epoque && <span className="text-encre-douce"> ({a.epoque})</span>}
        </p>
        <p className="mt-4">
          <span className="statut-source" data-teinte={statut.teinte}>
            {statut.libelle}
          </span>
        </p>
        {details.length > 0 && (
          <dl className="fiche-details mt-8">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {o.lien && (
          <a href={o.lien} target="_blank" rel="noopener noreferrer nofollow" className="mt-6 inline-flex items-center gap-2 font-semibold text-accent underline-offset-4 hover:underline">
            Consulter en ligne
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}

        {(citations.data ?? []).length > 0 && (
          <section className="mt-12" aria-labelledby="titre-citations">
            <h2 id="titre-citations" className="text-2xl font-bold">
              Citations
            </h2>
            <div className="mt-5 space-y-5">
              {((citations.data ?? []) as CitationAffichee[]).map((c) => (
                <figure key={c.id} className="citation-ouvrage">
                  {c.texte_original && (
                    <blockquote className="citation-originale" dir="auto">
                      {c.texte_original}
                    </blockquote>
                  )}
                  <blockquote>{c.texte}</blockquote>
                  <figcaption>
                    {localisation(c.tome, c.page) || "Page non précisée"}
                    <span className="statut-source" data-teinte={statutSource(c.statut).teinte}>
                      {statutSource(c.statut).court}
                    </span>
                  </figcaption>
                  {c.contexte && <p className="mt-2 text-sm text-encre-douce">{c.contexte}</p>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {articles.size > 0 && (
          <section className="mt-12" aria-labelledby="titre-cite-par">
            <h2 id="titre-cite-par" className="text-2xl font-bold">
              Cité dans
            </h2>
            <ul className="mt-5 grid gap-3">
              {[...articles].map(([aid, e]) => (
                <li key={aid}>
                  <Link href={`/explorer/article/${aid}`} className="carte-article">
                    <span className="font-bold">{e.titre}</span>
                    {e.pages.size > 0 && <span className="mt-1 block text-sm text-encre-douce">p. {[...e.pages].join(", ")}</span>}
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
