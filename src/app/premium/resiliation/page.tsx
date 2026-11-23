import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { abonnementActif } from "@/lib/premium/abonnements";
import { prixLisible } from "@/lib/premium/catalogue";
import { compteVerifie } from "@/lib/compte/session";
import { contextePremium } from "@/lib/premium/droits";
import { Resiliation } from "./Resiliation";

export const metadata: Metadata = { title: "Résilier votre contrat", robots: { index: false } };

/** « Résilier votre contrat » : la page vers laquelle mène le bouton de « Mon compte ». */
export default async function PageResiliation() {
  const verifie = await compteVerifie();
  if (verifie === null) redirect("/connexion?retour=%2Fpremium%2Fresiliation");
  if (verifie === "indisponible") redirect("/compte");
  const ctx = await contextePremium(verifie);
  const a = ctx.abonnement;
  const actif = a && abonnementActif(a);

  return (
    <>
      <EnTete outils={false} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <Link href="/compte" className="inline-flex items-center gap-2 font-semibold text-encre-douce hover:text-encre">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Mon compte
        </Link>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">Résilier votre contrat</h1>
        {actif && a ? (
          <>
            <p className="mt-3 max-w-[62ch] text-lg text-encre-douce">
              Tu peux arrêter ton abonnement Premium à tout moment. Tu gardes l&apos;accès jusqu&apos;à la fin de la période déjà payée, puis plus rien n&apos;est prélevé.
            </p>
            <Resiliation
              titulaire={verifie.nom || verifie.email}
              email={verifie.email}
              formule={a.formule === "annee" ? "à l'année" : "au mois"}
              prix={a.montant ? `${prixLisible(a.montant)} ${a.formule === "annee" ? "par an" : "par mois"}` : "prix de ton abonnement"}
              fin={a.fin_periode}
              dejaResilie={a.resiliation_fin_periode}
            />
          </>
        ) : (
          <p className="mt-6 text-lg text-encre-douce">
            Tu n&apos;as pas d&apos;abonnement en cours : il n&apos;y a rien à résilier.{" "}
            <Link href="/compte" className="font-semibold text-encre underline underline-offset-4">
              Revenir à mon compte
            </Link>
          </p>
        )}
      </main>
    </>
  );
}
