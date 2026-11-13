import type { MetadataRoute } from "next";
import { adresseDuSite } from "@/lib/site";

/** Les moteurs de recherche lisent le contenu public, jamais l'espace créateur ni les pages d'impression. */
export default function robots(): MetadataRoute.Robots {
  const site = adresseDuSite();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/createur", "/api/", "/fichiers/", "/explorer/article/*/imprimer", "/explorer/categorie/*/imprimer"] }],
    sitemap: new URL("/sitemap.xml", site).toString(),
    host: site.origin,
  };
}
