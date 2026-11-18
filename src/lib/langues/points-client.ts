"use client";

import { useSyncExternalStore } from "react";
import { palier, type ReponseEnvoyee } from "./points";
import type { Resultat } from "./verification";

/*
 * Les points dans le navigateur.
 *   • La série s'affiche tout de suite (optimiste) ; le serveur la corrige à sa réponse.
 *   • Les réponses partent par petits lots (6 au plus), espacés de 700 ms : la base refuse
 *     deux envois à moins de 600 ms. Hors connexion ou sans compte, rien ne part ; la série
 *     de la séance s'affiche quand même (elle n'entre simplement pas au classement).
 *   • Un petit « bus » prévient l'interface : série qui monte, points gagnés, palier franchi.
 */

export type EtatJoueur = {
  /** null : on ne sait pas encore ; false : pas de compte (ou déconnecté). */
  connecte: boolean | null;
  points: number;
  aujourdhui: number;
  serie: number;
  meilleure: number;
  jours: number;
  plafond: boolean;
};

export type Evenement =
  | { type: "serie"; serie: number; avant: number; resultat: Resultat }
  | { type: "palier"; index: number; avant: number; serie: number }
  | { type: "gain"; gain: number; bonus: number; jours: number; points: number }
  | { type: "plafond" };

let etat: EtatJoueur = { connecte: null, points: 0, aujourdhui: 0, serie: 0, meilleure: 0, jours: 0, plafond: false };
const abonnes = new Set<() => void>();
const ecouteurs = new Set<(e: Evenement) => void>();

function changer(maj: Partial<EtatJoueur>) {
  etat = { ...etat, ...maj };
  abonnes.forEach((f) => f());
}
function emettre(e: Evenement) {
  ecouteurs.forEach((f) => f(e));
}

export function surEvenement(f: (e: Evenement) => void): () => void {
  ecouteurs.add(f);
  return () => {
    ecouteurs.delete(f);
  };
}

const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
};
const instantane = () => etat;
const instantaneServeur = () => etat;

export function useJoueur(): EtatJoueur {
  return useSyncExternalStore(sAbonner, instantane, instantaneServeur);
}

/** Le classement a lu l'état du compte : il devient la référence. */
export function synchroniser(moi: { total: number; serie: number; meilleure_serie: number; jours: number } | null, connecte: boolean) {
  if (!moi) return changer({ connecte });
  changer({ connecte, points: moi.total, serie: moi.serie, meilleure: moi.meilleure_serie, jours: moi.jours });
}

/** Changer la série affichée, et prévenir si un palier est franchi. */
function serieVers(serie: number, resultat: Resultat) {
  const avant = etat.serie;
  if (serie === avant) return;
  const pa = palier(avant).index;
  const pn = palier(serie).index;
  changer({ serie, meilleure: Math.max(etat.meilleure, serie) });
  emettre({ type: "serie", serie, avant, resultat });
  if (pn > pa) emettre({ type: "palier", index: pn, avant: pa, serie });
}

/* ---------- La file d'envoi ---------- */

let file: ReponseEnvoyee[] = [];
let enVol = false;
let dernierEnvoi = 0;
let minuterie: ReturnType<typeof setTimeout> | null = null;
let essais = 0;
const ESPACEMENT_MS = 700;

function planifier() {
  if (enVol || !file.length || minuterie) return;
  const attente = Math.max(40, dernierEnvoi + ESPACEMENT_MS - Date.now());
  minuterie = setTimeout(() => {
    minuterie = null;
    void vider();
  }, attente);
}

async function vider() {
  if (enVol || !file.length) return;
  enVol = true;
  const lot = file.splice(0, 6);
  dernierEnvoi = Date.now();
  try {
    const r = await fetch("/api/langues/points", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reponses: lot }),
      credentials: "same-origin",
    });
    if (r.status === 401) {
      file = [];
      changer({ connecte: false });
    } else if (r.status === 429 && essais < 2) {
      essais++;
      file.unshift(...lot);
    } else if (r.ok) {
      essais = 0;
      const d = (await r.json()) as { ignore?: boolean; gain: number; bonus: number; points: number; aujourdhui: number; serie: number; meilleure_serie: number; jours: number; plafond: boolean };
      if (!d.ignore) {
        const plafondAvant = etat.plafond;
        changer({ connecte: true, points: d.points, aujourdhui: d.aujourdhui, jours: d.jours, plafond: d.plafond, meilleure: Math.max(etat.meilleure, d.meilleure_serie) });
        // Le serveur a le dernier mot sur la série (par exemple après une séance commencée sur un autre appareil).
        if (!file.length) serieVers(d.serie, "juste");
        if (d.gain + d.bonus > 0) emettre({ type: "gain", gain: d.gain, bonus: d.bonus, jours: d.jours, points: d.points });
        if (d.plafond && !plafondAvant) emettre({ type: "plafond" });
      }
    } else {
      essais = 0;
    }
  } catch {
    // Hors connexion : ces réponses ne comptent pas pour le classement, la séance continue.
  } finally {
    enVol = false;
    planifier();
  }
}

/**
 * Une réponse vient d'être donnée dans une séance. resultat : ce que l'appareil a jugé
 * (pour afficher la série tout de suite) ; le serveur juge de son côté avant de compter.
 */
export function envoyerReponse(reponse: ReponseEnvoyee, resultat: Resultat) {
  serieVers(resultat === "faux" ? 0 : resultat === "juste" ? etat.serie + 1 : etat.serie, resultat);
  // Les mots du dictionnaire personnel ne sont pas jugeables par le serveur : inutile de les envoyer.
  if (etat.connecte === false || reponse.mot.startsWith("perso:")) return;
  file.push(reponse);
  if (file.length > 60) file = file.slice(-60);
  planifier();
}
