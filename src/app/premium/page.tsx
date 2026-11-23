import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { ACCROCHE_DEFAUT, economieAnnuelle, FONCTIONS, MODULES_PREMIUM, PAR_ID, prixLisible, regleEffective, regleLisible } from "@/lib/premium/catalogue";
import { contextePremium } from "@/lib/premium/droits";
import { FormulairePremium } from "./FormulairePremium";

export const metadata: Metadata = {
  title: "Accès premium",
  description: "HaqqReason Premium : toutes les histoires et dictées du A1 au C2, les outils sans limite et les diplômes du Truchement.",
};

const date = (iso: string | null) => (iso ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(iso)) : "");

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PagePremium({ searchParams }: Props) {
  const [ctx, sp] = await Promise.all([contextePremium(), searchParams]);
  const { config } = ctx;
  const eco = economieAnnuelle(config);
  const depuis = typeof sp.depuis === "string" ? PAR_ID.get(sp.depuis) : undefined;
  const abonne = ctx.premium && ctx.source === "abonnement";

  // Ce que Premium ouvre, module par module : seulement les parties qui ne sont pas gratuites pour tous.
  const modules = MODULES_PREMIUM.map((m) => {
    const parties = FONCTIONS.filter((f) => f.module === m.id).map((f) => ({ f, r: regleEffective(config, f.id) }));
    return { m, reservees: parties.filter((p) => p.r.acces !== "libre"), libres: parties.filter((p) => p.r.acces === "libre") };
  }).filter((x) => x.reservees.length > 0);

  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 pt-6 sm:px-8">
        <header className="premium-entete">
          <span className="sceau-premium" aria-hidden="true">
            <Crown className="size-7" />
          </span>
          <h1 className="texte-or">Accès premium</h1>
          <p>{config.accroche || ACCROCHE_DEFAUT}</p>
        </header>

        {sp.annule === "1" && !ctx.premium && (
          <p className="message mx-auto mt-8 max-w-xl text-center" role="status">
            Paiement annulé : rien n&apos;a été prélevé. Tu peux reprendre quand tu veux.
          </p>
        )}
        {depuis && !ctx.premium && ctx.offre && (
          <p className="mx-auto mt-6 max-w-xl text-center text-encre-douce">
            Avec Premium, « {depuis.nom} » s&apos;ouvre sans limite.
          </p>
        )}

        {ctx.premium && (
          <section className="verre panneau mx-auto mt-10 grid max-w-xl justify-items-center gap-3 text-center" aria-label="Ton accès">
            <span className="badge-premium">
              <span className="sceau-premium" aria-hidden="true">
                <Crown className="size-4" />
              </span>
              <span className="badge-premium-texte texte-or">Accès premium</span>
            </span>
            {abonne && ctx.abonnement && (
              <p className="text-encre-douce">
                {ctx.abonnement.resiliation_fin_periode
                  ? `Ton abonnement est résilié : ton accès reste ouvert jusqu'au ${date(ctx.abonnement.fin_periode)}.`
                  : `Ton abonnement ${ctx.abonnement.formule === "annee" ? "annuel" : "mensuel"} est actif. Prochain renouvellement le ${date(ctx.abonnement.fin_periode)}.`}
              </p>
            )}
            {ctx.source === "offert" && <p className="text-encre-douce">{ctx.offertJusqu ? `Un accès t'est offert jusqu'au ${date(`${ctx.offertJusqu}T12:00:00Z`)}.` : "Un accès t'est offert, sans date de fin."}</p>}
            <Link href="/compte" className="bouton bouton-discret mt-2">
              Gérer mon abonnement
            </Link>
          </section>
        )}

        {ctx.createur && !ctx.premium && (
          <p className="message mx-auto mt-8 max-w-xl text-center" role="status">
            Tu es le créateur : tout t&apos;est ouvert. Pour voir les cadenas comme un visiteur, passe dans la vue utilisateur.{" "}
            <Link href="/createur/premium" className="font-semibold underline underline-offset-4">
              Régler l&apos;offre
            </Link>
          </p>
        )}

        {!ctx.premium && !ctx.offre && (
          <section className="verre panneau mx-auto mt-10 max-w-xl text-center" aria-label="Offre bientôt ouverte">
            <Sparkles className="mx-auto size-6 text-or" aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold">L&apos;offre Premium ouvre bientôt.</p>
            <p className="mt-2 text-encre-douce">En attendant, tout HaqqReason reste ouvert, gratuitement.</p>
          </section>
        )}

        {!ctx.premium && ctx.offre && (
          <section className="mx-auto mt-10 max-w-3xl" aria-label="Devenir Premium">
            <FormulairePremium
              connecte={Boolean(ctx.compte)}
              prixMois={prixLisible(config.prixMois)}
              prixAnnee={prixLisible(config.prixAnnee)}
              gainAnnee={eco.moisOfferts >= 1 ? `${eco.moisOfferts} mois offert${eco.moisOfferts > 1 ? "s" : ""}` : eco.pourcent >= 5 ? `−${eco.pourcent} %` : null}
              essaiJours={config.essaiJours}
            />
          </section>
        )}

        {modules.length > 0 && (
          <section className="mt-16" aria-labelledby="titre-ouvre">
            <h2 id="titre-ouvre" className="font-display text-3xl font-extrabold">
              Ce que Premium ouvre
            </h2>
            <p className="mt-2 max-w-[60ch] text-encre-douce">Sans abonnement, tout ceci reste à découvrir gratuitement, dans la limite indiquée.</p>
            <div className="premium-modules">
              {modules.map(({ m, reservees, libres }) => (
                <article key={m.id} className="premium-module">
                  <h3>{m.nom}</h3>
                  <p className="mt-1 text-sm text-encre-douce">{m.resume}</p>
                  <ul className="premium-parties">
                    {reservees.map(({ f, r }) => (
                      <li key={f.id} className="premium-partie">
                        <span>{f.nom}</span>
                        <span className="premium-partie-regles">
                          {r.acces === "premium" ? (
                            <span className="premium-partie-premium">Réservé à Premium</span>
                          ) : (
                            <>
                              <span className="premium-partie-gratuit">Gratuit : {regleLisible(r, f)}</span>
                              <span className="premium-partie-premium">Sans limite en Premium</span>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {libres.length > 0 && <p className="mt-3 text-sm text-encre-douce">Toujours gratuit : {libres.map((x) => x.f.nom.charAt(0).toLowerCase() + x.f.nom.slice(1)).join(", ")}.</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 max-w-3xl" aria-labelledby="titre-questions">
          <h2 id="titre-questions" className="font-display text-3xl font-extrabold">
            Questions
          </h2>
          <div className="mt-5 grid gap-3">
            <details className="premium-question">
              <summary>Comment résilier ?</summary>
              <p className="mt-3 text-encre-douce">
                Depuis « Mon compte », bouton « Résilier mon abonnement », puis confirmation : trois clics. Tu gardes l&apos;accès jusqu&apos;à la fin de la période déjà payée,
                et plus rien n&apos;est prélevé ensuite.
              </p>
            </details>
            <details className="premium-question">
              <summary>Mon paiement est-il protégé ?</summary>
              <p className="mt-3 text-encre-douce">
                Le paiement passe par Stripe, un prestataire agréé, sur sa propre page sécurisée. Ta carte n&apos;est jamais saisie ni gardée par HaqqReason, et ta banque peut te
                demander une confirmation (3-D Secure).
              </p>
            </details>
            <details className="premium-question">
              <summary>Où trouver mes factures ?</summary>
              <p className="mt-3 text-encre-douce">Stripe t&apos;envoie un reçu à chaque paiement. Toutes tes factures se téléchargent depuis « Mon compte », dans « Mon abonnement ».</p>
            </details>
            <details className="premium-question">
              <summary>Que deviennent mes données si j&apos;arrête ?</summary>
              <p className="mt-3 text-encre-douce">Rien ne s&apos;efface : tes documents, ta progression et ton dictionnaire restent sur ton compte. Seules les parties Premium se referment.</p>
            </details>
          </div>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-encre-douce">
            <Link href="/conditions-vente" className="underline underline-offset-4">
              Conditions générales de vente
            </Link>
            <Link href="/confidentialite" className="underline underline-offset-4">
              Confidentialité
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
