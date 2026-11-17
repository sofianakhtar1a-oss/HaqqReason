/**
 * Historique de lecture et collections de favoris : gardés sur l'appareil, et recopiés sur le compte
 * quand on est connecté.
 */
import { tiroir } from "./compte";
import { noter } from "./synchro/journal";

export type Visite = { id: string; titre: string; date: string };
const CLE_HISTORIQUE = "hr-historique";
const CLE_COLLECTIONS = "hr-collections";
export const EVENEMENT_COLLECTIONS = "haqqreason:collections";

function lire<T>(cle: string, defaut: T): T {
  try {
    const brut = localStorage.getItem(tiroir(cle));
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}
function ecrire(cle: string, valeur: unknown) {
  try {
    localStorage.setItem(tiroir(cle), JSON.stringify(valeur));
  } catch {
    /* stockage plein ou désactivé */
  }
}

/* Pour la synchronisation : l'historique et les collections voyagent chacun d'un bloc. */
export function historiqueBrut(): Visite[] {
  return lireHistorique();
}
export function rangerHistorique(liste: unknown) {
  ecrire(CLE_HISTORIQUE, Array.isArray(liste) ? liste.slice(0, 300) : []);
}
export function rangerCollections(c: unknown) {
  ecrire(CLE_COLLECTIONS, c && typeof c === "object" && !Array.isArray(c) ? c : {});
  window.dispatchEvent(new Event(EVENEMENT_COLLECTIONS));
}

export function noterVisite(v: { id: string; titre: string }) {
  const liste = lire<Visite[]>(CLE_HISTORIQUE, []).filter((x) => x && x.id !== v.id);
  ecrire(CLE_HISTORIQUE, [{ ...v, date: new Date().toISOString() }, ...liste].slice(0, 300));
  void noter("reglages", "historique");
}
export function lireHistorique(): Visite[] {
  const l = lire<Visite[]>(CLE_HISTORIQUE, []);
  return Array.isArray(l) ? l.filter((x) => x && typeof x.id === "string") : [];
}
export function effacerHistorique() {
  ecrire(CLE_HISTORIQUE, []);
  void noter("reglages", "historique");
}

/** Collections : { nom → identifiants des articles favoris }. */
export type Collections = Record<string, string[]>;
let brutCollections: string | null = null;
let cacheCollections: Collections = {};
export function lireCollections(): Collections {
  let brut = "{}";
  try {
    brut = localStorage.getItem(tiroir(CLE_COLLECTIONS)) ?? "{}";
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
  void noter("reglages", "collections");
}
export function abonnerCollections(rappel: () => void) {
  window.addEventListener(EVENEMENT_COLLECTIONS, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT_COLLECTIONS, rappel);
    window.removeEventListener("storage", rappel);
  };
}
