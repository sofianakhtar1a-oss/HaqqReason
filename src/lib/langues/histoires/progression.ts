"use client";

import { useSyncExternalStore } from "react";
import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";

/*
 * La lecture des histoires : pour chacune, la page où l'on s'est arrêté, la plus loin atteinte,
 * la date de fin et le meilleur score aux questions. Écrite sur l'appareil, recopiée sur le compte
 * quand on est connecté (magasin « histoires »).
 */

export type Lecture = { page: number; max: number; vu: number; fini?: number; quiz?: { juste: number; total: number } };
type Etat = { lectures: Record<string, Lecture> };

const NOM = "haqqreason-histoires";
const MAGASIN = "histoires" as const;
const cle = () => tiroir(NOM);
const vide: Etat = { lectures: {} };
let etat: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (etat) return etat;
  try {
    const brut = JSON.parse(localStorage.getItem(cle()) ?? "null") as Etat | null;
    etat = brut && typeof brut === "object" && brut.lectures ? brut : vide;
  } catch {
    etat = vide;
  }
  return etat;
}

function ecrire(e: Etat) {
  etat = e;
  try {
    localStorage.setItem(cle(), JSON.stringify(e));
  } catch {
    // Navigation privée : la lecture vit le temps de la visite.
  }
  abonnes.forEach((f) => f());
}

function modifier(id: string, f: (avant: Lecture | undefined) => Lecture) {
  const e = lire();
  ecrire({ lectures: { ...e.lectures, [id]: f(e.lectures[id]) } });
  void noter(MAGASIN, id);
}

/** La page lue (numérotée à partir de 1). */
export function noterPage(id: string, page: number) {
  const avant = lire().lectures[id];
  if (avant?.page === page) return;
  modifier(id, (a) => ({ ...a, page, max: Math.max(a?.max ?? 0, page), vu: Date.now() }));
}

export function noterFin(id: string) {
  modifier(id, (a) => ({ page: a?.page ?? 1, max: a?.max ?? 1, ...a, fini: a?.fini ?? Date.now(), vu: Date.now() }));
}

export function noterQuiz(id: string, juste: number, total: number) {
  modifier(id, (a) => {
    const avant = a?.quiz;
    const quiz = !avant || juste / Math.max(1, total) >= avant.juste / Math.max(1, avant.total) ? { juste, total } : avant;
    return { page: a?.page ?? 1, max: a?.max ?? 1, ...a, quiz, vu: Date.now() };
  });
}

/* ---------- Synchronisation ---------- */

export const clesLocales = () => Object.entries(lire().lectures).map(([c, l]) => ({ c, q: l.vu || undefined }));
export const valeurLocale = (c: string) => lire().lectures[c];
const nombre = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);

/** Range une lecture venue d'un autre appareil ; vrai si la fusion diffère de ce qui est arrivé. */
export function rangerValeur(c: string, v: unknown): boolean {
  if (!/^[a-z0-9-]{1,80}$/.test(c)) return false;
  const o = (v ?? {}) as Record<string, unknown>;
  const q = (o.quiz ?? null) as Record<string, unknown> | null;
  const venu: Lecture = { page: Math.max(1, nombre(o.page)), max: Math.max(1, nombre(o.max)), vu: nombre(o.vu) };
  if (nombre(o.fini)) venu.fini = nombre(o.fini);
  if (q && nombre(q.total)) venu.quiz = { juste: nombre(q.juste), total: nombre(q.total) };
  const ici = lire().lectures[c];
  // La page la plus récente, la plus loin atteinte, la première fin, le meilleur score.
  const fusion: Lecture = ici
    ? {
        page: ici.vu > venu.vu ? ici.page : venu.page,
        max: Math.max(ici.max, venu.max),
        vu: Math.max(ici.vu, venu.vu),
        ...(ici.fini || venu.fini ? { fini: Math.min(...[ici.fini, venu.fini].filter((x): x is number => Boolean(x))) } : {}),
        ...(ici.quiz || venu.quiz
          ? { quiz: [ici.quiz, venu.quiz].filter((x): x is { juste: number; total: number } => Boolean(x)).sort((a, b) => b.juste / b.total - a.juste / a.total)[0] }
          : {}),
      }
    : venu;
  const e = lire();
  ecrire({ lectures: { ...e.lectures, [c]: fusion } });
  return JSON.stringify(fusion) !== JSON.stringify(venu);
}

export function effacerValeur(c: string) {
  const e = lire();
  const lectures = { ...e.lectures };
  delete lectures[c];
  ecrire({ lectures });
}

/* ---------- Lecture dans l'interface ---------- */

const abonner = (f: () => void) => {
  abonnes.add(f);
  const ailleurs = (ev: StorageEvent) => {
    if (ev.key === cle()) {
      etat = null;
      f();
    }
  };
  window.addEventListener("storage", ailleurs);
  return () => {
    abonnes.delete(f);
    window.removeEventListener("storage", ailleurs);
  };
};

export function useLectures() {
  return useSyncExternalStore(abonner, lire, () => vide).lectures;
}
