import type { NextConfig } from "next";

/**
 * En-têtes de sécurité appliqués à toutes les réponses.
 * La Content-Security-Policy (avec nonce unique par requête) est posée dans src/proxy.ts.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  // La CSP à nonce exige un rendu à la demande : le pré-rendu partiel est donc désactivé.
  cacheComponents: false,
  poweredByHeader: false,
  reactStrictMode: true,
  // Le texte des histoires et des dictées est rangé hors du dossier public (donnees/langues/) : il ne sort
  // que par ses routes, après vérification des droits Premium. Ces fichiers voyagent avec elles.
  outputFileTracingIncludes: {
    "/api/langues/histoires/**/*": ["./donnees/langues/histoires/**/*.json"],
    "/api/langues/dictees/**/*": ["./donnees/langues/**/*.json"],
  },
  experimental: {
    // Un long article (avec son historique d'enregistrement) peut dépasser la limite par défaut de 1 Mo.
    serverActions: { bodySizeLimit: "4mb" },
    // Le proxy (src/proxy.ts) lit chaque requête : au-delà de cette taille, il tronquerait le corps.
    // Le texte d'un gros PDF envoyé à l'assistant (jusqu'à 3 millions de caractères) doit passer entier.
    proxyClientMaxBodySize: "16mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Les modèles de L'Écorché portent l'empreinte de leur contenu dans leur nom : le navigateur peut les garder pour toujours.
      { source: "/corps/:fichier*.bin", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      // Le service hors-ligne doit toujours être relu, pour que les mises à jour arrivent vite.
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }, { key: "Content-Type", value: "application/javascript; charset=utf-8" }] },
    ];
  },
};

export default nextConfig;
