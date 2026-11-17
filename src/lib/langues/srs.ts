/*
 * Répétition espacée : l'algorithme FSRS (version 4.5, paramètres par défaut publiés par ses auteurs).
 * Chaque mot a une stabilité (en jours : combien de temps il tient en mémoire) et une difficulté (1 à 10).
 * On le revoit quand la probabilité de s'en souvenir tombe à 90 %.
 * Les nouveaux mots passent d'abord par de courtes étapes (1 min, puis 10 min) dans la même séance.
 * Code pur : aucune dépendance au navigateur, testé à part.
 */
import type { Carte, EtatCarte, Note } from "./types";

const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECLIN = -0.5;
const FACTEUR = 19 / 81;
const RETENTION = 0.9;
const MINUTE = 60_000;
const JOUR = 86_400_000;
const PAS_APPRENTISSAGE = [1, 10];
const PAS_REAPPRENTISSAGE = [10];
const INTERVALLE_MAX = 3650;

const borner = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

export function nouvelleCarte(id: string, maintenant: number): Carte {
  return { id, etat: "nouveau", stabilite: 0, difficulte: 0, echeance: maintenant, reps: 0, oublis: 0, pas: 0 };
}

/** Probabilité de se souvenir après t jours, pour une stabilité S. */
export function rappel(jours: number, stabilite: number): number {
  return stabilite > 0 ? Math.pow(1 + (FACTEUR * Math.max(0, jours)) / stabilite, DECLIN) : 0;
}

/** Intervalle (en jours) pour retomber à 90 % de rappel. */
export function intervalle(stabilite: number): number {
  const brut = (stabilite / FACTEUR) * (Math.pow(RETENTION, 1 / DECLIN) - 1);
  return borner(Math.round(brut), 1, INTERVALLE_MAX);
}

const difficulteInitiale = (n: Note) => borner(W[4] - (n - 3) * W[5], 1, 10);
const difficulteSuivante = (d: number, n: Note) => borner(W[7] * difficulteInitiale(4) + (1 - W[7]) * (d - W[6] * (n - 3)), 1, 10);

function stabiliteRappel(d: number, s: number, r: number, n: Note): number {
  const penalite = n === 2 ? W[15] : 1;
  const bonus = n === 4 ? W[16] : 1;
  return s * (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * penalite * bonus + 1);
}

function stabiliteOubli(d: number, s: number, r: number): number {
  return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
}

/** Nouvel état d'un mot après une réponse. */
export function reviser(c: Carte, note: Note, maintenant: number): Carte {
  const base = { ...c, reps: c.reps + 1, derniere: maintenant };
  const versRevision = (s: number, d: number, minimumJours = 1): Carte => ({
    ...base,
    etat: "revision",
    stabilite: s,
    difficulte: d,
    pas: 0,
    echeance: maintenant + Math.max(minimumJours, intervalle(s)) * JOUR,
  });

  if (c.etat === "nouveau") {
    const s = W[note - 1];
    const d = difficulteInitiale(note);
    if (note === 4) return versRevision(s, d, 4);
    const pas = note === 3 ? 1 : 0;
    const minutes = note === 1 ? PAS_APPRENTISSAGE[0] : note === 2 ? (PAS_APPRENTISSAGE[0] + PAS_APPRENTISSAGE[1]) / 2 : PAS_APPRENTISSAGE[1];
    return { ...base, etat: "apprentissage", stabilite: s, difficulte: d, pas, echeance: maintenant + minutes * MINUTE };
  }

  if (c.etat === "apprentissage" || c.etat === "reapprentissage") {
    const pasListe = c.etat === "apprentissage" ? PAS_APPRENTISSAGE : PAS_REAPPRENTISSAGE;
    const d = difficulteSuivante(c.difficulte, note);
    if (note === 4) return versRevision(c.stabilite, d, c.etat === "apprentissage" ? 4 : 1);
    if (note === 1) return { ...base, etat: c.etat, difficulte: d, pas: 0, echeance: maintenant + pasListe[0] * MINUTE };
    if (note === 2) return { ...base, etat: c.etat, difficulte: d, echeance: maintenant + pasListe[Math.min(c.pas, pasListe.length - 1)] * MINUTE };
    const suivant = c.pas + 1;
    if (suivant >= pasListe.length) return versRevision(c.stabilite, d);
    return { ...base, etat: c.etat, difficulte: d, pas: suivant, echeance: maintenant + pasListe[suivant] * MINUTE };
  }

  // Révision : le temps écoulé depuis la dernière fois compte.
  const jours = c.derniere ? (maintenant - c.derniere) / JOUR : 0;
  const r = rappel(jours, c.stabilite);
  const d = difficulteSuivante(c.difficulte, note);
  if (note === 1) {
    return {
      ...base,
      etat: "reapprentissage",
      stabilite: stabiliteOubli(c.difficulte, c.stabilite, r),
      difficulte: d,
      oublis: c.oublis + 1,
      pas: 0,
      echeance: maintenant + PAS_REAPPRENTISSAGE[0] * MINUTE,
    };
  }
  return versRevision(stabiliteRappel(c.difficulte, c.stabilite, r, note), d);
}

/** Libellé du prochain délai pour chaque réponse possible (boutons des cartes mémoire). */
export function apercuDelai(c: Carte, note: Note, maintenant: number): string {
  const ms = reviser(c, note, maintenant).echeance - maintenant;
  if (ms < 60 * MINUTE) return `${Math.max(1, Math.round(ms / MINUTE))} min`;
  if (ms < JOUR) return `${Math.round(ms / (60 * MINUTE))} h`;
  const j = Math.round(ms / JOUR);
  if (j < 31) return `${j} j`;
  if (j < 365) return `${Math.round(j / 30)} mois`;
  return `${(j / 365).toFixed(1).replace(".", ",")} an${j >= 730 ? "s" : ""}`;
}

export type Maitrise = "nouveau" | "en-cours" | "appris" | "maitrise";

export function maitrise(c: Carte | undefined): Maitrise {
  if (!c || c.etat === "nouveau") return "nouveau";
  if (c.etat !== "revision") return "en-cours";
  return c.stabilite >= 21 ? "maitrise" : "appris";
}

export const estDue = (c: Carte | undefined, maintenant: number) => Boolean(c && c.etat !== "nouveau" && c.echeance <= maintenant);

export const ETATS: Record<EtatCarte, string> = { nouveau: "Nouveau", apprentissage: "En cours", revision: "Appris", reapprentissage: "À reprendre" };

/** Jours consécutifs d'étude, jusqu'à aujourd'hui (ou hier, si la journée n'est pas encore commencée). */
export function serie(jours: string[], aujourdhui: string): number {
  const ensemble = new Set(jours);
  const jour = new Date(`${aujourdhui}T12:00:00`);
  if (!ensemble.has(aujourdhui)) jour.setDate(jour.getDate() - 1);
  let n = 0;
  while (ensemble.has(cleJour(jour.getTime()))) {
    n++;
    jour.setDate(jour.getDate() - 1);
  }
  return n;
}

export const cleJour = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
