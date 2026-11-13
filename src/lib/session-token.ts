/**
 * Jeton de session du créateur (signé, illisible pour le navigateur : cookie httpOnly).
 * Ce module est utilisé par le proxy et par le serveur ; il ne touche pas à la base.
 * Il n'emploie que des outils disponibles partout (WebCrypto), jamais « node:crypto ».
 */
import { SignJWT, jwtVerify } from "jose";
import { REGLAGES_PAR_DEFAUT } from "./reglages";

const EN_PRODUCTION = process.env.NODE_ENV === "production";

/** Le préfixe __Host- interdit au navigateur d'accepter ce cookie hors HTTPS ou depuis un sous-domaine. */
export const NOM_COOKIE = EN_PRODUCTION ? "__Host-hr_session" : "hr_session";

/** Cookie qui identifie l'appareil (posé par lib/appareils.ts, lu ici pour lier la session). */
export const NOM_COOKIE_APPAREIL = EN_PRODUCTION ? "__Host-hr_appareil" : "hr_appareil";

/** Valeur de repli si la base n'a pas encore de réglages (ou si la variable d'environnement en impose une). */
export function minutesInactivite(): number {
  const valeur = Number.parseInt(process.env.SESSION_IDLE_MINUTES ?? "", 10);
  return Number.isFinite(valeur) && valeur >= 5 && valeur <= 720 ? valeur : REGLAGES_PAR_DEFAUT.inactivite_minutes;
}

export function optionsCookie(minutes: number = minutesInactivite()) {
  return {
    httpOnly: true,
    secure: EN_PRODUCTION,
    sameSite: "strict" as const,
    path: "/",
    maxAge: Math.max(5, Math.round(minutes)) * 60,
  };
}

function cle(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

/**
 * Empreinte de l'appareil : identifiant du cookie + navigateur, hachés avec le secret du serveur.
 * Un cookie de session recopié ailleurs (autre navigateur, autre machine) ne correspond plus
 * et n'ouvre donc aucun accès.
 */
export async function empreinteAppareil(idAppareil: string | undefined, userAgent: string | null | undefined): Promise<string> {
  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  const source = `${secret}|session-appareil|${idAppareil ?? ""}|${(userAgent ?? "").slice(0, 300)}`;
  const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return Array.from(new Uint8Array(octets).slice(0, 12))
    .map((o) => o.toString(16).padStart(2, "0"))
    .join("");
}

export type Session = {
  /** Version de session : incrémentée en base pour déconnecter tous les appareils. */
  sv: number;
  /** Début de la session (secondes), pour la durée maximale absolue. */
  debut: number;
  /** Minutes d'inactivité choisies dans les réglages, au moment de la connexion. */
  ina: number;
  /** Durée maximale absolue, en heures, choisie dans les réglages. */
  max: number;
  /** Empreinte de l'appareil, si la session y est liée. */
  emp?: string;
};

export async function signerSession(session: Session): Promise<string> {
  const secret = cle();
  if (!secret) throw new Error("SESSION_SECRET manquant ou trop court.");
  const charge: Record<string, unknown> = { sv: session.sv, debut: session.debut, ina: session.ina, max: session.max };
  if (session.emp) charge.emp = session.emp;
  return new SignJWT(charge)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("createur")
    .setIssuedAt()
    .setExpirationTime(`${Math.max(5, Math.round(session.ina))}m`)
    .sign(secret);
}

/**
 * Vérifie la signature, la durée d'inactivité, la durée maximale absolue et, le cas échéant,
 * que la requête vient bien de l'appareil qui s'est connecté.
 */
export async function verifierSession(
  jeton: string | undefined,
  contexte?: { idAppareil?: string; userAgent?: string | null },
): Promise<Session | null> {
  const secret = cle();
  if (!secret || !jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, secret, { algorithms: ["HS256"], subject: "createur" });
    const { sv, debut, ina, max, emp } = payload as Record<string, unknown>;
    if (typeof sv !== "number" || typeof debut !== "number") return null;
    const inactivite = typeof ina === "number" ? ina : minutesInactivite();
    const maximum = typeof max === "number" ? max : REGLAGES_PAR_DEFAUT.session_max_heures;
    if (Date.now() / 1000 - debut > maximum * 3600) return null;
    if (typeof emp === "string") {
      if (!contexte) return null;
      if ((await empreinteAppareil(contexte.idAppareil, contexte.userAgent)) !== emp) return null;
    }
    return { sv, debut, ina: inactivite, max: maximum, emp: typeof emp === "string" ? emp : undefined };
  } catch {
    return null;
  }
}
