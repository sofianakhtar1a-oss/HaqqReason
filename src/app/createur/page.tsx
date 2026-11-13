import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, FileText, ShieldAlert, ShieldCheck, SlidersHorizontal, Smartphone, Trash2, TriangleAlert, Wrench } from "lucide-react";
import { listerAppareils } from "@/lib/appareils";
import { articlesParBloc, brouillonsEnAttente, liensCasses } from "@/lib/tableau-de-bord";
import { confirmerAppareil, signalerAppareil } from "./actions";
import { BadgeStatut } from "@/components/BadgeStatut";
import { articlesRecents, listerBlocsAdmin } from "@/lib/contenu-admin";
import { exigerCreateur } from "@/lib/session";
import { libelleDuree } from "@/lib/reglages";
import { lireReglages } from "@/lib/reglages-donnees";
import { dbAdmin } from "@/lib/supabase";
import { EnTeteCreateur } from "./_composants/EnTeteCreateur";

export const metadata: Metadata = { title: "Espace créateur", robots: { index: false } };

async function compter(table: "categories" | "articles", statut?: "publie" | "brouillon"): Promise<number> {
  let requete = dbAdmin().from(table).select("id", { count: "exact", head: true }).is("supprime_le", null);
  if (statut) requete = requete.eq("statut", statut);
  const { count } = await requete;
  return count ?? 0;
}

function dateLongue(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

export default async function EspaceCreateur() {
  const compte = await exigerCreateur();
  const [appareils, parBloc, attente, casses, reglages] = await Promise.all([listerAppareils(), articlesParBloc(), brouillonsEnAttente(6), liensCasses(), lireReglages()]);
  const inconnus = appareils.filter((a) => !a.confirme);
  const [categories, articlesPublies, brouillons, blocs, recents, racines] = await Promise.all([
    compter("categories"),
    compter("articles", "publie"),
    compter("articles", "brouillon"),
    listerBlocsAdmin(),
    articlesRecents(8),
    dbAdmin().from("categories").select("bloc_id").is("parent_id", null).is("supprime_le", null),
  ]);
  const racinesParBloc = new Map<string, number>();
  for (const r of racines.data ?? []) racinesParBloc.set(r.bloc_id, (racinesParBloc.get(r.bloc_id) ?? 0) + 1);

  const chiffres = [
    { valeur: 3, libelle: "blocs" },
    { valeur: categories, libelle: categories > 1 ? "catégories" : "catégorie" },
    { valeur: articlesPublies, libelle: articlesPublies > 1 ? "articles publiés" : "article publié" },
    { valeur: brouillons, libelle: brouillons > 1 ? "brouillons" : "brouillon" },
  ];

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Espace créateur</h1>
        <p className="mt-3 max-w-[58ch] text-lg text-encre-douce">
          Tu es connecté en tant que créateur. Toi seul peux modifier HaqqReason.
        </p>

        {inconnus.map((a) => (
          <section key={a.empreinte} role="alert" className="alerte-appareil mt-8" aria-label="Nouvel appareil">
            <Smartphone className="size-7 shrink-0 text-or" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold">Connexion depuis un nouvel appareil</p>
              <p className="text-encre-douce">
                {a.libelle || "Appareil inconnu"}, le {new Date(a.premiere_connexion).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" })}
                {a.celuiCi ? " (celui que tu utilises en ce moment)" : ""}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={confirmerAppareil}>
                <input type="hidden" name="empreinte" value={a.empreinte} />
                <button type="submit" className="bouton bouton-discret">
                  C&apos;est bien moi
                </button>
              </form>
              {!a.celuiCi && (
                <form action={signalerAppareil}>
                  <input type="hidden" name="empreinte" value={a.empreinte} />
                  <button type="submit" className="bouton bouton-danger">
                    Ce n&apos;est pas moi
                  </button>
                </form>
              )}
            </div>
          </section>
        ))}

        <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {chiffres.map((chiffre) => (
            <div key={chiffre.libelle} className="verre rounded-3xl p-5">
              <dd className="font-display text-4xl font-extrabold text-or">{chiffre.valeur}</dd>
              <dt className="mt-1 text-encre-douce">{chiffre.libelle}</dt>
            </div>
          ))}
        </dl>

        <section className="mt-14" aria-labelledby="titre-blocs">
          <h2 id="titre-blocs" className="text-2xl font-bold">
            Les trois blocs
          </h2>
          <ul className="mt-6 grid gap-x-5 gap-y-6 md:grid-cols-3">
            {blocs.map((bloc) => {
              const n = racinesParBloc.get(bloc.id) ?? 0;
              return (
                <li key={bloc.id} data-accent={bloc.accent}>
                  <Link href={`/createur/bloc/${bloc.slug}`} className="dossier">
                    <h3 className="text-xl font-bold">{bloc.titre}</h3>
                    <p className="mt-auto pt-5 text-sm font-semibold text-accent">
                      {n === 0 ? "Aucune catégorie" : n === 1 ? "1 catégorie" : `${n} catégories`}
                      {(() => {
                        const c = parBloc.get(bloc.id);
                        const total = (c?.publies ?? 0) + (c?.brouillons ?? 0);
                        return total > 0 ? `, ${total} article${total > 1 ? "s" : ""} (${c?.publies ?? 0} publié${(c?.publies ?? 0) > 1 ? "s" : ""})` : "";
                      })()}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="verre panneau" aria-labelledby="titre-recents">
            <h2 id="titre-recents" className="text-2xl font-bold">
              Derniers articles modifiés
            </h2>
            {recents.length > 0 ? (
              <ol className="mt-4 space-y-1">
                {recents.map((a) => (
                  <li key={a.id} className="rangee !px-2">
                    <FileText className="size-5 shrink-0 text-or" aria-hidden="true" />
                    <Link href={`/createur/article/${a.id}`} className="min-w-0 flex-1 font-semibold hover:underline hover:underline-offset-4">
                      <span className="block truncate">{a.titre}</span>
                    </Link>
                    <BadgeStatut statut={a.statut} />
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-encre-douce">
                Aucun article pour l&apos;instant. Ouvre un bloc, crée une catégorie, puis ton premier article.
              </p>
            )}
          </section>

          <div className="space-y-6">
            {attente.length > 0 && (
              <section className="verre panneau" aria-labelledby="titre-brouillons">
                <h2 id="titre-brouillons" className="text-xl font-bold">
                  Brouillons en attente
                </h2>
                <ul className="mt-3 space-y-1.5">
                  {attente.map((a) => (
                    <li key={a.id}>
                      <Link href={`/createur/article/${a.id}`} className="block truncate hover:underline hover:underline-offset-4">
                        {a.titre}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <nav className="grid gap-3" aria-label="Outils du créateur">
              <Link href="/createur/qualite" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
                <TriangleAlert className="size-6 text-or" aria-hidden="true" />
                <span>
                  Contrôle qualité
                  {casses.length > 0 && <span className="block text-sm font-normal text-encre-douce">{casses.length} lien{casses.length > 1 ? "s" : ""} cassé{casses.length > 1 ? "s" : ""}</span>}
                </span>
              </Link>
              <Link href="/createur/statistiques" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
                <BarChart3 className="size-6 text-or" aria-hidden="true" />
                Statistiques de lecture
              </Link>
              <Link href="/createur/outils" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
                <Wrench className="size-6 text-or" aria-hidden="true" />
                Importer, sauvegarder, synonymes
              </Link>
              <Link href="/createur/parametres" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
                <SlidersHorizontal className="size-6 text-or" aria-hidden="true" />
                Paramètres
              </Link>
            </nav>
            <section className="verre panneau" aria-labelledby="titre-securite">
              {compte.totp_actif ? (
                <ShieldCheck className="size-8 text-emeraude" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <ShieldAlert className="size-8 text-or" strokeWidth={1.5} aria-hidden="true" />
              )}
              <h2 id="titre-securite" className="mt-4 text-2xl font-bold">
                Sécurité
              </h2>
              <ul className="mt-3 space-y-1.5 text-encre-douce">
                <li>Mot de passe défini le {dateLongue(compte.password_changed_at)}.</li>
                <li>Déconnexion automatique après {libelleDuree(reglages.inactivite_minutes)} sans activité.</li>
                <li>{reglages.lier_appareil ? "Session liée à l'appareil : un cookie recopié ailleurs ne donne aucun accès." : "Session non liée à l'appareil (à réactiver dans les Paramètres)."}</li>
                <li>{compte.totp_actif ? "Double authentification active." : "Double authentification désactivée : active-la."}</li>
              </ul>
              <Link href="/createur/securite" className="bouton bouton-discret mt-6">
                Gérer la sécurité
              </Link>
            </section>
            <Link href="/createur/corbeille" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
              <Trash2 className="size-6 text-encre-douce" aria-hidden="true" />
              Ouvrir la corbeille
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
