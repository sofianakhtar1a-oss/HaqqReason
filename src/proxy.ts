import { NextResponse, type NextRequest } from "next/server";
import { NOM_COOKIE, NOM_COOKIE_APPAREIL, optionsCookie, signerSession, verifierSession } from "@/lib/session-token";

/** Pages du mode créateur accessibles sans être connecté. */
const PAGES_OUVERTES = ["/createur/connexion", "/createur/configuration", "/createur/recuperation"];

/**
 * S'exécute avant chaque page :
 * 1. pose une Content-Security-Policy stricte avec un nonce unique par requête ;
 * 2. écarte tout de suite les visiteurs non connectés de l'espace créateur ;
 * 3. prolonge la session du créateur tant qu'il est actif.
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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${stockage}`,
    "font-src 'self' data:",
    `connect-src 'self'${stockage}${dev ? " ws: wss:" : ""}`,
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

  const enTetes = new Headers(request.headers);
  enTetes.set("x-nonce", nonce);
  enTetes.set("Content-Security-Policy", csp);

  const reponse = NextResponse.next({ request: { headers: enTetes } });
  reponse.headers.set("Content-Security-Policy", csp);
  if (zoneCreateur) {
    reponse.headers.set("Cache-Control", "no-store");
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
