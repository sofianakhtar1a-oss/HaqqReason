import { NextResponse, type NextRequest } from "next/server";
import { historique } from "@/lib/atelier/partages";
import { SANS_CACHE, acces } from "@/lib/atelier/partages-acces";

/* Qui a changé quoi, et quand : les derniers lots de changements d'un document partagé. */
type Contexte = { params: Promise<{ id: string }> };

export async function GET(requete: NextRequest, { params }: Contexte) {
  const a = await acces(requete, (await params).id);
  if (a instanceof NextResponse) return a;
  return NextResponse.json({ lignes: await historique(a.meta.id) }, { headers: SANS_CACHE });
}
