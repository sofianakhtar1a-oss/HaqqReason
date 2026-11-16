import { NextResponse } from "next/server";
import { erreur, garder, reponseErreur, SANS_CACHE } from "@/lib/alambic/serveur/garde";
import { demanderJson, MODELE_MOTS } from "@/lib/alambic/serveur/groq";
import { normaliser } from "@/lib/alambic/transcription/phrases";
import type { Glose } from "@/lib/alambic/transcription/types";
import { nomLangue } from "@/lib/alambic/transcription/types";

/*
 * Analyse mot à mot d'UNE phrase : traduction de la phrase, et pour chaque mot son sens
 * dans ce contexte, sa nature, sa forme de base et (en arabe) sa racine.
 * Une seule demande par phrase : survoler les mots voisins est ensuite instantané.
 * Réponse en tableaux compacts : deux fois moins de jetons, donc deux fois plus d'analyses gratuites.
 */

export const maxDuration = 60;

const NATURES: Record<string, string> = { n: "nom", v: "verbe", a: "adjectif", d: "adverbe", p: "pronom", r: "préposition", c: "conjonction", t: "article", x: "particule", np: "nom propre" };

export async function POST(requete: Request) {
  const refus = await garder(requete, "analyse");
  if (refus) return refus;

  let corps: { langue?: unknown; mots?: unknown; contexte?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return erreur("Demande illisible.", 400);
  }
  const mots = Array.isArray(corps.mots) ? corps.mots.map((m) => String(m ?? "").slice(0, 60)) : [];
  if (!mots.length || mots.length > 90) return erreur("Phrase vide ou trop longue.", 400);
  const code = String(corps.langue ?? "");
  const arabe = code === "ar";
  const langue = nomLangue(code).toLowerCase();
  const contexte = String(corps.contexte ?? "").slice(0, 500);
  const numerotes = mots.map((t, i) => [i, t] as const).filter(([, t]) => normaliser(t));

  const systeme = [
    `Tu es un professeur d'${langue} qui explique une phrase à un francophone, mot par mot.`,
    "Entrée : une phrase transcrite d'un enregistrement, en mots numérotés [i, mot].",
    'Réponds uniquement en JSON : {"t": "traduction française naturelle de toute la phrase", "m": [[i, sens, nature, lemme' + (arabe ? ", racine" : "") + "], …]} avec UNE entrée par mot numéroté :",
    "- sens : la TRADUCTION FRANÇAISE du mot dans cette phrase, 1 à 5 mots. Toujours en français, jamais recopié dans la langue d'origine (ex. pour « نور » : « lumière ») ;",
    "- nature : n (nom), v (verbe), a (adjectif), d (adverbe), p (pronom), r (préposition), c (conjonction), t (article), x (particule), np (nom propre) ;",
    "- lemme : forme de base dans la langue d'origine (infinitif, singulier, masculin) ;",
    arabe ? "- racine : 3 ou 4 lettres arabes séparées par des espaces, ou \"\" pour un mot outil ou un nom étranger. Un mot avec préfixe collé (و ف ب ل ك ال) reçoit le sens de l'ensemble." : "",
    "Termes islamiques : formes françaises usuelles (Allah, sourate, hadith, Prophète ﷺ).",
  ]
    .filter(Boolean)
    .join("\n");
  const utilisateur = JSON.stringify({ avant: contexte || undefined, mots: numerotes });

  try {
    const r = await demanderJson<{ t?: unknown; m?: unknown }>(MODELE_MOTS, systeme, utilisateur, 3000, requete.signal);
    const valides = new Set(numerotes.map(([i]) => i));
    const texte = (x: unknown, max: number) => (typeof x === "string" && x.trim() ? x.trim().slice(0, max) : undefined);
    const gloses: Glose[] = [];
    for (const ligne of Array.isArray(r.m) ? r.m : []) {
      if (!Array.isArray(ligne)) continue;
      const i = Number(ligne[0]);
      const sens = texte(ligne[1], 80);
      // Un « sens » resté en écriture arabe n'est pas une traduction : on l'écarte.
      if (!valides.has(i) || !sens || /[\u0600-\u06FF]/.test(sens)) continue;
      const nature = texte(ligne[2], 12);
      gloses.push({ i, sens, nature: nature ? (NATURES[nature] ?? nature) : undefined, lemme: texte(ligne[3], 40), racine: arabe ? texte(ligne[4], 20) : undefined });
    }
    return NextResponse.json({ traduction: texte(r.t, 1500) ?? "", mots: gloses }, { headers: SANS_CACHE });
  } catch (e) {
    return reponseErreur(e);
  }
}
