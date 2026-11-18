import { NextResponse, type NextRequest } from "next/server";
import { origineDe } from "@/lib/compte/google";
import { NOM_COOKIE_COMPTE, optionsCookieCompte } from "@/lib/compte/jeton";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";
import { dbAdmin } from "@/lib/supabase";
import { NOM_COOKIE_MODULES, optionsCookieModules } from "@/lib/acces-modules-jeton";

/*
 * Fin de session. Envoyé par un vrai formulaire : le navigateur recharge alors toute la page,
 * et plus rien du compte ne reste affiché. « partout » ferme aussi la session sur les autres appareils.
 */
export async function POST(requete: NextRequest) {
  const origine = origineDe(requete);
  const reponse = NextResponse.redirect(new URL("/", origine), { status: 303 });
  reponse.headers.set("Cache-Control", "no-store");
  if (!memeOrigine(requete)) return reponse;
  const formulaire = await requete.formData().catch(() => null);
  if (formulaire?.get("partout") === "1") {
    const compte = await compteVerifie();
    if (compte && compte !== "indisponible") await dbAdmin().from("utilisateurs").update({ session_version: compte.sv + 1 }).eq("id", compte.id);
  }
  reponse.cookies.set(NOM_COOKIE_COMPTE, "", optionsCookieCompte(0));
  // Se déconnecter referme aussi les modules réservés : il faudra redonner leur mot de passe.
  reponse.cookies.set(NOM_COOKIE_MODULES, "", optionsCookieModules(0));
  return reponse;
}
