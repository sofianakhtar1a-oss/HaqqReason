import { NextResponse, type NextRequest } from "next/server";
import { journaliser } from "@/lib/audit";
import { NOM_COOKIE_VUE, optionsCookieVue } from "@/lib/compte/jeton";
import { origineDe } from "@/lib/compte/google";
import { memeOrigine } from "@/lib/compte/session";
import { sessionCreateur } from "@/lib/session";

/*
 * « Voir comme un utilisateur » : le créateur garde sa session, mais tout le site s'affiche
 * exactement comme pour un visiteur, avec une barre en haut pour revenir. Envoyé par un vrai
 * formulaire (et non par un lien) : aucun préchargement ne peut l'activer par mégarde.
 */
export async function POST(requete: NextRequest) {
  const origine = origineDe(requete);
  if (!memeOrigine(requete) || !(await sessionCreateur())) return NextResponse.redirect(new URL("/", origine), { status: 303 });
  await journaliser("vue_utilisateur", {});
  const reponse = NextResponse.redirect(new URL("/", origine), { status: 303 });
  reponse.cookies.set(NOM_COOKIE_VUE, "1", optionsCookieVue());
  reponse.headers.set("Cache-Control", "no-store");
  return reponse;
}
