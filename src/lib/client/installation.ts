"use client";

import { useSyncExternalStore } from "react";

/*
 * Installer HaqqReason sur l'écran d'accueil : le navigateur (Android, ordinateur) le propose une fois
 * par visite ; on garde sa proposition pour la faire au bon moment. Installé, le site reçoit les
 * rappels de façon plus sûre et figure dans « Partager » du téléphone (Android).
 */

type Proposition = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let proposition: Proposition | null = null;
let installe = false;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());

if (typeof window !== "undefined") {
  installe = window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    proposition = e as Proposition;
    prevenir();
  });
  window.addEventListener("appinstalled", () => {
    installe = true;
    proposition = null;
    prevenir();
  });
}

export type EtatInstallation = "installe" | "proposable" | "iphone" | "autre";

function lire(): EtatInstallation {
  if (installe) return "installe";
  if (proposition) return "proposable";
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
  return ios ? "iphone" : "autre";
}

let dernier: EtatInstallation = "autre";
export const useInstallation = () =>
  useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => (dernier = lire()),
    () => dernier,
  );

export async function installer(): Promise<boolean> {
  if (!proposition) return false;
  const p = proposition;
  proposition = null;
  await p.prompt();
  const { outcome } = await p.userChoice;
  prevenir();
  return outcome === "accepted";
}
