import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { exigerCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { deconnecterTousLesAppareils, fermerLesModules, oublierAppareil, retirerAccesModules } from "../actions";
import { lireAccesModules } from "@/lib/acces-modules";
import { ContactReseaux } from "@/components/ContactReseaux";
import { listerAppareils } from "@/lib/appareils";
import { BadgeCheck, LockKeyhole, ShieldAlert, Smartphone } from "lucide-react";
import { ActivationDoubleAuth, DesactivationDoubleAuth } from "./FormulairesDoubleAuth";
import { FormulaireEffacement, FormulaireMotDePasse, FormulaireMotDePasseModules, FormulaireNouvelleCle } from "./FormulairesSecurite";

export const metadata: Metadata = { title: "Sécurité", robots: { index: false } };

const LIBELLES: Record<string, string> = {
  compte_createur_cree: "Création de l'accès créateur",
  connexion_reussie: "Connexion réussie",
  connexion_echouee: "Tentative de connexion échouée",
  recuperation_echouee: "Clé de récupération refusée",
  contenu_entierement_efface: "Tout le contenu a été effacé",
  mot_de_passe_reinitialise_par_cle: "Mot de passe réinitialisé avec la clé de récupération",
  mot_de_passe_change: "Mot de passe changé",
  cle_de_recuperation_regeneree: "Nouvelle clé de récupération créée",
  deconnexion: "Déconnexion",
  deconnexion_de_tous_les_appareils: "Déconnexion de tous les appareils",
  nouvel_appareil: "Connexion depuis un nouvel appareil",
  appareil_confirme: "Nouvel appareil confirmé",
  appareil_signale_inconnu: "Appareil signalé comme inconnu, autres sessions fermées",
  double_authentification_activee: "Double authentification activée",
  double_authentification_desactivee: "Double authentification désactivée",
  code_double_authentification_refuse: "Code de double authentification refusé",
  sauvegarde_exportee: "Bibliothèque exportée",
  sauvegarde_restauree: "Bibliothèque restaurée depuis une sauvegarde",
  sauvegarde_automatique: "Sauvegarde automatique",
  import_en_masse: "Import de contenus",
  mot_de_passe_modules_change: "Mot de passe des modules réservés changé",
  acces_modules_retire: "Accès aux modules réservés retiré à tous les visiteurs",
  modules_fermes: "Modules réservés fermés",
  acces_modules_ouvert: "Un visiteur est entré dans les modules réservés",
  acces_modules_refuse: "Mot de passe des modules refusé",
};

function appareil(userAgent: string): string {
  const systeme = /Android/.test(userAgent) ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Windows/.test(userAgent) ? "Windows" : /Mac OS/.test(userAgent) ? "Mac" : /Linux/.test(userAgent) ? "Linux" : "Appareil inconnu";
  const navigateur = /Edg\//.test(userAgent) ? "Edge" : /Firefox\//.test(userAgent) ? "Firefox" : /Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : "";
  return navigateur ? `${navigateur} sur ${systeme}` : systeme;
}

function date(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });
}

export default async function PageSecurite({ searchParams }: PageProps<"/createur/securite">) {
  const compte = await exigerCreateur();
  const sp = await searchParams;
  const alerte = sp.alerte === "appareil";
  const avisModules = sp.modules === "retire" ? "Accès retiré : chaque visiteur devra redonner le mot de passe." : sp.modules === "ferme" ? "Modules fermés : plus aucun mot de passe ne les ouvre." : null;
  let modules: Awaited<ReturnType<typeof lireAccesModules>> = null;
  try {
    modules = await lireAccesModules();
  } catch {
    modules = null;
  }
  const modulesOuverts = Boolean(modules?.empreinte);
  const appareils = await listerAppareils();
  const { data: journal } = await dbAdmin()
    .from("audit_log")
    .select("id, action, user_agent, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <Link href="/createur" className="sans-impression inline-flex items-center gap-2 font-semibold text-encre-douce hover:text-encre">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Espace créateur
        </Link>
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Sécurité</h1>
        {alerte && (
          <p role="alert" className="message message-erreur mt-6">
            L&apos;appareil inconnu a été déconnecté. Quelqu&apos;un connaît sans doute ton mot de passe : change-le tout de suite ci-dessous, puis
            active la double authentification.
          </p>
        )}

        <section className="verre panneau mt-10" aria-labelledby="titre-2fa">
          <div className="flex flex-wrap items-center gap-3">
            {compte.totp_actif ? <BadgeCheck className="size-7 text-succes" aria-hidden="true" /> : <ShieldAlert className="size-7 text-or" aria-hidden="true" />}
            <h2 id="titre-2fa" className="text-2xl font-bold">
              Double authentification {compte.totp_actif ? "active" : "désactivée"}
            </h2>
          </div>
          <p className="mb-6 mt-2 max-w-[64ch] text-encre-douce">
            {compte.totp_actif
              ? "Chaque connexion demande ton mot de passe ET un code à 6 chiffres donné par ton téléphone. Même avec ton mot de passe, personne ne peut entrer sans ton téléphone."
              : "Fortement recommandée : en plus du mot de passe, chaque connexion demandera un code à 6 chiffres donné par une application de ton téléphone."}
          </p>
          <div className="max-w-md">{compte.totp_actif ? <DesactivationDoubleAuth /> : <ActivationDoubleAuth />}</div>
        </section>

        <section className="verre panneau mt-10" aria-labelledby="titre-modules">
          <div className="flex flex-wrap items-center gap-3">
            <LockKeyhole className={`size-7 ${modulesOuverts ? "text-succes" : "text-or"}`} aria-hidden="true" />
            <h2 id="titre-modules" className="text-2xl font-bold">
              Modules réservés {modulesOuverts ? "ouverts avec un mot de passe" : "fermés à tous les visiteurs"}
            </h2>
          </div>
          <p className="mt-2 max-w-[70ch] text-encre-douce">
            « Les preuves de la véracité de l&apos;islam » et « L&apos;Islam authentique » (avec le graphe, la recherche, le débat express, les
            nouveautés et les fichiers joints) ne s&apos;ouvrent qu&apos;avec ce mot de passe, différent du tien. Tu le donnes à qui te le demande
            sur Instagram ou TikTok. {modulesOuverts ? "" : "Tant qu'il n'est pas choisi, personne d'autre que toi n'y entre."}
          </p>
          {avisModules && (
            <p role="status" className="message message-succes mt-4 max-w-2xl">
              {avisModules}
            </p>
          )}
          <div className="mt-6 grid items-start gap-8 lg:grid-cols-2">
            <div className="max-w-md">
              <FormulaireMotDePasseModules existe={modulesOuverts} />
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="font-bold">Ce que voient les visiteurs</h3>
                <p className="mt-1 text-encre-douce">Une page qui demande le mot de passe, et tes deux comptes pour le demander :</p>
                <ContactReseaux className="mt-3 sm:grid-cols-2" />
              </div>
              {modulesOuverts && (
                <div className="flex flex-wrap gap-3">
                  <form action={retirerAccesModules}>
                    <button type="submit" className="bouton bouton-discret">
                      Retirer l&apos;accès à tout le monde
                    </button>
                  </form>
                  <form action={fermerLesModules}>
                    <button type="submit" className="bouton bouton-danger">
                      Fermer les modules
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
          <section className="verre panneau">
            <h2 className="text-2xl font-bold">Changer le mot de passe</h2>
            <p className="mb-6 mt-2 text-encre-douce">Tes autres appareils seront déconnectés.</p>
            <FormulaireMotDePasse />
          </section>

          <div className="space-y-6">
            <section className="verre panneau">
              <h2 className="text-2xl font-bold">Clé de récupération</h2>
              <p className="mb-6 mt-2 text-encre-douce">
                Tu as perdu ta clé, ou tu penses que quelqu&apos;un l&apos;a vue ? Crée-en une nouvelle : l&apos;ancienne
                sera aussitôt invalidée.
              </p>
              <FormulaireNouvelleCle />
            </section>

            <section className="verre panneau">
              <h2 className="text-2xl font-bold">Appareils</h2>
              <p className="mb-6 mt-2 text-encre-douce">
                Ferme toutes les sessions créateur ouvertes, y compris celle-ci. Utile si tu as oublié de te déconnecter
                quelque part.
              </p>
              {appareils.length > 0 && (
                <ul className="mb-6 space-y-2">
                  {appareils.map((a) => (
                    <li key={a.empreinte} className="rangee flex-wrap !px-2">
                      <Smartphone className="size-5 shrink-0 text-encre-douce" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {a.libelle || "Appareil"}
                          {a.celuiCi && <span className="ml-2 text-sm font-normal text-succes">cet appareil</span>}
                          {!a.confirme && <span className="ml-2 text-sm font-normal text-or">non confirmé</span>}
                        </span>
                        <span className="block text-sm text-encre-douce">Dernière connexion : {date(a.derniere_connexion)}</span>
                      </span>
                      {!a.celuiCi && (
                        <form action={oublierAppareil}>
                          <input type="hidden" name="empreinte" value={a.empreinte} />
                          <button type="submit" className="bouton bouton-discret !min-h-9 text-sm">
                            Oublier
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <form action={deconnecterTousLesAppareils}>
                <button type="submit" className="bouton bouton-danger w-full">
                  Déconnecter tous les appareils
                </button>
              </form>
            </section>
          </div>
        </div>

        <section className="panneau mt-6 rounded-[1.75rem] border border-[color-mix(in_srgb,var(--danger)_45%,transparent)]" aria-labelledby="titre-effacement">
          <h2 id="titre-effacement" className="text-2xl font-bold text-danger">
            Effacer tout le contenu
          </h2>
          <p className="mb-6 mt-2 max-w-[64ch] text-encre-douce">
            Supprime définitivement toutes les catégories, tous les articles, documents, étiquettes, sources (ouvrages, auteurs, citations) et l&apos;historique des versions. Les trois
            grands blocs, ton accès créateur, tes modèles et tes synonymes sont conservés. Utile pour repartir de zéro après des essais. Cette
            action est irréversible.
          </p>
          <div className="max-w-md">
            <FormulaireEffacement />
          </div>
        </section>

        <section className="verre panneau mt-6">
          <h2 className="text-2xl font-bold">Journal de sécurité</h2>
          <p className="mt-2 text-encre-douce">Les 30 derniers événements liés à ton accès créateur.</p>
          {journal && journal.length > 0 ? (
            <ol className="mt-5 divide-y divide-trait">
              {journal.map((ligne) => (
                <li key={ligne.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                  <span className="font-semibold">{LIBELLES[ligne.action] ?? ligne.action}</span>
                  <span className="text-sm text-encre-douce">
                    {new Date(ligne.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" })}
                    {", "}
                    {appareil(ligne.user_agent)}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-encre-douce">Aucun événement enregistré pour l&apos;instant.</p>
          )}
        </section>
      </main>
    </>
  );
}
