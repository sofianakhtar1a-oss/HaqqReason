/**
 * Découpage d'un article en morceaux, avant d'en calculer le sens.
 * Module pur, partagé entre le serveur et les tests : il ne touche ni à la base ni au réseau.
 *
 * Pourquoi découper : un vecteur résume un texte. Sur un article de dix pages, ce résumé
 * devient flou et la recherche perd en précision. Plusieurs morceaux donnent plusieurs
 * points d'entrée : la question du lecteur peut correspondre à un seul passage.
 */

export const LIMITES_SENS = {
  /** Caractères par morceau. Environ 900 jetons : large marge sous la limite des services. */
  taille: 3000,
  /** Reprise du morceau précédent, pour ne pas couper une idée en deux. */
  recouvrement: 300,
  /** Plafond par article, pour borner la dépense. */
  morceaux: 12,
  /** En deçà, le morceau n'apporte rien. */
  minimum: 80,
} as const;

/** Coupe au dernier point, point d'interrogation ou retour à la ligne avant la limite. */
function couperProprement(texte: string, limite: number): number {
  if (texte.length <= limite) return texte.length;
  const fenetre = texte.slice(0, limite);
  for (const marque of ["\n\n", ". ", " ? ", " ! ", "\n", " "]) {
    const position = fenetre.lastIndexOf(marque);
    if (position > limite * 0.5) return position + marque.length;
  }
  return limite;
}

/**
 * Morceaux d'un article. Le premier porte toujours le titre et le résumé :
 * c'est lui qui répond aux questions générales (« parle-moi de X »).
 */
export function decouperArticle(titre: string, resume: string, texte: string): string[] {
  const entete = [titre.trim(), resume.trim()].filter(Boolean).join("\n\n");
  const corps = texte.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  const morceaux: string[] = [];
  let reste = corps;

  while (reste.length > 0 && morceaux.length < LIMITES_SENS.morceaux) {
    // Le premier morceau laisse la place à l'en-tête, qui lui est ajouté ensuite.
    const place = morceaux.length === 0 ? Math.max(500, LIMITES_SENS.taille - entete.length - 2) : LIMITES_SENS.taille;
    const coupe = couperProprement(reste, place);
    const morceau = reste.slice(0, coupe).trim();
    if (morceau.length >= LIMITES_SENS.minimum || morceaux.length === 0) morceaux.push(morceau);
    if (coupe >= reste.length) break;
    reste = reste.slice(Math.max(1, coupe - LIMITES_SENS.recouvrement)).trimStart();
  }

  if (morceaux.length === 0) return entete ? [entete] : [];
  morceaux[0] = entete ? `${entete}\n\n${morceaux[0]}`.trim() : morceaux[0];
  return morceaux.filter((m) => m.length > 0);
}

/** Normalise un vecteur : sa longueur devient 1, pour que le produit scalaire soit le cosinus. */
export function normaliser(vecteur: number[]): number[] {
  let somme = 0;
  for (const v of vecteur) somme += v * v;
  const norme = Math.sqrt(somme);
  if (!Number.isFinite(norme) || norme === 0) return vecteur.map(() => 0);
  return vecteur.map((v) => v / norme);
}

/** Vérifie qu'un vecteur reçu d'un service extérieur est utilisable. */
export function vecteurValide(valeur: unknown, dimensions?: number): valeur is number[] {
  return (
    Array.isArray(valeur) &&
    valeur.length >= 8 &&
    valeur.length <= 3072 &&
    (dimensions === undefined || valeur.length === dimensions) &&
    valeur.every((v) => typeof v === "number" && Number.isFinite(v))
  );
}
