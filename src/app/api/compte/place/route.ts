import { NextResponse, type NextRequest } from "next/server";
import { placeDuCompte } from "@/lib/compte/donnees";
import { PLAFOND_DONNEES, PLAFOND_FICHIERS } from "@/lib/compte/limites";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { dbAdmin } from "@/lib/supabase";

/*
 * La place occupée sur le compte, et ce qui pèse le plus : pour prévenir avant d'atteindre la limite.
 * Les clés (identifiants de documents…) sont rendues telles quelles : l'appareil connaît leurs titres.
 */
const SANS_CACHE = { "Cache-Control": "private, no-store" };

export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "refuse" }, { status: 403, headers: SANS_CACHE });
  const compte = await compteVerifie();
  if (compte === "indisponible") return NextResponse.json({ erreur: "indisponible" }, { status: 503, headers: SANS_CACHE });
  if (!compte) return NextResponse.json({ erreur: "deconnecte" }, { status: 401, headers: SANS_CACHE });
  const place = await placeDuCompte(compte.id);
  if (!place) return NextResponse.json({ erreur: "indisponible" }, { status: 503, headers: SANS_CACHE });
  const { data } = await dbAdmin()
    .from("donnees_utilisateur")
    .select("magasin, cle, taille")
    .eq("utilisateur_id", compte.id)
    .not("valeur", "is", null)
    .order("taille", { ascending: false })
    .limit(8);
  return NextResponse.json(
    {
      ...place,
      plafondDonnees: PLAFOND_DONNEES,
      plafondFichiers: PLAFOND_FICHIERS,
      plusLourds: (data ?? []).map((d) => ({ magasin: String(d.magasin), cle: String(d.cle), taille: Number(d.taille) || 0 })),
    },
    { headers: SANS_CACHE },
  );
}
