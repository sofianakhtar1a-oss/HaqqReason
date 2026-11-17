import { NextResponse, type NextRequest } from "next/server";
import { journaliser } from "@/lib/audit";
import { supprimerCompte } from "@/lib/compte/donnees";
import { origineDe } from "@/lib/compte/google";
import { NOM_COOKIE_COMPTE, optionsCookieCompte } from "@/lib/compte/jeton";
import { compteVerifie, memeOrigine } from "@/lib/compte/session";

/** Suppression définitive du compte : ses données et ses fichiers sont effacés du serveur. */
export async function POST(requete: NextRequest) {
  const origine = origineDe(requete);
  const vers = (chemin: string) => {
    const r = NextResponse.redirect(new URL(chemin, origine), { status: 303 });
    r.headers.set("Cache-Control", "no-store");
    return r;
  };
  if (!memeOrigine(requete)) return vers("/compte");
  const compte = await compteVerifie();
  if (compte === "indisponible") return vers("/compte?erreur=suppression");
  if (!compte) return vers("/connexion");
  const formulaire = await requete.formData().catch(() => null);
  if (formulaire?.get("confirmation") !== "supprimer") return vers("/compte");
  if (!(await supprimerCompte(compte.id))) return vers("/compte?erreur=suppression");
  await journaliser("compte_supprime", {});
  const reponse = vers("/?compte=supprime");
  reponse.cookies.set(NOM_COOKIE_COMPTE, "", optionsCookieCompte(0));
  return reponse;
}
