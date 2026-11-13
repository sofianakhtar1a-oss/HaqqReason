import type { Metadata } from "next";
import { CircleCheck, CircleSlash, Compass } from "lucide-react";
import { FilAriane } from "@/components/FilAriane";
import { lireReglages } from "@/lib/reglages-donnees";
import { etatIndexation } from "@/lib/sens/indexation";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../../_composants/EnTeteCreateur";
import { Indexation } from "./Indexation";

export const metadata: Metadata = { title: "Recherche par le sens", robots: { index: false } };

export default async function PageRechercheSens() {
  await exigerCreateur();
  const [etat, reglages] = await Promise.all([etatIndexation(), lireReglages()]);
  const aIndexer = Math.max(0, etat.total - etat.indexes);

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: "/createur/outils", libelle: "Outils" },
            { href: "/createur/outils/recherche-sens", libelle: "Recherche par le sens" },
          ]}
        />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Recherche par le sens</h1>
        <p className="mt-4 max-w-2xl text-lg text-encre-douce">
          Un lecteur qui cherche « les preuves que Muhammad ﷺ était prophète » doit tomber sur ton article « Les signes de la prophétie », même sans un
          seul mot en commun. C&apos;est le rôle de cette page : chaque article y est résumé en une suite de nombres qui représente son sens, et la
          question du lecteur est comparée à ces nombres.
        </p>

        <section className="verre panneau mt-8" aria-labelledby="titre-etat">
          <div className="flex flex-wrap items-center gap-3">
            {etat.actif ? <CircleCheck className="size-7 text-succes" aria-hidden="true" /> : <CircleSlash className="size-7 text-or" aria-hidden="true" />}
            <h2 id="titre-etat" className="text-2xl font-bold">
              {etat.actif ? "Service configuré" : "Service non configuré"}
            </h2>
          </div>

          {etat.actif ? (
            <>
              <ul className="mt-4 space-y-1.5 text-encre-douce">
                <li>
                  <strong className="text-encre">{etat.indexes}</strong> article{etat.indexes > 1 ? "s" : ""} indexé{etat.indexes > 1 ? "s" : ""} sur {etat.total}{" "}
                  ({etat.publies} publié{etat.publies > 1 ? "s" : ""}, brouillons compris).
                </li>
                <li>
                  <strong className="text-encre">{etat.morceaux}</strong> morceau{etat.morceaux > 1 ? "x" : ""} en mémoire.
                </li>
                <li>{reglages.recherche_sens ? "Proposée aux lecteurs." : "Désactivée pour les lecteurs dans les Paramètres."}</li>
              </ul>
              <p className="mt-4 text-encre-douce">
                Les articles que tu écris ou modifies sont indexés tout seuls, juste après l&apos;enregistrement. Ce bouton sert aux articles déjà
                écrits, ou après un changement de service.
              </p>
              <Indexation aIndexer={aIndexer} />
            </>
          ) : (
            <>
              <p className="mt-4 text-encre-douce">{etat.raison}</p>
              <h3 className="mt-6 text-xl font-bold">Pour l&apos;activer</h3>
              <ol className="mt-3 space-y-2 text-encre-douce">
                <li>
                  1. Crée un compte sur un service qui calcule ces nombres. Le plus simple : <strong className="text-encre">platform.openai.com</strong>,
                  rubrique « API keys ». Prévois quelques euros de crédit : c&apos;est payant, mais très bon marché.
                </li>
                <li>
                  2. Copie la clé obtenue (elle commence par <code>sk-</code>).
                </li>
                <li>
                  3. Dans Vercel, ouvre ton projet, puis <strong className="text-encre">Settings → Environment Variables</strong>. Ajoute la variable{" "}
                  <code>EMBEDDINGS_CLE</code> avec cette clé comme valeur.
                </li>
                <li>4. Republie le site (Deployments → le menu « … » du dernier déploiement → Redeploy), puis reviens ici.</li>
              </ol>
              <p className="mt-4 text-sm text-encre-douce">
                Sans cette clé, rien ne casse : la recherche par mots continue exactement comme avant, et cette page reste simplement en attente.
              </p>
            </>
          )}
        </section>

        <section className="verre panneau mt-8">
          <h2 className="text-2xl font-bold">Ce que ça coûte, ce que ça ne fait pas</h2>
          <ul className="mt-3 space-y-2 text-encre-douce">
            <li>
              <Compass className="mr-2 inline size-4 text-accent" aria-hidden="true" />
              L&apos;indexation se paie une fois par article modifié. Pour une bibliothèque de quelques centaines d&apos;articles, le coût total se
              compte en centimes.
            </li>
            <li>
              <Compass className="mr-2 inline size-4 text-accent" aria-hidden="true" />
              Chaque question de lecteur coûte une requête minuscule. Le site limite à 30 questions par heure et par visiteur, pour qu&apos;un robot ne
              puisse pas faire grimper la facture.
            </li>
            <li>
              <Compass className="mr-2 inline size-4 text-accent" aria-hidden="true" />
              Aucune réponse n&apos;est rédigée par une intelligence artificielle : elle ne fait que classer tes articles. Elle ne peut donc inventer ni
              citation, ni référence, ni verset.
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
