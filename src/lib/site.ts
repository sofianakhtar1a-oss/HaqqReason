/** Adresse publique du site, pour les liens de partage, le plan du site et les moteurs de recherche. */
export function adresseDuSite(): URL {
  const brute = process.env.SITE_URL?.trim() || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  try {
    return new URL(brute);
  } catch {
    return new URL("http://localhost:3000");
  }
}
