/**
 * Liens entre articles : on écrit [[Titre d'un article]] ou [[Titre|texte affiché]] dans le texte.
 * Partagé entre le serveur (enregistrement) et l'affichage.
 */
export const RE_LIEN_INTERNE = /\[\[([^[\]\n]{1,300})\]\]/g;

/** Sépare « Titre|texte affiché ». */
export function partiesLien(brut: string): { cible: string; texte: string } {
  const i = brut.indexOf("|");
  const cible = (i >= 0 ? brut.slice(0, i) : brut).trim();
  const texte = (i >= 0 ? brut.slice(i + 1) : brut).trim() || cible;
  return { cible, texte };
}

/** Titres visés par les liens d'un texte (sans doublon, 200 au plus). */
export function extraireLiens(texte: string): string[] {
  const vus = new Map<string, string>();
  for (const m of texte.matchAll(RE_LIEN_INTERNE)) {
    const { cible } = partiesLien(m[1]);
    if (cible && !vus.has(cible.toLowerCase())) vus.set(cible.toLowerCase(), cible);
    if (vus.size >= 200) break;
  }
  return [...vus.values()];
}

/** Lien résolu : l'article visé, ou null si aucun article ne porte (encore) ce titre. */
export type LiensResolus = Record<string, { id: string; titre: string } | null>;
