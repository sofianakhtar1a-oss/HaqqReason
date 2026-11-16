"use client";

/*
 * Les carnets restent sur l'appareil (IndexedDB) : sources, morceaux indexés, conversations,
 * et le fichier d'origine (pour rouvrir un PDF à la bonne page ou réécouter un son).
 */
import type { Carnet, Morceau } from "./types";

const BASE = "haqqreason-carnets";
const CARNETS = "carnets";
const MORCEAUX = "morceaux";
const FICHIERS = "fichiers";

let ouverture: Promise<IDBDatabase> | null = null;

function base(): Promise<IDBDatabase> {
  ouverture ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(BASE, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore(CARNETS, { keyPath: "id" });
      r.result.createObjectStore(MORCEAUX);
      r.result.createObjectStore(FICHIERS);
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => {
      ouverture = null;
      reject(r.error ?? new Error("Stockage de l'appareil indisponible."));
    };
  });
  return ouverture;
}

async function op<T>(magasin: string, mode: IDBTransactionMode, faire: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await base();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(magasin, mode);
    const r = faire(tx.objectStore(magasin));
    tx.oncomplete = () => resolve(r.result);
    tx.onerror = () => reject(tx.error ?? new Error("Écriture impossible sur l'appareil."));
    tx.onabort = () => reject(tx.error ?? new Error("Espace de stockage plein ?"));
  });
}

export async function listerCarnets(): Promise<Carnet[]> {
  try {
    return (await op<Carnet[]>(CARNETS, "readonly", (s) => s.getAll())).sort((a, b) => b.majLe - a.majLe);
  } catch {
    return [];
  }
}
export const lireCarnet = (id: string) => op<Carnet | undefined>(CARNETS, "readonly", (s) => s.get(id));
export const ecrireCarnet = (c: Carnet) => op(CARNETS, "readwrite", (s) => s.put({ ...c, majLe: Date.now() }));
export const lireMorceaux = (source: string) => op<Morceau[] | undefined>(MORCEAUX, "readonly", (s) => s.get(source)).then((m) => m ?? []);
export const ecrireMorceaux = (source: string, m: Morceau[]) => op(MORCEAUX, "readwrite", (s) => s.put(m, source));
export const lireFichier = (source: string) => op<Blob | undefined>(FICHIERS, "readonly", (s) => s.get(source)).catch(() => undefined);

export async function ecrireFichier(source: string, blob: Blob) {
  if (blob.size > 300 * 1024 * 1024) return;
  try {
    await navigator.storage?.persist?.();
    await op(FICHIERS, "readwrite", (s) => s.put(blob, source));
  } catch {
    // Sans place : la source reste interrogeable, seul l'aperçu d'origine manquera.
  }
}

export async function oublierSource(source: string) {
  await op(MORCEAUX, "readwrite", (s) => s.delete(source)).catch(() => undefined);
  await op(FICHIERS, "readwrite", (s) => s.delete(source)).catch(() => undefined);
}

export async function supprimerCarnet(c: Carnet) {
  for (const s of c.sources) await oublierSource(s.id);
  await op(CARNETS, "readwrite", (s) => s.delete(c.id));
}
