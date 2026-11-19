import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import type { SorteDefi } from "@/lib/monde/defis";
import { envoyerDefi, lireDefi } from "@/lib/monde/serveur";

/*
 * Le défi du jour et le défi de la semaine (migration 018).
 *   GET  ?sorte=jour                    le classement du défi en cours
 *   POST { sorte, cle, reponses: [...], ms } les réponses, jugées ici ; une seule tentative
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const SORTES: SorteDefi[] = ["jour", "semaine"];

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const sorte = requete.nextUrl.searchParams.get("sorte") as SorteDefi;
  if (!SORTES.includes(sorte)) return refus(400, "illisible");
  const r = await lireDefi(compte.id, sorte);
  if (!r) return refus(503, "indisponible");
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
  const sorte = o.sorte as SorteDefi;
  const reponses = o.reponses;
  if (!SORTES.includes(sorte) || !Array.isArray(reponses) || reponses.length > 30 || reponses.some((x) => typeof x !== "string" || x.length > 120)) return refus(400, "illisible");
  const ms = Number.isFinite(Number(o.ms)) ? Math.max(0, Math.min(3_600_000, Number(o.ms))) : 0;
  if (typeof o.cle !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.cle)) return refus(400, "illisible");
  const r = await envoyerDefi(compte.id, sorte, o.cle, reponses as string[], ms);
  if ("erreur" in r) return refus(r.erreur === "illisible" ? 400 : 503, r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}
