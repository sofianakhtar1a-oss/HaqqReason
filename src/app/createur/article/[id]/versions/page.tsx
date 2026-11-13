import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { diffWords } from "diff";
import { BoutonConfirmation } from "@/components/BoutonConfirmation";
import { FilAriane } from "@/components/FilAriane";
import { RenduDocument } from "@/components/RenduDocument";
import { lireArticleAdmin } from "@/lib/contenu-admin";
import { documentVersTexteAere } from "@/lib/document";
import { exigerCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";
import { EnTeteCreateur } from "../../../_composants/EnTeteCreateur";
import { restaurerVersion } from "../../../contenu-actions";

export const metadata: Metadata = { title: "Historique des versions", robots: { index: false } };

const MOTIFS: Record<string, string> = {
  automatique: "Enregistrement automatique",
  enregistrement: "Enregistrement manuel",
  publication: "Publication",
  "avant-restauration": "Avant une restauration",
  creation: "Création",
};

/** Au-delà de cette taille, la comparaison se fait ligne par ligne (plus rapide). */
const SEUIL_COMPARAISON_FINE = 60_000;

function Comparaison({ avant, apres }: { avant: string; apres: string }) {
  if (avant === apres) return <p className="text-encre-douce">Le texte de cette version est identique au texte actuel.</p>;
  const fine = avant.length + apres.length <= SEUIL_COMPARAISON_FINE;
  const morceaux = fine
    ? diffWords(avant, apres)
    : (() => {
        const a = new Set(avant.split("\n"));
        const b = new Set(apres.split("\n"));
        return [
          ...avant.split("\n").filter((l) => !b.has(l)).map((l) => ({ value: `${l}\n`, removed: true, added: false })),
          ...apres.split("\n").filter((l) => !a.has(l)).map((l) => ({ value: `${l}\n`, added: true, removed: false })),
        ];
      })();
  return (
    <div className="diff whitespace-pre-wrap text-[1.0625rem] leading-relaxed">
      {morceaux.map((m, i) => (m.added ? <ins key={i}>{m.value}</ins> : m.removed ? <del key={i}>{m.value}</del> : <span key={i}>{m.value}</span>))}
    </div>
  );
}

export default async function Versions({ params, searchParams }: PageProps<"/createur/article/[id]/versions">) {
  await exigerCreateur();
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const article = await lireArticleAdmin(id);
  if (!article) notFound();

  const sp = await searchParams;
  const { data: versions } = await dbAdmin()
    .from("versions_articles")
    .select("id, titre, motif, created_at")
    .eq("article_id", id)
    .order("created_at", { ascending: false })
    .limit(200);
  const liste = versions ?? [];
  const choisie = typeof sp.v === "string" && estUuid(sp.v) ? sp.v : liste[0]?.id;
  const vue = sp.vue === "apercu" ? "apercu" : "differences";

  const { data: version } = choisie
    ? await dbAdmin().from("versions_articles").select("id, titre, resume, contenu, motif, created_at").eq("id", choisie).eq("article_id", id).maybeSingle()
    : { data: null };

  const date = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: `/createur/article/${id}`, libelle: article.titre },
            { href: `/createur/article/${id}/versions`, libelle: "Historique" },
          ]}
        />
        <h1 className="mt-6 text-4xl font-extrabold">Historique des versions</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Une version est gardée à chaque Ctrl+S, à chaque publication, et automatiquement toutes les dix minutes pendant l&apos;écriture. Les 200 plus récentes sont conservées.
        </p>

        {liste.length === 0 ? (
          <p className="verre panneau mt-10 max-w-2xl">Aucune version pour l&apos;instant. Elles apparaîtront dès que tu écriras dans cet article.</p>
        ) : (
          <div className="mt-10 grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
            <nav aria-label="Versions" className="verre panneau !p-3 lg:sticky lg:top-6">
              <ol className="max-h-[70vh] space-y-1 overflow-auto">
                {liste.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/createur/article/${id}/versions?v=${v.id}&vue=${vue}`}
                      className="block rounded-xl px-3 py-2 hover:bg-[var(--surface-forte)] aria-[current=true]:bg-[color-mix(in_srgb,var(--or)_16%,transparent)]"
                      aria-current={v.id === choisie}
                    >
                      <span className="block font-semibold">{date(v.created_at)}</span>
                      <span className="block text-sm text-encre-douce">{MOTIFS[v.motif] ?? v.motif}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>

            {version && (
              <section className="verre panneau min-w-0" aria-labelledby="titre-version">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 id="titre-version" className="text-2xl font-bold">
                      Version du {date(version.created_at)}
                    </h2>
                    <p className="mt-1 text-encre-douce">{MOTIFS[version.motif] ?? version.motif}</p>
                  </div>
                  <form action={restaurerVersion}>
                    <input type="hidden" name="version" value={version.id} />
                    <BoutonConfirmation
                      libelle="Restaurer cette version"
                      confirmation="Oui, restaurer"
                      enCours="Restauration…"
                      className="bouton bouton-principal"
                      avertissement="Le texte actuel sera d'abord gardé dans l'historique."
                    />
                  </form>
                </div>

                <div className="mt-6 flex gap-2" role="tablist" aria-label="Affichage">
                  <Link
                    href={`/createur/article/${id}/versions?v=${version.id}&vue=differences`}
                    role="tab"
                    aria-selected={vue === "differences"}
                    className="outil !px-4 aria-selected:bg-[color-mix(in_srgb,var(--or)_18%,transparent)] aria-selected:text-encre"
                  >
                    Différences avec le texte actuel
                  </Link>
                  <Link
                    href={`/createur/article/${id}/versions?v=${version.id}&vue=apercu`}
                    role="tab"
                    aria-selected={vue === "apercu"}
                    className="outil !px-4 aria-selected:bg-[color-mix(in_srgb,var(--or)_18%,transparent)] aria-selected:text-encre"
                  >
                    Aperçu de la version
                  </Link>
                </div>

                <div className="mt-6 border-t border-trait pt-6">
                  {vue === "differences" ? (
                    <>
                      <p className="diff mb-4 text-sm text-encre-douce">
                        <del>Barré en rouge</del> : présent dans cette version, absent aujourd&apos;hui.{" "}
                        <ins>Surligné en vert</ins> : ajouté depuis.
                      </p>
                      {version.titre !== article.titre && (
                        <p className="mb-4">
                          Titre de cette version : <strong>{version.titre}</strong>
                        </p>
                      )}
                      <Comparaison avant={documentVersTexteAere(version.contenu)} apres={documentVersTexteAere(article.contenu)} />
                    </>
                  ) : (
                    <article className="lecture">
                      <h3 className="text-3xl font-extrabold">{version.titre}</h3>
                      {version.resume && <p className="mt-4 text-lg text-encre-douce">{version.resume}</p>}
                      <div className="lecture-corps mt-6">
                        <RenduDocument document={version.contenu} />
                      </div>
                    </article>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}
