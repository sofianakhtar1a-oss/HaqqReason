import { NextResponse, type NextRequest } from "next/server";
import { erreur, garder, reponseErreur, SANS_CACHE } from "@/lib/alambic/serveur/garde";
import { apercu, sousTitres, viaRelais } from "@/lib/alambic/serveur/youtube";
import { idYoutube } from "@/lib/alambic/transcription/lien";

/*
 * GET ?v=…&apercu=1 : titre et auteur (pour l'aperçu du lien collé).
 * GET ?v=…&langue=ar : sous-titres horodatés de la vidéo.
 */

export const maxDuration = 30;

export async function GET(requete: NextRequest) {
  const parametres = requete.nextUrl.searchParams;
  const id = idYoutube(parametres.get("v") ?? "");
  if (!id) return erreur("Ce lien n'est pas celui d'une vidéo YouTube.", 400);

  if (parametres.get("apercu")) {
    const infos = await apercu(id, requete.signal);
    if (!infos) return erreur("Vidéo introuvable ou privée.", 404);
    return NextResponse.json({ id, ...infos }, { headers: { "Cache-Control": "public, max-age=3600" } });
  }

  const refus = await garder(requete, "youtube");
  if (refus) return refus;
  const langue = parametres.get("langue");
  const voulue = langue && ["en", "ar", "es"].includes(langue) ? langue : null;
  // 1. Les relais publics (YouTube bloque les serveurs comme Vercel, pas eux).
  try {
    const video = await viaRelais(id, voulue, requete.signal);
    if (video) return NextResponse.json({ id, ...video }, { headers: SANS_CACHE });
  } catch (e) {
    if (requete.signal.aborted) return reponseErreur(e);
  }
  // 2. YouTube directement, au cas où il laisserait passer.
  try {
    const video = await sousTitres(id, voulue, requete.signal);
    return NextResponse.json({ id, ...video, son: null }, { headers: SANS_CACHE });
  } catch (e) {
    return reponseErreur(e);
  }
}
