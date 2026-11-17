/*
 * Recherches récentes et recherches sauvegardées, gardées sur l'appareil (stockage du navigateur).
 * Les recherches sauvegardées sont aussi recopiées sur le compte quand on est connecté ; les récentes
 * restent propres à l'appareil. Si le stockage est indisponible (navigation privée stricte), on s'en passe.
 */
import { tiroir } from "./compte";
import { noter } from "./synchro/journal";

const RECENTES = "hr-recherches-recentes";
const SAUVEGARDEES = "hr-recherches-sauvegardees";

export type RechercheSauvegardee = { nom: string; parametres: string };

function lire<T>(cle: string): T[] {
  try {
    const brut = localStorage.getItem(tiroir(cle));
    const valeur = brut ? JSON.parse(brut) : [];
    return Array.isArray(valeur) ? valeur : [];
  } catch {
    return [];
  }
}

function ecrire(cle: string, valeur: unknown) {
  try {
    localStorage.setItem(tiroir(cle), JSON.stringify(valeur));
  } catch {
    // Stockage indisponible : la fonction reste utilisable pendant la visite.
  }
}

export function recherchesRecentes(): string[] {
  return lire<string>(RECENTES).filter((x) => typeof x === "string");
}

export function memoriserRecherche(q: string) {
  const propre = q.trim();
  if (propre.length < 2) return;
  ecrire(RECENTES, [propre, ...recherchesRecentes().filter((x) => x.toLowerCase() !== propre.toLowerCase())].slice(0, 8));
}

export function oublierRecherchesRecentes() {
  ecrire(RECENTES, []);
}

export function recherchesSauvegardees(): RechercheSauvegardee[] {
  return lire<RechercheSauvegardee>(SAUVEGARDEES).filter((x) => x && typeof x.nom === "string" && typeof x.parametres === "string");
}

export function sauvegarderRecherche(nom: string, parametres: string) {
  const propre = nom.trim().slice(0, 80);
  if (!propre) return;
  ecrire(SAUVEGARDEES, [{ nom: propre, parametres }, ...recherchesSauvegardees().filter((x) => x.nom !== propre)].slice(0, 30));
  void noter("reglages", "recherches");
}

export function supprimerRechercheSauvegardee(nom: string) {
  ecrire(SAUVEGARDEES, recherchesSauvegardees().filter((x) => x.nom !== nom));
  void noter("reglages", "recherches");
}

/** Pour la synchronisation : range les recherches sauvegardées venues d'un autre appareil. */
export function rangerRecherchesSauvegardees(liste: unknown) {
  ecrire(SAUVEGARDEES, Array.isArray(liste) ? liste.slice(0, 30) : []);
}
