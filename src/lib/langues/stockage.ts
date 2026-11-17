"use client";

/*
 * Le Truchement garde tout sur l'appareil, dans IndexedDB :
 * les cartes de révision, le dictionnaire personnel, les vidéos et sons transcrits,
 * les PDF lus (leur texte et la page où l'on s'est arrêté) et le journal des jours d'étude.
 */
import type { Analyse, Transcription } from "@/lib/alambic/transcription/types";
import type { Carte, MotPerso } from "./types";

const BASE = "haqqreason-langues";
const VERSION = 1;
export const MAGASINS = ["cartes", "dictionnaire", "medias", "blobs", "documents", "journal"] as const;
type Magasin = (typeof MAGASINS)[number];

export type MediaLangue = Transcription & { vu: number; position?: number };
export type PageTexte = { page: number; texte: string };
export type DocumentLangue = {
  id: string;
  titre: string;
  pages: PageTexte[];
  /** Page où l'on s'est arrêté. */
  page: number;
  ajouteLe: number;
  vu: number;
  /** Traduction de chaque phrase, par « page:phrase ». */
  traductions: Record<string, string>;
  analyses: Record<string, Analyse>;
};
export type Jour = { jour: string; revues: number; justes: number; nouveaux: number };

let ouverture: Promise<IDBDatabase> | null = null;

function base(): Promise<IDBDatabase> {
  ouverture ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(BASE, VERSION);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains("cartes")) db.createObjectStore("cartes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("dictionnaire")) db.createObjectStore("dictionnaire", { keyPath: "id" });
      if (!db.objectStoreNames.contains("medias")) db.createObjectStore("medias", { keyPath: "id" });
      if (!db.objectStoreNames.contains("blobs")) db.createObjectStore("blobs");
      if (!db.objectStoreNames.contains("documents")) db.createObjectStore("documents", { keyPath: "id" });
      if (!db.objectStoreNames.contains("journal")) db.createObjectStore("journal", { keyPath: "jour" });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => {
      ouverture = null;
      reject(r.error ?? new Error("Le stockage de l'appareil est indisponible."));
    };
  });
  return ouverture;
}

async function operation<T>(magasin: Magasin, mode: IDBTransactionMode, faire: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await base();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(magasin, mode);
    const requete = faire(tx.objectStore(magasin));
    let resultat: T;
    if (requete) requete.onsuccess = () => (resultat = requete.result as T);
    tx.oncomplete = () => resolve(resultat);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Écriture interrompue (espace de stockage plein ?)."));
  });
}

export const tout = <T>(magasin: Magasin) => operation<T[]>(magasin, "readonly", (s) => s.getAll());
export const lireUn = <T>(magasin: Magasin, cle: string) => operation<T | undefined>(magasin, "readonly", (s) => s.get(cle));
export const ecrire = (magasin: Magasin, valeur: unknown) => operation<void>(magasin, "readwrite", (s) => s.put(valeur));
export const effacer = (magasin: Magasin, cle: string) => operation<void>(magasin, "readwrite", (s) => s.delete(cle));

export async function ecrireBeaucoup(magasin: Magasin, valeurs: unknown[]) {
  if (!valeurs.length) return;
  await operation<void>(magasin, "readwrite", (s) => {
    for (const v of valeurs) s.put(v);
  });
}

export const lireBlob = (id: string) => operation<Blob | undefined>("blobs", "readonly", (s) => s.get(id)).catch(() => undefined);
export const ecrireBlob = (id: string, b: Blob) => operation<void>("blobs", "readwrite", (s) => s.put(b, id));

/** Les médias sans leur texte complet, pour la bibliothèque. */
export async function listerMedias() {
  const m = await tout<MediaLangue>("medias");
  return m.sort((a, b) => b.vu - a.vu);
}
export async function listerDocuments() {
  const d = await tout<DocumentLangue>("documents");
  return d.sort((a, b) => b.vu - a.vu);
}

export async function supprimerMedia(id: string) {
  await effacer("medias", id);
  await effacer("blobs", id).catch(() => undefined);
}

/* ---------- Sauvegarde complète, dans un fichier ---------- */

export type Sauvegarde = {
  format: "haqqreason-truchement";
  version: 1;
  creeLe: string;
  cartes: Carte[];
  dictionnaire: MotPerso[];
  journal: Jour[];
  medias: MediaLangue[];
  documents: DocumentLangue[];
};

export async function exporterTout(): Promise<Sauvegarde> {
  const [cartes, dictionnaire, journal, medias, documents] = await Promise.all([
    tout<Carte>("cartes"),
    tout<MotPerso>("dictionnaire"),
    tout<Jour>("journal"),
    tout<MediaLangue>("medias"),
    tout<DocumentLangue>("documents"),
  ]);
  return { format: "haqqreason-truchement", version: 1, creeLe: new Date().toISOString(), cartes, dictionnaire, journal, medias, documents };
}

/** Fusionne une sauvegarde : ce qui existe déjà est remplacé par la version du fichier. */
export async function importerTout(s: unknown): Promise<{ mots: number; cartes: number }> {
  const x = s as Partial<Sauvegarde>;
  if (x?.format !== "haqqreason-truchement") throw new Error("Ce fichier n'est pas une sauvegarde du Truchement.");
  const tableau = <T>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
  const cartes = tableau<Carte>(x.cartes).filter((c) => c && typeof c.id === "string" && typeof c.echeance === "number");
  const mots = tableau<MotPerso>(x.dictionnaire).filter((m) => m && typeof m.id === "string" && typeof m.en === "string");
  await ecrireBeaucoup("cartes", cartes);
  await ecrireBeaucoup("dictionnaire", mots);
  await ecrireBeaucoup("journal", tableau<Jour>(x.journal).filter((j) => j && typeof j.jour === "string"));
  await ecrireBeaucoup("medias", tableau<MediaLangue>(x.medias).filter((m) => m && typeof m.id === "string" && Array.isArray(m.phrases)));
  await ecrireBeaucoup("documents", tableau<DocumentLangue>(x.documents).filter((d) => d && typeof d.id === "string" && Array.isArray(d.pages)));
  return { mots: mots.length, cartes: cartes.length };
}
