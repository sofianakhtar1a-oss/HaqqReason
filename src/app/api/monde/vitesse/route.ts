import { NextResponse, type NextRequest } from "next/server";
import { memeOrigine } from "@/lib/compte/session";
import { noterVitesse } from "@/lib/monde/atelier";
import { estMesureVitesse } from "@/lib/monde/edition";

/*
 * POST [{ mesure, valeur }, …] (navigator.sendBeacon) : la vitesse réelle du Portulan, mesurée
 * dans les navigateurs (Web Vitals). Rien n'identifie le joueur : la base ne garde que des
 * comptes par seau et par jour (migration 019).
 */

const BORNES = { LCP: 120_000, FCP: 120_000, TTFB: 120_000, INP: 60_000, CLS: 50 } as const;

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return new NextResponse(null, { status: 403 });
  let corps: unknown;
  try {
    corps = JSON.parse(await requete.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const liste = (Array.isArray(corps) ? corps : [corps]).slice(0, 6) as { mesure?: unknown; valeur?: unknown }[];
  await Promise.allSettled(
    liste.map((m) => {
      const v = Number(m?.valeur);
      if (!estMesureVitesse(m?.mesure) || !Number.isFinite(v) || v < 0 || v > BORNES[m.mesure]) return Promise.resolve();
      return noterVitesse(m.mesure, v);
    }),
  );
  return new NextResponse(null, { status: 204 });
}
