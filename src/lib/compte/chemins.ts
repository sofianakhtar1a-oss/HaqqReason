/* Quelles pages demandent un compte, et où revenir après la connexion. Sans dépendance : sert aussi au navigateur. */

/** Les espaces personnels : il faut un compte pour y entrer (quand la connexion Google est réglée). */
const ESPACES_PERSONNELS = ["/utilisateur", "/ecrire", "/alambic", "/langues", "/monde", "/favoris", "/compte"];

/**
 * Ce qui, sous le Portulan, reste ouvert à tous : la page de chaque pays, les invitations à un duel
 * (pour les moteurs de recherche et les aperçus de liens), et ses fichiers (drapeaux, cartes).
 */
const OUVERTS = [/^\/monde\/(pays|rejoindre)(\/|$)/, /^\/monde\/(drapeaux|emblemes)\//, /^\/monde\/[^/]+\.(json|svg|webp|png)$/];

export function espacePersonnel(chemin: string): boolean {
  if (OUVERTS.some((r) => r.test(chemin))) return false;
  return ESPACES_PERSONNELS.some((e) => chemin === e || chemin.startsWith(`${e}/`));
}

/** N'accepte qu'une adresse interne du site comme page de retour (jamais un autre site). */
export function retourSur(valeur: string | null | undefined): string {
  if (!valeur || !valeur.startsWith("/") || valeur.startsWith("//") || valeur.includes("\\") || valeur.length > 300) return "/utilisateur";
  if (/^\/(api|createur|connexion)(\/|$|\?)/.test(valeur)) return "/utilisateur";
  return valeur;
}
