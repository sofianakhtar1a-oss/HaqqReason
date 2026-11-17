/**
 * Favoris du lecteur : gardés sur l'appareil, et recopiés sur son compte quand il est connecté.
 * Chaque favori est aussi mis de côté par le service hors-ligne pour rester lisible sans connexion.
 */
import { tiroir } from "./compte";
import { noter } from "./synchro/journal";

export type Favori = { id: string; titre: string; resume: string; ajoute: string };
const cle = () => tiroir("hr-favoris");
export const EVENEMENT_FAVORIS = "haqqreason:favoris";

export function lireFavoris(): Favori[] {
  try {
    const brut = JSON.parse(localStorage.getItem(cle()) ?? "[]");
    return Array.isArray(brut) ? brut.filter((f) => f && typeof f.id === "string" && typeof f.titre === "string") : [];
  } catch {
    return [];
  }
}

function ecrire(liste: Favori[]): void {
  try {
    localStorage.setItem(cle(), JSON.stringify(liste.slice(0, 500)));
  } catch {
    /* stockage plein ou désactivé */
  }
  window.dispatchEvent(new Event(EVENEMENT_FAVORIS));
}

/** Demande au service hors-ligne de garder (ou d'oublier) une page. */
export function garderHorsLigne(urls: string[], oublier = false): void {
  navigator.serviceWorker?.controller?.postMessage({ type: oublier ? "oublier" : "garder", urls });
}

export function basculerFavori(f: Omit<Favori, "ajoute">): boolean {
  const liste = lireFavoris();
  const present = liste.some((x) => x.id === f.id);
  const url = `/explorer/article/${f.id}`;
  if (present) {
    ecrire(liste.filter((x) => x.id !== f.id));
    garderHorsLigne([url], true);
    void noter("favoris", f.id);
    return false;
  }
  ecrire([{ ...f, ajoute: new Date().toISOString() }, ...liste]);
  garderHorsLigne([url]);
  void noter("favoris", f.id);
  return true;
}

/** Pour la synchronisation : range (ou retire) un favori venu d'un autre appareil, sans rien noter au journal. */
export function rangerFavori(id: string, f: Favori | null): void {
  const liste = lireFavoris().filter((x) => x.id !== id);
  const url = `/explorer/article/${id}`;
  if (f && typeof f.titre === "string") {
    const range: Favori = { id, titre: f.titre, resume: String(f.resume ?? ""), ajoute: String(f.ajoute ?? new Date().toISOString()) };
    ecrire([...liste, range].sort((a, b) => b.ajoute.localeCompare(a.ajoute)));
    garderHorsLigne([url]);
  } else {
    ecrire(liste);
    garderHorsLigne([url], true);
  }
}

// Lecture « réactive » des favoris, pour useSyncExternalStore.
let brutEnCache: string | null = null;
let listeEnCache: Favori[] = [];
export function instantaneFavoris(): Favori[] {
  let brut = "[]";
  try {
    brut = localStorage.getItem(cle()) ?? "[]";
  } catch {
    /* stockage désactivé */
  }
  if (brut !== brutEnCache) {
    brutEnCache = brut;
    listeEnCache = lireFavoris();
  }
  return listeEnCache;
}
export function abonnerFavoris(rappel: () => void): () => void {
  window.addEventListener(EVENEMENT_FAVORIS, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT_FAVORIS, rappel);
    window.removeEventListener("storage", rappel);
  };
}
export function abonnerConnexion(rappel: () => void): () => void {
  window.addEventListener("online", rappel);
  window.addEventListener("offline", rappel);
  return () => {
    window.removeEventListener("online", rappel);
    window.removeEventListener("offline", rappel);
  };
}
