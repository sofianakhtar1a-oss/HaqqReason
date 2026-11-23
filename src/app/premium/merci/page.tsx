import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { compteVerifie } from "@/lib/compte/session";
import { synchroniserAbonnement } from "@/lib/premium/abonnements";
import { contextePremium } from "@/lib/premium/droits";
import { stripe, stripeConfigure } from "@/lib/premium/stripe";
import { Actualiser } from "./Actualiser";

export const metadata: Metadata = { title: "Bienvenue dans Premium", robots: { index: false } };

const SESSION = /^cs_(test|live)_[A-Za-z0-9]{10,250}$/;
const date = (iso: string | null | undefined) => (iso ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(iso)) : "");

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Le retour de la page de paiement. Le site ne croit pas l'adresse sur parole : il redemande à
 * Stripe si le paiement de CE compte a bien abouti, puis recopie l'abonnement aussitôt (sans
 * attendre l'avis de Stripe, qui confirmera de son côté).
 */
export default async function MerciPremium({ searchParams }: Props) {
  const verifie = await compteVerifie();
  if (!verifie || verifie === "indisponible") redirect("/connexion?retour=%2Fpremium");
  const sp = await searchParams;
  const id = typeof sp.session_id === "string" && SESSION.test(sp.session_id) ? sp.session_id : null;
  let attente = false;
  if (id && stripeConfigure()) {
    try {
      const s = await stripe().checkout.sessions.retrieve(id);
      if (s.client_reference_id === verifie.id && s.status === "complete" && typeof s.subscription === "string") await synchroniserAbonnement(s.subscription, verifie.id);
      else if (s.client_reference_id === verifie.id) attente = true;
    } catch {
      attente = true;
    }
  }
  const ctx = await contextePremium(verifie);
  const a = ctx.abonnement;

  return (
    <>
      <EnTete />
      <Actualiser premium={ctx.premium} />
      <main className="mx-auto grid w-full max-w-2xl flex-1 content-start justify-items-center gap-5 px-5 pb-20 pt-10 text-center sm:px-8">
        <span className="sceau-premium" aria-hidden="true">
          <Crown className="size-7" />
        </span>
        {ctx.premium ? (
          <>
            <h1 className="font-display text-4xl font-extrabold md:text-5xl">Bienvenue dans Premium</h1>
            <span className="badge-premium">
              <span className="sceau-premium" aria-hidden="true">
                <Crown className="size-4" />
              </span>
              <span className="badge-premium-texte texte-or">Accès premium</span>
            </span>
            <p className="max-w-[48ch] text-lg text-encre-douce">
              Tout est ouvert : chaque histoire, chaque dictée, chaque outil, et les examens du Truchement.
              {a?.fin_periode ? ` Ton abonnement ${a.formule === "annee" ? "annuel" : "mensuel"} se renouvelle le ${date(a.fin_periode)}.` : ""} Stripe t&apos;envoie le reçu par e-mail.
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Link href="/langues" className="bouton bouton-principal bouton-premium">
                Ouvrir Le Truchement
              </Link>
              <Link href="/utilisateur" className="bouton bouton-discret">
                Tous les espaces
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl font-extrabold">{attente ? "Paiement en cours de confirmation" : "Aucun paiement à confirmer"}</h1>
            <p className="max-w-[48ch] text-lg text-encre-douce">
              {attente
                ? "Ta banque confirme le paiement : ton accès s'ouvrira de lui-même dans quelques instants. Tu peux recharger cette page dans une minute."
                : "Nous n'avons trouvé aucun paiement récent sur ton compte. Si tu viens de payer, patiente une minute puis recharge la page."}
            </p>
            <Link href="/premium" className="bouton bouton-discret">
              Revenir à l&apos;offre Premium
            </Link>
          </>
        )}
      </main>
    </>
  );
}
