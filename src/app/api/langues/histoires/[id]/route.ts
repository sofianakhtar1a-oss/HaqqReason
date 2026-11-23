import { NextResponse, type NextRequest } from "next/server";
import { memeOrigine } from "@/lib/compte/session";
import { fonctionHistoire, lireHistoire } from "@/lib/langues/contenus";
import { consommer, contextePremium } from "@/lib/premium/droits";

/*
 * Le texte d'une histoire du Truchement. Il ne sort du serveur qu'après vérification : gratuit,
 * limité (l'histoire est alors comptée une fois par période, la rouvrir ne coûte rien) ou Premium.
 * Refus : 402, avec de quoi ouvrir la fenêtre Premium.
 */
export async function GET(requete: NextRequest, { params }: RouteContext<"/api/langues/histoires/[id]">) {
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "refuse" }, { status: 403 });
  const { id } = await params;
  const trouve = await lireHistoire(id);
  if (!trouve) return NextResponse.json({ erreur: "introuvable" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  const fonction = fonctionHistoire(trouve.niveau);
  const verdict = await consommer(await contextePremium(), fonction, id);
  if (!verdict.ok) return NextResponse.json({ erreur: "premium", fonction, ...verdict }, { status: 402, headers: { "Cache-Control": "private, no-store" } });
  // L'adresse porte la version (?v=…) : le navigateur et le service hors ligne peuvent garder ce texte-là.
  return NextResponse.json(trouve.histoire, { headers: { "Cache-Control": "private, max-age=31536000, immutable" } });
}
