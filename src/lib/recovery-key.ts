/** Format de la clé de récupération. Module partagé entre le serveur et le navigateur. */

/** Sans caractères ambigus : pas de 0/O, pas de 1/I/L. */
export const ALPHABET_CLE = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const GROUPES_CLE = 5;
export const TAILLE_GROUPE = 4;

/** « ABCDEFGH… » -> ["ABCD", "EFGH", …] */
export function groupesDeCle(brute: string): string[] {
  const groupes: string[] = [];
  for (let i = 0; i < brute.length; i += TAILLE_GROUPE) {
    groupes.push(brute.slice(i, i + TAILLE_GROUPE));
  }
  return groupes;
}

export function formaterCle(brute: string): string {
  return groupesDeCle(brute).join("-");
}

/** Nettoie une saisie (espaces, tirets, minuscules). Renvoie null si le format est invalide. */
export function normaliserCle(saisie: string): string | null {
  const brute = saisie.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (brute.length !== GROUPES_CLE * TAILLE_GROUPE) return null;
  for (const caractere of brute) {
    if (!ALPHABET_CLE.includes(caractere)) return null;
  }
  return brute;
}
