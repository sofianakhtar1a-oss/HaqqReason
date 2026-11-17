import { NextResponse } from "next/server";
import { erreur, SANS_CACHE } from "@/lib/alambic/serveur/garde";
import { geminiActif, modeleActuel, modelesDisponibles } from "@/lib/alambic/serveur/gemini";

/* Diagnostic : la clé est-elle installée, quel modèle est utilisé, lesquels sont ouverts à la clé. Rien de secret. */
export async function GET(requete: Request) {
  if (requete.headers.get("sec-fetch-site") && requete.headers.get("sec-fetch-site") !== "same-origin") return erreur("Appel refusé.", 403);
  if (!geminiActif()) return NextResponse.json({ cle: false }, { headers: SANS_CACHE });
  return NextResponse.json({ cle: true, modele: modeleActuel(), disponibles: await modelesDisponibles() }, { headers: SANS_CACHE });
}
