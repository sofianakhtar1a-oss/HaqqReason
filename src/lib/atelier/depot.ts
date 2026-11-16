"use client";

/**
 * Le Calame — dépôt local.
 *
 * Tout reste sur l'appareil de l'auteur, dans la base du navigateur (IndexedDB) :
 * aucun compte, aucune adresse e-mail, rien qui parte sur un serveur. Les
 * documents, les images, les PDF et l'historique des versions y vivent ensemble,
 * et l'auteur peut à tout moment tout exporter dans un fichier.
 *
 * Deux conséquences qu'il faut assumer et dire clairement :
 *   • le travail ne suit pas d'un appareil à l'autre — c'est l'export qui sert
 *     de pont ;
 *   • vider les données du site efface aussi les documents.
 * En échange : aucune latence réseau, aucun quota, et ça fonctionne hors ligne.
 */

import { documentVide, nettoyerReglages, type DocumentAtelier, type VersionAtelier, LIMITES_ATELIER } from "./modele";

const BASE = "haqqreason-calame";
const VERSION_BASE = 1;
const DOCUMENTS = "documents";
const FICHIERS = "fichiers";
const VERSIONS = "versions";

export type FichierLocal = { id: string; nom: string; type: string; taille: number; blob: Blob; ajoute: string };

let promesse: Promise<IDBDatabase> | null = null;

function ouvrir(): Promise<IDBDatabase> {
  if (promesse) return promesse;
  promesse = new Promise((resoudre, rejeter) => {
    if (typeof indexedDB === "undefined") {
      rejeter(new Error("Ce navigateur ne sait pas garder de documents hors ligne."));
      return;
    }
    const demande = indexedDB.open(BASE, VERSION_BASE);
    demande.onupgradeneeded = () => {
      const db = demande.result;
      if (!db.objectStoreNames.contains(DOCUMENTS)) db.createObjectStore(DOCUMENTS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(FICHIERS)) db.createObjectStore(FICHIERS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(VERSIONS)) {
        const v = db.createObjectStore(VERSIONS, { keyPath: "id" });
        v.createIndex("documentId", "documentId", { unique: false });
      }
    };
    demande.onsuccess = () => resoudre(demande.result);
    demande.onerror = () => rejeter(demande.error ?? new Error("Base locale inaccessible."));
  });
  return promesse;
}

function enPromesse<T>(demande: IDBRequest<T>): Promise<T> {
  return new Promise((resoudre, rejeter) => {
    demande.onsuccess = () => resoudre(demande.result);
    demande.onerror = () => rejeter(demande.error ?? new Error("Opération refusée par la base locale."));
  });
}

async function magasin(nom: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await ouvrir();
  return db.transaction(nom, mode).objectStore(nom);
}

export function nouvelIdentifiant(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

function remettreDAplomb(brut: unknown): DocumentAtelier {
  const o = (brut ?? {}) as Partial<DocumentAtelier>;
  const vide = documentVide(o.id ?? nouvelIdentifiant());
  return {
    ...vide,
    ...o,
    titre: String(o.titre ?? vide.titre).slice(0, LIMITES_ATELIER.titre),
    dossier: String(o.dossier ?? "").slice(0, LIMITES_ATELIER.dossier),
    reglages: nettoyerReglages(o.reglages),
    contenu: o.contenu ?? vide.contenu,
    mots: Number(o.mots ?? 0),
    signes: Number(o.signes ?? 0),
  };
}

export async function listerDocuments(): Promise<DocumentAtelier[]> {
  const tous = await enPromesse((await magasin(DOCUMENTS, "readonly")).getAll());
  return (tous as unknown[]).map(remettreDAplomb).sort((a, b) => b.modifie.localeCompare(a.modifie));
}

export async function lireDocument(id: string): Promise<DocumentAtelier | null> {
  const trouve = await enPromesse((await magasin(DOCUMENTS, "readonly")).get(id));
  return trouve ? remettreDAplomb(trouve) : null;
}

export async function ecrireDocument(doc: DocumentAtelier): Promise<void> {
  await enPromesse((await magasin(DOCUMENTS, "readwrite")).put(remettreDAplomb(doc)));
}

export async function supprimerDocument(id: string): Promise<void> {
  await enPromesse((await magasin(DOCUMENTS, "readwrite")).delete(id));
  for (const v of await listerVersions(id)) await enPromesse((await magasin(VERSIONS, "readwrite")).delete(v.id));
  await nettoyerFichiersOrphelins();
}

// ---------------------------------------------------------------------------
// Versions : un historique simple, le plus récent d'abord
// ---------------------------------------------------------------------------

export async function listerVersions(documentId: string): Promise<VersionAtelier[]> {
  const index = (await magasin(VERSIONS, "readonly")).index("documentId");
  const tout = (await enPromesse(index.getAll(documentId))) as VersionAtelier[];
  return tout.sort((a, b) => b.quand.localeCompare(a.quand));
}

export async function ajouterVersion(version: Omit<VersionAtelier, "id">): Promise<void> {
  await enPromesse((await magasin(VERSIONS, "readwrite")).put({ ...version, id: nouvelIdentifiant() }));
  const toutes = await listerVersions(version.documentId);
  for (const vieille of toutes.slice(LIMITES_ATELIER.versions)) {
    await enPromesse((await magasin(VERSIONS, "readwrite")).delete(vieille.id));
  }
}

// ---------------------------------------------------------------------------
// Fichiers joints
// ---------------------------------------------------------------------------

const urls = new Map<string, string>();

export async function ajouterFichier(blob: Blob, nom: string): Promise<FichierLocal> {
  const fichier: FichierLocal = {
    id: nouvelIdentifiant(),
    nom: nom.slice(0, 200),
    type: blob.type || "application/octet-stream",
    taille: blob.size,
    blob,
    ajoute: new Date().toISOString(),
  };
  await enPromesse((await magasin(FICHIERS, "readwrite")).put(fichier));
  return fichier;
}

export async function lireFichier(id: string): Promise<FichierLocal | null> {
  const trouve = await enPromesse((await magasin(FICHIERS, "readonly")).get(id));
  return (trouve as FichierLocal) ?? null;
}

/** Adresse locale d'un fichier, fabriquée une seule fois et gardée en mémoire. */
export async function urlFichier(id: string): Promise<string | null> {
  const connue = urls.get(id);
  if (connue) return connue;
  const fichier = await lireFichier(id);
  if (!fichier) return null;
  const url = URL.createObjectURL(fichier.blob);
  urls.set(id, url);
  return url;
}

export function oublierUrls(): void {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
}

/** Identifiants de fichiers cités quelque part dans un document. */
export function fichiersCites(contenu: unknown): Set<string> {
  const vus = new Set<string>();
  const visiter = (n: unknown) => {
    if (!n || typeof n !== "object") return;
    const noeud = n as { attrs?: Record<string, unknown>; content?: unknown[] };
    const f = noeud.attrs?.fichier;
    if (typeof f === "string" && f) vus.add(f);
    for (const enfant of noeud.content ?? []) visiter(enfant);
  };
  visiter(contenu);
  return vus;
}

/** Efface les images et documents que plus aucun texte ne cite. */
export async function nettoyerFichiersOrphelins(): Promise<number> {
  const documents = await listerDocuments();
  const cites = new Set<string>();
  for (const doc of documents) for (const id of fichiersCites(doc.contenu)) cites.add(id);
  const tous = (await enPromesse((await magasin(FICHIERS, "readonly")).getAll())) as FichierLocal[];
  let effaces = 0;
  for (const fichier of tous) {
    if (cites.has(fichier.id)) continue;
    await enPromesse((await magasin(FICHIERS, "readwrite")).delete(fichier.id));
    const url = urls.get(fichier.id);
    if (url) {
      URL.revokeObjectURL(url);
      urls.delete(fichier.id);
    }
    effaces++;
  }
  return effaces;
}

/** Place occupée sur l'appareil, et place encore disponible si le navigateur la connaît. */
export async function placeOccupee(): Promise<{ documents: number; fichiers: number; octets: number; disponible: number | null }> {
  const documents = await listerDocuments();
  const tous = (await enPromesse((await magasin(FICHIERS, "readonly")).getAll())) as FichierLocal[];
  const octets = tous.reduce((total, f) => total + f.taille, 0) + documents.reduce((total, d) => total + JSON.stringify(d.contenu).length, 0);
  let disponible: number | null = null;
  try {
    const estimation = await navigator.storage?.estimate?.();
    if (estimation?.quota && estimation?.usage) disponible = estimation.quota - estimation.usage;
  } catch {
    disponible = null;
  }
  return { documents: documents.length, fichiers: tous.length, octets, disponible };
}
