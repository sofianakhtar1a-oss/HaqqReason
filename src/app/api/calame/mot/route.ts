import { NextResponse, type NextRequest } from "next/server";
import { lemmeDe, synonymesDe, traductionsAnglaises } from "@/lib/atelier/wiktionnaire";
import { googleConfigure } from "@/lib/compte/jeton";
import { compteCourant, memeOrigine } from "@/lib/compte/session";
import { porteJetonCreateur } from "@/lib/session";

/*
 * Un mot, d'après le Wiktionnaire (CC BY-SA) : ses synonymes et ses traductions anglaises.
 * Le serveur va chercher la page (le navigateur ne sort pas du site) et la garde une semaine.
 */
export async function GET(requete: NextRequest) {
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "Requête refusée." }, { status: 403 });
  if (googleConfigure() && !(await compteCourant()) && !(await porteJetonCreateur())) return NextResponse.json({ erreur: "Connecte-toi." }, { status: 401 });
  const mot = (requete.nextUrl.searchParams.get("mot") ?? "").trim().slice(0, 60);
  if (!mot || !/^[\p{L}\p{M}' -]+$/u.test(mot)) return NextResponse.json({ erreur: "Choisis un seul mot." }, { status: 400 });
  const lire = async (page: string) => {
    const r = await fetch(`https://fr.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2&redirects=1`, {
      headers: { "user-agent": "HaqqReason-Calame/1.0 (https://haqqreason.vercel.app)" },
      next: { revalidate: 7 * 86400 },
    });
    if (!r.ok) return "";
    const d = (await r.json()) as { parse?: { wikitext?: string } };
    return d.parse?.wikitext ?? "";
  };
  try {
    // Le mot tel quel, puis en minuscules (début de phrase).
    let texte = await lire(mot);
    if (!texte && mot !== mot.toLowerCase()) texte = await lire(mot.toLowerCase());
    let synonymes = synonymesDe(texte);
    let anglais = traductionsAnglaises(texte);
    // Une forme fléchie (« maisons », « mangeons ») : synonymes et traductions de sa forme de base.
    const lemme = lemmeDe(texte);
    if (lemme && lemme !== mot && (synonymes.length === 0 || anglais.length === 0)) {
      const base = await lire(lemme);
      if (synonymes.length === 0) synonymes = synonymesDe(base);
      if (anglais.length === 0) anglais = traductionsAnglaises(base);
    }
    return NextResponse.json(
      { mot, lemme: lemme || null, synonymes, anglais, source: `https://fr.wiktionary.org/wiki/${encodeURIComponent(lemme && synonymes.length ? lemme : mot)}` },
      { headers: { "Cache-Control": "private, max-age=86400" } },
    );
  } catch {
    return NextResponse.json({ erreur: "Le Wiktionnaire n'a pas répondu." }, { status: 502 });
  }
}
