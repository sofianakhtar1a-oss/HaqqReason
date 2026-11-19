/* Quelles pages demandent un compte, et où revenir après la connexion. Sans dépendance : sert aussi au navigateur. */

/** Les espaces personnels : il faut un compte pour y entrer (quand la connexion Google est réglée). */
const ESPACES_PERSONNELS = ["/utilisateur", "/ecrire", "/alambic", "/langues", "/monde", "/favoris", "/compte"];

export function espacePersonnel(chemin: string): boolean {
  return ESPACES_PERSONNELS.some((e) => chemin === e || chemin.startsWith(`${e}/`));
}

/** N'accepte qu'une adresse interne du site comme page de retour (jamais un autre site). */
export function retourSur(valeur: string | null | undefined): string {
  if (!valeur || !valeur.startsWith("/") || valeur.startsWith("//") || valeur.includes("\\") || valeur.length > 300) return "/utilisateur";
  if (/^\/(api|createur|connexion)(\/|$|\?)/.test(valeur)) return "/utilisateur";
  return valeur;
}
