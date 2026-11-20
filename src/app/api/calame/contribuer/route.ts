import { NextResponse, type NextRequest } from "next/server";
import { deposerContribution, empreinteJeton, LIMITES_CONTRIBUTION } from "@/lib/contributions/donnees";
import { googleConfigure } from "@/lib/compte/jeton";
import { compteCourant, memeOrigine } from "@/lib/compte/session";
import { infosRequete } from "@/lib/request-info";
import { porteJetonCreateur } from "@/lib/session";
import { DOSSIER_PROPOSITIONS, MARQUE_CALAME } from "@/lib/atelier/propositions";
import { ESPACE } from "@/lib/stockage";
import { dbAdmin, dbPublic } from "@/lib/supabase";

/*
 * Proposer un texte du Calame à la bibliothèque du site : il arrive dans « Contribuer », comme une
 * idée de sujet ou un argument de plus, avec son résumé. Le texte complet (document neutre, sans
 * images) est gardé à part pour le créateur, dans l'espace de stockage privé.
 *   GET  : les modules (blocs) auxquels rattacher la proposition.
 *   POST : { type, blocId, pseudo, titre, resume, contenu }.
 */
const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

async function autorise(): Promise<boolean> {
  return !googleConfigure() || Boolean(await compteCourant()) || (await porteJetonCreateur());
}

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "Requête refusée.");
  if (!(await autorise())) return refus(401, "Connecte-toi pour proposer un texte.");
  const { data } = await dbPublic().from("blocs").select("id, titre").order("ordre");
  return NextResponse.json({ blocs: data ?? [] }, { headers: SANS_CACHE });
}

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "Requête refusée.");
  if (!(await autorise())) return refus(401, "Connecte-toi pour proposer un texte.");
  let corps: Record<string, unknown>;
  try {
    corps = (await requete.json()) as Record<string, unknown>;
  } catch {
    return refus(400, "Proposition illisible.");
  }
  const type = corps.type === "argument" ? "argument" : "idee";
  const blocId = typeof corps.blocId === "string" ? corps.blocId : "";
  const { data: bloc } = await dbPublic().from("blocs").select("id").eq("id", blocId).maybeSingle();
  if (!bloc) return refus(400, "Choisis le module auquel ton texte se rattache.");
  const titre = String(corps.titre ?? "").trim().slice(0, LIMITES_CONTRIBUTION.titre);
  const pseudo = String(corps.pseudo ?? "").trim().slice(0, LIMITES_CONTRIBUTION.pseudo);
  const resume = String(corps.resume ?? "").replace(/\s+\n/g, "\n").trim();
  if (titre.length < LIMITES_CONTRIBUTION.titreMin) return refus(400, `Donne un titre d'au moins ${LIMITES_CONTRIBUTION.titreMin} caractères.`);
  const contenu = corps.contenu as { type?: string; content?: unknown[] } | undefined;
  const complet = contenu && contenu.type === "doc" && Array.isArray(contenu.content) ? JSON.stringify({ titre, contenu }) : "";
  if (complet.length > 2_000_000) return refus(400, "Ce texte est trop long pour être proposé (2 Mo au plus).");
  const marque = complet ? `\n\n${MARQUE_CALAME}` : "";
  const texte = `${resume.slice(0, LIMITES_CONTRIBUTION.texte - marque.length)}${marque}`;
  if (resume.length < LIMITES_CONTRIBUTION.texteMin) return refus(400, `Le résumé doit faire au moins ${LIMITES_CONTRIBUTION.texteMin} caractères.`);

  const { ipHash } = await infosRequete();
  const r = await deposerContribution({ type, nature: "", blocId, articleId: null, pseudo, titre, texte }, ipHash);
  if (!r.ok) return refus(400, r.message);
  if (complet) {
    const { data } = await dbAdmin().from("contributions").select("id").eq("jeton_hash", empreinteJeton(r.jeton)).maybeSingle();
    if (data?.id) await dbAdmin().storage.from(ESPACE).upload(`${DOSSIER_PROPOSITIONS}/${String(data.id)}.json`, new Blob([complet], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  }
  return NextResponse.json({ message: r.message, jeton: r.jeton }, { headers: SANS_CACHE });
}
