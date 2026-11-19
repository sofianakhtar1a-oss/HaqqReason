import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import type { ModeJeu } from "@/lib/monde/categories";
import { NOMBRES_SALON, TAILLE_SALON } from "@/lib/monde/duels";
import { creerSalon, lancerSalon, lireSalon, quitterSalon, rejoindreSalon, repondreSalon } from "@/lib/monde/social";

/*
 * Les salons du Portulan : de trois à huit joueurs sur les mêmes questions, en classique ou à élimination.
 *   GET  ?id=… : l'état du salon (relu chaque seconde).
 *   POST { action: "creer", mode, formule, nombre, taille }
 *        { action: "rejoindre", code }
 *        { action: "lancer", id }          (l'hôte, à trois joueurs au moins)
 *        { action: "repondre", id, index, reponse, ms }
 *        { action: "quitter", id }
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const MODES: ModeJeu[] = ["drapeaux", "capitales", "cartes", "continents", "monnaies", "melange"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const statut = (e: string) => (e === "trop_vite" ? 429 : e === "illisible" ? 400 : e === "introuvable" ? 404 : e === "ferme" || e === "complet" || e === "pas_assez" || e === "code_pris" ? 409 : 503);

async function compte(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const c = await compteVerifie();
  if (c === "indisponible") return refus(503, "indisponible");
  if (!c) return refus(401, "deconnecte");
  return c;
}

export async function GET(requete: NextRequest) {
  const c = await compte(requete);
  if (c instanceof NextResponse) return c;
  const id = requete.nextUrl.searchParams.get("id") ?? "";
  if (!UUID.test(id)) return refus(400, "illisible");
  const r = await lireSalon(c.id, id);
  if ("erreur" in r) return refus(statut(r.erreur), r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest) {
  const c = await compte(requete);
  if (c instanceof NextResponse) return c;
  let o: Record<string, unknown>;
  try {
    o = (await requete.json()) as Record<string, unknown>;
  } catch {
    return refus(400, "illisible");
  }
  const id = typeof o.id === "string" && UUID.test(o.id) ? o.id : null;
  let r;
  switch (o.action) {
    case "creer": {
      const mode = MODES.includes(o.mode as ModeJeu) ? (o.mode as ModeJeu) : null;
      const formule = o.formule === "elimination" ? "elimination" : o.formule === "classique" ? "classique" : null;
      const nombre = NOMBRES_SALON.includes(o.nombre as never) ? (o.nombre as number) : null;
      const taille = Number.isInteger(o.taille) && (o.taille as number) >= TAILLE_SALON.min && (o.taille as number) <= TAILLE_SALON.max ? (o.taille as number) : null;
      if (!mode || !formule || !nombre || !taille) return refus(400, "illisible");
      r = await creerSalon(c.id, { mode, formule, nombre, taille });
      break;
    }
    case "rejoindre":
      if (typeof o.code !== "string" || !/^[A-Za-z2-9]{6}$/.test(o.code)) return refus(400, "illisible");
      r = await rejoindreSalon(c.id, o.code);
      break;
    case "lancer":
      if (!id) return refus(400, "illisible");
      r = await lancerSalon(c.id, id);
      break;
    case "repondre": {
      const index = Number(o.index);
      if (!id || !Number.isInteger(index) || index < 0 || index > 14 || typeof o.reponse !== "string" || o.reponse.length > 120) return refus(400, "illisible");
      const ms = Number.isFinite(Number(o.ms)) ? Math.max(0, Math.min(60_000, Number(o.ms))) : 15_000;
      r = await repondreSalon(c.id, id, index, o.reponse, ms);
      break;
    }
    case "quitter":
      if (!id) return refus(400, "illisible");
      r = await quitterSalon(c.id, id);
      break;
    default:
      return refus(400, "illisible");
  }
  if ("erreur" in r) return refus(statut(r.erreur), r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}
