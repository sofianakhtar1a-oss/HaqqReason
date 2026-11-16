import { type NextRequest } from "next/server";
import { erreur, garder } from "@/lib/alambic/serveur/garde";
import { relais } from "@/lib/alambic/serveur/youtube";
import { idYoutube } from "@/lib/alambic/transcription/lien";

/*
 * Le son d'une vidéo YouTube, relayé par morceaux de 3,5 Mo au plus (limite des fonctions Vercel).
 * Le navigateur recolle les morceaux, puis le fichier suit le chemin habituel : Whisper.
 * Seuls les relais de la liste connue sont acceptés : cette route n'ouvre aucune autre adresse.
 */

export const maxDuration = 60;

const MORCEAU_MAX = 3_500_000;

export async function GET(requete: NextRequest) {
  const p = requete.nextUrl.searchParams;
  const id = idYoutube(p.get("v") ?? "");
  const hote = p.get("relais") ?? "";
  const itag = p.get("itag") ?? "";
  const debut = Number(p.get("debut"));
  const fin = Number(p.get("fin"));
  if (!id || !/^\d{1,4}$/.test(itag) || !Number.isInteger(debut) || !Number.isInteger(fin) || debut < 0 || fin < debut || fin - debut + 1 > MORCEAU_MAX) {
    return erreur("Demande de son invalide.", 400);
  }
  if (!(await relais()).includes(hote)) return erreur("Relais inconnu.", 400);
  // Un seul décompte par vidéo (au premier morceau), pour ne pas épuiser le quota horaire.
  if (debut === 0) {
    const refus = await garder(requete, "youtube");
    if (refus) return refus;
  }
  try {
    const r = await fetch(`https://${hote}/latest_version?id=${id}&itag=${itag}&local=true`, {
      headers: { Range: `bytes=${debut}-${fin}` },
      signal: requete.signal,
    });
    if (!r.ok || !r.body) return erreur("Le relais n'a pas livré le son.", 502);
    return new Response(r.body, {
      status: 200,
      headers: { "Content-Type": r.headers.get("content-type") ?? "application/octet-stream", "Cache-Control": "private, no-store" },
    });
  } catch {
    return erreur("Le relais n'a pas livré le son.", 502);
  }
}
