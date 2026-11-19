import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { choisirClassement } from "@/lib/langues/classement-serveur";
import { lireClassement, type PeriodeClassement } from "@/lib/monde/serveur";

/*
 * Le classement du Portulan.
 *   GET  ?periode=jour|semaine|toujours|trophees : les 50 premiers et la place du compte connecté.
 *   POST { visible: true|false } : rejoindre ou quitter les classements (le même choix que le vocabulaire).
 * Réservé aux comptes connectés ; les noms montrés sont réduits au prénom et à l'initiale.
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const PERIODES: PeriodeClassement[] = ["jour", "semaine", "toujours", "trophees"];

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const demandee = requete.nextUrl.searchParams.get("periode") as PeriodeClassement;
  const c = await lireClassement(compte.id, PERIODES.includes(demandee) ? demandee : "semaine");
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
