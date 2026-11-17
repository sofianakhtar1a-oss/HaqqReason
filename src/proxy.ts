import { NextResponse, type NextRequest } from "next/server";
import { RELAIS_CONNUS } from "@/lib/alambic/transcription/vtt";
import { espacePersonnel, googleConfigure, NOM_COOKIE_COMPTE, NOM_COOKIE_VUE, optionsCookieCompte, optionsCookieVue, signerCompte, verifierCompte } from "@/lib/compte/jeton";
import { NOM_COOKIE, NOM_COOKIE_APPAREIL, optionsCookie, signerSession, verifierSession } from "@/lib/session-token";

/** Pages du mode créateur accessibles sans être connecté. */
const PAGES_OUVERTES = ["/createur/connexion", "/createur/configuration", "/createur/recuperation"];

/**
 * S'exécute avant chaque page :
 * 1. pose une Content-Security-Policy stricte avec un nonce unique par requête ;
 * 2. écarte tout de suite les visiteurs non connectés de l'espace créateur ;
 * 3. prolonge la session du créateur tant qu'il est actif ;
 * 4. demande un compte (connexion Google) à l'entrée des espaces personnels ;
 * 5. signale à la page que le créateur regarde le site « comme un utilisateur ».
 * La vérification qui fait foi reste celle de chaque page et de chaque action (lib/session.ts).
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const dev = process.env.NODE_ENV === "development";
  // Origine de l'espace de stockage : le navigateur y envoie les fichiers et y lit les liens temporaires.
  let stockage = "";
  try {
    stockage = process.env.SUPABASE_URL ? ` ${new URL(process.env.SUPABASE_URL).origin}` : "";
  } catch {
    stockage = "";
  }
  const csp = [
    "default-src 'self'",
    // 'wasm-unsafe-eval' : le lecteur PDF décode certaines images (JPEG 2000, JBIG2) et les
    // profils de couleur avec des modules WebAssembly servis par l'application. Sans cette
    // autorisation, ces documents-là refusent de s'ouvrir. Elle n'autorise QUE WebAssembly,
    // jamais eval() ni l'exécution de code arbitraire.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    // i.ytimg.com : vignettes des vidéos YouTube collées dans L'Alambic (outil « Transcrire »).
    `img-src 'self' data: blob: https://i.ytimg.com${stockage}`,
    // Lecteur YouTube officiel (domaine sans cookie), pour lire une vidéo comme un livre.
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
    // L'Alambic : aperçu des sons et vidéos de l'appareil (adresses blob: locales, rien ne sort).
    "media-src 'self' blob:",
    "font-src 'self' data:",
    // data: : les encodeurs MP3 et FLAC de L'Alambic lisent leur moteur WebAssembly, intégré au code
    // lui-même. Une adresse data: ne sort jamais de la page : elle n'ouvre aucune connexion.
    // Relais Invidious : L'Alambic y lit les sous-titres et le son d'une vidéo YouTube (YouTube bloque les serveurs).
    `connect-src 'self' data:${stockage} ${RELAIS_CONNUS.map((h) => `https://${h}`).join(" ")}${dev ? " ws: wss:" : ""}`,
    // Lecteur PDF et reconnaissance de texte : leurs « workers » sont servis par l'application.
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    // Pas de mise à niveau forcée vers https quand Supabase tourne en local (http://127.0.0.1) : cela casserait les images.
    ...(dev || /^ http:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(stockage) ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const chemin = request.nextUrl.pathname;
  const session = await verifierSession(request.cookies.get(NOM_COOKIE)?.value, {
    idAppareil: request.cookies.get(NOM_COOKIE_APPAREIL)?.value,
    userAgent: request.headers.get("user-agent"),
  });

  const zoneCreateur = chemin === "/createur" || chemin.startsWith("/createur/");
  const pageOuverte = PAGES_OUVERTES.some((page) => chemin === page || chemin.startsWith(`${page}/`));
  if (zoneCreateur && !pageOuverte && !session) {
    // Renvoi vers l'accueil, jamais vers la page demandée : une adresse d'article recopiée
    // ailleurs ne révèle donc rien, et il faut repasser par le mot de passe.
    const redirection = NextResponse.redirect(new URL("/", request.url));
    redirection.headers.set("Content-Security-Policy", csp);
    // Un cookie périmé ou recopié est effacé tout de suite.
    if (request.cookies.has(NOM_COOKIE)) redirection.cookies.set(NOM_COOKIE, "", { ...optionsCookie(), maxAge: 0 });
    return redirection;
  }

  // « Voir comme un utilisateur » : demandé par le créateur depuis son espace (cookie à part).
  const vueDemandee = request.cookies.get(NOM_COOKIE_VUE)?.value === "1";

  // Les espaces personnels demandent un compte. Tant que la connexion Google n'est pas réglée
  // sur le serveur, ils restent ouverts comme avant. Chaque page revérifie (lib/compte/session.ts).
  // Le créateur connecté y entre sans compte (pour l'aperçu de ses brouillons), sauf dans la vue
  // utilisateur, où il est traité exactement comme un visiteur.
  const compte = await verifierCompte(request.cookies.get(NOM_COOKIE_COMPTE)?.value);
  const createurChezLui = session !== null && !vueDemandee;
  if (!compte && !createurChezLui && request.method === "GET" && googleConfigure() && espacePersonnel(chemin)) {
    const connexion = new URL("/connexion", request.url);
    connexion.searchParams.set("retour", `${chemin}${request.nextUrl.search}`);
    const redirection = NextResponse.redirect(connexion);
    redirection.headers.set("Content-Security-Policy", csp);
    redirection.headers.set("Cache-Control", "no-store");
    if (request.cookies.has(NOM_COOKIE_COMPTE)) redirection.cookies.set(NOM_COOKIE_COMPTE, "", optionsCookieCompte(0));
    return redirection;
  }

  // La vue utilisateur n'existe que pour le créateur connecté, hors de son espace.
  const vueUtilisateur = vueDemandee && session !== null && !zoneCreateur;

  // Dans la vue utilisateur, la carte « Mode créateur » de l'accueil ramène simplement le créateur
  // chez lui (comme le bouton du haut), au lieu de fermer sa session et de redemander son mot de passe.
  if (vueDemandee && session !== null && chemin === "/createur/connexion" && request.method === "GET") {
    const retour = NextResponse.redirect(new URL("/createur", request.url));
    retour.headers.set("Content-Security-Policy", csp);
    retour.headers.set("Cache-Control", "no-store");
    retour.cookies.set(NOM_COOKIE_VUE, "", optionsCookieVue(0));
    return retour;
  }

  const enTetes = new Headers(request.headers);
  enTetes.set("x-nonce", nonce);
  enTetes.set("Content-Security-Policy", csp);
  // Cet en-tête ne vient jamais du navigateur : il est réécrit ici à chaque requête.
  enTetes.delete("x-vue-utilisateur");
  if (vueUtilisateur) enTetes.set("x-vue-utilisateur", "1");

  const reponse = NextResponse.next({ request: { headers: enTetes } });
  reponse.headers.set("Content-Security-Policy", csp);
  if (zoneCreateur || vueUtilisateur || espacePersonnel(chemin) || chemin === "/connexion") {
    reponse.headers.set("Cache-Control", "no-store");
  }
  // Revenir dans l'espace créateur, par n'importe quel chemin, quitte la vue utilisateur.
  // Elle s'éteint aussi d'elle-même si la session du créateur a expiré.
  if (vueDemandee && request.method === "GET" && (zoneCreateur || session === null)) {
    reponse.cookies.set(NOM_COOKIE_VUE, "", optionsCookieVue(0));
  }
  // Session utilisateur glissante : le cookie est renouvelé au plus une fois par jour.
  if (compte && request.method === "GET" && Date.now() / 1000 - (compte.emis ?? 0) > 86400) {
    reponse.cookies.set(NOM_COOKIE_COMPTE, await signerCompte(compte), optionsCookieCompte());
  }

  // Entrer dans le mode créateur par sa porte (« Mode créateur ») ferme toute session ouverte :
  // le mot de passe est redemandé à chaque fois, même si l'on s'était connecté peu avant.
  if (chemin === "/createur/connexion" && request.method === "GET") {
    if (request.cookies.has(NOM_COOKIE)) reponse.cookies.set(NOM_COOKIE, "", { ...optionsCookie(), maxAge: 0 });
    return reponse;
  }

  // Session glissante : uniquement sur les lectures, pour ne jamais interférer avec une déconnexion.
  if (session && request.method === "GET") {
    reponse.cookies.set(NOM_COOKIE, await signerSession(session), optionsCookie(session.ina));
  }
  return reponse;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|vendor/|icones/|sw.js|favicon.ico|icon.svg|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
