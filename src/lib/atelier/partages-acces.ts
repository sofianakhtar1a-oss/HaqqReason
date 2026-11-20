import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import type { MetaPartage, MonRole } from "./partage-commun";
import { lireMeta, roleDe } from "./partages";

export const SANS_CACHE = { "Cache-Control": "private, no-store" };
export const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

/** Le compte connecté (ou la réponse de refus). */
export async function compteOuRefus(requete: NextRequest): Promise<{ id: string } | NextResponse> {
  if (!memeOrigine(requete)) return refus(403, "Requête refusée.");
  const c = await compteVerifie();
  if (c === "indisponible") return refus(503, "Le serveur ne répond pas : réessaie dans un instant.");
  if (!c) return refus(401, "Connecte-toi pour partager.");
  return { id: c.id };
}

/** Le compte, le document partagé et mon rôle ; refus si je n'en suis pas. */
export async function acces(requete: NextRequest, id: string): Promise<{ compte: string; meta: MetaPartage; role: MonRole } | NextResponse> {
  const c = await compteOuRefus(requete);
  if (c instanceof NextResponse) return c;
  const meta = await lireMeta(id);
  if (!meta) return refus(404, "Ce partage n'existe plus.");
  const role = roleDe(meta, c.id);
  if (!role) return refus(403, "Ce document n'est pas partagé avec toi.");
  return { compte: c.id, meta, role };
}
