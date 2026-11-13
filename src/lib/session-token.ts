/**
 * Jeton de session du créateur (signé, illisible pour le navigateur : cookie httpOnly).
 * Ce module est utilisé par le proxy et par le serveur ; il ne touche pas à la base.
 */
import { SignJWT, jwtVerify } from "jose";

const EN_PRODUCTION = process.env.NODE_ENV === "production";

/** Le préfixe __Host- interdit au navigateur d'accepter ce cookie hors HTTPS ou depuis un sous-domaine. */
export const NOM_COOKIE = EN_PRODUCTION ? "__Host-hr_session" : "hr_session";

/** Durée maximale d'une session, même active. */
const DUREE_ABSOLUE_SECONDES = 12 * 60 * 60;

export function minutesInactivite(): number {
  const valeur = Number.parseInt(process.env.SESSION_IDLE_MINUTES ?? "", 10);
  return Number.isFinite(valeur) && valeur >= 5 && valeur <= 720 ? valeur : 30;
}

export function optionsCookie() {
  return {
    httpOnly: true,
    secure: EN_PRODUCTION,
    sameSite: "strict" as const,
    path: "/",
    maxAge: minutesInactivite() * 60,
  };
}

function cle(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

export type Session = {
  /** Version de session : incrémentée en base pour déconnecter tous les appareils. */
  sv: number;
  /** Début de la session (secondes), pour la durée maximale absolue. */
  debut: number;
};

export async function signerSession(session: Session): Promise<string> {
  const secret = cle();
  if (!secret) throw new Error("SESSION_SECRET manquant ou trop court.");
  return new SignJWT({ sv: session.sv, debut: session.debut })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("createur")
    .setIssuedAt()
    .setExpirationTime(`${minutesInactivite()}m`)
    .sign(secret);
}

export async function verifierSession(jeton: string | undefined): Promise<Session | null> {
  const secret = cle();
  if (!secret || !jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, secret, { algorithms: ["HS256"], subject: "createur" });
    const sv = payload.sv;
    const debut = payload.debut;
    if (typeof sv !== "number" || typeof debut !== "number") return null;
    if (Date.now() / 1000 - debut > DUREE_ABSOLUE_SECONDES) return null;
    return { sv, debut };
  } catch {
    return null;
  }
}
