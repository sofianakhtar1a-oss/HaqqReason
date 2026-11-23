import "server-only";
import Stripe from "stripe";
import { dbAdmin } from "@/lib/supabase";

/*
 * Le lien avec Stripe. Les deux secrets (la clé et le secret du webhook) vivent seulement dans les
 * variables d'environnement du serveur (Vercel) : ils ne sont jamais écrits en base, jamais envoyés
 * au navigateur, jamais affichés, même au créateur (il ne voit que « réglé » ou « manquant »).
 */

const CLE = /^(sk|rk)_(test|live)_[A-Za-z0-9]{10,}$/;
const SECRET_WEBHOOK = /^whsec_[A-Za-z0-9+/=]{10,}$/;

export const ID_PRODUIT = "haqqreason-premium";
export const CLES_PRIX = { mois: "haqqreason_premium_mois", annee: "haqqreason_premium_annee" } as const;
export type Formule = keyof typeof CLES_PRIX;

function cleSecrete(): string | null {
  const v = process.env.STRIPE_SECRET_KEY?.trim();
  return v && CLE.test(v) ? v : null;
}

export function secretWebhook(): string | null {
  const v = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return v && SECRET_WEBHOOK.test(v) ? v : null;
}

export type EtatStripe = {
  /** Une clé est présente mais mal formée (copiée de travers). */
  cleInvalide: boolean;
  cle: boolean;
  /** Clé restreinte (rk_…) : les droits minimum, recommandé. */
  restreinte: boolean;
  mode: "test" | "reel" | null;
  webhook: boolean;
  webhookInvalide: boolean;
};

export function etatStripe(): EtatStripe {
  const brute = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const cle = cleSecrete();
  const wh = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  return {
    cleInvalide: Boolean(brute) && !cle,
    cle: Boolean(cle),
    restreinte: Boolean(cle?.startsWith("rk_")),
    mode: cle ? (cle.includes("_live_") ? "reel" : "test") : null,
    webhook: Boolean(secretWebhook()),
    webhookInvalide: Boolean(wh) && !secretWebhook(),
  };
}

/** Stripe est prêt : une clé valide ET le secret du webhook (sans lui, les renouvellements ne seraient pas suivis). */
export function stripeConfigure(): boolean {
  return Boolean(cleSecrete() && secretWebhook());
}

let client: Stripe | null = null;
let clientPour = "";

export function stripe(): Stripe {
  const cle = cleSecrete();
  if (!cle) throw new Error("Stripe n'est pas réglé sur le serveur.");
  if (!client || clientPour !== cle) {
    client = new Stripe(cle, { maxNetworkRetries: 2, timeout: 20_000, appInfo: { name: "HaqqReason", url: "https://haqqreason.vercel.app" } });
    clientPour = cle;
  }
  return client;
}

/** Les identifiants Stripe que le site garde pour lui (pas des secrets) : un jeu en test, un en réel. */
type Memoire = { portail?: string };
const CLE_MEMOIRE = "premium_stripe";

async function lireMemoire(): Promise<Record<string, Memoire>> {
  const { data } = await dbAdmin().from("reglages").select("valeur").eq("cle", CLE_MEMOIRE).maybeSingle();
  return ((data as { valeur: Record<string, Memoire> } | null)?.valeur ?? {}) as Record<string, Memoire>;
}

async function ecrireMemoire(m: Record<string, Memoire>) {
  await dbAdmin().from("reglages").upsert({ cle: CLE_MEMOIRE, valeur: m as never }, { onConflict: "cle" });
}

/** Le produit « HaqqReason Premium », créé une seule fois (son identifiant est fixe). */
export async function assurerProduit(): Promise<string> {
  const s = stripe();
  try {
    const p = await s.products.retrieve(ID_PRODUIT);
    if (!p.active) await s.products.update(ID_PRODUIT, { active: true });
    return p.id;
  } catch (e) {
    if (!(e instanceof Stripe.errors.StripeInvalidRequestError) || e.statusCode !== 404) throw e;
  }
  const p = await s.products.create(
    { id: ID_PRODUIT, name: "HaqqReason Premium", description: "L'accès complet à HaqqReason : toutes les histoires, dictées, outils et diplômes.", metadata: { haqqreason: "premium" } },
    { idempotencyKey: `produit-${ID_PRODUIT}` },
  );
  return p.id;
}

const intervalle = (f: Formule) => (f === "mois" ? "month" : "year");

/**
 * Le prix Stripe d'une formule, au montant voulu. Un prix Stripe ne se modifie pas : si le créateur
 * change le montant, un nouveau prix prend le nom de l'ancien (les abonnés en cours gardent le leur,
 * comme le veut l'usage), et l'ancien est retiré de la vente.
 */
export async function prixStripe(formule: Formule, montant: number): Promise<string> {
  const s = stripe();
  const existants = await s.prices.list({ lookup_keys: [CLES_PRIX[formule]], active: true, limit: 1 });
  const p = existants.data[0];
  if (p && p.unit_amount === montant && p.currency === "eur" && p.type === "recurring" && p.recurring?.interval === intervalle(formule) && p.recurring.interval_count === 1) return p.id;
  const produit = await assurerProduit();
  const nouveau = await s.prices.create({
    product: produit,
    currency: "eur",
    unit_amount: montant,
    recurring: { interval: intervalle(formule), interval_count: 1 },
    lookup_key: CLES_PRIX[formule],
    transfer_lookup_key: true,
    tax_behavior: "inclusive",
    nickname: formule === "mois" ? "Premium mensuel" : "Premium annuel",
    metadata: { haqqreason: "premium", formule },
  });
  if (p) await s.prices.update(p.id, { active: false }).catch(() => undefined);
  return nouveau.id;
}

/** Les deux prix, alignés sur la configuration du créateur. */
export async function synchroniserPrix(prixMois: number, prixAnnee: number): Promise<{ mois: string; annee: string }> {
  const [mois, annee] = await Promise.all([prixStripe("mois", prixMois), prixStripe("annee", prixAnnee)]);
  return { mois, annee };
}

/** La formule d'un prix Stripe (d'après son nom réservé, ou son intervalle). */
export function formuleDuPrix(prix: Stripe.Price | null | undefined): Formule | null {
  if (!prix) return null;
  if (prix.lookup_key === CLES_PRIX.mois || prix.metadata?.formule === "mois") return "mois";
  if (prix.lookup_key === CLES_PRIX.annee || prix.metadata?.formule === "annee") return "annee";
  if (prix.recurring?.interval === "month") return "mois";
  if (prix.recurring?.interval === "year") return "annee";
  return null;
}

/**
 * Le portail de Stripe (changer de carte, retrouver ses factures, résilier), réglé une fois pour toutes
 * par le site lui-même : le créateur n'a rien à configurer dans Stripe.
 */
export async function portailStripe(origine: string): Promise<string> {
  const s = stripe();
  const mode = etatStripe().mode ?? "test";
  const memoire = await lireMemoire().catch(() => ({}) as Record<string, Memoire>);
  const connu = memoire[mode]?.portail;
  if (connu) {
    try {
      const c = await s.billingPortal.configurations.retrieve(connu);
      if (c.active) return c.id;
    } catch {
      // Configuration effacée dans Stripe : on en refait une.
    }
  }
  const c = await s.billingPortal.configurations.create({
    name: "HaqqReason Premium",
    business_profile: { headline: "HaqqReason Premium : ton abonnement", privacy_policy_url: `${origine}/confidentialite`, terms_of_service_url: `${origine}/conditions-vente` },
    default_return_url: `${origine}/compte`,
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "address", "name"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "missing_features", "switched_service", "other"] } },
    },
    metadata: { haqqreason: "premium" },
  });
  await ecrireMemoire({ ...memoire, [mode]: { ...memoire[mode], portail: c.id } }).catch(() => undefined);
  return c.id;
}

/** Un message d'erreur de Stripe, sans rien qui puisse trahir un secret. */
export function erreurStripe(e: unknown): string {
  if (e instanceof Stripe.errors.StripeAuthenticationError) return "La clé Stripe est refusée : vérifie STRIPE_SECRET_KEY dans Vercel.";
  if (e instanceof Stripe.errors.StripePermissionError) return "La clé Stripe n'a pas tous les droits nécessaires (voir le guide Premium).";
  if (e instanceof Stripe.errors.StripeConnectionError) return "Stripe ne répond pas pour l'instant. Réessaie dans un moment.";
  if (e instanceof Stripe.errors.StripeRateLimitError) return "Trop de demandes à Stripe d'un coup. Réessaie dans un moment.";
  if (e instanceof Stripe.errors.StripeInvalidRequestError) return `Stripe refuse la demande${e.code ? ` (${e.code})` : ""}.`;
  return "Stripe n'a pas pu traiter la demande.";
}
