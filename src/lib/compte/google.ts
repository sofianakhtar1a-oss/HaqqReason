import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/*
 * Connexion avec Google (OpenID Connect, parcours « code d'autorisation » avec PKCE).
 * On ne demande que l'identité : nom et adresse e-mail. Aucun accès à Gmail, Drive ou autre.
 * Le secret du client Google ne quitte jamais le serveur.
 */

const AUTORISATION = "https://accounts.google.com/o/oauth2/v2/auth";
const ECHANGE = "https://oauth2.googleapis.com/token";
const CLES = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function reglages(): { id: string; secret: string } {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("Connexion Google non réglée.");
  return { id, secret };
}

function base64Url(octets: Uint8Array): string {
  return Buffer.from(octets).toString("base64url");
}

export function aleatoire(longueur = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(longueur)));
}

export async function defiPkce(verificateur: string): Promise<string> {
  return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verificateur))));
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

export function adresseAutorisation(p: { retour: string; etat: string; nonce: string; defi: string }): string {
  const url = new URL(AUTORISATION);
  url.search = new URLSearchParams({
    client_id: reglages().id,
    redirect_uri: p.retour,
    response_type: "code",
    scope: "openid email profile",
    state: p.etat,
    nonce: p.nonce,
    code_challenge: p.defi,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export type IdentiteGoogle = { sub: string; email: string; nom: string };

/** Échange le code reçu contre l'identité, et vérifie la signature de Google. */
export async function identiteDepuisCode(p: { code: string; verificateur: string; retour: string; nonce: string }): Promise<IdentiteGoogle | null> {
  const { id, secret } = reglages();
  let jeton = "";
  try {
    const reponse = await fetch(ECHANGE, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: p.code, client_id: id, client_secret: secret, redirect_uri: p.retour, grant_type: "authorization_code", code_verifier: p.verificateur }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!reponse.ok) return null;
    const corps = (await reponse.json()) as { id_token?: unknown };
    if (typeof corps.id_token !== "string") return null;
    jeton = corps.id_token;
  } catch {
    return null;
  }
  try {
    const { payload } = await jwtVerify(jeton, CLES, { issuer: ["https://accounts.google.com", "accounts.google.com"], audience: id });
    if (payload.nonce !== p.nonce || typeof payload.sub !== "string" || !payload.sub) return null;
    // Une adresse que Google n'a pas vérifiée ne prouve rien : on la refuse.
    if (payload.email_verified !== true && payload.email_verified !== "true") return null;
    const email = typeof payload.email === "string" ? payload.email : "";
    const nom = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0] ?? "";
    return { sub: payload.sub, email, nom };
  } catch {
    return null;
  }
}
