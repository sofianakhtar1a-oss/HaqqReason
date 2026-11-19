"use client";

import { useSyncExternalStore } from "react";
import type { ReponseEnvoyee } from "./points";

/*
 * L'XP du compte, dans le navigateur.
 *   • Les réponses partent par petits lots (12 au plus), espacées de 900 ms : la base refuse
 *     deux envois à moins de 500 ms. Hors connexion, elles attendent le retour du réseau.
 *   • Sans compte, ou tant que le serveur n'a pas ses tables (migration 017), rien ne part :
 *     la progression reste sur l'appareil, le jeu continue normalement.
 */

export type EtatCompte = {
  /** null : on ne sait pas encore. */
  connecte: boolean | null;
  /** false : le serveur n'a pas (encore) le classement ni les duels en ligne. */
  enLigne: boolean | null;
  xp: number;
  aujourdhui: number;
  trophees: number;
  plafond: boolean;
};

let etat: EtatCompte = { connecte: null, enLigne: null, xp: 0, aujourdhui: 0, trophees: 0, plafond: false };
const abonnes = new Set<() => void>();
const changer = (m: Partial<EtatCompte>) => {
  etat = { ...etat, ...m };
  abonnes.forEach((f) => f());
};
const sAbonner = (f: () => void) => {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
};
export const useCompteMonde = () =>
  useSyncExternalStore(
    sAbonner,
    () => etat,
    () => etat,
  );
export const compteMonde = () => etat;

/** Lit le score du compte (et apprend au passage si le serveur a ses tables). */
export async function lireScore(): Promise<void> {
  try {
    const r = await fetch("/api/monde/classement?periode=jour", { cache: "no-store" });
    if (r.status === 401) return changer({ connecte: false, enLigne: false });
    if (!r.ok) return changer({ connecte: true, enLigne: false });
    const c = (await r.json()) as { moi: { xp: number; trophees: number; points: number } | null };
    changer({ connecte: true, enLigne: true, xp: c.moi?.xp ?? 0, trophees: c.moi?.trophees ?? 0, aujourdhui: c.moi?.points ?? 0 });
  } catch {
    // Hors connexion : on réessaiera à la prochaine réponse.
  }
}

let file: ReponseEnvoyee[] = [];
let minuterie: ReturnType<typeof setTimeout> | null = null;
let enCours = false;

export function envoyerReponse(r: ReponseEnvoyee) {
  if (etat.connecte === false || etat.enLigne === false) return;
  file.push(r);
  if (file.length > 200) file = file.slice(-200);
  planifier(900);
}

function planifier(ms: number) {
  if (!minuterie) minuterie = setTimeout(vider, ms);
}

async function vider() {
  minuterie = null;
  if (enCours || !file.length) return;
  enCours = true;
  const lot = file.splice(0, 12);
  let attente = 900;
  try {
    const r = await fetch("/api/monde/reponses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reponses: lot }) });
    if (r.ok) {
      const x = (await r.json()) as { xp: number; aujourdhui: number; trophees: number; plafond: boolean };
      changer({ connecte: true, enLigne: true, xp: x.xp, aujourdhui: x.aujourdhui, trophees: x.trophees, plafond: x.plafond });
    } else if (r.status === 429) {
      file.unshift(...lot);
      attente = 1500;
    } else if (r.status === 401) {
      file = [];
      changer({ connecte: false });
    } else if (r.status === 503) {
      file = [];
      changer({ enLigne: false });
    }
  } catch {
    // Pas de réseau : le lot repartira.
    file.unshift(...lot);
    attente = 5000;
  } finally {
    enCours = false;
    if (file.length) planifier(attente);
  }
}
