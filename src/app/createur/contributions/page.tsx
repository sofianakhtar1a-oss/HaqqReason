import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Inbox, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { etatContributions, listerPourCreateur } from "@/lib/contributions/donnees";
import { lireReglages } from "@/lib/reglages-donnees";
import { exigerCreateur } from "@/lib/session";
import { Gestion } from "./Gestion";

export const metadata: Metadata = { title: "Contributions des lecteurs", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function PageContributions() {
  await exigerCreateur();
  const [contributions, etat, reglages] = await Promise.all([listerPourCreateur(), etatContributions(), lireReglages()]);

  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <Link href="/createur" className="sans-impression inline-flex items-center gap-2 font-semibold text-encre-douce hover:text-encre">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Espace créateur
        </Link>
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Contributions des lecteurs</h1>
        <p className="mt-4 max-w-2xl text-lg text-encre-douce">
          Les idées de sujet et les arguments proposés depuis la page{" "}
          <Link href="/contribuer" className="lien-interne">
            Contribuer
          </Link>
          . Tout passe d&apos;abord par un filtre de politesse : une grossièreté n&apos;est jamais publiée.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <p className="reglage-resume">
            <Inbox className="size-5 text-accent" aria-hidden="true" />
            <span>
              <strong>{etat.en_attente}</strong>{" "}en attente de ta relecture
            </span>
          </p>
          <p className="reglage-resume">
            <MessageSquarePlus className="size-5 text-accent" aria-hidden="true" />
            <span>
              <strong>{etat.publiees}</strong>{" "}en ligne
              {etat.signalees > 0 ? `, dont ${etat.signalees} signalée${etat.signalees > 1 ? "s" : ""}` : ""}
            </span>
          </p>
          <p className="reglage-resume">
            <ShieldCheck className="size-5 text-accent" aria-hidden="true" />
            <span>
              <strong>{etat.refusees}</strong>{" "}arrêtée{etat.refusees > 1 ? "s" : ""} par le filtre
            </span>
          </p>
        </div>

        <p className="mt-6 text-encre-douce">
          {reglages.contributions_ouvertes
            ? reglages.contributions_validation
              ? "Réglage actuel : rien ne paraît sans ton accord."
              : "Réglage actuel : ce qui passe le filtre paraît aussitôt, le reste t'attend ici."
            : "Les envois sont fermés : la page Contribuer n'accepte plus rien pour le moment."}{" "}
          <Link href="/createur/parametres" className="lien-interne">
            Changer dans les Paramètres
          </Link>
          .
        </p>

        <section className="mt-8">
          <Gestion contributions={contributions} />
        </section>
      </main>
    </>
  );
}
