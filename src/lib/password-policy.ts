/** Règles du mot de passe créateur. Module partagé entre le serveur et le navigateur. */

export const LONGUEUR_MIN = 12;
export const LONGUEUR_MAX = 128;

export type Robustesse = {
  /** 0 = refusé, 1 = faible, 2 = correct, 3 = solide, 4 = excellent */
  score: 0 | 1 | 2 | 3 | 4;
  libelle: string;
  /** Raisons bloquantes : le mot de passe est refusé tant que cette liste n'est pas vide. */
  problemes: string[];
};

const LIBELLES = ["Refusé", "Faible", "Correct", "Solide", "Excellent"] as const;
const MOTIFS_COURANTS = ["haqqreason", "password", "motdepasse", "azerty", "qwerty", "123456", "abcdef", "islam", "sofian"];

export function evaluerMotDePasse(motDePasse: string): Robustesse {
  const problemes: string[] = [];
  const longueur = [...motDePasse].length;
  const minuscule = motDePasse.toLowerCase();

  if (longueur < LONGUEUR_MIN) problemes.push(`Au moins ${LONGUEUR_MIN} caractères.`);
  if (longueur > LONGUEUR_MAX) problemes.push(`Au plus ${LONGUEUR_MAX} caractères.`);
  if (longueur > 0 && new Set(motDePasse).size <= 4) problemes.push("Trop peu de caractères différents.");
  const motif = MOTIFS_COURANTS.find((m) => minuscule.includes(m));
  if (motif) problemes.push(`Ne doit pas contenir « ${motif} ».`);

  if (problemes.length > 0) {
    return { score: 0, libelle: LIBELLES[0], problemes };
  }

  const familles =
    Number(/[a-z]/.test(motDePasse)) +
    Number(/[A-Z]/.test(motDePasse)) +
    Number(/[0-9]/.test(motDePasse)) +
    Number(/[^A-Za-z0-9]/.test(motDePasse));
  const diversite = new Set(motDePasse).size;

  let points = 0;
  if (longueur >= 14) points++;
  if (longueur >= 18) points++;
  if (longueur >= 24) points++;
  if (familles >= 3) points++;
  if (diversite >= 10) points++;

  const score = Math.max(1, Math.min(4, points)) as 1 | 2 | 3 | 4;
  return { score, libelle: LIBELLES[score], problemes: [] };
}
