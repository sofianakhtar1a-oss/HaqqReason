import type { Metadata } from "next";
import { CircleAlert, CircleCheck, Crown, ExternalLink } from "lucide-react";
import { FilAriane } from "@/components/FilAriane";
import { googleConfigure } from "@/lib/compte/jeton";
import { FONCTIONS, MODULES_PREMIUM, prixLisible, vendeurComplet } from "@/lib/premium/catalogue";
import { chiffresPremium } from "@/lib/premium/chiffres";
import { lireConfigPremium, offreActive, tablesPremium } from "@/lib/premium/config";
import { etatStripe } from "@/lib/premium/stripe";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";
import { BoutonConseilles, BoutonVerifierStripe, ComptesOfferts, InterrupteurOffre, ReglagesPremium } from "./Reglages";

export const metadata: Metadata = { title: "L'offre Premium", robots: { index: false } };

const ilYa = (iso: string) => {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (min < 2) return "à l'instant";
  if (min < 60) return `il y a ${min} minutes`;
  const h = Math.round(min / 60);
  if (h < 48) return `il y a ${h} heure${h > 1 ? "s" : ""}`;
  return `il y a ${Math.round(h / 24)} jours`;
};

function Ligne({ ok, titre, detail }: { ok: boolean; titre: string; detail: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      {ok ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-emeraude" aria-label="Prêt" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-or" aria-label="À faire" />}
      <div>
        <p className="font-semibold">{titre}</p>
        <p className="text-sm text-encre-douce">{detail}</p>
      </div>
    </li>
  );
}

export default async function PremiumCreateur() {
  await exigerCreateur();
  const config = await lireConfigPremium(true);
  const [base, enService, chiffres] = await Promise.all([tablesPremium(), offreActive(config), chiffresPremium()]);
  const s = etatStripe();
  const comptes = googleConfigure();
  const vendeur = vendeurComplet(config.vendeur);
  const pret = s.cle && s.webhook && base && comptes && vendeur;
  const dernierAvis = chiffres?.avis[0];
  const tableauStripe = s.mode === "test" ? "https://dashboard.stripe.com/test/dashboard" : "https://dashboard.stripe.com/dashboard";

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane etapes={[{ href: "/createur", libelle: "Espace créateur" }, { href: "/createur/premium", libelle: "L'offre Premium" }]} />
        <h1 className="mt-6 flex flex-wrap items-center gap-3 text-4xl font-extrabold md:text-5xl">
          <span className="sceau-premium" aria-hidden="true">
            <Crown className="size-6" />
          </span>
          L&apos;offre Premium
        </h1>
        <p className="mt-3 max-w-[70ch] text-lg text-encre-douce">
          Les prix, ce qui est gratuit et ce qui est réservé, les comptes offerts. Les paiements arrivent sur ton compte Stripe, puis sur ton compte bancaire professionnel (versements automatiques).
        </p>

        <section className="verre panneau mt-8" aria-labelledby="titre-etat">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="titre-etat" className="font-display text-2xl font-bold">
              État
            </h2>
            <span className={enService ? "marque-premium" : "marque-essais"}>{enService ? "En service" : config.active ? "Allumée, mais en attente" : "Éteinte"}</span>
          </div>
          <ul className="mt-4 grid gap-4">
            <Ligne
              ok={s.cle}
              titre="La clé Stripe"
              detail={
                s.cleInvalide
                  ? "STRIPE_SECRET_KEY est présente dans Vercel mais mal copiée : elle doit commencer par rk_ ou sk_."
                  : s.cle
                    ? `Réglée, en mode ${s.mode === "reel" ? "réel (vrais paiements)" : "test (aucun vrai paiement)"}${s.restreinte ? ", clé restreinte : parfait." : ". Conseil : une clé restreinte (rk_…) limite les dégâts si elle fuitait."}`
                    : "À mettre dans Vercel (STRIPE_SECRET_KEY), voir le guide."
              }
            />
            <Ligne ok={s.webhook} titre="Le secret du webhook" detail={s.webhookInvalide ? "STRIPE_WEBHOOK_SECRET est mal copié : il commence par whsec_." : s.webhook ? `Réglé. ${dernierAvis ? `Dernier avis de Stripe : ${dernierAvis.type}, ${ilYa(dernierAvis.recu_le)}.` : "Aucun avis reçu pour l'instant."}` : "À mettre dans Vercel (STRIPE_WEBHOOK_SECRET)."} />
            <Ligne ok={base} titre="La base de données" detail={base ? "Les tables de l'offre sont prêtes." : "Exécute supabase/migrations/021_premium.sql dans Supabase (SQL Editor)."} />
            <Ligne ok={comptes} titre="Les comptes des utilisateurs" detail={comptes ? "La connexion Google est en service." : "La connexion Google doit être en service pour s'abonner."} />
            <Ligne ok={vendeur} titre="Les informations du vendeur" detail={vendeur ? "Complètes : les conditions de vente sont prêtes." : "Nom, adresse, SIRET et e-mail : plus bas sur cette page."} />
          </ul>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InterrupteurOffre active={config.active} pret={pret} />
            <BoutonVerifierStripe possible={s.cle && s.webhook} />
          </div>
          <form action="/createur/vue-utilisateur" method="post" className="mt-2 text-sm text-encre-douce">
            Pour voir les cadenas comme un visiteur :{" "}
            <button type="submit" className="font-semibold text-encre underline underline-offset-4">
              passer dans la vue utilisateur
            </button>
            .
          </form>
        </section>

        {chiffres && (
          <section className="verre panneau mt-6" aria-labelledby="titre-chiffres">
            <h2 id="titre-chiffres" className="font-display text-2xl font-bold">
              Les abonnés
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              <p>
                <span className="block font-display text-3xl font-extrabold">{chiffres.actifs.mois + chiffres.actifs.annee}</span>
                <span className="text-sm text-encre-douce">
                  abonnés ({chiffres.actifs.mois} au mois, {chiffres.actifs.annee} à l&apos;année)
                </span>
              </p>
              <p>
                <span className="block font-display text-3xl font-extrabold texte-or">{prixLisible(chiffres.revenuMensuel)}</span>
                <span className="text-sm text-encre-douce">revenu mensuel estimé, avant frais Stripe</span>
              </p>
              <p>
                <span className="block font-display text-3xl font-extrabold">{chiffres.essais}</span>
                <span className="text-sm text-encre-douce">en essai gratuit</span>
              </p>
              <p>
                <span className="block font-display text-3xl font-extrabold">{chiffres.resiliations}</span>
                <span className="text-sm text-encre-douce">
                  résiliations à venir{chiffres.impayes ? `, ${chiffres.impayes} paiement${chiffres.impayes > 1 ? "s" : ""} en retard` : ""}
                </span>
              </p>
            </div>
            {s.cle && (
              <a href={tableauStripe} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 font-semibold text-encre-douce underline underline-offset-4 hover:text-encre">
                Le détail des paiements et des versements, dans Stripe
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            )}
          </section>
        )}

        <div className="mt-6">
          <ReglagesPremium
            config={{ prixMois: config.prixMois, prixAnnee: config.prixAnnee, essaiJours: config.essaiJours, modules: config.modules, regles: config.regles, vendeur: config.vendeur, accroche: config.accroche }}
            modules={MODULES_PREMIUM}
            fonctions={FONCTIONS}
          />
        </div>
        <div className="mt-4">
          <BoutonConseilles />
        </div>

        <div className="mt-6">
          <ComptesOfferts offerts={config.offerts} />
        </div>

        <section className="verre panneau mt-6" aria-labelledby="titre-securite">
          <h2 id="titre-securite" className="font-display text-2xl font-bold">
            La sécurité de tes paiements
          </h2>
          <ul className="liste-compte mt-3 text-encre-douce">
            <li>Les cartes bancaires sont saisies sur la page de Stripe : elles ne passent jamais par le site, il n&apos;y a donc rien à voler ici.</li>
            <li>Les deux secrets de Stripe vivent seulement dans Vercel : ils ne sont ni dans le code, ni dans la base, ni affichés ici.</li>
            <li>Chaque avis de Stripe est vérifié par sa signature ; un faux avis est refusé et noté dans le journal de sécurité.</li>
            <li>Le prix vient toujours de ces réglages, côté serveur : personne ne peut payer moins en modifiant la page.</li>
            <li>Active la double authentification sur Stripe, Vercel, Supabase, GitHub et ton compte Google : c&apos;est la protection la plus efficace contre le piratage.</li>
          </ul>
          <p className="mt-3 text-sm text-encre-douce">Le guide pas à pas (compte Stripe, banque, clé, webhook) est dans le dépôt : docs/GUIDE-PREMIUM.md.</p>
        </section>
      </main>
    </>
  );
}
