import { NextResponse, type NextRequest } from "next/server";
import { listerModelesPublies, publierModele, retirerModele } from "@/lib/atelier/modeles-publies";
import { googleConfigure } from "@/lib/compte/jeton";
import { compteCourant, memeOrigine } from "@/lib/compte/session";
import { porteJetonCreateur, sessionCreateur } from "@/lib/session";

/*
 * Les modèles publiés par le créateur pour l'atelier d'écriture.
 *   GET    : la liste (pour toute personne qui a accès au Calame) ; « createur » dit si on peut publier.
 *   POST   : publier un modèle (créateur seulement).
 *   DELETE ?id= : retirer un modèle (créateur seulement).
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "Requête refusée.");
  const createur = (await sessionCreateur()) !== null;
  if (!createur && googleConfigure() && !(await compteCourant()) && !(await porteJetonCreateur())) return refus(401, "Connecte-toi pour voir les modèles.");
  try {
    return NextResponse.json({ modeles: await listerModelesPublies(), createur }, { headers: SANS_CACHE });
  } catch {
    return NextResponse.json({ modeles: [], createur }, { headers: SANS_CACHE });
  }
}

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "Requête refusée.");
  if (!(await sessionCreateur())) return refus(403, "Seul le créateur publie des modèles.");
  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return refus(400, "Modèle illisible.");
  }
  const id = await publierModele(corps);
  if (id === "invalide") return refus(400, "Ce modèle n'a pas pu être publié : il lui faut un titre, et il ne doit pas dépasser 600 Ko.");
  if (!id) return refus(503, "Le stockage n'a pas répondu : réessaie dans un instant.");
  return NextResponse.json({ id }, { headers: SANS_CACHE });
}

export async function DELETE(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "Requête refusée.");
  if (!(await sessionCreateur())) return refus(403, "Seul le créateur retire des modèles.");
  const ok = await retirerModele(requete.nextUrl.searchParams.get("id") ?? "");
  return ok ? NextResponse.json({ ok }, { headers: SANS_CACHE }) : refus(400, "Ce modèle n'a pas pu être retiré.");
}
