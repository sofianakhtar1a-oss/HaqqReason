import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { enregistrerReponses } from "@/lib/langues/classement-serveur";
import { lireReponse } from "@/lib/langues/points";

/*
 * POST { reponses: [{ mot, exercice, sens?, reponse?, resultat?, indices? }, …] } (6 au plus)
 * Le navigateur envoie ses réponses, jamais des points : le serveur les juge avec ses propres
 * données (lib/langues/points.ts → evaluer) et la base compte les points (migration 015).
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
  if (!Array.isArray(corps.reponses) || corps.reponses.length < 1 || corps.reponses.length > 6) return refus(400, "illisible");
  const lues = corps.reponses.map(lireReponse).filter((r) => r !== null);
  if (!lues.length) return refus(400, "illisible");
  const r = await enregistrerReponses(compte.id, lues);
  if ("erreur" in r) {
    // Des mots que le serveur ne juge pas (dictionnaire personnel) : rien à compter, ce n'est pas une erreur.
    if (r.erreur === "aucune") return NextResponse.json({ ignore: true }, { headers: SANS_CACHE });
    return refus(r.erreur === "trop_vite" ? 429 : r.erreur === "illisible" ? 400 : 503, r.erreur);
  }
  return NextResponse.json(r, { headers: SANS_CACHE });
}
