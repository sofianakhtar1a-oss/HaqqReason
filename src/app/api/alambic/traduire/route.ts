import { NextResponse } from "next/server";
import { erreur, garder, reponseErreur, SANS_CACHE } from "@/lib/alambic/serveur/garde";
import { demanderJson, MODELE_PHRASES } from "@/lib/alambic/serveur/groq";
import { nomLangue } from "@/lib/alambic/transcription/types";

/* Traduit vers le français un lot de phrases consécutives (25 au plus), en tenant compte du contexte. */

export const maxDuration = 60;

const MAX_PHRASES = 25;
const MAX_SIGNES = 7000;

export async function POST(requete: Request) {
  const refus = await garder(requete, "traduction");
  if (refus) return refus;

  let corps: { langue?: unknown; phrases?: unknown; contexte?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return erreur("Demande illisible.", 400);
  }
  const phrases = Array.isArray(corps.phrases) ? corps.phrases.map((p) => String(p ?? "").slice(0, 1200)) : [];
  if (!phrases.length || phrases.length > MAX_PHRASES) return erreur("Envoie entre 1 et 25 phrases.", 400);
  if (phrases.join("").length > MAX_SIGNES) return erreur("Ce lot de phrases est trop long.", 413);
  const langue = nomLangue(String(corps.langue ?? "")).toLowerCase();
  const contexte = String(corps.contexte ?? "").slice(0, 600);

  const systeme = [
    `Tu es un traducteur professionnel de l'${langue} vers le français.`,
    "Les phrases viennent de la transcription automatique d'un cours, d'un podcast ou d'une conférence : traduis chacune fidèlement, en français naturel et soigné, en t'aidant des phrases voisines pour le sens.",
    "Corrige sans le signaler les petites erreurs évidentes de transcription.",
    "Termes islamiques : garde les formes françaises usuelles (Allah, sourate, hadith, Prophète ﷺ, etc.). Versets et hadiths : traduction fidèle, sans commentaire.",
    `Réponds uniquement en JSON : {"t": ["…", "…"]}, avec exactement ${phrases.length} traductions, dans le même ordre.`,
  ].join("\n");
  const utilisateur = JSON.stringify({ contexte_precedent: contexte || undefined, phrases: phrases.map((p, i) => ({ n: i + 1, texte: p })) });

  try {
    const r = await demanderJson<{ t?: unknown }>(MODELE_PHRASES, systeme, utilisateur, 4000, requete.signal);
    const t = Array.isArray(r.t) ? r.t.map((x) => String(x ?? "").trim()) : [];
    if (t.length !== phrases.length) return erreur("La traduction est revenue incomplète. Réessaie.", 502);
    return NextResponse.json({ traductions: t }, { headers: SANS_CACHE });
  } catch (e) {
    return reponseErreur(e);
  }
}
