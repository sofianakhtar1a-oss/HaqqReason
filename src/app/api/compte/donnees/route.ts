import { NextResponse, type NextRequest } from "next/server";
import { ecrireDonnees, lireDonnees, nettoyerEcritures } from "@/lib/compte/donnees";
import { LOT_MAX } from "@/lib/compte/limites";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";

/*
 * Les données personnelles d'un compte, entre ses appareils.
 *   GET  ?depuis=N : ce qui a changé depuis le numéro d'ordre N.
 *   POST { ecritures } : ce que cet appareil a modifié ; la modification la plus récente l'emporte.
 * Tout est rattaché au compte de la session : un appareil ne peut ni lire ni écrire pour un autre compte.
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const depuis = Number(requete.nextUrl.searchParams.get("depuis") ?? "0");
  const lu = await lireDonnees(compte.id, Number.isFinite(depuis) && depuis > 0 ? Math.floor(depuis) : 0);
  if (!lu) return refus(503, "indisponible");
  return NextResponse.json(lu, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  let corps: { ecritures?: unknown };
  try {
    corps = (await requete.json()) as { ecritures?: unknown };
  } catch {
    return refus(400, "illisible");
  }
  if (!Array.isArray(corps.ecritures) || corps.ecritures.length > LOT_MAX) return refus(400, "illisible");
  const { valides, tropLourdes } = nettoyerEcritures(corps.ecritures);
  const ecrit = await ecrireDonnees(compte.id, valides);
  if (!ecrit) return refus(503, "indisponible");
  return NextResponse.json({ ok: true, refusees: [...ecrit.refusees, ...tropLourdes] }, { headers: SANS_CACHE });
}
