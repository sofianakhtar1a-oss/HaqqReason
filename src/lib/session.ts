import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { assurerIdAppareil } from "./appareils";
import { lireCompteCreateur, type CompteCreateur } from "./auth-store";
import { lireReglages } from "./reglages-donnees";
import { NOM_COOKIE_VUE } from "./compte/jeton";
import { empreinteAppareil, NOM_COOKIE, NOM_COOKIE_APPAREIL, optionsCookie, signerSession, verifierSession } from "./session-token";

/** Contexte de l'appareil courant, pour vérifier qu'un cookie n'a pas été recopié ailleurs. */
async function contexteAppareil(): Promise<{ idAppareil?: string; userAgent?: string | null }> {
  return {
    idAppareil: (await cookies()).get(NOM_COOKIE_APPAREIL)?.value,
    userAgent: (await headers()).get("user-agent"),
  };
}

/** Ouvre une session créateur sur cet appareil, selon les réglages en vigueur. */
export async function ouvrirSession(sessionVersion: number): Promise<void> {
  const reglages = await lireReglages();
  // L'identifiant d'appareil doit exister AVANT la signature, sinon l'empreinte changerait
  // dès la requête suivante et la session serait close aussitôt.
  const idAppareil = await assurerIdAppareil();
  const jeton = await signerSession({
    sv: sessionVersion,
    debut: Math.floor(Date.now() / 1000),
    ina: reglages.inactivite_minutes,
    max: reglages.session_max_heures,
    emp: reglages.lier_appareil ? await empreinteAppareil(idAppareil, (await headers()).get("user-agent")) : undefined,
  });
  (await cookies()).set(NOM_COOKIE, jeton, optionsCookie(reglages.inactivite_minutes));
}

export async function fermerSession(): Promise<void> {
  (await cookies()).set(NOM_COOKIE, "", { ...optionsCookie(), maxAge: 0 });
}

/**
 * Vérifie côté serveur que la requête vient bien du créateur :
 * jeton signé valide, appareil attendu, ET version de session identique à celle de la base.
 */
export async function sessionCreateur(): Promise<CompteCreateur | null> {
  const jeton = (await cookies()).get(NOM_COOKIE)?.value;
  const session = await verifierSession(jeton, await contexteAppareil());
  if (!session) return null;
  const compte = await lireCompteCreateur();
  if (!compte || compte.session_version !== session.sv) return null;
  return compte;
}

/**
 * Pour les pages du mode créateur : renvoie vers l'accueil si l'accès n'est pas légitime.
 * L'adresse demandée n'est jamais conservée, pour qu'un lien recopié ne mène nulle part.
 */
export async function exigerCreateur(): Promise<CompteCreateur> {
  const compte = await sessionCreateur();
  if (compte) return compte;
  const existe = await lireCompteCreateur();
  redirect(existe ? "/" : "/createur/configuration");
}

/**
 * Le créateur a choisi de regarder le site « comme un utilisateur » : hors de son espace,
 * plus rien ne doit le distinguer d'un visiteur (ni raccourci « Modifier », ni brouillon).
 */
export async function vueUtilisateur(): Promise<boolean> {
  return (await cookies()).get(NOM_COOKIE_VUE)?.value === "1";
}

/** Pour les pages publiques : la session du créateur, sauf s'il regarde le site comme un utilisateur. */
export async function sessionCreateurVisible(): Promise<CompteCreateur | null> {
  if (await vueUtilisateur()) return null;
  return sessionCreateur();
}

/**
 * Indique seulement si le navigateur porte un jeton créateur valide (sans interroger la base).
 * Sert à AFFICHER des raccourcis « Modifier » côté lecteur ; les pages et actions du créateur revérifient tout.
 * Faux dans la vue utilisateur.
 */
export async function porteJetonCreateur(): Promise<boolean> {
  if (await vueUtilisateur()) return false;
  return (await verifierSession((await cookies()).get(NOM_COOKIE)?.value, await contexteAppareil())) !== null;
}
