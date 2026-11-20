import { NextResponse, type NextRequest } from "next/server";
import { LIMITES_PARTAGE, couleurDe } from "@/lib/atelier/partage-commun";
import { ajouterLot, changementsDepuis, peutEcrire, presences } from "@/lib/atelier/partages";
import { SANS_CACHE, acces, refus } from "@/lib/atelier/partages-acces";

/*
 * Écrire à plusieurs : les changements d'un document partagé.
 *   GET ?depuis=V[&de=&a=&client=]  les changements reçus depuis la version V (et les curseurs des autres ;
 *                                   avec de/a/client, mon curseur est rangé au passage) ;
 *   POST { version, pas, client }   mes changements, faits à partir de la version donnée. S'ils ne partent pas
 *                                   de la dernière version : { conflit: true }, il faut d'abord reprendre ceux des autres.
 */
type Contexte = { params: Promise<{ id: string }> };

export async function GET(requete: NextRequest, { params }: Contexte) {
  const a = await acces(requete, (await params).id);
  if (a instanceof NextResponse) return a;
  const q = requete.nextUrl.searchParams;
  const depuis = Number(q.get("depuis"));
  if (!Number.isInteger(depuis) || depuis < 0) return refus(400, "Version illisible.");
  const de = Number(q.get("de"));
  const fin = Number(q.get("a"));
  const client = Number(q.get("client"));
  const ici =
    q.has("de") && q.has("a") && Number.isInteger(de) && Number.isInteger(fin) && Number.isInteger(client)
      ? { compte: a.compte, nom: a.role === "proprietaire" ? a.meta.nomProprietaire : (a.meta.membres.find((m) => m.compte === a.compte)?.nom ?? "Un auteur"), couleur: couleurDe(a.compte), client, de, a: fin, quand: Date.now() }
      : null;
  const [suite, curseurs] = await Promise.all([changementsDepuis(a.meta.id, depuis), presences(a.meta.id, ici)]);
  if ("recharger" in suite) return NextResponse.json({ recharger: true }, { headers: SANS_CACHE });
  // Le rôle et les membres voyagent aussi : un changement du propriétaire se voit sans rouvrir le document.
  return NextResponse.json({ ...suite, presences: curseurs.filter((p) => p.compte !== a.compte || p.client !== client), maj: a.meta.maj, role: a.role, meta: a.meta }, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest, { params }: Contexte) {
  const a = await acces(requete, (await params).id);
  if (a instanceof NextResponse) return a;
  if (!peutEcrire(a.role)) return refus(403, "Ce document t'est partagé en lecture seule.");
  const brut = await requete.text();
  if (brut.length > LIMITES_PARTAGE.poidsEnvoi) return refus(413, "Trop de changements d'un coup.");
  let o: { version?: unknown; pas?: unknown; client?: unknown };
  try {
    o = JSON.parse(brut) as typeof o;
  } catch {
    return refus(400, "Envoi illisible.");
  }
  const version = Number(o.version);
  const client = Number(o.client);
  if (!Number.isInteger(version) || version < 0 || !Number.isInteger(client) || !Array.isArray(o.pas) || o.pas.length === 0 || o.pas.length > LIMITES_PARTAGE.pasParEnvoi) return refus(400, "Envoi illisible.");
  if (!o.pas.every((p) => p && typeof p === "object" && typeof (p as { stepType?: unknown }).stepType === "string")) return refus(400, "Changements illisibles.");
  const r = await ajouterLot(a.meta, a.compte, version, o.pas, o.pas.map(() => client));
  if ("erreur" in r) return refus(503, r.erreur);
  // D'autres ont écrit avant : rien d'anormal, l'appareil reprend leurs changements puis renvoie les siens.
  if ("conflit" in r) return NextResponse.json({ conflit: true, version: r.conflit }, { headers: SANS_CACHE });
  return NextResponse.json({ version: r.version }, { headers: SANS_CACHE });
}
