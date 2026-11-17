"use client";

/*
 * Bibliothèque des transcriptions, écrite d'abord sur l'appareil (IndexedDB).
 * Avec un compte, les textes (et leurs traductions) sont recopiés sur le compte et suivent la personne.
 * Le son ou la vidéo d'origine est gardé à côté (jusqu'à 400 Mo) pour réécouter plus tard :
 * lui reste sur l'appareil, il est trop lourd pour voyager.
 */
import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";
import type { Transcription } from "./types";

const BASE = "haqqreason-transcriptions";
const TEXTES = "textes";
const MEDIAS = "medias";
export const POIDS_MEDIA_MAX = 400 * 1024 * 1024;

export type Resume = Pick<Transcription, "id" | "titre" | "langue" | "duree" | "source" | "creeLe"> & { nbPhrases: number; traduites: number };

let ouverture: Promise<IDBDatabase> | null = null;

function base(): Promise<IDBDatabase> {
  ouverture ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(tiroir(BASE), 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore(TEXTES, { keyPath: "id" });
      r.result.createObjectStore(MEDIAS);
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => {
      ouverture = null;
      reject(r.error ?? new Error("Stockage de l'appareil indisponible."));
    };
  });
  return ouverture;
}

async function operation<T>(magasin: string, mode: IDBTransactionMode, faire: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await base();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(magasin, mode);
    const requete = faire(tx.objectStore(magasin));
    tx.oncomplete = () => resolve(requete.result);
    tx.onerror = () => reject(tx.error ?? new Error("Écriture impossible sur l'appareil."));
    tx.onabort = () => reject(tx.error ?? new Error("Écriture interrompue (espace plein ?)."));
  });
}

export async function lister(): Promise<Resume[]> {
  try {
    const tout = await operation<Transcription[]>(TEXTES, "readonly", (s) => s.getAll());
    return tout
      .map(({ id, titre, langue, duree, source, creeLe, phrases, traductions }) => ({ id, titre, langue, duree, source, creeLe, nbPhrases: phrases.length, traduites: Object.keys(traductions ?? {}).length }))
      .sort((a, b) => b.creeLe - a.creeLe);
  } catch {
    return [];
  }
}

export const lire = (id: string) => operation<Transcription | undefined>(TEXTES, "readonly", (s) => s.get(id));
export const listerTout = () => operation<Transcription[]>(TEXTES, "readonly", (s) => s.getAll());
/* Sans rien noter au journal : réservés à la synchronisation. */
export const enregistrerBrut = (t: Transcription) => operation(TEXTES, "readwrite", (s) => s.put(t));
export const supprimerBrut = (id: string) => operation(TEXTES, "readwrite", (s) => s.delete(id));

export async function enregistrer(t: Transcription) {
  const cle = await enregistrerBrut(t);
  await noter("transcriptions", t.id);
  return cle;
}
export const lireMedia = (id: string) => operation<Blob | undefined>(MEDIAS, "readonly", (s) => s.get(id)).catch(() => undefined);

export async function enregistrerMedia(id: string, blob: Blob) {
  if (blob.size > POIDS_MEDIA_MAX) return false;
  try {
    await navigator.storage?.persist?.();
    await operation(MEDIAS, "readwrite", (s) => s.put(blob, id));
    return true;
  } catch {
    return false;
  }
}

export async function supprimer(id: string) {
  await supprimerBrut(id);
  await noter("transcriptions", id);
  await operation(MEDIAS, "readwrite", (s) => s.delete(id)).catch(() => undefined);
}
