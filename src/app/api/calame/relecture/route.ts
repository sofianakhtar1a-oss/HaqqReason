import { NextResponse, type NextRequest } from "next/server";
import { googleConfigure } from "@/lib/compte/jeton";
import { compteCourant, memeOrigine } from "@/lib/compte/session";
import { porteJetonCreateur } from "@/lib/session";

/*
 * La relecture grammaticale du Calame : le texte part chez LanguageTool (service libre, Allemagne),
 * seulement quand l'auteur l'a demandé, et revient avec les remarques (accords, conjugaison, orthographe,
 * typographie). Rien n'est gardé ici. LANGUAGETOOL_URL permet d'utiliser un serveur à soi.
 */
const SANS_CACHE = { "Cache-Control": "private, no-store" };
const TAILLE_MAX = 18_000;

type Correspondance = {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  replacements?: { value: string }[];
  rule?: { id?: string; issueType?: string; category?: { id?: string; name?: string } };
};

export async function POST(requete: NextRequest) {
  if (!memeOrigine(requete)) return NextResponse.json({ erreur: "Requête refusée." }, { status: 403, headers: SANS_CACHE });
  if (googleConfigure() && !(await compteCourant()) && !(await porteJetonCreateur())) return NextResponse.json({ erreur: "Connecte-toi pour relire." }, { status: 401, headers: SANS_CACHE });
  let texte = "";
  try {
    texte = String(((await requete.json()) as { texte?: unknown }).texte ?? "");
  } catch {
    /* corps illisible */
  }
  if (!texte.trim()) return NextResponse.json({ remarques: [] }, { headers: SANS_CACHE });
  if (texte.length > TAILLE_MAX) return NextResponse.json({ erreur: "Morceau trop long." }, { status: 413, headers: SANS_CACHE });
  const adresse = process.env.LANGUAGETOOL_URL || "https://api.languagetool.org/v2/check";
  try {
    const corps = new URLSearchParams({ text: texte, language: "fr", level: "default" });
    const r = await fetch(adresse, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body: corps, signal: AbortSignal.timeout(25_000) });
    if (r.status === 429) return NextResponse.json({ erreur: "Le service de relecture est très demandé : réessaie dans une minute." }, { status: 429, headers: SANS_CACHE });
    if (!r.ok) throw new Error(String(r.status));
    const d = (await r.json()) as { matches?: Correspondance[] };
    const remarques = (d.matches ?? []).slice(0, 400).map((m) => ({
      message: m.message,
      court: m.shortMessage ?? "",
      debut: m.offset,
      longueur: m.length,
      suggestions: (m.replacements ?? []).slice(0, 5).map((x) => x.value),
      regle: m.rule?.id ?? "",
      genre: m.rule?.issueType === "misspelling" || m.rule?.category?.id === "TYPOS" ? "orthographe" : m.rule?.category?.id === "TYPOGRAPHY" || m.rule?.issueType === "typographical" ? "typographie" : m.rule?.issueType === "style" || m.rule?.category?.id === "STYLE" ? "style" : "grammaire",
      categorie: m.rule?.category?.name ?? "",
    }));
    return NextResponse.json({ remarques }, { headers: SANS_CACHE });
  } catch {
    return NextResponse.json({ erreur: "Le service de relecture n'a pas répondu. Réessaie dans un instant." }, { status: 502, headers: SANS_CACHE });
  }
}
