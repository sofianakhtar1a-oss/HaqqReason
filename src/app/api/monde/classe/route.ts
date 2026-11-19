import { NextResponse, type NextRequest } from "next/server";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { creerClasse, lireClasse, mesClasses, quitterClasse, rejoindreClasse } from "@/lib/monde/social";

/*
 * Les classes du Portulan : un enseignant crée une classe, ses élèves la rejoignent avec un code,
 * il suit leurs progrès.
 *   GET            : mes classes (celles que j'anime, celles que je suis)
 *   GET  ?id=…     : une classe
 *   POST { action: "creer", nom }
 *        { action: "rejoindre", code }
 *        { action: "quitter", id, membre? }   (l'élève part ; l'enseignant retire un élève, ou ferme la classe)
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const statut = (e: string) => (e === "trop_vite" ? 429 : e === "illisible" || e === "trop" ? 400 : e === "introuvable" ? 404 : e === "complet" || e === "code_pris" ? 409 : 503);

async function compte(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const c = await compteVerifie();
  if (c === "indisponible") return refus(503, "indisponible");
  if (!c) return refus(401, "deconnecte");
  return c;
}

export async function GET(requete: NextRequest) {
  const c = await compte(requete);
  if (c instanceof NextResponse) return c;
  const id = requete.nextUrl.searchParams.get("id");
  if (id !== null && !UUID.test(id)) return refus(400, "illisible");
  const r = id ? await lireClasse(c.id, id) : await mesClasses(c.id);
  if ("erreur" in r) return refus(statut(r.erreur), r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest) {
  const c = await compte(requete);
  if (c instanceof NextResponse) return c;
  let o: Record<string, unknown>;
  try {
    o = (await requete.json()) as Record<string, unknown>;
  } catch {
    return refus(400, "illisible");
  }
  const id = typeof o.id === "string" && UUID.test(o.id) ? o.id : null;
  let r;
  switch (o.action) {
    case "creer":
      if (typeof o.nom !== "string" || o.nom.trim().length < 2 || o.nom.trim().length > 60) return refus(400, "illisible");
      r = await creerClasse(c.id, o.nom.trim());
      break;
    case "rejoindre":
      if (typeof o.code !== "string" || !/^[A-Za-z2-9]{6}$/.test(o.code)) return refus(400, "illisible");
      r = await rejoindreClasse(c.id, o.code);
      break;
    case "quitter": {
      const membre = typeof o.membre === "string" && UUID.test(o.membre) ? o.membre : null;
      if (!id) return refus(400, "illisible");
      r = await quitterClasse(c.id, id, membre);
      break;
    }
    default:
      return refus(400, "illisible");
  }
  if ("erreur" in r) return refus(statut(r.erreur), r.erreur);
  return NextResponse.json(r, { headers: SANS_CACHE });
}
