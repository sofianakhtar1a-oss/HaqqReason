/**
 * Les jetons de suivi des contributions envoyées depuis ce navigateur.
 * Ils restent sur l'appareil : c'est la seule clé de « Mes messages », sans compte ni adresse.
 */
import { SUIVIS_MAX } from "@/lib/contributions/modele";

const CLE = "haqqreason-contributions-suivies";
const EVENEMENT = "haqqreason-suivis";

export function lireJetons(): string[] {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? "[]");
    return Array.isArray(brut) ? brut.filter((j): j is string => typeof j === "string") : [];
  } catch {
    return [];
  }
}

export function ajouterJeton(jeton: string): void {
  try {
    const jetons = [jeton, ...lireJetons().filter((j) => j !== jeton)].slice(0, SUIVIS_MAX);
    localStorage.setItem(CLE, JSON.stringify(jetons));
    window.dispatchEvent(new Event(EVENEMENT));
  } catch {
    // Stockage indisponible (navigation privée stricte) : la contribution part quand même.
  }
}

export function oublierJeton(jeton: string): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(lireJetons().filter((j) => j !== jeton)));
    window.dispatchEvent(new Event(EVENEMENT));
  } catch {
    // rien à faire
  }
}

/** Prévient quand la liste change (nouvel envoi dans un autre onglet de la page). */
export function surChangement(rappel: () => void): () => void {
  const local = () => rappel();
  const autre = (e: StorageEvent) => {
    if (e.key === CLE) rappel();
  };
  window.addEventListener(EVENEMENT, local);
  window.addEventListener("storage", autre);
  return () => {
    window.removeEventListener(EVENEMENT, local);
    window.removeEventListener("storage", autre);
  };
}
