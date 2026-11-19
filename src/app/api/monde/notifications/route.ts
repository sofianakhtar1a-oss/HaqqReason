import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { abonner, clePubliqueVapid, desabonner } from "@/lib/monde/notifications";

/*
 * Les notifications du téléphone (Web Push).
 *   GET : la clé publique du site (null : les notifications ne sont pas encore ouvertes).
 *   POST { action: "abonner", endpoint, cles: { p256dh, auth } }
 *        { action: "desabonner", endpoint }
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  return NextResponse.json({ cle: clePubliqueVapid() }, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const c = await compteVerifie();
  if (c === "indisponible") return refus(503, "indisponible");
  if (!c) return refus(401, "deconnecte");
  let o: Record<string, unknown>;
  try {
    o = (await requete.json()) as Record<string, unknown>;
  } catch {
    return refus(400, "illisible");
  }
  const endpoint = typeof o.endpoint === "string" && /^https:\/\/[^\s]{10,1000}$/.test(o.endpoint) ? o.endpoint : null;
  if (!endpoint) return refus(400, "illisible");
  if (o.action === "desabonner") {
    const r = await desabonner(c.id, endpoint);
    return "erreur" in r ? refus(503, r.erreur) : NextResponse.json(r, { headers: SANS_CACHE });
  }
  if (o.action !== "abonner") return refus(400, "illisible");
  const cles = o.cles as { p256dh?: unknown; auth?: unknown } | undefined;
  if (!cles || typeof cles.p256dh !== "string" || typeof cles.auth !== "string" || cles.p256dh.length > 200 || cles.auth.length > 100) return refus(400, "illisible");
  const r = await abonner(c.id, endpoint, { p256dh: cles.p256dh, auth: cles.auth });
  return "erreur" in r ? refus(r.erreur === "illisible" ? 400 : 503, r.erreur) : NextResponse.json(r, { headers: SANS_CACHE });
}
