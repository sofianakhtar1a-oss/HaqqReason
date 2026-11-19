import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { signaler, SUJETS_SIGNALEMENT, type SujetSignalement } from "@/lib/monde/atelier";

/*
 * POST { sujet, texte, code?, contexte? } : un joueur signale une erreur (une fiche, une question,
 * la carte, une traduction). Le créateur les lit dans son atelier. Un envoi toutes les vingt
 * secondes au plus par compte, et rien d'autre que du texte court n'est gardé.
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const derniers = new Map<string, number>();

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const avant = derniers.get(compte.id) ?? 0;
  if (Date.now() - avant < 20_000) return refus(429, "trop_vite");
  let corps: Record<string, unknown>;
  try {
    corps = (await requete.json()) as Record<string, unknown>;
  } catch {
    return refus(400, "illisible");
  }
  const sujet = SUJETS_SIGNALEMENT.includes(corps.sujet as SujetSignalement) ? (corps.sujet as SujetSignalement) : "autre";
  const texte = typeof corps.texte === "string" ? corps.texte : "";
  const code = typeof corps.code === "string" && /^[a-z0-9-]{2,12}$/.test(corps.code) ? corps.code : null;
  // Le contexte : quelques champs connus, courts (la question, la méthode, la langue de l'interface).
  const brut = corps.contexte && typeof corps.contexte === "object" ? (corps.contexte as Record<string, unknown>) : {};
  const contexte: Record<string, string> = {};
  for (const k of ["type", "question", "reponse", "langue", "ecran"]) if (typeof brut[k] === "string") contexte[k] = String(brut[k]).slice(0, 200);
  if (texte.trim().length < 3) return refus(400, "trop_court");
  const ok = await signaler({ utilisateur: compte.id, code, sujet, texte, contexte }).catch(() => false);
  if (!ok) return refus(503, "indisponible");
  derniers.set(compte.id, Date.now());
  if (derniers.size > 5000) derniers.clear();
  return NextResponse.json({ ok: true }, { headers: SANS_CACHE });
}
