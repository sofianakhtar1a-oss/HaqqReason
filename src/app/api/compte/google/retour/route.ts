import { NextResponse, type NextRequest } from "next/server";
import { journaliser } from "@/lib/audit";
import { identiteDepuisJeton, origineDe } from "@/lib/compte/google";
import { googleConfigure, NOM_COOKIE_COMPTE, NOM_COOKIE_OAUTH, optionsCookieAllerRetour, optionsCookieCompte, signerCompte, verifierAllerRetour } from "@/lib/compte/jeton";
import { dbAdmin } from "@/lib/supabase";

/*
 * Retour de chez Google. Google envoie ici, par un formulaire (POST), le jeton d'identité signé
 * et l'état de la demande. On vérifie l'état (cookie signé de l'aller), puis le jeton (signature
 * de Google, application, nonce), on ouvre ou on crée le compte, on pose le cookie de session
 * et on revient à la page demandée.
 */
async function traiter(requete: NextRequest, params: URLSearchParams) {
  const origine = origineDe(requete);
  const vers = (chemin: string) => {
    const r = NextResponse.redirect(new URL(chemin, origine), { status: 303 });
    r.cookies.set(NOM_COOKIE_OAUTH, "", optionsCookieAllerRetour(0));
    r.headers.set("Cache-Control", "no-store");
    return r;
  };
  if (!googleConfigure()) return vers("/connexion?erreur=reglage");

  const attendu = await verifierAllerRetour(requete.cookies.get(NOM_COOKIE_OAUTH)?.value);
  // Refus côté Google (« Annuler ») : on revient simplement à la page de connexion.
  if (params.get("error")) return vers(`/connexion?erreur=annule${attendu ? `&retour=${encodeURIComponent(attendu.retour)}` : ""}`);
  const jeton = params.get("id_token");
  if (!attendu || !jeton || params.get("state") !== attendu.etat) return vers("/connexion?erreur=expire");

  const identite = await identiteDepuisJeton(jeton, attendu.nonce);
  if (!identite) return vers(`/connexion?erreur=google&retour=${encodeURIComponent(attendu.retour)}`);

  const { data, error } = await dbAdmin().rpc("compte_ouvrir", { p_sub: identite.sub, p_email: identite.email, p_nom: identite.nom });
  const ligne = (Array.isArray(data) ? data[0] : data) as { id: string; nom: string; email: string; session_version: number; nouveau: boolean } | null;
  if (error || !ligne) return vers(`/connexion?erreur=base&retour=${encodeURIComponent(attendu.retour)}`);
  if (ligne.nouveau) await journaliser("compte_cree", {});

  const reponse = vers(attendu.retour);
  reponse.cookies.set(NOM_COOKIE_COMPTE, await signerCompte({ id: ligne.id, nom: ligne.nom, email: ligne.email, sv: ligne.session_version }), optionsCookieCompte());
  return reponse;
}

/** La réponse normale de Google : un formulaire envoyé à cette adresse. */
export async function POST(requete: NextRequest) {
  let params = new URLSearchParams();
  try {
    const type = requete.headers.get("content-type") ?? "";
    if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
      const formulaire = await requete.formData();
      for (const [cle, valeur] of formulaire) if (typeof valeur === "string") params.append(cle, valeur);
    }
  } catch {
    params = new URLSearchParams();
  }
  return traiter(requete, params);
}

/**
 * Une erreur renvoyée dans l'adresse, ou une page rechargée : jamais de jeton accepté par ce
 * chemin (un jeton dans une adresse finirait dans l'historique et les journaux).
 */
export async function GET(requete: NextRequest) {
  const params = new URLSearchParams(requete.nextUrl.searchParams);
  params.delete("id_token");
  return traiter(requete, params);
}
