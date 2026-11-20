import { NextResponse, type NextRequest } from "next/server";
import { LIMITES_PARTAGE } from "@/lib/atelier/partage-commun";
import { classesSuivies, creerPartage, mesPartages } from "@/lib/atelier/partages";
import { SANS_CACHE, compteOuRefus, refus } from "@/lib/atelier/partages-acces";
import { lireAmis } from "@/lib/monde/social";

/*
 * Les documents partagés du Calame.
 *   GET              mes partages (par moi et avec moi) ;
 *   GET ?contacts=1  mes amis du Portulan (le carnet) et les classes que je suis ;
 *   POST { titre, contenu, reglages }  partager un document (je deviens son propriétaire).
 */
export async function GET(requete: NextRequest) {
  const c = await compteOuRefus(requete);
  if (c instanceof NextResponse) return c;
  if (requete.nextUrl.searchParams.get("contacts")) {
    const [amis, classes] = await Promise.all([lireAmis(c.id), classesSuivies(c.id)]);
    return NextResponse.json({ amis: "erreur" in amis ? null : amis.amis.map((a) => ({ id: a.id, nom: a.nom, avatar: a.avatar })), classes }, { headers: SANS_CACHE });
  }
  return NextResponse.json({ partages: await mesPartages(c.id) }, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest) {
  const c = await compteOuRefus(requete);
  if (c instanceof NextResponse) return c;
  const brut = await requete.text();
  if (brut.length > LIMITES_PARTAGE.poidsBase + 10_000) return refus(413, "Ce document est trop lourd pour être partagé (3 Mo de texte au plus).");
  let o: { titre?: unknown; contenu?: unknown; reglages?: unknown };
  try {
    o = JSON.parse(brut) as typeof o;
  } catch {
    return refus(400, "Envoi illisible.");
  }
  const contenu = o.contenu as { type?: unknown } | undefined;
  if (!contenu || contenu.type !== "doc") return refus(400, "Document illisible.");
  const r = await creerPartage(c.id, { titre: String(o.titre ?? ""), contenu, reglages: o.reglages ?? null });
  return "erreur" in r ? refus(503, r.erreur) : NextResponse.json({ meta: r, role: "proprietaire" }, { headers: SANS_CACHE });
}
