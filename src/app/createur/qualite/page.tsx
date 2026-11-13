import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Link2Off, TriangleAlert } from "lucide-react";
import { BadgeStatut } from "@/components/BadgeStatut";
import { FilAriane } from "@/components/FilAriane";
import { exigerCreateur } from "@/lib/session";
import { articlesAVerifier, liensCasses, referencesAVerifier } from "@/lib/tableau-de-bord";
import { statutSource } from "@/lib/sources";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";

export const metadata: Metadata = { title: "Contrôle qualité", robots: { index: false } };

export default async function Qualite() {
  await exigerCreateur();
  const [{ articles, total }, casses, refs] = await Promise.all([articlesAVerifier(), liensCasses(), referencesAVerifier()]);

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane etapes={[{ href: "/createur", libelle: "Espace créateur" }, { href: "/createur/qualite", libelle: "Contrôle qualité" }]} />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Contrôle qualité</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Pour être irréprochable devant les meilleurs spécialistes : chaque argument relié à ses sources, chaque hadith avec son degré, chaque
          verset avec sa traduction.
        </p>

        <section className="mt-10" aria-labelledby="titre-a-verifier">
          <h2 id="titre-a-verifier" className="flex items-center gap-2 text-2xl font-bold">
            <TriangleAlert className="size-6 text-or" aria-hidden="true" />
            Articles à compléter ({articles.length} sur {total})
          </h2>
          {articles.length === 0 ? (
            <p className="verre mt-4 flex items-center gap-3 rounded-3xl p-5">
              <CircleCheck className="size-5 text-succes" aria-hidden="true" />
              Aucun article à compléter.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3">
              {articles.map((a) => (
                <li key={a.id} className="verre rounded-3xl p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/createur/article/${a.id}`} className="min-w-0 flex-1 font-semibold hover:underline hover:underline-offset-4">
                      {a.titre}
                    </Link>
                    <BadgeStatut statut={a.statut as "publie" | "brouillon"} />
                  </div>
                  <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-encre-douce">
                    {a.alertes.map((al) => (
                      <li key={al.cle}>{al.message}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12" aria-labelledby="titre-references">
          <h2 id="titre-references" className="flex items-center gap-2 text-2xl font-bold">
            <TriangleAlert className="size-6 text-or" aria-hidden="true" />
            Références à vérifier ({refs.ouvrages.length + refs.citations.length})
          </h2>
          <p className="mt-2 text-encre-douce">Ouvrages incomplets, à vérifier ou contestés (les plus cités d&apos;abord), et citations sans page.</p>
          {(refs.ouvrages.length > 0 || refs.citations.length > 0) && (
            <ul className="mt-4 grid gap-2">
              {refs.ouvrages.map((o) => (
                <li key={o.id}>
                  <Link href={`/createur/sources?ouvrage=${o.id}`} className="rangee flex-wrap hover:border-or">
                    <cite className="min-w-0 flex-1 font-semibold not-italic">{o.titre}</cite>
                    <span className="text-sm text-encre-douce">
                      {o.usages} réf.{o.manques.length > 0 ? `, il manque : ${o.manques.join(", ")}` : ""}
                    </span>
                    <span className="statut-source" data-teinte={statutSource(o.statut).teinte}>
                      {statutSource(o.statut).court}
                    </span>
                  </Link>
                </li>
              ))}
              {refs.citations.map((c) => (
                <li key={c.id} className="rangee flex-wrap">
                  <span className="min-w-0 flex-1 truncate">« {c.texte} »</span>
                  <span className="text-sm text-encre-douce">{c.ouvrage}, page manquante</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12" aria-labelledby="titre-liens-casses">
          <h2 id="titre-liens-casses" className="flex items-center gap-2 text-2xl font-bold">
            <Link2Off className="size-6 text-or" aria-hidden="true" />
            Liens vers des articles inexistants ({casses.length})
          </h2>
          <p className="mt-2 text-encre-douce">
            Un lien [[Titre]] dont aucun article ne porte le titre. Crée l&apos;article, ou corrige le titre dans le lien.
          </p>
          {casses.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {casses.map((l, i) => (
                <li key={i} className="rangee flex-wrap">
                  <Link href={`/createur/article/${l.source_id}`} className="font-semibold hover:underline hover:underline-offset-4">
                    {l.source_titre}
                  </Link>
                  <span className="text-encre-douce">cite</span>
                  <span className="lien-interne-absent">[[{l.cible_texte}]]</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
