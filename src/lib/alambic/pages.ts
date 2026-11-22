/*
 * Organiser un PDF : la liste des pages et ce qu'on lui fait (pivoter, retirer, dupliquer, déplacer,
 * insérer une page blanche). Pur, sans PDF : testé dans tests/test-alambic-studio.mts.
 * L'écriture du PDF final suit cette liste (navigateur/organiser.ts).
 */

export type PageOrdonnee = {
  /** Identifiant stable (glisser-déposer, sélection). */
  cle: string;
  /** Le PDF d'où vient la page ; null pour une page blanche. */
  source: string | null;
  /** Numéro de la page dans sa source, à partir de 0. */
  index: number;
  /** Rotation ajoutée, en degrés (0, 90, 180, 270), dans le sens des aiguilles d'une montre. */
  rotation: number;
  /** Taille d'une page blanche, en points. */
  taille?: [number, number];
};

let compteur = 0;
export const nouvelleCle = () => `p${Date.now().toString(36)}-${(compteur++).toString(36)}`;

/** Les pages d'un PDF, dans l'ordre. */
export function pagesDe(source: string, nombre: number): PageOrdonnee[] {
  return Array.from({ length: nombre }, (_, index) => ({ cle: nouvelleCle(), source, index, rotation: 0 }));
}

const tourner = (angle: number, quart: number) => (((angle + quart * 90) % 360) + 360) % 360;

/** Pivote les pages choisies (toutes si aucune) d'un quart de tour : 1 à droite, -1 à gauche. */
export function pivoter(pages: PageOrdonnee[], cles: Set<string>, quart: 1 | -1 | 2): PageOrdonnee[] {
  const toutes = cles.size === 0;
  return pages.map((p) => (toutes || cles.has(p.cle) ? { ...p, rotation: tourner(p.rotation, quart) } : p));
}

export function retirer(pages: PageOrdonnee[], cles: Set<string>): PageOrdonnee[] {
  return pages.filter((p) => !cles.has(p.cle));
}

/** Duplique chaque page choisie juste après elle-même. */
export function dupliquer(pages: PageOrdonnee[], cles: Set<string>): PageOrdonnee[] {
  return pages.flatMap((p) => (cles.has(p.cle) ? [p, { ...p, cle: nouvelleCle() }] : [p]));
}

/** Inverse l'ordre des pages (utile pour un scan recto fait à l'envers). */
export function inverser(pages: PageOrdonnee[]): PageOrdonnee[] {
  return [...pages].reverse();
}

/** Où va une page blanche : après la dernière page choisie, ou à la fin. */
export function placeBlanche(pages: PageOrdonnee[], cles: Set<string>): number {
  for (let i = pages.length - 1; i >= 0; i--) if (cles.has(pages[i].cle)) return i + 1;
  return pages.length;
}

/** Insère une page blanche à cette place, à la taille donnée (celle de sa voisine, telle qu'on la voit). */
export function insererBlanche(pages: PageOrdonnee[], place: number, taille: [number, number] = [595.28, 841.89]): PageOrdonnee[] {
  const blanche: PageOrdonnee = { cle: nouvelleCle(), source: null, index: 0, rotation: 0, taille };
  return [...pages.slice(0, place), blanche, ...pages.slice(place)];
}

/** Déplace une page d'une place à une autre. */
export function deplacer<T>(liste: T[], de: number, vers: number): T[] {
  if (de === vers || de < 0 || vers < 0 || de >= liste.length || vers >= liste.length) return liste;
  const copie = [...liste];
  const [x] = copie.splice(de, 1);
  copie.splice(vers, 0, x);
  return copie;
}

/** Entrelace deux paquets (recto, puis verso à l'envers) : scan recto-verso fait en deux passes. */
export function entrelacer(rectos: PageOrdonnee[], versos: PageOrdonnee[], versosALEnvers = true): PageOrdonnee[] {
  const v = versosALEnvers ? [...versos].reverse() : versos;
  const sortie: PageOrdonnee[] = [];
  for (let i = 0; i < Math.max(rectos.length, v.length); i++) {
    if (rectos[i]) sortie.push(rectos[i]);
    if (v[i]) sortie.push(v[i]);
  }
  return sortie;
}

/** La liste a-t-elle changé par rapport au PDF d'origine (une seule source, pages dans l'ordre, sans rotation) ? */
export function estIntacte(pages: PageOrdonnee[], source: string, nombre: number): boolean {
  return pages.length === nombre && pages.every((p, i) => p.source === source && p.index === i && p.rotation === 0);
}
