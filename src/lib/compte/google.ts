import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { identifiantClientGoogle } from "./jeton";

/*
 * Connexion avec Google (OpenID Connect).
 *
 * Google renvoie directement au site un « jeton d'identité » signé (response_type=id_token),
 * en l'envoyant par un formulaire (response_mode=form_post) : il ne passe jamais par l'adresse
 * ni par l'historique du navigateur. Le serveur vérifie la signature avec les clés publiques de
 * Google, l'application destinataire, l'émetteur, la date d'expiration, et le nonce de CETTE
 * demande (protection contre le rejeu). Aucun code secret n'est nécessaire : rien à cacher,
 * rien à faire fuiter.
 *
 * On ne demande que l'identité : nom et adresse e-mail. Aucun accès à Gmail, Drive ou autre.
 */

const AUTORISATION = "https://accounts.google.com/o/oauth2/v2/auth";
const CLES = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function base64Url(octets: Uint8Array): string {
  return Buffer.from(octets).toString("base64url");
}

export function aleatoire(longueur = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(longueur)));
}

/** L'adresse publique du site telle que le visiteur la voit (domaine personnalisé ou adresse Vercel). */
export function origineDe(requete: Request): string {
  const url = new URL(requete.url);
  const hote = requete.headers.get("x-forwarded-host") ?? requete.headers.get("host") ?? url.host;
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(hote);
  const protocole = requete.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || (local ? "http" : "https");
  return `${local ? protocole : "https"}://${hote}`;
}

export function adresseRetour(requete: Request): string {
  return `${origineDe(requete)}/api/compte/google/retour`;
}

export function adresseAutorisation(p: { retour: string; etat: string; nonce: string }): string {
  const url = new URL(AUTORISATION);
  url.search = new URLSearchParams({
    client_id: identifiantClientGoogle(),
    redirect_uri: p.retour,
    response_type: "id_token",
    response_mode: "form_post",
    scope: "openid email profile",
    state: p.etat,
    nonce: p.nonce,
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export type IdentiteGoogle = { sub: string; email: string; nom: string };

/** Vérifie le jeton d'identité envoyé par Google et en tire l'identité. Tout défaut → null. */
export async function identiteDepuisJeton(jeton: string | null | undefined, nonce: string): Promise<IdentiteGoogle | null> {
  if (!jeton || jeton.length > 8192 || !nonce) return null;
  try {
    const { payload } = await jwtVerify(jeton, CLES, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: identifiantClientGoogle(),
      algorithms: ["RS256"],
      maxTokenAge: "1h",
    });
    if (payload.nonce !== nonce || typeof payload.sub !== "string" || !payload.sub) return null;
    // Une adresse que Google n'a pas vérifiée ne prouve rien : on la refuse.
    if (payload.email_verified !== true && payload.email_verified !== "true") return null;
    const email = typeof payload.email === "string" ? payload.email : "";
    const nom = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0] ?? "";
    return { sub: payload.sub, email, nom };
  } catch {
    return null;
  }
}
