/**
 * Les jetons de suivi des contributions envoyées depuis ce navigateur : c'est la seule clé
 * de « Mes messages ». Ils restent sur l'appareil et, avec un compte, le suivent d'un appareil à l'autre.
 */
import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";
import { SUIVIS_MAX } from "@/lib/contributions/modele";

const NOM = "haqqreason-contributions-suivies";
const cle = () => tiroir(NOM);
const EVENEMENT = "haqqreason-suivis";

export function lireJetons(): string[] {
  try {
    const brut = JSON.parse(localStorage.getItem(cle()) ?? "[]");
    return Array.isArray(brut) ? brut.filter((j): j is string => typeof j === "string") : [];
  } catch {
    return [];
  }
}

export function ajouterJeton(jeton: string): void {
  try {
    const jetons = [jeton, ...lireJetons().filter((j) => j !== jeton)].slice(0, SUIVIS_MAX);
    localStorage.setItem(cle(), JSON.stringify(jetons));
    window.dispatchEvent(new Event(EVENEMENT));
    void noter("reglages", "contributions");
  } catch {
    // Stockage indisponible (navigation privée stricte) : la contribution part quand même.
  }
}

export function oublierJeton(jeton: string): void {
  try {
    localStorage.setItem(cle(), JSON.stringify(lireJetons().filter((j) => j !== jeton)));
    window.dispatchEvent(new Event(EVENEMENT));
    void noter("reglages", "contributions");
  } catch {
    // rien à faire
  }
}

/** Pour la synchronisation : range les jetons venus d'un autre appareil, sans rien noter au journal. */
export function rangerJetons(jetons: unknown): void {
  try {
    const propres = Array.isArray(jetons) ? jetons.filter((j): j is string => typeof j === "string").slice(0, SUIVIS_MAX) : [];
    localStorage.setItem(cle(), JSON.stringify(propres));
    window.dispatchEvent(new Event(EVENEMENT));
  } catch {
    // rien à faire
  }
}

/** Prévient quand la liste change (nouvel envoi dans un autre onglet de la page). */
export function surChangement(rappel: () => void): () => void {
  const local = () => rappel();
  const autre = (e: StorageEvent) => {
    if (e.key === cle()) rappel();
  };
  window.addEventListener(EVENEMENT, local);
  window.addEventListener("storage", autre);
  return () => {
    window.removeEventListener(EVENEMENT, local);
    window.removeEventListener("storage", autre);
  };
}
