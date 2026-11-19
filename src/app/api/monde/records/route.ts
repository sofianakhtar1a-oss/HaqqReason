import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { envoyerRecord, lireRecords, type ModeRecord } from "@/lib/monde/serveur";

/*
 * Les records en ligne de l'éclair, du sans-faute et du marathon (migration 018).
 *   GET  ?mode=eclair      le tableau (seuls les comptes qui ont rejoint le classement y figurent)
 *   POST { mode, score }   un score, gardé s'il bat le précédent (avec un plafond par mode)
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const MODES: ModeRecord[] = ["eclair", "survie", "marathon"];

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const mode = requete.nextUrl.searchParams.get("mode") as ModeRecord;
  if (!MODES.includes(mode)) return refus(400, "illisible");
  const r = await lireRecords(compte.id, mode);
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
  const mode = o.mode as ModeRecord;
  const score = Number(o.score);
  if (!MODES.includes(mode) || !Number.isInteger(score) || score < 0 || score > 5000) return refus(400, "illisible");
  const r = await envoyerRecord(compte.id, mode, score);
  if ("erreur" in r) return refus(r.erreur === "illisible" ? 400 : 503, r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}
