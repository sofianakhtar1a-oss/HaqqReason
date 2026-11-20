"use client";

import { tiroir } from "@/lib/client/compte";
import { construireArchiveComplete } from "./sorties";

/*
 * Le Calame — la sauvegarde automatique de tous les documents dans un dossier de l'ordinateur,
 * à la fréquence choisie. Le navigateur garde l'accès au dossier (Chrome, Edge) ; ailleurs, le Calame
 * rappelle simplement de télécharger l'archive. Les 10 dernières sauvegardes sont gardées.
 */

export const FREQUENCES = [
  { cle: "aucune", libelle: "Désactivée", ms: 0 },
  { cle: "heure", libelle: "Toutes les heures", ms: 3_600_000 },
  { cle: "jour", libelle: "Chaque jour", ms: 86_400_000 },
  { cle: "semaine", libelle: "Chaque semaine", ms: 7 * 86_400_000 },
] as const;
export type Frequence = (typeof FREQUENCES)[number]["cle"];

export type ReglageSauvegarde = { frequence: Frequence; derniere: number; dossier: string };
const GARDEES = 10;

type Dossier = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: "readwrite" }) => Promise<PermissionState>;
};

export const dossierPossible = () => typeof window !== "undefined" && "showDirectoryPicker" in window;

const CLE = () => tiroir("calame-sauvegarde-auto");

export function lireReglage(): ReglageSauvegarde {
  try {
    const o = JSON.parse(localStorage.getItem(CLE()) ?? "{}") as Partial<ReglageSauvegarde>;
    return { frequence: FREQUENCES.some((f) => f.cle === o.frequence) ? (o.frequence as Frequence) : "aucune", derniere: Number(o.derniere) || 0, dossier: String(o.dossier ?? "") };
  } catch {
    return { frequence: "aucune", derniere: 0, dossier: "" };
  }
}

export function ecrireReglage(r: Partial<ReglageSauvegarde>): ReglageSauvegarde {
  const suite = { ...lireReglage(), ...r };
  try {
    localStorage.setItem(CLE(), JSON.stringify(suite));
  } catch {
    /* stockage plein */
  }
  window.dispatchEvent(new Event("calame:sauvegarde-auto"));
  return suite;
}

/* ---------- le dossier choisi, gardé d'une visite à l'autre (IndexedDB accepte les poignées) ---------- */

function base(): Promise<IDBDatabase> {
  return new Promise((ok, ko) => {
    const r = indexedDB.open(tiroir("haqqreason-calame-sauvegarde"), 1);
    r.onupgradeneeded = () => r.result.createObjectStore("dossier");
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}

async function lireDossier(): Promise<Dossier | null> {
  try {
    const db = await base();
    return await new Promise((ok) => {
      const req = db.transaction("dossier").objectStore("dossier").get("choisi");
      req.onsuccess = () => ok((req.result as Dossier | undefined) ?? null);
      req.onerror = () => ok(null);
    });
  } catch {
    return null;
  }
}

async function garderDossier(d: Dossier): Promise<void> {
  const db = await base();
  await new Promise<void>((ok, ko) => {
    const tx = db.transaction("dossier", "readwrite");
    tx.objectStore("dossier").put(d, "choisi");
    tx.oncomplete = () => ok();
    tx.onerror = () => ko(tx.error);
  });
}

/** Fait choisir le dossier de sauvegarde (geste de l'utilisateur obligatoire). */
export async function choisirDossier(): Promise<string | null> {
  if (!dossierPossible()) return null;
  try {
    const d = (await (window as unknown as { showDirectoryPicker: (o: object) => Promise<Dossier> }).showDirectoryPicker({ id: "calame-sauvegardes", mode: "readwrite" })) as Dossier;
    await garderDossier(d);
    ecrireReglage({ dossier: d.name });
    return d.name;
  } catch {
    return null;
  }
}

/** « ok » : écrit ; « permission » : le navigateur redemande l'accès (il faut un clic) ; « sans-dossier » : rien de choisi. */
export async function sauvegarderMaintenant(geste = false): Promise<"ok" | "permission" | "sans-dossier" | "erreur"> {
  const d = await lireDossier();
  if (!d) return "sans-dossier";
  try {
    let permission = (await d.queryPermission?.({ mode: "readwrite" })) ?? "granted";
    if (permission !== "granted" && geste) permission = (await d.requestPermission?.({ mode: "readwrite" })) ?? "denied";
    if (permission !== "granted") return "permission";
    const { octets } = await construireArchiveComplete();
    const horodatage = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const fichier = await d.getFileHandle(`calame-${horodatage}.zip`, { create: true });
    const flux = await fichier.createWritable();
    await flux.write(new Uint8Array(octets).slice().buffer);
    await flux.close();
    // Les plus anciennes s'en vont : on garde les dix dernières.
    const noms: string[] = [];
    for await (const [nom] of (d as unknown as { entries: () => AsyncIterable<[string, FileSystemHandle]> }).entries()) if (/^calame-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}\.zip$/.test(nom)) noms.push(nom);
    for (const vieux of noms.sort().slice(0, Math.max(0, noms.length - GARDEES))) await d.removeEntry(vieux).catch(() => undefined);
    ecrireReglage({ derniere: Date.now() });
    return "ok";
  } catch {
    return "erreur";
  }
}

/** Faut-il sauvegarder maintenant, d'après la fréquence choisie ? */
export function sauvegardeDue(r: ReglageSauvegarde = lireReglage(), maintenant = Date.now()): boolean {
  const f = FREQUENCES.find((x) => x.cle === r.frequence);
  return Boolean(f && f.ms > 0 && maintenant - r.derniere >= f.ms);
}
