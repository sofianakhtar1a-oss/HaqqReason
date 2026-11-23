import { NextResponse, type NextRequest } from "next/server";
import { memeOrigine } from "@/lib/compte/session";
import { contextePremium, droitsPublics } from "@/lib/premium/droits";
import { refus, SANS_CACHE } from "@/lib/premium/requete";

/** Ce que la personne connectée peut ouvrir, et ce qu'il lui reste d'essais gratuits. */
export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const ctx = await contextePremium();
  return NextResponse.json(await droitsPublics(ctx), { headers: SANS_CACHE });
}
