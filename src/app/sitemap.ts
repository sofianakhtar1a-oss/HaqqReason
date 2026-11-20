import type { MetadataRoute } from "next";
import { cheminReserve } from "@/lib/acces-modules-jeton";
import { PAYS } from "@/lib/monde/donnees";
import { adressePays } from "@/lib/monde/pages-publiques";
import { adresseDuSite } from "@/lib/site";

export const revalidate = 3600;

/**
 * Plan du site pour Google, Bing… : uniquement les pages ouvertes à tous.
 * Les deux modules réservés (preuves de la véracité de l'islam, Islam authentique), le graphe,
 * la recherche et leurs articles demandent un mot de passe : ils n'y figurent donc pas.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = adresseDuSite();
  const url = (chemin: string) => new URL(chemin, site).toString();
  const pages: MetadataRoute.Sitemap = ["/", "/sophismes", "/contribuer", "/utilisateur", "/alambic", "/langues", "/monde", "/monde/pays", "/corps", "/confidentialite", "/conditions"]
    .filter((c) => !cheminReserve(c))
    .map((c) => ({ url: url(c), changeFrequency: "weekly", priority: c === "/" ? 1 : 0.6 }));
  // Le Portulan : une page publique par pays (capitale, drapeau, chiffres, devise, histoire).
  const pays: MetadataRoute.Sitemap = PAYS.map((p) => ({ url: url(adressePays(p)), changeFrequency: "monthly", priority: 0.5 }));
  return [...pages, ...pays];
}
