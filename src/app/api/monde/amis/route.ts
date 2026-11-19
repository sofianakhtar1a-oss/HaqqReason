import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { ajouterAmi, lireAmis, monCodeAmi, repondreAmi, retirerAmi } from "@/lib/monde/social";

/*
 * Les amis du Portulan.
 *   GET : mon code d'ami, mes amis (avec nos duels gagnés, perdus, nuls), les demandes reçues et envoyées.
 *   POST { action: "code" }                 créer mon code d'ami (huit caractères)
 *        { action: "ajouter", code }        demander quelqu'un en ami (ou accepter, s'il me l'avait demandé)
 *        { action: "repondre", id, accepte }
 *        { action: "retirer", id }
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const statut = (e: string) => (e === "trop_vite" ? 429 : e === "illisible" || e === "soi" || e === "trop" ? 400 : e === "introuvable" ? 404 : e === "code_pris" ? 409 : 503);

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
  const r = await lireAmis(c.id);
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
    case "code":
      r = await monCodeAmi(c.id);
      break;
    case "ajouter":
      if (typeof o.code !== "string" || !/^[A-Za-z2-9]{8}$/.test(o.code)) return refus(400, "illisible");
      r = await ajouterAmi(c.id, o.code);
      break;
    case "repondre":
      if (!id || typeof o.accepte !== "boolean") return refus(400, "illisible");
      r = await repondreAmi(c.id, id, o.accepte);
      break;
    case "retirer":
      if (!id) return refus(400, "illisible");
      r = await retirerAmi(c.id, id);
      break;
    default:
      return refus(400, "illisible");
  }
  if ("erreur" in r) return refus(statut(r.erreur), r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}
