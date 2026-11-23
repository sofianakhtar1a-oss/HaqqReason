import { NextResponse, type NextRequest } from "next/server";
import { journaliser } from "@/lib/audit";
import { origineDe } from "@/lib/compte/google";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { abonnementActif, assurerClient, lireAbonnement, noterConsentement } from "@/lib/premium/abonnements";
import { prixLisible } from "@/lib/premium/catalogue";
import { lireConfigPremium, offreActive } from "@/lib/premium/config";
import { lireJson, refus, SANS_CACHE, tropDeDemandes } from "@/lib/premium/requete";
import { erreurStripe, portailStripe, prixStripe, stripe } from "@/lib/premium/stripe";

/*
 * Ouvre la page de paiement sécurisée de Stripe. Le numéro de carte est saisi chez Stripe, jamais
 * ici. Le prix vient de la configuration du créateur (lue sur le serveur) : le navigateur ne choisit
 * que la formule, jamais le montant.
 */
export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const corps = await lireJson(requete, 1024);
  const formule = corps?.formule === "annee" ? "annee" : corps?.formule === "mois" ? "mois" : null;
  if (!formule) return refus(400, "illisible");
  // Les deux cases cochées : les conditions de vente, et l'accès immédiat (renonciation au délai de rétractation).
  if (corps?.cgv !== true || corps?.renonciation !== true) return refus(400, "consentement");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const config = await lireConfigPremium(true);
  if (!(await offreActive(config))) return refus(409, "fermee");
  if (tropDeDemandes(`paiement:${compte.id}`, 10, 3_600_000)) return refus(429, "trop");
  const origine = origineDe(requete);
  try {
    const actuel = await lireAbonnement(compte.id);
    if (actuel === "indisponible") return refus(503, "indisponible");
    if (actuel?.stripe_client && abonnementActif(actuel)) {
      // Déjà abonné : pas de second abonnement, on ouvre plutôt son espace d'abonnement.
      const portail = await stripe().billingPortal.sessions.create({ customer: actuel.stripe_client, return_url: `${origine}/compte`, configuration: await portailStripe(origine), locale: "fr" });
      return NextResponse.json({ url: portail.url, deja: true }, { headers: SANS_CACHE });
    }
    const client = await assurerClient(compte);
    const montant = formule === "mois" ? config.prixMois : config.prixAnnee;
    const prix = await prixStripe(formule, montant);
    const le = new Date().toISOString();
    await noterConsentement(compte.id, { cgv: config.versionCgv, renonciation: true, formule, montant, le });
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: client,
      client_reference_id: compte.id,
      line_items: [{ price: prix, quantity: 1 }],
      subscription_data: {
        metadata: { compte: compte.id, formule, cgv: config.versionCgv },
        ...(config.essaiJours > 0 ? { trial_period_days: config.essaiJours } : {}),
      },
      metadata: { compte: compte.id, formule, cgv: config.versionCgv, consentement: le },
      success_url: `${origine}/premium/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origine}/premium?annule=1`,
      locale: "fr",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
      custom_text: {
        submit: {
          message: `HaqqReason Premium, ${prixLisible(montant)} ${formule === "mois" ? "par mois" : "par an"}, renouvelé automatiquement, résiliable à tout moment depuis « Mon compte ». Tu as demandé l'accès immédiat et renoncé au délai de rétractation.`,
        },
      },
    });
    if (!session.url) return refus(502, "stripe");
    await journaliser("premium.paiement_ouvert", { formule });
    return NextResponse.json({ url: session.url }, { headers: SANS_CACHE });
  } catch (e) {
    const message = erreurStripe(e);
    await journaliser("premium.erreur_paiement", { message });
    return refus(502, "stripe", { message });
  }
}
