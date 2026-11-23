import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { journaliser } from "@/lib/audit";
import { synchroniserAbonnement } from "@/lib/premium/abonnements";
import { secretWebhook, stripe } from "@/lib/premium/stripe";
import { dbAdmin } from "@/lib/supabase";

/*
 * Les avis de Stripe (paiement réussi, renouvellement, échec, résiliation…).
 * 1. La signature est vérifiée avec le secret du webhook : un avis forgé est refusé.
 * 2. L'abonnement concerné est relu chez Stripe : l'état recopié est toujours le plus récent,
 *    même si les avis arrivent en retard ou dans le désordre.
 * 3. Un avis déjà traité n'est pas traité deux fois.
 * Cette adresse est la seule que Stripe appelle ; elle ne renvoie jamais rien de sensible.
 */

export const dynamic = "force-dynamic";
const TAILLE_MAX = 1_000_000;

const idDe = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : (x?.id ?? null));

/** L'abonnement dont parle l'avis, et le compte attendu s'il est connu. */
function concerne(evenement: Stripe.Event): { abonnement: string; compte?: string } | null {
  const o = evenement.data.object as unknown as Record<string, unknown>;
  switch (evenement.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = o as unknown as Stripe.Checkout.Session;
      const abonnement = s.mode === "subscription" ? idDe(s.subscription as string | { id: string } | null) : null;
      return abonnement ? { abonnement, compte: s.client_reference_id ?? undefined } : null;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
    case "customer.subscription.pending_update_applied":
    case "customer.subscription.pending_update_expired":
      return typeof o.id === "string" ? { abonnement: o.id } : null;
    case "invoice.paid":
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
    case "invoice.payment_action_required":
    case "invoice.marked_uncollectible": {
      const f = o as unknown as Stripe.Invoice;
      const abonnement = idDe(f.parent?.subscription_details?.subscription as string | { id: string } | null | undefined);
      return abonnement ? { abonnement } : null;
    }
    default:
      return null;
  }
}

export async function POST(requete: NextRequest) {
  const secret = secretWebhook();
  if (!secret) return NextResponse.json({ erreur: "non configuré" }, { status: 503 });
  const signature = requete.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ erreur: "signature absente" }, { status: 400 });
  if (Number(requete.headers.get("content-length") ?? "0") > TAILLE_MAX) return NextResponse.json({ erreur: "trop lourd" }, { status: 413 });
  const corps = await requete.text();
  if (corps.length > TAILLE_MAX) return NextResponse.json({ erreur: "trop lourd" }, { status: 413 });

  let evenement: Stripe.Event;
  try {
    // Le corps brut, tel qu'il est arrivé : la signature porte sur ces octets-là.
    evenement = stripe().webhooks.constructEvent(corps, signature, secret);
  } catch {
    await journaliser("premium.webhook_refuse", {});
    return NextResponse.json({ erreur: "signature invalide" }, { status: 400 });
  }
  if (!/^evt_[A-Za-z0-9]{1,250}$/.test(evenement.id)) return NextResponse.json({ recu: true });

  const base = dbAdmin();
  const { data: deja } = await base.from("evenements_stripe").select("id").eq("id", evenement.id).maybeSingle();
  if (deja) return NextResponse.json({ recu: true, deja: true });

  const cible = concerne(evenement);
  if (cible) {
    try {
      await synchroniserAbonnement(cible.abonnement, cible.compte);
    } catch {
      // Stripe renverra cet avis plus tard (pendant trois jours) : rien n'est perdu.
      return NextResponse.json({ erreur: "à réessayer" }, { status: 500 });
    }
  }
  await base.from("evenements_stripe").upsert({ id: evenement.id, type: evenement.type.slice(0, 100) }, { onConflict: "id", ignoreDuplicates: true });
  // De temps en temps, les avis de plus de quatre-vingt-dix jours s'effacent.
  if (Math.random() < 0.02) await base.from("evenements_stripe").delete().lt("recu_le", new Date(Date.now() - 90 * 86_400_000).toISOString());
  return NextResponse.json({ recu: true });
}
