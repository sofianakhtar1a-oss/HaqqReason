import { NextResponse } from "next/server";
import { erreur, garder, reponseErreur, SANS_CACHE } from "@/lib/alambic/serveur/garde";
import { vecteurs } from "@/lib/alambic/serveur/gemini";

/* Vecteurs de sens pour la recherche hybride du Carnet (100 textes au plus par appel). */

export const maxDuration = 60;

export async function POST(requete: Request) {
  const refus = await garder(requete, "vecteurs");
  if (refus) return refus;
  let corps: { textes?: unknown; type?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return erreur("Demande illisible.", 400);
  }
  const textes = Array.isArray(corps.textes) ? corps.textes.map((t) => String(t ?? "")).filter(Boolean) : [];
  if (!textes.length || textes.length > 100) return erreur("Entre 1 et 100 textes.", 400);
  try {
    const v = await vecteurs(textes, corps.type === "requete" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT", requete.signal);
    return NextResponse.json({ vecteurs: v }, { headers: SANS_CACHE });
  } catch (e) {
    return reponseErreur(e);
  }
}
