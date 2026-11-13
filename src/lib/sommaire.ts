import { LIMITES_DOCUMENT, NOEUDS, type NoeudJSON } from "./document-schema";
import { partiesLien, RE_LIEN_INTERNE } from "./liens";

export type EntreeSommaire = { id: string; niveau: 2 | 3 | 4; texte: string };

/**
 * Titres d'un article, dans l'ordre où l'affichage les numérote (section-1, section-2…).
 * Le parcours suit exactement celui de RenduDocument : mêmes nœuds autorisés, même profondeur maximale.
 */
export function sommaireDuDocument(document: unknown): EntreeSommaire[] {
  const entrees: EntreeSommaire[] = [];
  let compteur = 0;
  const texteDe = (n: NoeudJSON): string =>
    n.type === "text" ? (n.text ?? "") : (n.content ?? []).map(texteDe).join(n.type === "hardBreak" ? " " : "");
  const parcourir = (n: NoeudJSON, profondeur: number) => {
    if (profondeur > LIMITES_DOCUMENT.profondeur || !Object.hasOwn(NOEUDS, n.type)) return;
    if (n.type === "heading") {
      compteur++;
      const niveau = Math.min(4, Math.max(2, Number(n.attrs?.level) || 2)) as 2 | 3 | 4;
      const texte = texteDe(n).replace(RE_LIEN_INTERNE, (_, brut: string) => partiesLien(brut).texte).trim();
      if (texte) entrees.push({ id: `section-${compteur}`, niveau, texte: texte.slice(0, 160) });
      return;
    }
    for (const e of n.content ?? []) parcourir(e, profondeur + 1);
  };
  if (document && typeof document === "object") for (const e of (document as NoeudJSON).content ?? []) parcourir(e, 1);
  return entrees;
}
