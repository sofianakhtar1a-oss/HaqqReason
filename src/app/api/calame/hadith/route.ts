import { NextResponse } from "next/server";
import { recueilDe } from "@/lib/atelier/hadiths";

/**
 * Un hadith par sa référence (recueil et numéro), pour l'atelier d'écriture : le texte arabe et
 * les degrés donnés par les savants, tirés de fawazahmed0/hadith-api (domaine public).
 * Le serveur va les chercher (la politique de sécurité interdit au navigateur de sortir du site)
 * et les garde un mois : un hadith ne change pas.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const recueil = recueilDe(params.get("recueil") ?? "");
  const numero = Number(params.get("numero"));
  if (!recueil || !Number.isInteger(numero) || numero < 1 || numero > recueil.max) {
    return NextResponse.json({ erreur: "Référence inconnue : choisis un recueil et un numéro valides." }, { status: 400 });
  }
  try {
    const reponse = await fetch(`https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions/ara-${recueil.cle}/${numero}.json`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (reponse.status === 404) return NextResponse.json({ erreur: "Ce numéro n'existe pas dans ce recueil." }, { status: 404 });
    if (!reponse.ok) throw new Error(String(reponse.status));
    const donnees = (await reponse.json()) as {
      hadiths?: { hadithnumber: number; text: string; grades?: { name: string; grade: string }[] }[];
      metadata?: { section?: Record<string, string> };
    };
    const h = donnees.hadiths?.[0];
    if (!h?.text) return NextResponse.json({ erreur: "Ce numéro n'existe pas dans ce recueil." }, { status: 404 });
    return NextResponse.json(
      {
        recueil: recueil.nom,
        numero: h.hadithnumber,
        texte: h.text.trim(),
        degres: (h.grades ?? []).map((g) => ({ nom: g.name, degre: g.grade })).slice(0, 8),
        chapitre: Object.values(donnees.metadata?.section ?? {})[0] ?? "",
        sahihParConsensus: recueil.sahih,
      },
      { headers: { "Cache-Control": "public, max-age=86400, s-maxage=2592000" } },
    );
  } catch {
    return NextResponse.json({ erreur: "Le recueil n'a pas répondu. Réessaie dans un instant." }, { status: 502 });
  }
}
