import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { lireReponse } from "@/lib/monde/points";
import { enregistrerReponses } from "@/lib/monde/serveur";

/*
 * POST { reponses: [{ type, cible, reponse, nb }, …] } (12 au plus)
 * Le navigateur envoie ses réponses, jamais de l'XP : le serveur les juge avec ses propres
 * données (lib/monde/quiz.ts → juger) et la base compte l'XP (migration 017).
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  let corps: { reponses?: unknown };
  try {
    corps = (await requete.json()) as { reponses?: unknown };
  } catch {
    return refus(400, "illisible");
  }
  if (!Array.isArray(corps.reponses) || corps.reponses.length < 1 || corps.reponses.length > 12) return refus(400, "illisible");
  const lues = corps.reponses.map(lireReponse).filter((r) => r !== null);
  if (!lues.length) return refus(400, "illisible");
  const r = await enregistrerReponses(compte.id, lues);
  if ("erreur" in r) return refus(r.erreur === "trop_vite" ? 429 : r.erreur === "illisible" ? 400 : 503, r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}
