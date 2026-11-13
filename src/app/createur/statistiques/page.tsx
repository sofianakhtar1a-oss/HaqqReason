import type { Metadata } from "next";
import Link from "next/link";
import { FilAriane } from "@/components/FilAriane";
import { exigerCreateur } from "@/lib/session";
import { plusLus, recherchesSansResultat, vuesParJour } from "@/lib/tableau-de-bord";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";

export const metadata: Metadata = { title: "Statistiques", robots: { index: false } };

const PERIODES = [7, 30, 90, 365] as const;

export default async function Statistiques({ searchParams }: PageProps<"/createur/statistiques">) {
  await exigerCreateur();
  const demandee = Number((await searchParams).jours);
  const jours = (PERIODES as readonly number[]).includes(demandee) ? demandee : 30;
  const [lus, vides, serie] = await Promise.all([plusLus(jours, 20), recherchesSansResultat(jours, 30), vuesParJour(Math.min(jours, 90))]);
  const total = serie.reduce((s, v) => s + v.vues, 0);
  const max = Math.max(1, ...serie.map((v) => v.vues));

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane etapes={[{ href: "/createur", libelle: "Espace créateur" }, { href: "/createur/statistiques", libelle: "Statistiques" }]} />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Statistiques</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Anonymes : un simple compteur par article et par jour. Aucune adresse, aucun cookie, rien qui identifie un lecteur. Tes propres visites ne
          sont pas comptées.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Période">
          {PERIODES.map((p) => (
            <Link key={p} href={`/createur/statistiques?jours=${p}`} className="puce-filtre" aria-pressed={p === jours}>
              {p === 365 ? "1 an" : `${p} jours`}
            </Link>
          ))}
        </nav>

        <section className="verre panneau mt-8" aria-labelledby="titre-vues">
          <h2 id="titre-vues" className="text-2xl font-bold">
            {total} lecture{total > 1 ? "s" : ""} sur {Math.min(jours, 90)} jours
          </h2>
          <div className="histogramme mt-6" role="img" aria-label={`Lectures par jour, maximum ${max}`}>
            {serie.map((v) => (
              <span key={v.jour} style={{ height: `${(v.vues / max) * 100}%` }} title={`${new Date(v.jour).toLocaleDateString("fr-FR")} : ${v.vues}`} />
            ))}
          </div>
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
          <section className="verre panneau" aria-labelledby="titre-lus">
            <h2 id="titre-lus" className="text-2xl font-bold">
              Les plus lus
            </h2>
            {lus.length === 0 ? (
              <p className="mt-3 text-encre-douce">Pas encore de lecture sur cette période.</p>
            ) : (
              <ol className="mt-4 space-y-2">
                {lus.map((a) => (
                  <li key={a.id} className="flex items-baseline gap-3">
                    <Link href={`/createur/article/${a.id}`} className="min-w-0 flex-1 truncate font-semibold hover:underline hover:underline-offset-4">
                      {a.titre}
                    </Link>
                    <span className="font-display font-bold text-or">{a.vues}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="verre panneau" aria-labelledby="titre-vides">
            <h2 id="titre-vides" className="text-2xl font-bold">
              Cherché sans résultat
            </h2>
            <p className="mt-1 text-sm text-encre-douce">Les sujets que les lecteurs cherchent et que la bibliothèque ne traite pas encore.</p>
            {vides.length === 0 ? (
              <p className="mt-3 text-encre-douce">Rien sur cette période.</p>
            ) : (
              <ol className="mt-4 space-y-2">
                {vides.map((r) => (
                  <li key={r.terme} className="flex items-baseline gap-3">
                    <span className="min-w-0 flex-1 truncate">{r.terme}</span>
                    <span className="font-display font-bold text-or">{r.nombre}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
