/*
 * Le journal de synchronisation : pour chaque objet personnel (un document, une leçon, un mot…),
 * l'heure de sa dernière modification sur cet appareil, et s'il reste à envoyer sur le compte.
 *
 * Ce module est volontairement minuscule : tous les tiroirs de l'appareil l'appellent à chaque
 * écriture (« noter »), y compris hors connexion. Le moteur (moteur.ts) fait le reste quand
 * un compte est connecté et que le réseau est là.
 */
import type { NomMagasin } from "@/lib/compte/limites";
import { tiroir } from "@/lib/client/compte";

export type Trace = {
  /** « magasin\nclé » */
  k: string;
  m: NomMagasin;
  c: string;
  /** Heure (ms) de la version présente sur cet appareil. */
  q: number;
  /** 1 : reste à envoyer. */
  p: 0 | 1;
  /** Empreinte de la dernière version envoyée ou reçue : évite de renvoyer ce qui n'a pas changé. */
  h?: string;
  /** Heure de cette dernière version commune. */
  qs?: number;
  /** 1 : refusé par le compte (trop lourd, ou place pleine) ; l'objet reste sur cet appareil. */
  r?: 1;
};

const TRACES = "traces";
export const EVENEMENT_A_ENVOYER = "haqqreason:synchro-a-envoyer";
/** Envoyé quand des données arrivent d'un autre appareil ; detail : la liste des magasins touchés. */
export const EVENEMENT_RECU = "haqqreason:synchro-recu";

let ouverture: Promise<IDBDatabase> | null = null;

function base(): Promise<IDBDatabase> {
  ouverture ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Stockage indisponible."));
      return;
    }
    const r = indexedDB.open(tiroir("haqqreason-synchro"), 1);
    r.onupgradeneeded = () => {
      const magasin = r.result.createObjectStore(TRACES, { keyPath: "k" });
      magasin.createIndex("p", "p", { unique: false });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => {
      ouverture = null;
      reject(r.error ?? new Error("Stockage indisponible."));
    };
  });
  return ouverture;
}

async function operation<T>(mode: IDBTransactionMode, faire: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await base();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(TRACES, mode);
    const requete = faire(tx.objectStore(TRACES));
    let resultat: T;
    if (requete) requete.onsuccess = () => (resultat = requete.result as T);
    tx.oncomplete = () => resolve(resultat);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Écriture interrompue."));
  });
}

export const cleTrace = (m: string, c: string) => `${m}\n${c}`;

/**
 * À appeler après chaque écriture ou suppression locale : l'objet devra être envoyé sur le compte.
 * Ne lève jamais d'erreur : la synchronisation ne doit pas empêcher d'enregistrer sur l'appareil.
 */
export async function noter(m: NomMagasin, c: string, quand: number = Date.now()): Promise<void> {
  try {
    const db = await base();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TRACES, "readwrite");
      const magasin = tx.objectStore(TRACES);
      const k = cleTrace(m, c);
      const lecture = magasin.get(k);
      lecture.onsuccess = () => {
        const avant = lecture.result as Trace | undefined;
        // L'heure ne recule jamais, même si l'horloge de l'appareil a été reculée.
        const q = Math.max(Math.floor(quand), (avant?.q ?? 0) + 1);
        magasin.put({ ...avant, k, m, c, q, p: 1 } satisfies Trace);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    if (etat.phase === "a-jour") publierEtat({ phase: "attente" });
    window.dispatchEvent(new Event(EVENEMENT_A_ENVOYER));
  } catch {
    // Journal indisponible (navigation privée stricte) : le travail reste sur l'appareil.
  }
}

export const lireTrace = (m: string, c: string) => operation<Trace | undefined>("readonly", (s) => s.get(cleTrace(m, c))).catch(() => undefined);
export const ecrireTrace = (t: Trace) => operation<void>("readwrite", (s) => s.put(t));
export async function ecrireTraces(traces: Trace[]): Promise<void> {
  if (traces.length === 0) return;
  await operation<void>("readwrite", (s) => {
    for (const t of traces) s.put(t);
  });
}
export const tracesEnAttente = () => operation<Trace[]>("readonly", (s) => s.index("p").getAll(1)).catch(() => [] as Trace[]);
export const toutesLesTraces = () => operation<Trace[]>("readonly", (s) => s.getAll()).catch(() => [] as Trace[]);

/** Empreinte courte d'une valeur (FNV-1a sur son JSON) : sert seulement à repérer « rien n'a changé ». */
export function empreinte(valeur: unknown): string {
  const texte = JSON.stringify(valeur) ?? "";
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < texte.length; i++) {
    const code = texte.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 + code, 0x85ebca6b) ^ (h2 >>> 13);
  }
  return `${texte.length.toString(36)}-${(h1 >>> 0).toString(36)}-${(h2 >>> 0).toString(36)}`;
}

/* ---------- L'état visible : « à jour », « envoi en cours », « hors ligne »… ---------- */

export type EtatSynchro = {
  /** inactif : aucun compte ; attente : rien encore tenté. */
  phase: "inactif" | "attente" | "en-cours" | "a-jour" | "hors-ligne" | "erreur" | "deconnecte";
  /** Objets qui restent à envoyer. */
  enAttente: number;
  /** Heure de la dernière synchronisation complète. */
  dernier: number | null;
  /** Objets refusés par le compte (place pleine ou objet trop lourd) : ils restent sur l'appareil. */
  refuses: number;
};

let etat: EtatSynchro = { phase: "inactif", enAttente: 0, dernier: null, refuses: 0 };
const INITIAL = etat;
const abonnes = new Set<() => void>();

export function publierEtat(maj: Partial<EtatSynchro>) {
  etat = { ...etat, ...maj };
  abonnes.forEach((f) => f());
}
export const lireEtat = () => etat;
export const etatInitial = () => INITIAL;
export function abonnerEtat(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/* ---------- « Les données du compte sont-elles arrivées ? » ---------- */

let pret = false;
const enAttenteDePret = new Set<() => void>();

/** Appelé par le moteur à la fin de son premier passage (réussi ou non). */
export function marquerPret() {
  pret = true;
  enAttenteDePret.forEach((f) => f());
  enAttenteDePret.clear();
}

/**
 * Attend le premier passage de la synchronisation, pour ne pas afficher un espace vide
 * alors que les documents du compte sont en train d'arriver. N'attend jamais plus que « delai ».
 * Sans compte, répond tout de suite.
 */
export function attendreSynchro(delai = 7000): Promise<void> {
  if (pret || typeof document === "undefined" || !document.documentElement.dataset.compte) return Promise.resolve();
  if (typeof navigator !== "undefined" && navigator.onLine === false) return Promise.resolve();
  return new Promise((resolve) => {
    const fini = () => {
      clearTimeout(minuteur);
      enAttenteDePret.delete(fini);
      resolve();
    };
    const minuteur = setTimeout(fini, delai);
    enAttenteDePret.add(fini);
  });
}
