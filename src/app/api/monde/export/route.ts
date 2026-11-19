import { NextResponse, type NextRequest } from "next/server";
import { lireDonnees } from "@/lib/compte/donnees";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { dbAdmin } from "@/lib/supabase";

/*
 * GET : tout ce que le compte a laissé au Portulan, dans un fichier JSON à garder.
 *   • la progression rangée sur le compte (magasin « monde ») ;
 *   • l'XP, les trophées, la cote, les records, les défis ;
 *   • les duels, les amis, les salons, les classes, les signalements envoyés.
 * Rien d'un autre joueur n'y figure, sinon le nom public de ses amis et adversaires.
 * Une table absente (migration pas encore lancée) est simplement sautée.
 */

const SANS_CACHE = { "Cache-Control": "private, no-store" };
const refus = (statut: number, erreur: string) => NextResponse.json({ erreur }, { status: statut, headers: SANS_CACHE });

async function table(nom: string, colonne: string, id: string, champs = "*"): Promise<unknown[] | null> {
  const { data, error } = await dbAdmin().from(nom).select(champs).eq(colonne, id).limit(5000);
  return error ? null : (data as unknown[]);
}

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return refus(403, "refuse");
  const compte = await compteVerifie();
  if (compte === "indisponible") return refus(503, "indisponible");
  if (!compte) return refus(401, "deconnecte");
  const id = compte.id;

  // La progression du compte, page après page (le magasin « monde » seulement).
  const progression: Record<string, unknown> = {};
  let depuis = 0;
  for (let tour = 0; tour < 40; tour++) {
    const lu = await lireDonnees(id, depuis);
    if (!lu || !lu.lignes.length) break;
    for (const l of lu.lignes) if (l.m === "monde") progression[l.c] = l.v;
    depuis = Math.max(depuis, ...lu.lignes.map((l) => l.j));
  }

  const [scores, jours, records, defis, duelsCrees, duelsJoues, amis, salons, classes, membres, signalements] = await Promise.all([
    table("portulan_scores", "utilisateur_id", id),
    table("portulan_jour", "utilisateur_id", id),
    table("portulan_records", "utilisateur_id", id),
    table("portulan_defis", "utilisateur_id", id),
    table("portulan_duels", "createur", id),
    table("portulan_duels", "adversaire", id),
    table("portulan_amis", "utilisateur_id", id),
    table("portulan_salon_joueurs", "utilisateur_id", id),
    table("portulan_classes", "proprietaire", id),
    table("portulan_classe_membres", "utilisateur_id", id),
    table("portulan_signalements", "utilisateur_id", id, "le, code, sujet, texte, traite"),
  ]);

  const fichier = {
    format: "portulan-compte",
    version: 1,
    exporte: new Date().toISOString(),
    compte: { id, nom: compte.nom, email: compte.email },
    progression,
    scores,
    jours,
    records,
    defis,
    duels: [...(duelsCrees ?? []), ...(duelsJoues ?? [])],
    amis,
    salons,
    classes,
    membreDe: membres,
    signalements,
  };
  const jour = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(fichier, null, 1), {
    headers: { ...SANS_CACHE, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="portulan-compte-${jour}.json"` },
  });
}
