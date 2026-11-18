/**
 * Modules réservés : « Les preuves de la véracité de l'islam » et « L'Islam authentique ».
 * On n'y entre qu'avec un mot de passe que le créateur donne lui-même (sur Instagram ou TikTok).
 * Ce mot de passe est DIFFÉRENT de celui du mode créateur.
 *
 * Ce module est utilisé par le proxy et par le serveur : il ne touche pas à la base par le
 * client Supabase (seulement par un fetch minimal, voir versionAccesModules) et n'emploie que
 * WebCrypto, jamais « node:crypto ».
 *
 * Principe :
 *   - le créateur choisit le mot de passe dans « Sécurité » ; la base garde son empreinte
 *     Argon2 et un numéro de version (table « reglages », clé « acces_modules ») ;
 *   - un visiteur qui donne le bon mot de passe reçoit un cookie signé (httpOnly) qui porte
 *     ce numéro de version et le compte Google avec lequel il l'a donné (ou aucun) ;
 *   - se déconnecter de son compte Google, ou en changer, referme les modules : il faut
 *     redonner le mot de passe ;
 *   - changer le mot de passe, ou « retirer l'accès à tout le monde », augmente la version :
 *     tous les cookies déjà donnés cessent aussitôt d'ouvrir les modules.
 */
import { SignJWT, jwtVerify } from "jose";

const EN_PRODUCTION = process.env.NODE_ENV === "production";

/** Le préfixe __Host- interdit au navigateur d'accepter ce cookie hors HTTPS ou depuis un sous-domaine. */
export const NOM_COOKIE_MODULES = EN_PRODUCTION ? "__Host-hr_modules" : "hr_modules";

/** Durée de l'accès sur un appareil, avant de redemander le mot de passe. */
export const DUREE_ACCES_JOURS = 30;

/** Clé de la ligne qui garde l'empreinte du mot de passe et sa version (table « reglages »). */
export const CLE_REGLAGE = "acces_modules";

/** Comptes à contacter pour obtenir le mot de passe. */
export const CONTACT = {
  instagram: { nom: "haqqreason", url: "https://www.instagram.com/haqqreason/" },
  tiktok: { nom: "Haqq_Reason", url: "https://www.tiktok.com/@haqq_reason" },
} as const;

/**
 * Tout ce qui montre le contenu des deux modules réservés, y compris le graphe de connaissances,
 * la recherche, le débat express, les nouveautés, les sources et les fichiers joints aux articles.
 * (Les catégories et articles de « L'Islam authentique » vivent aussi sous /explorer.)
 */
export const CHEMINS_RESERVES = [
  "/explorer",
  "/islam",
  "/graphe",
  "/recherche",
  "/debat",
  "/nouveautes",
  "/sources",
  "/fichiers",
  "/api/recherche",
  "/api/sens",
  "/api/apercu-noeud",
  "/api/articles-publies",
] as const;

export function cheminReserve(chemin: string): boolean {
  return CHEMINS_RESERVES.some((c) => chemin === c || chemin.startsWith(`${c}/`));
}

/** Le module à nommer sur la page du mot de passe. */
export function moduleDuChemin(chemin: string): "islam" | "preuves" {
  return chemin === "/islam" || chemin.startsWith("/islam/") ? "islam" : "preuves";
}

/** Adresse de retour acceptée après le mot de passe : un chemin réservé de ce site, rien d'autre. */
export function retourSur(valeur: unknown): string {
  if (typeof valeur !== "string" || !valeur.startsWith("/") || valeur.startsWith("//") || valeur.includes("\\")) return "/explorer";
  try {
    const url = new URL(valeur, "https://exemple.invalid");
    if (url.origin !== "https://exemple.invalid" || !cheminReserve(url.pathname) || url.pathname.startsWith("/api/")) return "/explorer";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/explorer";
  }
}

export function optionsCookieModules(maxAge: number = DUREE_ACCES_JOURS * 86400) {
  return {
    httpOnly: true,
    secure: EN_PRODUCTION,
    // « lax » : le cookie suit un lien ouvert depuis Instagram ou TikTok (navigation ordinaire),
    // mais jamais une requête envoyée en douce par un autre site.
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function cle(): Uint8Array | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  // Clé dérivée à part : un jeton d'accès aux modules ne peut jamais servir de session créateur.
  return new TextEncoder().encode(`${secret}|acces-modules`);
}

export async function signerAccesModules(version: number, compteId = ""): Promise<string> {
  const secret = cle();
  if (!secret) throw new Error("SESSION_SECRET manquant ou trop court.");
  return new SignJWT({ v: version, c: compteId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("modules")
    .setIssuedAt()
    .setExpirationTime(`${DUREE_ACCES_JOURS}d`)
    .sign(secret);
}

/**
 * Vrai si le jeton est authentique, non expiré, donné pour le mot de passe actuel,
 * et avec le même compte Google que celui de maintenant (ou sans compte, des deux côtés).
 */
export async function verifierAccesModules(jeton: string | undefined, versionActuelle: number | null, compteId = ""): Promise<boolean> {
  const secret = cle();
  if (!secret || !jeton || versionActuelle === null) return false;
  try {
    const { payload } = await jwtVerify(jeton, secret, { algorithms: ["HS256"], subject: "modules" });
    return payload.v === versionActuelle && (typeof payload.c === "string" ? payload.c : "") === compteId;
  } catch {
    return false;
  }
}

/** Forme stockée en base. Une empreinte vide veut dire : aucun mot de passe choisi, modules fermés. */
export type ReglageAcces = { empreinte: string; version: number };

export function lireReglageAcces(brut: unknown): ReglageAcces | null {
  if (!brut || typeof brut !== "object") return null;
  const { empreinte, version } = brut as Record<string, unknown>;
  if (typeof empreinte !== "string" || typeof version !== "number" || !Number.isInteger(version)) return null;
  return { empreinte, version };
}

let cache: { version: number | null; expire: number } | null = null;
const DUREE_CACHE_MS = 15_000;

/**
 * Version actuelle du mot de passe (null : aucun mot de passe, ou base injoignable → modules fermés).
 * Lue directement par l'API REST de la base, avec un court cache : le proxy s'en sert à chaque page réservée.
 */
export async function versionAccesModules(): Promise<number | null> {
  if (cache && cache.expire > Date.now()) return cache.version;
  let version: number | null = null;
  const url = process.env.SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (url && secret) {
    try {
      const reponse = await fetch(`${url.replace(/\/$/, "")}/rest/v1/reglages?cle=eq.${CLE_REGLAGE}&select=valeur`, {
        headers: { apikey: secret, Authorization: `Bearer ${secret}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (reponse.ok) {
        const lignes = (await reponse.json()) as { valeur: unknown }[];
        const reglage = lireReglageAcces(lignes[0]?.valeur);
        version = reglage && reglage.empreinte ? reglage.version : null;
      }
    } catch {
      version = null;
    }
  }
  cache = { version, expire: Date.now() + DUREE_CACHE_MS };
  return version;
}

/** À appeler après un changement : le serveur qui l'a fait n'attend pas la fin du cache. */
export function oublierVersionAccesModules(): void {
  cache = null;
}
