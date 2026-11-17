import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { porteJetonCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { googleConfigure, NOM_COOKIE_COMPTE, optionsCookieCompte, signerCompte, verifierCompte, type Compte } from "./jeton";

/** Le compte porté par le navigateur (jeton signé valide), sans interroger la base. */
export async function compteCourant(): Promise<Compte | null> {
  return verifierCompte((await cookies()).get(NOM_COOKIE_COMPTE)?.value);
}

/**
 * Pour les pages des espaces personnels : sans compte, on passe par la page de connexion,
 * puis on revient ici. Tant que la connexion Google n'est pas réglée sur le serveur,
 * les espaces restent ouverts comme avant (les données restent alors sur l'appareil).
 */
export async function exigerCompte(retour: string): Promise<Compte | null> {
  const compte = await compteCourant();
  if (compte || !googleConfigure()) return compte;
  // Le créateur connecté entre sans compte (aperçu de ses brouillons) ; dans la vue utilisateur,
  // porteJetonCreateur répond « non » : il est alors traité comme n'importe quel visiteur.
  if (await porteJetonCreateur()) return null;
  redirect(`/connexion?retour=${encodeURIComponent(retour)}`);
}

/**
 * Pour les routes qui lisent ou écrivent des données : le jeton doit être valide ET
 * le compte doit toujours exister en base, avec la même version de session.
 * « indisponible » : la base n'a pas répondu. Ce n'est pas une déconnexion : l'appareil réessaiera.
 */
export async function compteVerifie(): Promise<Compte | null | "indisponible"> {
  const compte = await compteCourant();
  if (!compte) return null;
  try {
    const { data, error } = await dbAdmin().from("utilisateurs").select("session_version").eq("id", compte.id).maybeSingle();
    if (error) return "indisponible";
    if (!data || data.session_version !== compte.sv) return null;
    return compte;
  } catch {
    return "indisponible";
  }
}

export async function ouvrirSessionCompte(compte: Compte): Promise<void> {
  (await cookies()).set(NOM_COOKIE_COMPTE, await signerCompte(compte), optionsCookieCompte());
}

export async function fermerSessionCompte(): Promise<void> {
  (await cookies()).set(NOM_COOKIE_COMPTE, "", optionsCookieCompte(0));
}

/** Une requête d'écriture doit venir des pages du site lui-même. */
export function memeOrigine(requete: Request): boolean {
  const site = requete.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origine = requete.headers.get("origin");
  if (!origine) return requete.method === "GET";
  try {
    return new URL(origine).host === (requete.headers.get("x-forwarded-host") ?? requete.headers.get("host") ?? new URL(requete.url).host);
  } catch {
    return false;
  }
}
