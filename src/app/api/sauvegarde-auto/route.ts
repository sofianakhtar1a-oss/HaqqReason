import { NextResponse } from "next/server";
import { egaliteSure } from "@/lib/crypto";
import { sauvegarderMaintenant } from "@/lib/sauvegarde-auto";

/*
 * Sauvegarde quotidienne, déclenchée par Vercel Cron (voir vercel.json).
 * Vercel envoie automatiquement « Authorization: Bearer <CRON_SECRET> » : sans ce secret, rien ne se passe.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 16) return NextResponse.json({ ok: false, raison: "CRON_SECRET non configuré" }, { status: 503 });
  const recu = request.headers.get("authorization") ?? "";
  if (!egaliteSure(recu, `Bearer ${secret}`)) return NextResponse.json({ ok: false }, { status: 401 });
  const r = await sauvegarderMaintenant("automatique");
  return NextResponse.json({ ok: r.ok, nom: r.nom, taille: r.taille }, { status: r.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
