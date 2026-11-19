import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { activerDouble } from "@/lib/monde/serveur";

/* POST : dix minutes d'XP double, une fois par jour (migration 018). */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const r = await activerDouble(compte.id);
  if ("erreur" in r && r.erreur === "deja") return NextResponse.json(r, { status: 409, headers: SANS_CACHE });
  if ("erreur" in r) return refus(503, r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}
