"use client";

/**
 * Le Calame — dépôt local.
 *
 * L'auteur écrit d'abord sur son appareil, dans la base du navigateur (IndexedDB) :
 * aucune latence réseau, et ça fonctionne hors ligne. Les documents, les images,
 * les PDF et l'historique des versions y vivent ensemble.
 *
 * Quand il est connecté à son compte, chaque écriture est aussi notée dans le journal
 * de synchronisation (lib/client/synchro) : les documents et leurs fichiers joints sont
 * alors recopiés sur son compte, et le suivent d'un appareil à l'autre. Vider les données
 * du site n'efface donc plus son travail.
 *
 * Ce qui reste propre à chaque appareil : l'historique des versions, et les fichiers
 * joints trop lourds pour le compte (voir lib/compte/limites.ts).
 */

import { compteLocal, tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";
import { corbeilleExpiree, documentVide, nettoyerExtras, nettoyerReglages, type DocumentAtelier, type VersionAtelier, LIMITES_ATELIER } from "./modele";

const BASE = "haqqreason-calame";
const VERSION_BASE = 1;
const DOCUMENTS = "documents";
const FICHIERS = "fichiers";
const VERSIONS = "versions";

export type FichierLocal = { id: string; nom: string; type: string; taille: number; blob: Blob; ajoute: string };
/** La fiche d'un fichier joint, sans son contenu : c'est elle qui voyage avec le compte. */
export type FicheFichier = Omit<FichierLocal, "blob">;
/** Sur l'appareil, un fichier venu d'un autre appareil n'a d'abord que sa fiche ; son contenu arrive à la première lecture. */
type FichierRange = FicheFichier & { blob: Blob | null };

let promesse: Promise<IDBDatabase> | null = null;

function ouvrir(): Promise<IDBDatabase> {
  if (promesse) return promesse;
  promesse = new Promise((resoudre, rejeter) => {
    if (typeof indexedDB === "undefined") {
      rejeter(new Error("Ce navigateur ne sait pas garder de documents hors ligne."));
      return;
    }
    const demande = indexedDB.open(tiroir(BASE), VERSION_BASE);
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
    ...nettoyerExtras(o),
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
  await ecrireDocumentBrut(doc);
  await noter("calame-documents", doc.id);
}

export async function supprimerDocument(id: string): Promise<void> {
  await supprimerDocumentBrut(id);
  await noter("calame-documents", id);
  await nettoyerFichiersOrphelins();
}

/* Les mêmes gestes sans rien noter au journal : réservés à la synchronisation, qui range ce qui arrive du compte. */

export async function ecrireDocumentBrut(doc: unknown): Promise<void> {
  await enPromesse((await magasin(DOCUMENTS, "readwrite")).put(remettreDAplomb(doc)));
}

export async function supprimerDocumentBrut(id: string): Promise<void> {
  await enPromesse((await magasin(DOCUMENTS, "readwrite")).delete(id));
  for (const v of await listerVersions(id)) await enPromesse((await magasin(VERSIONS, "readwrite")).delete(v.id));
}

// ---------------------------------------------------------------------------
// Versions : un historique simple, le plus récent d'abord
// ---------------------------------------------------------------------------

export async function listerVersions(documentId: string): Promise<VersionAtelier[]> {
  const index = (await magasin(VERSIONS, "readonly")).index("documentId");
  const tout = (await enPromesse(index.getAll(documentId))) as VersionAtelier[];
  return tout.sort((a, b) => b.quand.localeCompare(a.quand));
}

export async function ajouterVersion(version: Omit<VersionAtelier, "id">): Promise<string> {
  const id = nouvelIdentifiant();
  await enPromesse((await magasin(VERSIONS, "readwrite")).put({ ...version, id }));
  // Les versions nommées ne comptent pas dans la limite : elles ne s'effacent jamais d'elles-mêmes.
  const ordinaires = (await listerVersions(version.documentId)).filter((v) => !v.nom);
  for (const vieille of ordinaires.slice(LIMITES_ATELIER.versions)) {
    await enPromesse((await magasin(VERSIONS, "readwrite")).delete(vieille.id));
  }
  return id;
}

export async function lireVersion(id: string): Promise<VersionAtelier | null> {
  return ((await enPromesse((await magasin(VERSIONS, "readonly")).get(id))) as VersionAtelier | undefined) ?? null;
}

/** Donne un nom à une version (ou le retire, avec un nom vide). */
export async function nommerVersion(id: string, nom: string): Promise<void> {
  const v = await lireVersion(id);
  if (!v) return;
  const propre = nom.trim().slice(0, 80);
  const aJour: VersionAtelier = { ...v };
  if (propre) aJour.nom = propre;
  else delete aJour.nom;
  await enPromesse((await magasin(VERSIONS, "readwrite")).put(aJour));
}

export async function supprimerVersion(id: string): Promise<void> {
  await enPromesse((await magasin(VERSIONS, "readwrite")).delete(id));
}

// ---------------------------------------------------------------------------
// Corbeille, archives, copies
// ---------------------------------------------------------------------------

/** Met un document à la corbeille (il y reste 30 jours) ou l'en sort. */
export async function mettreALaCorbeille(id: string, dedans = true): Promise<DocumentAtelier | null> {
  const doc = await lireDocument(id);
  if (!doc) return null;
  const aJour: DocumentAtelier = { ...doc, corbeille: dedans ? new Date().toISOString() : null };
  await ecrireDocument(aJour);
  return aJour;
}

/** Efface pour de bon les documents restés plus de 30 jours à la corbeille. */
export async function viderCorbeilleExpiree(): Promise<number> {
  let effaces = 0;
  for (const doc of await listerDocuments()) {
    if (!corbeilleExpiree({ corbeille: doc.corbeille ?? null })) continue;
    await supprimerDocument(doc.id);
    effaces++;
  }
  return effaces;
}

/** Une copie complète du document, avec un nouveau titre ; les images restent partagées. */
export async function dupliquerDocument(id: string, suffixe = " (copie)"): Promise<DocumentAtelier | null> {
  const doc = await lireDocument(id);
  if (!doc) return null;
  const maintenant = new Date().toISOString();
  const copie: DocumentAtelier = {
    ...doc,
    id: nouvelIdentifiant(),
    titre: `${doc.titre}${suffixe}`.slice(0, LIMITES_ATELIER.titre),
    cree: maintenant,
    modifie: maintenant,
    epingle: false,
    corbeille: null,
    archive: false,
  };
  await ecrireDocument(copie);
  return copie;
}

/** Modifie quelques champs d'un document sans toucher à son texte (rangement, propriétés). */
export async function modifierDocument(id: string, modif: Partial<DocumentAtelier>): Promise<DocumentAtelier | null> {
  const doc = await lireDocument(id);
  if (!doc) return null;
  const aJour: DocumentAtelier = { ...doc, ...modif, id: doc.id };
  await ecrireDocument(aJour);
  return aJour;
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
  await noter("calame-fichiers", fichier.id);
  return fichier;
}

const telechargements = new Map<string, Promise<Blob | null>>();

/** Va chercher sur le compte le contenu d'un fichier ajouté depuis un autre appareil. */
function telecharger(id: string): Promise<Blob | null> {
  const enCours = telechargements.get(id);
  if (enCours) return enCours;
  const promesse = (async () => {
    try {
      if (!compteLocal()) return null;
      const lien = await fetch(`/api/compte/fichiers/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!lien.ok) return null;
      const { url } = (await lien.json()) as { url?: string };
      if (!url) return null;
      const contenu = await fetch(url, { cache: "no-store" });
      return contenu.ok ? await contenu.blob() : null;
    } catch {
      return null;
    } finally {
      telechargements.delete(id);
    }
  })();
  telechargements.set(id, promesse);
  return promesse;
}

export async function lireFichier(id: string): Promise<FichierLocal | null> {
  const trouve = (await enPromesse((await magasin(FICHIERS, "readonly")).get(id))) as FichierRange | undefined;
  if (!trouve) return null;
  if (trouve.blob) return trouve as FichierLocal;
  const blob = await telecharger(id);
  if (!blob) return null;
  const complet: FichierLocal = { ...trouve, blob: trouve.type && blob.type !== trouve.type ? new Blob([blob], { type: trouve.type }) : blob };
  await enPromesse((await magasin(FICHIERS, "readwrite")).put(complet)).catch(() => undefined);
  return complet;
}

/* Pour la synchronisation : les fiches, sans jamais charger les contenus. */

export async function listerFichesLocales(): Promise<FicheFichier[]> {
  const tous = (await enPromesse((await magasin(FICHIERS, "readonly")).getAll())) as FichierRange[];
  return tous.filter((f) => f.blob).map(({ id, nom, type, taille, ajoute }) => ({ id, nom, type, taille, ajoute }));
}

/** Le fichier tel qu'il est sur l'appareil, sans téléchargement. */
export async function lireFichierLocal(id: string): Promise<FichierLocal | null> {
  const trouve = (await enPromesse((await magasin(FICHIERS, "readonly")).get(id))) as FichierRange | undefined;
  return trouve?.blob ? (trouve as FichierLocal) : null;
}

/** Range la fiche d'un fichier ajouté ailleurs ; son contenu sera téléchargé quand un document l'affichera. */
export async function rangerFiche(fiche: FicheFichier): Promise<void> {
  const deja = (await enPromesse((await magasin(FICHIERS, "readonly")).get(fiche.id))) as FichierRange | undefined;
  if (deja?.blob) return;
  const range: FichierRange = { id: fiche.id, nom: String(fiche.nom ?? "").slice(0, 200), type: String(fiche.type || "application/octet-stream"), taille: Number(fiche.taille) || 0, ajoute: String(fiche.ajoute ?? ""), blob: null };
  await enPromesse((await magasin(FICHIERS, "readwrite")).put(range));
}

export async function supprimerFichierBrut(id: string): Promise<void> {
  await enPromesse((await magasin(FICHIERS, "readwrite")).delete(id));
  const url = urls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(id);
  }
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
  const tous = (await enPromesse((await magasin(FICHIERS, "readonly")).getAll())) as FichierRange[];
  let effaces = 0;
  for (const fichier of tous) {
    // Une simple fiche (contenu resté sur un autre appareil) n'est jamais effacée d'ici :
    // le document qui la cite est peut-être encore en route.
    if (cites.has(fichier.id) || !fichier.blob) continue;
    await supprimerFichierBrut(fichier.id);
    await noter("calame-fichiers", fichier.id);
    effaces++;
  }
  return effaces;
}

/** Place occupée sur l'appareil, et place encore disponible si le navigateur la connaît. */
export async function placeOccupee(): Promise<{ documents: number; fichiers: number; octets: number; disponible: number | null }> {
  const documents = await listerDocuments();
  const tous = (await enPromesse((await magasin(FICHIERS, "readonly")).getAll())) as FichierRange[];
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
