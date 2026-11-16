import { NextResponse } from "next/server";
import { erreur, garder, reponseErreur, SANS_CACHE } from "@/lib/alambic/serveur/garde";
import { transcrireAudio } from "@/lib/alambic/serveur/groq";
import { depuisWhisper } from "@/lib/alambic/transcription/phrases";
import { codeLangue } from "@/lib/alambic/transcription/types";

/*
 * Transcrit UN morceau de son (10 minutes au plus, déjà allégé par le navigateur).
 * Le navigateur découpe les longs enregistrements et recolle les morceaux : chaque appel reste
 * sous la limite de 4,5 Mo des fonctions Vercel et se termine en quelques secondes.
 */

export const maxDuration = 60;

const POIDS_MAX = 4_400_000;
const LANGUES = new Set(["en", "ar", "es"]);

export async function POST(requete: Request) {
  const refus = await garder(requete, "transcription");
  if (refus) return refus;

  let formulaire: FormData;
  try {
    formulaire = await requete.formData();
  } catch {
    return erreur("Morceau de son illisible.", 400);
  }
  const fichier = formulaire.get("fichier");
  if (!(fichier instanceof Blob) || !fichier.size) return erreur("Aucun son reçu.", 400);
  if (fichier.size > POIDS_MAX) return erreur("Ce morceau de son est trop lourd.", 413);
  if (fichier.type && !/^(audio|video)\//.test(fichier.type)) return erreur("Ce fichier n'est pas un son.", 415);
  const langue = String(formulaire.get("langue") ?? "");
  const nom = String(formulaire.get("nom") ?? "morceau.ogg").replace(/[^\w.-]/g, "_").slice(0, 80) || "morceau.ogg";

  try {
    const r = await transcrireAudio(fichier, nom, LANGUES.has(langue) ? langue : null, requete.signal);
    return NextResponse.json(
      { langue: codeLangue(r.language), duree: r.duration ?? 0, fragments: depuisWhisper(r.segments ?? [], r.words ?? []) },
      { headers: SANS_CACHE },
    );
  } catch (e) {
    return reponseErreur(e);
  }
}
