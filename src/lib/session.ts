import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { lireCompteCreateur, type CompteCreateur } from "./auth-store";
import { NOM_COOKIE, optionsCookie, signerSession, verifierSession } from "./session-token";

/** Ouvre une session créateur sur cet appareil. */
export async function ouvrirSession(sessionVersion: number): Promise<void> {
  const jeton = await signerSession({ sv: sessionVersion, debut: Math.floor(Date.now() / 1000) });
  (await cookies()).set(NOM_COOKIE, jeton, optionsCookie());
}

export async function fermerSession(): Promise<void> {
  (await cookies()).set(NOM_COOKIE, "", { ...optionsCookie(), maxAge: 0 });
}

/**
 * Vérifie côté serveur que la requête vient bien du créateur :
 * jeton signé valide ET version de session identique à celle de la base.
 */
export async function sessionCreateur(): Promise<CompteCreateur | null> {
  const jeton = (await cookies()).get(NOM_COOKIE)?.value;
  const session = await verifierSession(jeton);
  if (!session) return null;
  const compte = await lireCompteCreateur();
  if (!compte || compte.session_version !== session.sv) return null;
  return compte;
}

/** Pour les pages du mode créateur : redirige si l'accès n'est pas légitime. */
export async function exigerCreateur(): Promise<CompteCreateur> {
  const compte = await sessionCreateur();
  if (compte) return compte;
  const existe = await lireCompteCreateur();
  redirect(existe ? "/createur/connexion" : "/createur/configuration");
}

/**
 * Indique seulement si le navigateur porte un jeton créateur valide (sans interroger la base).
 * Sert à AFFICHER des raccourcis « Modifier » côté lecteur ; les pages et actions du créateur revérifient tout.
 */
export async function porteJetonCreateur(): Promise<boolean> {
  return (await verifierSession((await cookies()).get(NOM_COOKIE)?.value)) !== null;
}
