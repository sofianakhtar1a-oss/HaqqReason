import { NextResponse, type NextRequest } from "next/server";
import { journaliser } from "@/lib/audit";
import { adresseRetour, identiteDepuisCode, origineDe } from "@/lib/compte/google";
import { googleConfigure, NOM_COOKIE_COMPTE, NOM_COOKIE_OAUTH, optionsCookieCompte, signerCompte, verifierAllerRetour } from "@/lib/compte/jeton";
import { dbAdmin } from "@/lib/supabase";

/*
 * Retour de chez Google. On vérifie l'état, on échange le code contre l'identité (signée par Google),
 * on ouvre ou on crée le compte, puis on pose le cookie de session et on revient à la page demandée.
 */
export async function GET(requete: NextRequest) {
  const origine = origineDe(requete);
  const vers = (chemin: string) => {
    const r = NextResponse.redirect(new URL(chemin, origine), { status: 303 });
    r.cookies.set(NOM_COOKIE_OAUTH, "", optionsCookieCompte(0));
    r.headers.set("Cache-Control", "no-store");
    return r;
  };
  if (!googleConfigure()) return vers("/connexion?erreur=reglage");

  const params = requete.nextUrl.searchParams;
  const attendu = await verifierAllerRetour(requete.cookies.get(NOM_COOKIE_OAUTH)?.value);
  const code = params.get("code");
  // Refus côté Google (« Annuler ») : on revient simplement à la page de connexion.
  if (params.get("error")) return vers(`/connexion?erreur=annule${attendu ? `&retour=${encodeURIComponent(attendu.retour)}` : ""}`);
  if (!attendu || !code || params.get("state") !== attendu.etat) return vers("/connexion?erreur=expire");

  const identite = await identiteDepuisCode({ code, verificateur: attendu.verificateur, retour: adresseRetour(requete), nonce: attendu.nonce });
  if (!identite) return vers(`/connexion?erreur=google&retour=${encodeURIComponent(attendu.retour)}`);

  const { data, error } = await dbAdmin().rpc("compte_ouvrir", { p_sub: identite.sub, p_email: identite.email, p_nom: identite.nom });
  const ligne = (Array.isArray(data) ? data[0] : data) as { id: string; nom: string; email: string; session_version: number; nouveau: boolean } | null;
  if (error || !ligne) return vers(`/connexion?erreur=base&retour=${encodeURIComponent(attendu.retour)}`);
  if (ligne.nouveau) await journaliser("compte_cree", {});

  const reponse = vers(attendu.retour);
  reponse.cookies.set(NOM_COOKIE_COMPTE, await signerCompte({ id: ligne.id, nom: ligne.nom, email: ligne.email, sv: ligne.session_version }), optionsCookieCompte());
  return reponse;
}
