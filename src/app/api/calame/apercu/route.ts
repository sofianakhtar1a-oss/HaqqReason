import { NextResponse, type NextRequest } from "next/server";
import { apercuSansStockage } from "@/lib/apercu-lien";
import { googleConfigure } from "@/lib/compte/jeton";
import { compteCourant, memeOrigine } from "@/lib/compte/session";
import { porteJetonCreateur } from "@/lib/session";

/**
 * Aperçu d'un lien pour l'atelier d'écriture (titre, description, petite vignette) : rien n'est
 * rangé sur le serveur, la carte et sa vignette restent dans le document, sur l'appareil.
 * Réservé aux pages du site et aux personnes connectées (ou à tous tant que la connexion Google
 * n'est pas réglée, comme les espaces personnels). Seules les adresses web publiques sont visitées.
 */
const SANS_CACHE = { "Cache-Control": "private, no-store" };

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "Requête refusée." }, { status: 403, headers: SANS_CACHE });
  if (googleConfigure() && !(await compteCourant()) && !(await porteJetonCreateur())) {
    return NextResponse.json({ erreur: "Connecte-toi pour préparer une carte de lien." }, { status: 401, headers: SANS_CACHE });
  }
  let url = "";
  try {
    const corps = (await requete.json()) as { url?: unknown };
    url = typeof corps.url === "string" ? corps.url.trim() : "";
  } catch {
    /* corps illisible */
  }
  if (!url || url.length > 2000 || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ erreur: "Colle une adresse complète, qui commence par https://" }, { status: 400, headers: SANS_CACHE });
  }
  const resultat = await apercuSansStockage(url);
  if (!resultat) return NextResponse.json({ erreur: "Cette adresse n'est pas un lien web valide." }, { status: 400, headers: SANS_CACHE });
  return NextResponse.json(resultat, { headers: SANS_CACHE });
}
