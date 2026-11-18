import { NextResponse, type NextRequest } from "next/server";
import { adresseAutorisation, adresseRetour, aleatoire } from "@/lib/compte/google";
import { googleConfigure, NOM_COOKIE_OAUTH, optionsCookieAllerRetour, retourSur, signerAllerRetour } from "@/lib/compte/jeton";

/*
 * Départ vers Google. Le navigateur garde, dans un cookie signé de dix minutes, de quoi
 * vérifier au retour que la réponse est bien celle de CETTE demande (état et nonce).
 */
export async function GET(requete: NextRequest) {
  const retour = retourSur(requete.nextUrl.searchParams.get("retour"));
  if (!googleConfigure()) return NextResponse.redirect(new URL("/connexion?erreur=reglage", requete.url), { status: 303 });

  const etat = aleatoire(24);
  const nonce = aleatoire(24);
  const reponse = NextResponse.redirect(adresseAutorisation({ retour: adresseRetour(requete), etat, nonce }), { status: 303 });
  reponse.cookies.set(NOM_COOKIE_OAUTH, await signerAllerRetour({ etat, nonce, retour }), optionsCookieAllerRetour());
  reponse.headers.set("Cache-Control", "no-store");
  return reponse;
}
