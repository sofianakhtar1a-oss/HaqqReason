import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { choisirClassement, lireClassement } from "@/lib/langues/classement-serveur";

/*
 * Le classement du vocabulaire.
 *   GET  ?periode=semaine|toujours : les 10 premiers et la place du compte connecté.
 *   POST { visible: true|false }  : rejoindre ou quitter le classement.
 * Réservé aux comptes connectés ; les noms montrés sont réduits au prénom et à l'initiale.
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const periode = requete.nextUrl.searchParams.get("periode") === "toujours" ? "toujours" : "semaine";
  const c = await lireClassement(compte.id, periode);
  if (!c) return refus(503, "indisponible");
  return NextResponse.json(c, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  let corps: { visible?: unknown };
  try {
    corps = (await requete.json()) as { visible?: unknown };
  } catch {
    return refus(400, "illisible");
  }
  if (typeof corps.visible !== "boolean") return refus(400, "illisible");
  if (!(await choisirClassement(compte.id, corps.visible))) return refus(503, "indisponible");
  return NextResponse.json({ ok: true, visible: corps.visible }, { headers: SANS_CACHE });
}
