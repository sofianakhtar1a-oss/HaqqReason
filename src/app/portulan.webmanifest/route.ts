/*
 * Le Portulan, installable à part : sa propre icône, son propre nom, et il s'ouvre sur /monde.
 * (Le reste du site garde son manifeste : /manifest.webmanifest.)
 */
export const dynamic = "force-static";

export function GET() {
  const manifeste = {
    id: "/monde",
    name: "Le Portulan · HaqqReason",
    short_name: "Le Portulan",
    description: "Apprendre la géographie : drapeaux, capitales, cartes, continents et monnaies, en jouant, même sans réseau.",
    lang: "fr",
    dir: "ltr",
    start_url: "/monde",
    scope: "/monde",
    display: "standalone",
    orientation: "any",
    background_color: "#0b1233",
    theme_color: "#0b1233",
    categories: ["education", "games", "travel"],
    icons: [
      { src: "/icones/portulan-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/portulan-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/portulan-masquable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icones/portulan.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Jouer", url: "/monde#accueil", icons: [{ src: "/icones/portulan-192.png", sizes: "192x192" }] },
      { name: "La carte", url: "/monde#carte", icons: [{ src: "/icones/portulan-192.png", sizes: "192x192" }] },
      { name: "Les duels", url: "/monde#duels", icons: [{ src: "/icones/portulan-192.png", sizes: "192x192" }] },
    ],
  };
  return new Response(JSON.stringify(manifeste), { headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
