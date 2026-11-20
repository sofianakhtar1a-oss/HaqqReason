"use client";

/**
 * Le Calame — le journal d'écriture.
 *
 * Chaque jour, combien de mots ont été ajoutés (et retirés), combien de temps on a
 * écrit, et sur quels documents. Chaque appareil tient sa propre ligne : réunir deux
 * appareils revient à additionner leurs lignes, sans jamais compter deux fois le même
 * travail. Le journal est rangé par mois, pour que chaque envoi au compte reste léger.
 */

import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";

export type LigneJour = { mots: number; retires: number; secondes: number; documents: string[] };
/** Un mois : jour (AAAA-MM-JJ) → appareil → ligne. */
export type MoisJournal = Record<string, Record<string, LigneJour>>;

const CLE_APPAREIL = "calame-appareil";
const PREFIXE = () => tiroir("calame-journal-");
export const EVENEMENT_JOURNAL = "calame:journal";

export function jourLocal(date = new Date()): string {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 10);
}

function appareil(): string {
  try {
    let id = localStorage.getItem(CLE_APPAREIL);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem(CLE_APPAREIL, id);
    }
    return id;
  } catch {
    return "ici";
  }
}

function nettoyerLigne(brut: unknown): LigneJour {
  const o = (brut ?? {}) as Record<string, unknown>;
  const n = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.min(10_000_000, Math.round(Number(v)))) : 0);
  return {
    mots: n(o.mots),
    retires: n(o.retires),
    secondes: n(o.secondes),
    documents: Array.isArray(o.documents) ? [...new Set(o.documents.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 80)))].slice(0, 200) : [],
  };
}

export function nettoyerMois(brut: unknown): MoisJournal {
  const sortie: MoisJournal = {};
  if (!brut || typeof brut !== "object") return sortie;
  for (const [jour, appareils] of Object.entries(brut as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(jour) || !appareils || typeof appareils !== "object") continue;
    const lignes: Record<string, LigneJour> = {};
    for (const [app, ligne] of Object.entries(appareils as Record<string, unknown>)) {
      if (/^[a-z0-9-]{1,20}$/i.test(app)) lignes[app] = nettoyerLigne(ligne);
    }
    sortie[jour] = lignes;
  }
  return sortie;
}

export function lireMois(mois: string): MoisJournal {
  try {
    const brut = localStorage.getItem(PREFIXE() + mois);
    return nettoyerMois(brut ? JSON.parse(brut) : {});
  } catch {
    return {};
  }
}

function ecrireMois(mois: string, valeur: MoisJournal, noterAuCompte: boolean) {
  try {
    localStorage.setItem(PREFIXE() + mois, JSON.stringify(valeur));
  } catch {
    return;
  }
  if (noterAuCompte) void noter("calame-journal", mois).catch(() => undefined);
  window.dispatchEvent(new CustomEvent(EVENEMENT_JOURNAL));
}

let tampon: { mots: number; retires: number; secondes: number; documents: Set<string> } = { mots: 0, retires: 0, secondes: 0, documents: new Set() };
let minuteur: ReturnType<typeof setTimeout> | null = null;

/** Note un changement de longueur (en mots) d'un document : un ajout ou un retrait. */
export function noterEcriture(documentId: string, deltaMots: number): void {
  if (deltaMots > 0) tampon.mots += deltaMots;
  else tampon.retires += -deltaMots;
  tampon.documents.add(documentId);
  planifier();
}

/** Note du temps passé à écrire (secondes de frappe réelle). */
export function noterTemps(documentId: string, secondes: number): void {
  if (secondes <= 0) return;
  tampon.secondes += secondes;
  tampon.documents.add(documentId);
  planifier();
}

function planifier() {
  if (minuteur) return;
  minuteur = setTimeout(viderTampon, 4000);
}

/** Range ce qui a été noté depuis le dernier passage (appelé tout seul, et avant de quitter la page). */
export function viderTampon(): void {
  if (minuteur) clearTimeout(minuteur);
  minuteur = null;
  if (tampon.mots === 0 && tampon.retires === 0 && tampon.secondes === 0) return;
  const jour = jourLocal();
  const mois = jour.slice(0, 7);
  const contenu = lireMois(mois);
  const app = appareil();
  const ligne = contenu[jour]?.[app] ?? { mots: 0, retires: 0, secondes: 0, documents: [] };
  const suite: LigneJour = {
    mots: ligne.mots + tampon.mots,
    retires: ligne.retires + tampon.retires,
    secondes: ligne.secondes + Math.round(tampon.secondes),
    documents: [...new Set([...ligne.documents, ...tampon.documents])].slice(0, 200),
  };
  contenu[jour] = { ...(contenu[jour] ?? {}), [app]: suite };
  tampon = { mots: 0, retires: 0, secondes: 0, documents: new Set() };
  ecrireMois(mois, contenu, true);
}

/** Totaux d'un jour, tous appareils confondus. */
export function totalDuJour(jour: string, mois: MoisJournal = lireMois(jour.slice(0, 7))): LigneJour {
  const lignes = Object.values(mois[jour] ?? {});
  return {
    mots: lignes.reduce((s, l) => s + l.mots, 0),
    retires: lignes.reduce((s, l) => s + l.retires, 0),
    secondes: lignes.reduce((s, l) => s + l.secondes, 0),
    documents: [...new Set(lignes.flatMap((l) => l.documents))],
  };
}

/** Les jours d'une période, du plus ancien au plus récent. */
export function joursEntre(debut: Date, fin: Date): string[] {
  const jours: string[] = [];
  const d = new Date(debut);
  d.setHours(12, 0, 0, 0);
  const f = new Date(fin);
  f.setHours(12, 0, 0, 0);
  while (d <= f) {
    jours.push(jourLocal(d));
    d.setDate(d.getDate() + 1);
  }
  return jours;
}

/** Les totaux des n derniers jours (aujourd'hui compris). */
export function derniersJours(n: number): { jour: string; total: LigneJour }[] {
  const fin = new Date();
  const debut = new Date();
  debut.setDate(debut.getDate() - (n - 1));
  const caches = new Map<string, MoisJournal>();
  return joursEntre(debut, fin).map((jour) => {
    const mois = jour.slice(0, 7);
    if (!caches.has(mois)) caches.set(mois, lireMois(mois));
    return { jour, total: totalDuJour(jour, caches.get(mois)) };
  });
}

/** Série en cours : jours consécutifs (jusqu'à aujourd'hui ou hier) où l'objectif a été tenu. */
export function serieEnCours(objectif: number): number {
  const seuil = Math.max(1, objectif);
  const jours = derniersJours(400).reverse();
  let serie = 0;
  for (let i = 0; i < jours.length; i++) {
    const tenu = jours[i].total.mots >= seuil;
    if (tenu) serie++;
    else if (i === 0) continue; // aujourd'hui n'est pas fini : la série peut encore tenir
    else break;
  }
  return serie;
}

/* ---------- Synchronisation ---------- */

export function moisLocaux(): string[] {
  const prefixe = PREFIXE();
  const mois: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefixe)) mois.push(k.slice(prefixe.length));
    }
  } catch {
    return [];
  }
  return mois.filter((m) => /^\d{4}-\d{2}$/.test(m));
}

/** Réunit un mois venu du compte avec celui de l'appareil : pour chaque ligne, la plus avancée. */
export function rangerMois(mois: string, v: unknown): "a-renvoyer" | undefined {
  const venu = nettoyerMois(v);
  const ici = lireMois(mois);
  let enPlus = false;
  const reuni: MoisJournal = { ...venu };
  for (const [jour, lignes] of Object.entries(ici)) {
    for (const [app, ligne] of Object.entries(lignes)) {
      const autre = reuni[jour]?.[app];
      if (!autre || ligne.mots + ligne.retires + ligne.secondes > autre.mots + autre.retires + autre.secondes) {
        reuni[jour] = { ...(reuni[jour] ?? {}), [app]: ligne };
        enPlus = true;
      }
    }
  }
  ecrireMois(mois, reuni, false);
  return enPlus ? "a-renvoyer" : undefined;
}
