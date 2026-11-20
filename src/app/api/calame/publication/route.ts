import { NextResponse, type NextRequest } from "next/server";
import { publier, retirerPublication } from "@/lib/atelier/publications";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";

/*
 * Publier un document du Calame en page web (lecture seule), le mettre à jour, ou le retirer.
 * Il faut un compte : la publication lui appartient, et lui seul peut la retirer.
 */
const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "Requête refusée.");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "Le compte n'a pas répondu : réessaie dans un instant.");
  if (!compte) return refus(401, "Connecte-toi pour publier un document.");
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return refus(400, "Document illisible.");
  }
  const r = await publier(compte.id, (corps ?? {}) as Record<string, unknown>);
  if ("erreur" in r) return refus(400, r.erreur);
  return NextResponse.json({ id: r.id, adresse: `/lire/${r.id}` }, { headers: SANS_CACHE });
}

export async function DELETE(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "Requête refusée.");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "Le compte n'a pas répondu.");
  if (!compte) return refus(401, "Connecte-toi pour retirer une publication.");
  const ok = await retirerPublication(compte.id, requete.nextUrl.searchParams.get("id") ?? "");
  return ok ? NextResponse.json({ ok }, { headers: SANS_CACHE }) : refus(404, "Publication introuvable.");
}
