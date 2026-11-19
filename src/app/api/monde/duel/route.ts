import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import type { ModeJeu } from "@/lib/monde/categories";
import { creerDuel, duelAuHasard, lireDuel, quitterDuel, rejoindreDuel, repondreDuel } from "@/lib/monde/serveur";

/*
 * Les duels du Portulan, entre deux comptes.
 *   GET  ?id=… : l'état du duel (le navigateur le relit chaque seconde pendant la partie).
 *   POST { action: "creer", mode }              un duel entre amis (un code à partager)
 *        { action: "hasard", mode }             un adversaire au hasard (ou on attend le suivant)
 *        { action: "rejoindre", code }
 *        { action: "repondre", id, index, reponse, ms }
 *        { action: "quitter", id }
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const MODES: ModeJeu[] = ["drapeaux", "capitales", "cartes", "continents", "monnaies", "melange"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const statut = (e: string) => (e === "trop_vite" ? 429 : e === "illisible" ? 400 : e === "introuvable" ? 404 : e === "ferme" ? 409 : 503);

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const id = requete.nextUrl.searchParams.get("id") ?? "";
  if (!UUID.test(id)) return refus(400, "illisible");
  const r = await lireDuel(compte.id, id);
  if ("erreur" in r) return refus(statut(r.erreur), r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  let o: Record<string, unknown>;
  try {
    o = (await requete.json()) as Record<string, unknown>;
  } catch {
    return refus(400, "illisible");
  }
  const mode = MODES.includes(o.mode as ModeJeu) ? (o.mode as ModeJeu) : null;
  const id = typeof o.id === "string" && UUID.test(o.id) ? o.id : null;
  let r;
  switch (o.action) {
    case "creer":
      if (!mode) return refus(400, "illisible");
      r = await creerDuel(compte.id, mode);
      break;
    case "hasard":
      if (!mode) return refus(400, "illisible");
      r = await duelAuHasard(compte.id, mode);
      break;
    case "rejoindre":
      if (typeof o.code !== "string" || !/^[A-Za-z2-9]{6}$/.test(o.code)) return refus(400, "illisible");
      r = await rejoindreDuel(compte.id, o.code);
      break;
    case "repondre": {
      const index = Number(o.index);
      if (!id || !Number.isInteger(index) || index < 0 || index > 9 || typeof o.reponse !== "string" || o.reponse.length > 120) return refus(400, "illisible");
      const ms = Number.isFinite(Number(o.ms)) ? Math.max(0, Math.min(60_000, Number(o.ms))) : 15_000;
      r = await repondreDuel(compte.id, id, index, o.reponse, ms);
      break;
    }
    case "quitter":
      if (!id) return refus(400, "illisible");
      r = await quitterDuel(compte.id, id);
      break;
    default:
      return refus(400, "illisible");
  }
  if ("erreur" in r) return refus(statut(r.erreur), r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}
