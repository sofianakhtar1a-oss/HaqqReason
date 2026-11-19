import { NextResponse } from "next/server";
import { egaliteSure } from "@/lib/crypto";
import { mettreAJourPopulations } from "@/lib/monde/atelier";

/*
 * La population de chaque pays, relue à la Banque mondiale : déclenchée par Vercel Cron (voir
 * vercel.json), qui envoie « Authorization: Bearer <CRON_SECRET> ». Sans ce secret, rien ne se
 * passe. La mise à jour elle-même ne fait rien si la précédente a moins de trente jours.
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 16) return NextResponse.json({ ok: false, raison: "CRON_SECRET non configuré" }, { status: 503 });
  if (!egaliteSure(request.headers.get("authorization") ?? "", `Bearer ${secret}`)) return NextResponse.json({ ok: false }, { status: 401 });
  try {
    const r = await mettreAJourPopulations(false);
    return NextResponse.json({ ok: true, ...r }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return NextResponse.json({ ok: false, erreur: e instanceof Error ? e.message : "échec" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
