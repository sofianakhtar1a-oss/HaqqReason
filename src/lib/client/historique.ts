/**
 * Historique de lecture et collections de favoris : gardés dans l'appareil uniquement.
 */
export type Visite = { id: string; titre: string; date: string };
const CLE_HISTORIQUE = "hr-historique";
const CLE_COLLECTIONS = "hr-collections";
export const EVENEMENT_COLLECTIONS = "haqqreason:collections";

function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}
function ecrire(cle: string, valeur: unknown) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    /* stockage plein ou désactivé */
  }
}

export function noterVisite(v: { id: string; titre: string }) {
  const liste = lire<Visite[]>(CLE_HISTORIQUE, []).filter((x) => x && x.id !== v.id);
  ecrire(CLE_HISTORIQUE, [{ ...v, date: new Date().toISOString() }, ...liste].slice(0, 300));
}
export function lireHistorique(): Visite[] {
  const l = lire<Visite[]>(CLE_HISTORIQUE, []);
  return Array.isArray(l) ? l.filter((x) => x && typeof x.id === "string") : [];
}
export function effacerHistorique() {
  ecrire(CLE_HISTORIQUE, []);
}

/** Collections : { nom → identifiants des articles favoris }. */
export type Collections = Record<string, string[]>;
let brutCollections: string | null = null;
let cacheCollections: Collections = {};
export function lireCollections(): Collections {
  let brut = "{}";
  try {
    brut = localStorage.getItem(CLE_COLLECTIONS) ?? "{}";
  } catch {
    /* désactivé */
  }
  if (brut !== brutCollections) {
    brutCollections = brut;
    try {
      const j = JSON.parse(brut);
      cacheCollections = j && typeof j === "object" && !Array.isArray(j) ? j : {};
    } catch {
      cacheCollections = {};
    }
  }
  return cacheCollections;
}
export function ecrireCollections(c: Collections) {
  ecrire(CLE_COLLECTIONS, c);
  window.dispatchEvent(new Event(EVENEMENT_COLLECTIONS));
}
export function abonnerCollections(rappel: () => void) {
  window.addEventListener(EVENEMENT_COLLECTIONS, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT_COLLECTIONS, rappel);
    window.removeEventListener("storage", rappel);
  };
}
