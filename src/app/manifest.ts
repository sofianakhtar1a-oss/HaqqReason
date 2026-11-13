import type { MetadataRoute } from "next";

/** Permet d'installer HaqqReason sur l'écran d'accueil d'un téléphone Android (et sur ordinateur). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "HaqqReason",
    short_name: "HaqqReason",
    description: "Bibliothèque d'apologétique islamique : la véracité de l'islam, la défense de l'islam, la réfutation des autres croyances.",
    lang: "fr",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b1233",
    theme_color: "#0b1233",
    categories: ["books", "education", "reference"],
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-masquable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "Rechercher", url: "/recherche", icons: [{ src: "/icones/icone-192.png", sizes: "192x192" }] },
      { name: "Débat express", url: "/debat", icons: [{ src: "/icones/icone-192.png", sizes: "192x192" }] },
      { name: "Mes favoris", url: "/favoris", icons: [{ src: "/icones/icone-192.png", sizes: "192x192" }] },
    ],
  };
}
