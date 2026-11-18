/**
 * Jeton de session d'un utilisateur connecté avec Google (cookie httpOnly, signé).
 * Comme celui du créateur (lib/session-token.ts), ce module sert au proxy et au serveur :
 * il ne touche pas à la base et n'emploie que WebCrypto.
 *
 * Les deux sessions sont étanches : le sujet du jeton (« utilisateur ») n'ouvre aucun
 * accès au mode créateur, et inversement.
 */
import { SignJWT, jwtVerify } from "jose";

const EN_PRODUCTION = process.env.NODE_ENV === "production";

export const NOM_COOKIE_COMPTE = EN_PRODUCTION ? "__Host-hr_compte" : "hr_compte";
/** Le temps d'un aller-retour chez Google : état, nonce et page de retour. */
export const NOM_COOKIE_OAUTH = EN_PRODUCTION ? "__Host-hr_oauth" : "hr_oauth";
/** Le créateur regarde le site « comme un utilisateur » (voir lib/compte/vue.ts). */
export const NOM_COOKIE_VUE = EN_PRODUCTION ? "__Host-hr_vue" : "hr_vue";

/** Durée d'une session utilisateur : elle se prolonge toute seule à chaque visite. */
export const JOURS_SESSION = 60;
const SECONDES_SESSION = JOURS_SESSION * 24 * 3600;

/**
 * Identifiant public de l'application « HaqqReason » chez Google (projet Google Cloud « haqqreason »).
 * Ce n'est pas un secret : Google l'affiche dans l'adresse de chaque connexion. La variable
 * GOOGLE_CLIENT_ID, si elle existe sur le serveur, le remplace (autre projet, essais en local).
 */
export const CLIENT_GOOGLE_HAQQREASON = "696064934563-cjkhusordcton5epskjv7er730236grs.apps.googleusercontent.com";

export function identifiantClientGoogle(): string {
  return process.env.GOOGLE_CLIENT_ID?.trim() || CLIENT_GOOGLE_HAQQREASON;
}

/**
 * La connexion Google est active dès qu'il y a un identifiant d'application (toujours, sauf
 * GOOGLE_CONNEXION=non pour la couper) et la clé qui signe les sessions (SESSION_SECRET).
 * Aucun code secret Google n'est nécessaire (voir lib/compte/google.ts).
 */
export function googleConfigure(): boolean {
  if (process.env.GOOGLE_CONNEXION?.trim().toLowerCase() === "non") return false;
  return Boolean(identifiantClientGoogle() && (process.env.SESSION_SECRET?.trim().length ?? 0) >= 32);
}

/**
 * « Lax » et non « Strict » : au retour de chez Google, le navigateur arrive d'un autre site,
 * et un cookie « Strict » ne serait pas envoyé sur cette première page. « Lax » protège quand même
 * les envois de formulaires et les requêtes lancées depuis un autre site.
 */
export function optionsCookieCompte(maxAge: number = SECONDES_SESSION) {
  return { httpOnly: true, secure: EN_PRODUCTION, sameSite: "lax" as const, path: "/", maxAge };
}

/**
 * Le cookie de l'aller-retour chez Google : Google renvoie le jeton par un formulaire envoyé
 * depuis son propre site (POST). Un cookie « Lax » ne voyagerait pas avec ce formulaire : celui-ci
 * est donc « None » (toujours Secure, httpOnly, dix minutes, signé, et effacé dès le retour).
 * Sur la machine locale (http), « None » est refusé par les navigateurs : on garde « Lax ».
 */
export function optionsCookieAllerRetour(maxAge = 600) {
  return { httpOnly: true, secure: EN_PRODUCTION, sameSite: (EN_PRODUCTION ? "none" : "lax") as "none" | "lax", path: "/", maxAge };
}

export function optionsCookieVue(maxAge: number = 12 * 3600) {
  return { httpOnly: true, secure: EN_PRODUCTION, sameSite: "strict" as const, path: "/", maxAge };
}

function cle(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export type Compte = {
  id: string;
  nom: string;
  email: string;
  /** Version de session : changée en base pour déconnecter tous les appareils du compte. */
  sv: number;
  /** Date d'émission (secondes), pour ne prolonger le cookie qu'une fois par jour. */
  emis?: number;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function signerCompte(compte: Compte): Promise<string> {
  const secret = cle();
  if (!secret) throw new Error("SESSION_SECRET manquant ou trop court.");
  return new SignJWT({ uid: compte.id, nom: compte.nom.slice(0, 200), email: compte.email.slice(0, 320), sv: compte.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("utilisateur")
    .setIssuedAt()
    .setExpirationTime(`${JOURS_SESSION}d`)
    .sign(secret);
}

export async function verifierCompte(jeton: string | undefined): Promise<Compte | null> {
  const secret = cle();
  if (!secret || !jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, secret, { algorithms: ["HS256"], subject: "utilisateur" });
    const { uid, nom, email, sv, iat } = payload as Record<string, unknown>;
    if (typeof uid !== "string" || !UUID.test(uid) || typeof sv !== "number") return null;
    return { id: uid, nom: typeof nom === "string" ? nom : "", email: typeof email === "string" ? email : "", sv, emis: typeof iat === "number" ? iat : undefined };
  } catch {
    return null;
  }
}

/** Ce que le navigateur garde pendant l'aller-retour chez Google. */
export type AllerRetour = { etat: string; nonce: string; retour: string };

export async function signerAllerRetour(a: AllerRetour): Promise<string> {
  const secret = cle();
  if (!secret) throw new Error("SESSION_SECRET manquant ou trop court.");
  return new SignJWT({ etat: a.etat, nonce: a.nonce, retour: a.retour }).setProtectedHeader({ alg: "HS256" }).setSubject("oauth").setIssuedAt().setExpirationTime("10m").sign(secret);
}

export async function verifierAllerRetour(jeton: string | undefined): Promise<AllerRetour | null> {
  const secret = cle();
  if (!secret || !jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, secret, { algorithms: ["HS256"], subject: "oauth" });
    const { etat, nonce, retour } = payload as Record<string, unknown>;
    if (typeof etat !== "string" || !etat || typeof nonce !== "string" || !nonce || typeof retour !== "string") return null;
    return { etat, nonce, retour };
  } catch {
    return null;
  }
}

export { espacePersonnel, retourSur } from "./chemins";
