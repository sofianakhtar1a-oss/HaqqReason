import "server-only";
import type Stripe from "stripe";
import { journaliser } from "@/lib/audit";
import { dbAdmin } from "@/lib/supabase";
import { formuleDuPrix, ID_PRODUIT, stripe, stripeConfigure } from "./stripe";

/*
 * Les abonnements : Stripe fait foi. Le site en garde une copie (pour répondre vite), mise à jour
 * à chaque avis de Stripe et revérifiée auprès de lui quand quelque chose semble ne plus coller.
 * Le site ne recopie jamais un état envoyé par le navigateur : il redemande toujours à Stripe.
 */

export type Abonnement = {
  compte: string;
  stripe_client: string | null;
  stripe_abonnement: string | null;
  statut: string;
  formule: "mois" | "annee" | null;
  fin_periode: string | null;
  resiliation_fin_periode: boolean;
  montant: number | null;
  consentement: unknown;
  verifie_le: string | null;
  maj: string;
  cree_le: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Les états où l'abonné garde son accès (« past_due » : Stripe retente le paiement, on laisse le temps). */
const ACTIFS = new Set(["active", "trialing", "past_due"]);
/** Marge après la fin d'une période payée, le temps que le renouvellement arrive. */
const GRACE_MS = 3 * 86_400_000;

export async function lireAbonnement(compte: string): Promise<Abonnement | null | "indisponible"> {
  try {
    const { data, error } = await dbAdmin().from("abonnements_premium").select("*").eq("compte", compte).maybeSingle();
    if (error) return "indisponible";
    return (data as Abonnement | null) ?? null;
  } catch {
    return "indisponible";
  }
}

export function statutActif(statut: string): boolean {
  return ACTIFS.has(statut);
}

/** L'abonné a-t-il accès en ce moment ? */
export function abonnementActif(a: Abonnement | null, maintenant = Date.now()): boolean {
  if (!a || !statutActif(a.statut)) return false;
  if (a.fin_periode && Date.parse(a.fin_periode) + GRACE_MS < maintenant) return false;
  return true;
}

/** Faut-il redemander à Stripe ? (fin de période passée sans nouvelle, et pas vérifié depuis dix minutes) */
export function aReverifier(a: Abonnement, maintenant = Date.now()): boolean {
  if (!a.stripe_abonnement || !a.fin_periode) return false;
  if (Date.parse(a.fin_periode) > maintenant) return false;
  return !a.verifie_le || maintenant - Date.parse(a.verifie_le) > 10 * 60_000;
}

const idDe = (x: string | { id: string } | null | undefined) => (typeof x === "string" ? x : (x?.id ?? null));

/** Le compte du site lié à un client Stripe. */
async function compteDuClient(client: string): Promise<string | null> {
  const { data } = await dbAdmin().from("abonnements_premium").select("compte").eq("stripe_client", client).maybeSingle();
  const trouve = (data as { compte: string } | null)?.compte;
  if (trouve) return trouve;
  try {
    const c = await stripe().customers.retrieve(client);
    const m = "deleted" in c && c.deleted ? null : (c as Stripe.Customer).metadata?.compte;
    return m && UUID.test(m) ? m : null;
  } catch {
    return null;
  }
}

/**
 * Recopie l'état d'un abonnement Stripe. L'abonnement est relu chez Stripe (jamais pris tel quel d'un
 * avis, qui peut arriver en retard ou dans le désordre). Renvoie le compte concerné, ou null.
 */
export async function synchroniserAbonnement(source: string | Stripe.Subscription, compteAttendu?: string): Promise<string | null> {
  const id = typeof source === "string" ? source : source.id;
  const sub = await stripe().subscriptions.retrieve(id, { expand: ["items.data.price"] });
  const client = idDe(sub.customer);
  if (!client) return null;
  // Un abonnement qui ne concerne pas HaqqReason Premium (le compte Stripe peut servir à autre chose) : on l'ignore.
  if (!sub.items.data.some((i) => idDe((i.price as Stripe.Price | undefined)?.product as string | { id: string } | undefined) === ID_PRODUIT)) return null;
  let compte = sub.metadata?.compte && UUID.test(sub.metadata.compte) ? sub.metadata.compte : null;
  compte ??= await compteDuClient(client);
  if (!compte && compteAttendu && UUID.test(compteAttendu)) compte = compteAttendu;
  if (!compte) {
    await journaliser("premium.abonnement_orphelin", { abonnement: sub.id });
    return null;
  }
  if (compteAttendu && compteAttendu !== compte) {
    // Le paiement revendique un autre compte que celui inscrit chez Stripe : on ne touche à rien.
    await journaliser("premium.compte_different", { abonnement: sub.id });
    return null;
  }

  const actuel = await lireAbonnement(compte);
  if (actuel === "indisponible") throw new Error("Base indisponible");
  // Un vieil abonnement terminé ne doit pas écraser un abonnement en cours plus récent.
  if (actuel?.stripe_abonnement && actuel.stripe_abonnement !== sub.id && statutActif(actuel.statut) && !statutActif(sub.status)) return compte;

  const item = sub.items.data[0];
  const prix = item?.price as Stripe.Price | undefined;
  const fin = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null;
  const maintenant = new Date().toISOString();
  const ligne = {
    compte,
    stripe_client: client,
    stripe_abonnement: sub.id,
    statut: /^[a-z_]{1,40}$/.test(sub.status) ? sub.status : "inconnu",
    formule: formuleDuPrix(prix),
    fin_periode: fin,
    resiliation_fin_periode: Boolean(sub.cancel_at_period_end || sub.cancel_at),
    montant: typeof prix?.unit_amount === "number" ? prix.unit_amount : null,
    verifie_le: maintenant,
    maj: maintenant,
  };
  const { error } = await dbAdmin().from("abonnements_premium").upsert(ligne, { onConflict: "compte" });
  if (error) throw new Error(`Abonnement non enregistré : ${error.message}`);
  if (!actuel || actuel.statut !== ligne.statut) await journaliser("premium.statut", { statut: ligne.statut, formule: ligne.formule });
  oublierPremium(compte);
  return compte;
}

/** Le client Stripe du compte, créé au premier paiement (une seule fois, même si l'on clique deux fois). */
export async function assurerClient(compte: { id: string; email: string; nom: string }): Promise<string> {
  const actuel = await lireAbonnement(compte.id);
  if (actuel === "indisponible") throw new Error("Base indisponible");
  if (actuel?.stripe_client) {
    try {
      const c = await stripe().customers.retrieve(actuel.stripe_client);
      if (!("deleted" in c && c.deleted)) return c.id;
    } catch {
      // Client effacé dans Stripe : on en crée un autre.
    }
  }
  const c = await stripe().customers.create(
    { email: compte.email || undefined, name: compte.nom || undefined, metadata: { compte: compte.id }, preferred_locales: ["fr"] },
    { idempotencyKey: `client-${compte.id}-${actuel?.stripe_client ?? "premier"}` },
  );
  const { error } = actuel
    ? await dbAdmin().from("abonnements_premium").update({ stripe_client: c.id, maj: new Date().toISOString() }).eq("compte", compte.id)
    : await dbAdmin().from("abonnements_premium").insert({ compte: compte.id, stripe_client: c.id, statut: "aucun" });
  if (error) throw new Error(`Client non enregistré : ${error.message}`);
  return c.id;
}

/** Garde la trace des cases cochées avant le paiement (preuve du consentement). */
export async function noterConsentement(compte: string, consentement: Record<string, unknown>): Promise<void> {
  await dbAdmin().from("abonnements_premium").update({ consentement, maj: new Date().toISOString() }).eq("compte", compte);
}

/* ---------- Un petit cache, pour ne pas interroger la base à chaque page ---------- */

const cachePremium = new Map<string, { valeur: Abonnement | null; expire: number }>();

export async function abonnementEnCache(compte: string): Promise<Abonnement | null | "indisponible"> {
  const c = cachePremium.get(compte);
  if (c && c.expire > Date.now()) return c.valeur;
  const a = await lireAbonnement(compte);
  if (a !== "indisponible") {
    if (cachePremium.size > 5000) cachePremium.clear();
    // Un abonné se garde trente secondes ; un non-abonné cinq (celui qui vient de payer est vite reconnu).
    cachePremium.set(compte, { valeur: a, expire: Date.now() + (abonnementActif(a) ? 30_000 : 5_000) });
  }
  return a;
}

export function oublierPremium(compte: string) {
  cachePremium.delete(compte);
}

/** Résilie tout de suite (suppression du compte) : plus aucun prélèvement ensuite. */
export async function resilierImmediatement(compte: string): Promise<boolean> {
  const a = await lireAbonnement(compte);
  if (a === "indisponible") return false;
  if (!a?.stripe_abonnement || ["canceled", "incomplete_expired", "aucun"].includes(a.statut)) return true;
  if (!stripeConfigure()) {
    // Stripe a été débranché : le créateur devra résilier lui-même depuis Stripe (noté dans le journal).
    await journaliser("premium.resiliation_a_faire", { abonnement: a.stripe_abonnement });
    return true;
  }
  try {
    await stripe().subscriptions.cancel(a.stripe_abonnement, { invoice_now: false, prorate: false });
    await journaliser("premium.resilie_suppression", {});
    return true;
  } catch (e) {
    // Déjà résilié chez Stripe : c'est ce qu'on voulait.
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "resource_missing") return true;
    try {
      const sub = await stripe().subscriptions.retrieve(a.stripe_abonnement);
      return sub.status === "canceled" || sub.status === "incomplete_expired";
    } catch {
      return false;
    }
  }
}
