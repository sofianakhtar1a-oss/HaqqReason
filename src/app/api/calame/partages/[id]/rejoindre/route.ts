import { NextResponse, type NextRequest } from "next/server";
import { rejoindreParInvitation, valideId } from "@/lib/atelier/partages";
import { SANS_CACHE, compteOuRefus, refus } from "@/lib/atelier/partages-acces";

/* Rejoindre un document partagé par son lien d'invitation : POST { jeton }. */
type Contexte = { params: Promise<{ id: string }> };

export async function POST(requete: NextRequest, { params }: Contexte) {
  const c = await compteOuRefus(requete);
  if (c instanceof NextResponse) return c;
  const { id } = await params;
  if (!valideId(id)) return refus(400, "Lien illisible.");
  let jeton = "";
  try {
    jeton = String(((await requete.json()) as { jeton?: unknown }).jeton ?? "");
  } catch {
    /* corps illisible */
  }
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(jeton)) return refus(400, "Lien illisible.");
  const r = await rejoindreParInvitation(id, c.id, jeton);
  return "erreur" in r ? refus(403, r.erreur) : NextResponse.json(r, { headers: SANS_CACHE });
}
