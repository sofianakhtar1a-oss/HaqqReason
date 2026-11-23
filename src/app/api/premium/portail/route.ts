import { NextResponse, type NextRequest } from "next/server";
import { origineDe } from "@/lib/compte/google";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { lireAbonnement } from "@/lib/premium/abonnements";
import { refus, SANS_CACHE, tropDeDemandes } from "@/lib/premium/requete";
import { erreurStripe, portailStripe, stripe, stripeConfigure } from "@/lib/premium/stripe";

/** L'espace d'abonnement chez Stripe : changer de carte, télécharger ses factures, résilier. */
export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  if (!stripeConfigure()) return refus(409, "fermee");
  if (tropDeDemandes(`portail:${compte.id}`, 20, 3_600_000)) return refus(429, "trop");
  const a = await lireAbonnement(compte.id);
  if (a === "indisponible") return refus(503, "indisponible");
  if (!a?.stripe_client) return refus(404, "aucun");
  const origine = origineDe(requete);
  try {
    const s = await stripe().billingPortal.sessions.create({ customer: a.stripe_client, return_url: `${origine}/compte`, configuration: await portailStripe(origine), locale: "fr" });
    return NextResponse.json({ url: s.url }, { headers: SANS_CACHE });
  } catch (e) {
    return refus(502, "stripe", { message: erreurStripe(e) });
  }
}
