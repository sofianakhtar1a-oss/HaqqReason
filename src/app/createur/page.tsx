import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Eye, BookOpen, BookOpenText, Compass, Feather, FlaskConical, Languages, LayoutTemplate, Lightbulb, ShieldAlert, ShieldCheck, SlidersHorizontal, Smartphone, Wrench } from "lucide-react";
import { listerAppareils } from "@/lib/appareils";
import { etatContributions } from "@/lib/contributions/donnees";
import { resumeModules } from "@/lib/modules/donnees";
import { exigerCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { confirmerAppareil, signalerAppareil } from "./actions";
import { EnTeteCreateur } from "./_composants/EnTeteCreateur";

export const metadata: Metadata = { title: "Espace créateur", robots: { index: false } };

function dateCourte(iso: string | null): string {
  if (!iso || iso === "origine") return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

/*
 * L'entrée du mode créateur : on choisit d'abord le module à modifier.
 * La bibliothèque garde son éditeur complet ; les trois autres espaces (et la page qui les présente)
 * ont l'éditeur de modules : textes, listes, vocabulaire, brouillon puis publication.
 */
export default async function EspaceCreateur() {
  const compte = await exigerCreateur();
  const [appareils, etats, contributions, articles] = await Promise.all([
    listerAppareils(),
    resumeModules(["accueil", "calame", "alambic", "langues", "monde"]),
    etatContributions(),
    Promise.all(
      (["preuves", "islam"] as const).map((e) =>
        dbAdmin().from("articles").select("id, blocs!inner(espace)", { count: "exact", head: true }).is("supprime_le", null).eq("blocs.espace", e),
      ),
    ),
  ]);
  const parEspace = { preuves: articles[0].count ?? 0, islam: articles[1].count ?? 0 };
  const nbArticles = (n: number) => `${n} article${n > 1 ? "s" : ""}`;
  const inconnus = appareils.filter((a) => !a.confirme);

  const statut = (id: string) => {
    const e = etats[id];
    if (!e) return "";
    if (e.enAttente) return "Modifications à publier";
    return e.publieLe ? `Publié le ${dateCourte(e.publieLe)}` : "Textes d'origine";
  };

  const modules = [
    { href: "/createur/bibliotheque", titre: "Les preuves de la véracité de l'islam", sur: "La bibliothèque", texte: "Blocs, catégories et articles : écrire, réorganiser, publier.", Icone: BookOpen, accent: "emeraude", etat: nbArticles(parEspace.preuves), attente: false },
    { href: "/createur/islam", titre: "L'Islam authentique", sur: "Vidéos", texte: "Les vidéos sur la croyance, l'adoration et la voie des pieux prédécesseurs : écrire, réorganiser, publier.", Icone: BookOpenText, accent: "azur", etat: nbArticles(parEspace.islam), attente: false },
    { href: "/createur/module/calame", titre: "Le Calame", sur: "Atelier d'écriture", texte: "Les textes de l'atelier : présentation, colonne de gauche, messages.", Icone: Feather, accent: "or", etat: statut("calame"), attente: etats.calame?.enAttente },
    { href: "/createur/module/alambic", titre: "L'Alambic", sur: "Studio de fichiers", texte: "Les outils (noms, aide, ordre, présence) et les textes de présentation.", Icone: FlaskConical, accent: "amethyste", etat: statut("alambic"), attente: etats.alambic?.enAttente },
    { href: "/createur/module/langues", titre: "Le Truchement", sur: "Apprendre les langues", texte: "Les thèmes et les mots, les onglets, l'objectif du jour et tous les textes.", Icone: Languages, accent: "azur", etat: statut("langues"), attente: etats.langues?.enAttente },
    { href: "/createur/module/monde", titre: "Le Portulan", sur: "Apprendre la géographie", texte: "Les titres et les introductions de chaque partie, et les onglets.", Icone: Compass, accent: "safran", etat: statut("monde"), attente: etats.monde?.enAttente },
  ];

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-6 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Espace créateur</h1>
        <p className="mt-3 max-w-[58ch] text-lg text-encre-douce">Quel module veux-tu modifier ?</p>

        <form method="post" action="/createur/vue-utilisateur" className="mt-6">
          <button type="submit" className="verre flex w-full items-center gap-4 rounded-3xl p-5 text-left hover:border-or">
            <Eye className="size-6 shrink-0 text-or" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Voir le site comme un utilisateur</span>
              <span className="block text-sm text-encre-douce">Tu navigues exactement comme un visiteur. Un bouton, tout en haut, te ramène ici sans redemander ton mot de passe.</span>
            </span>
            <ArrowRight className="size-5 shrink-0 text-encre-douce" aria-hidden="true" />
          </button>
        </form>

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

        <nav aria-label="Les modules" className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {modules.map(({ href, titre, sur, texte, Icone, accent, etat, attente }) => (
            <Link key={href} href={href} className="carte-choix" data-accent={accent}>
              {attente && <span className="carte-choix-marque">À publier</span>}
              <Icone className="size-9 text-accent" strokeWidth={1.4} aria-hidden="true" />
              <span className="carte-choix-sur">{sur}</span>
              <span className="carte-choix-titre">{titre}</span>
              <span className="carte-choix-texte">{texte}</span>
              <span className="carte-choix-pied">
                {etat || "Modifier"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </nav>

        <Link href="/createur/module/accueil" className="verre mt-5 flex items-center gap-4 rounded-3xl p-5 hover:border-or">
          <LayoutTemplate className="size-6 shrink-0 text-or" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">La page « Par où veux-tu commencer ? »</span>
            <span className="block text-sm text-encre-douce">Son titre, son introduction, et la carte de chaque espace (texte, ordre, présence).</span>
          </span>
          <span className="text-sm font-semibold text-encre-douce">{statut("accueil")}</span>
        </Link>

        <nav aria-label="Réglages du site" className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/createur/parametres" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
            <SlidersHorizontal className="size-6 text-or" aria-hidden="true" />
            Paramètres
          </Link>
          <Link href="/createur/securite" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
            {compte.totp_actif ? <ShieldCheck className="size-6 text-emeraude" aria-hidden="true" /> : <ShieldAlert className="size-6 text-or" aria-hidden="true" />}
            Sécurité
          </Link>
          <Link href="/createur/statistiques" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
            <BarChart3 className="size-6 text-or" aria-hidden="true" />
            Statistiques de lecture
          </Link>
          <Link href="/createur/outils" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
            <Wrench className="size-6 text-or" aria-hidden="true" />
            Importer, sauvegarder, synonymes
          </Link>
          <Link href="/createur/contributions" className="verre flex items-center gap-4 rounded-3xl p-5 font-semibold hover:border-or">
            <Lightbulb className="size-6 text-or" aria-hidden="true" />
            <span>
              Boîte de réception des contributions
              {(contributions.en_attente > 0 || contributions.non_lues > 0) && <span className="block text-sm font-normal text-encre-douce">{contributions.non_lues > 0 ? `${contributions.non_lues} non lue${contributions.non_lues > 1 ? "s" : ""}, ` : ""}{contributions.en_attente} en attente de relecture</span>}
            </span>
          </Link>
        </nav>
      </main>
    </>
  );
}
