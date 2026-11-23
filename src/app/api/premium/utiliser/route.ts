import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { PAR_ID } from "@/lib/premium/catalogue";
import { consommer, contextePremium } from "@/lib/premium/droits";
import { lireJson, refus, SANS_CACHE } from "@/lib/premium/requete";

/**
 * Avant d'utiliser une partie limitée (un outil de L'Alambic, un examen…) : le serveur compte et
 * répond oui ou non. Le compteur vit en base, rattaché au compte de la session, jamais à l'appareil.
 */
export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const corps = await lireJson(requete, 1024);
  const fonction = typeof corps?.fonction === "string" ? corps.fonction : "";
  if (!PAR_ID.has(fonction)) return refus(400, "illisible");
  const verifie = await compteVerifie();
  // Base injoignable : on ne bloque personne à tort.
  if (verifie === "indisponible") return NextResponse.json({ ok: true }, { headers: SANS_CACHE });
  const ctx = await contextePremium(verifie);
  return NextResponse.json(await consommer(ctx, fonction, typeof corps?.element === "string" ? corps.element : ""), { headers: SANS_CACHE });
}
