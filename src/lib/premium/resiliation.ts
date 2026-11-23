import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { journaliser } from "@/lib/audit";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { lireAbonnement, statutActif, synchroniserAbonnement } from "./abonnements";
import { refus, SANS_CACHE, tropDeDemandes } from "./requete";
import { erreurStripe, stripe, stripeConfigure } from "./stripe";

/**
 * Résilier, ou annuler une résiliation. L'accès reste jusqu'à la fin de la période déjà payée,
 * puis plus rien n'est prélevé. Stripe confirme, puis le site recopie son état.
 */
export async function changer(requete: NextRequest, resilier: boolean) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  if (!stripeConfigure()) return refus(409, "fermee");
  if (tropDeDemandes(`resilier:${compte.id}`, 20, 3_600_000)) return refus(429, "trop");
  const a = await lireAbonnement(compte.id);
  if (a === "indisponible") return refus(503, "indisponible");
  if (!a?.stripe_abonnement || !statutActif(a.statut)) return refus(404, "aucun");
  try {
    const avant = await stripe().subscriptions.retrieve(a.stripe_abonnement);
    // Reprendre : on efface la résiliation sous la forme où elle a été posée (ici ou dans l'espace Stripe).
    const params = resilier ? { cancel_at_period_end: true } : avant.cancel_at_period_end ? { cancel_at_period_end: false } : { cancel_at: "" as const };
    const sub = await stripe().subscriptions.update(a.stripe_abonnement, params);
    await synchroniserAbonnement(sub.id, compte.id);
    const fin = sub.items.data[0]?.current_period_end ?? null;
    await journaliser(resilier ? "premium.resiliation" : "premium.reprise", {});
    return NextResponse.json({ ok: true, fin: fin ? new Date(fin * 1000).toISOString() : null, le: new Date().toISOString() }, { headers: SANS_CACHE });
  } catch (e) {
    return refus(502, "stripe", { message: erreurStripe(e) });
  }
}
