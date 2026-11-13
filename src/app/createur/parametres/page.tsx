import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, HardDrive, ShieldCheck } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { libelleDuree, libelleHeures } from "@/lib/reglages";
import { lireReglages } from "@/lib/reglages-donnees";
import { exigerCreateur } from "@/lib/session";
import { FormulaireReglages } from "./FormulaireReglages";

export const metadata: Metadata = { title: "Paramètres", robots: { index: false } };

export default async function PageParametres() {
  await exigerCreateur();
  const reglages = await lireReglages();

  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <Link href="/createur" className="sans-impression inline-flex items-center gap-2 font-semibold text-encre-douce hover:text-encre">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Espace créateur
        </Link>
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Paramètres</h1>
        <p className="mt-4 max-w-2xl text-lg text-encre-douce">
          Les réglages du site. Ils s&apos;appliquent dès l&apos;enregistrement, sans republier l&apos;application.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <p className="reglage-resume">
            <Clock className="size-5 text-accent" aria-hidden="true" />
            <span>
              Déconnexion après <strong>{libelleDuree(reglages.inactivite_minutes)}</strong> sans activité
            </span>
          </p>
          <p className="reglage-resume">
            <ShieldCheck className="size-5 text-accent" aria-hidden="true" />
            <span>
              Session {reglages.lier_appareil ? <strong>liée à l&apos;appareil</strong> : <strong>non liée à l&apos;appareil</strong>}, {libelleHeures(reglages.session_max_heures)} au maximum
            </span>
          </p>
          <p className="reglage-resume">
            <HardDrive className="size-5 text-accent" aria-hidden="true" />
            <span>
              Fichiers jusqu&apos;à <strong>{reglages.taille_max_mo} Mo</strong>
            </span>
          </p>
        </div>

        <section className="verre panneau mt-8" aria-labelledby="titre-reglages">
          <h2 id="titre-reglages" className="text-2xl font-bold">
            Sécurité et envois
          </h2>
          <div className="mt-6">
            <FormulaireReglages reglages={reglages} />
          </div>
        </section>

        <section className="verre panneau mt-8">
          <h2 className="text-2xl font-bold">Mot de passe, appareils et sauvegardes</h2>
          <p className="mt-3 text-encre-douce">
            Le changement de mot de passe, la double authentification, la clé de récupération, la liste des appareils et le journal de sécurité se trouvent
            sur la page Sécurité. Les sauvegardes sont dans les Outils.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/createur/securite" className="bouton bouton-discret">
              Sécurité
            </Link>
            <Link href="/createur/outils/sauvegardes" className="bouton bouton-discret">
              Sauvegardes
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
