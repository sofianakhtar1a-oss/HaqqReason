"use client";

/**
 * Le Calame — les préférences de l'auteur.
 *
 * Tout ce qui n'appartient pas à un document en particulier : les dossiers et les
 * étiquettes, le tri de la liste, les aides à la frappe, le dictionnaire personnel,
 * les objectifs, l'apparence de l'atelier. Elles vivent sur l'appareil (stockage local
 * du navigateur, rangé par compte) et suivent le compte d'un appareil à l'autre, d'un
 * seul bloc : la modification la plus récente l'emporte.
 */

import { tiroir } from "@/lib/client/compte";
import { noter } from "@/lib/client/synchro/journal";

export const TRIS = [
  { cle: "modification", libelle: "Dernière modification" },
  { cle: "creation", libelle: "Date de création" },
  { cle: "titre", libelle: "Titre (A → Z)" },
  { cle: "longueur", libelle: "Longueur" },
] as const;
export type Tri = (typeof TRIS)[number]["cle"];

export const COULEURS_ETIQUETTES = ["#c9a227", "#1f6feb", "#2e7d52", "#a23b72", "#c2410c", "#6d4aff", "#0f766e", "#64748b"] as const;

export const THEMES_ATELIER = [
  { cle: "auto", libelle: "Celui du site" },
  { cle: "sepia", libelle: "Sépia" },
  { cle: "contraste", libelle: "Contraste élevé" },
] as const;
export type ThemeAtelier = (typeof THEMES_ATELIER)[number]["cle"];

export const AMBIANCES = [
  { cle: "aucune", libelle: "Silence" },
  { cle: "pluie", libelle: "Pluie" },
  { cle: "bibliotheque", libelle: "Bibliothèque" },
] as const;
export type Ambiance = (typeof AMBIANCES)[number]["cle"];

export type PreferencesCalame = {
  /** Chemins des dossiers (« Cours/2026 ») : un dossier peut exister vide. */
  dossiers: string[];
  dossiersReplies: string[];
  etiquettes: { nom: string; couleur: string }[];
  tri: Tri;
  /** Correcteur typographique pendant la frappe (espaces fines, guillemets, apostrophes). */
  typographie: boolean;
  /** Raccourcis de translittération (_a → ā, .h → ḥ…), désactivés par défaut. */
  translitRapide: boolean;
  /** Mots que le correcteur ne doit plus signaler. */
  dictionnaire: string[];
  /** Mots à écrire chaque jour (0 : pas d'objectif). */
  objectifQuotidien: number;
  theme: ThemeAtelier;
  /** Taille du texte de l'interface (1 = normale). */
  tailleInterface: number;
  /** Police pour lecteurs dyslexiques, à l'écran seulement. */
  dyslexie: boolean;
  ambiance: Ambiance;
  volume: number;
  /** Jeu de styles appliqué aux nouveaux documents (null : styles d'origine). */
  jeuParDefaut: string | null;
  /** Jalons déjà fêtés (pour ne les fêter qu'une fois). */
  jalons: string[];
  /** Mode machine à écrire : la ligne en cours reste au milieu de l'écran. */
  machineAEcrire: boolean;
  /** Dernière modification, en millisecondes : départage deux appareils. */
  q: number;
};

export const PREFERENCES_PAR_DEFAUT: PreferencesCalame = {
  dossiers: [],
  dossiersReplies: [],
  etiquettes: [],
  tri: "modification",
  typographie: true,
  translitRapide: false,
  dictionnaire: [],
  objectifQuotidien: 0,
  theme: "auto",
  tailleInterface: 1,
  dyslexie: false,
  ambiance: "aucune",
  volume: 0.35,
  jeuParDefaut: null,
  jalons: [],
  machineAEcrire: false,
  q: 0,
};

const CLE = () => tiroir("calame-preferences");
export const EVENEMENT_PREFERENCES = "calame:preferences";

const chaines = (v: unknown, max: number, longueur: number) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, longueur)).filter(Boolean))].slice(0, max) : [];

export function nettoyerPreferences(brut: unknown): PreferencesCalame {
  const o = (brut ?? {}) as Record<string, unknown>;
  const d = PREFERENCES_PAR_DEFAUT;
  const dans = <T extends string>(v: unknown, liste: readonly { cle: T }[], defaut: T): T => (liste.some((x) => x.cle === v) ? (v as T) : defaut);
  const nombre = (v: unknown, min: number, max: number, defaut: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : defaut;
  };
  const etiquettes = Array.isArray(o.etiquettes)
    ? (o.etiquettes as unknown[])
        .map((e) => e as { nom?: unknown; couleur?: unknown })
        .filter((e) => typeof e?.nom === "string" && e.nom.trim())
        .map((e) => ({ nom: String(e.nom).trim().slice(0, 40), couleur: typeof e.couleur === "string" && /^#[0-9a-f]{6}$/i.test(e.couleur) ? e.couleur : COULEURS_ETIQUETTES[0] }))
        .filter((e, i, liste) => liste.findIndex((x) => x.nom === e.nom) === i)
        .slice(0, 60)
    : [];
  return {
    dossiers: [...new Set(chaines(o.dossiers, 300, 160).map((x) => x.replace(/\/+/g, "/").replace(/^\/|\/$/g, "").trim()).filter(Boolean))],
    dossiersReplies: chaines(o.dossiersReplies, 300, 160),
    etiquettes,
    tri: dans(o.tri, TRIS, d.tri),
    typographie: o.typographie === undefined ? d.typographie : o.typographie === true,
    translitRapide: o.translitRapide === true,
    dictionnaire: chaines(o.dictionnaire, 5000, 60),
    objectifQuotidien: nombre(o.objectifQuotidien, 0, 100_000, 0),
    theme: dans(o.theme, THEMES_ATELIER, d.theme),
    tailleInterface: nombre(o.tailleInterface, 0.85, 1.4, 1),
    dyslexie: o.dyslexie === true,
    ambiance: dans(o.ambiance, AMBIANCES, d.ambiance),
    volume: nombre(o.volume, 0, 1, d.volume),
    jeuParDefaut: typeof o.jeuParDefaut === "string" && o.jeuParDefaut ? o.jeuParDefaut.slice(0, 40) : null,
    jalons: chaines(o.jalons, 200, 60),
    machineAEcrire: o.machineAEcrire === true,
    q: nombre(o.q, 0, Number.MAX_SAFE_INTEGER, 0),
  };
}

let cache: PreferencesCalame | null = null;

export function lirePreferences(): PreferencesCalame {
  if (cache) return cache;
  try {
    const brut = typeof localStorage !== "undefined" ? localStorage.getItem(CLE()) : null;
    cache = nettoyerPreferences(brut ? JSON.parse(brut) : {});
  } catch {
    cache = { ...PREFERENCES_PAR_DEFAUT };
  }
  return cache;
}

function publier(p: PreferencesCalame) {
  cache = p;
  try {
    localStorage.setItem(CLE(), JSON.stringify(p));
  } catch {
    // Stockage plein ou refusé : les préférences restent pour cette visite.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENEMENT_PREFERENCES));
}

/** Modifie les préférences et les envoie au compte. */
export function modifierPreferences(modif: Partial<PreferencesCalame> | ((p: PreferencesCalame) => Partial<PreferencesCalame>)): PreferencesCalame {
  const avant = lirePreferences();
  const suite = nettoyerPreferences({ ...avant, ...(typeof modif === "function" ? modif(avant) : modif), q: Date.now() });
  publier(suite);
  void noter("calame-preferences", "preferences", suite.q).catch(() => undefined);
  return suite;
}

/* ---------- Synchronisation (appelée par le moteur, sans rien noter au journal) ---------- */

export function preferencesBrutes(): PreferencesCalame | undefined {
  const p = lirePreferences();
  return p.q > 0 ? p : undefined;
}

/** Range des préférences venues du compte ; garde les nôtres si elles sont plus récentes. */
export function rangerPreferences(v: unknown): "a-renvoyer" | undefined {
  const venues = nettoyerPreferences(v);
  const ici = lirePreferences();
  if (ici.q > venues.q) return "a-renvoyer";
  publier(venues);
  return undefined;
}

/* ---------- Abonnement React (useSyncExternalStore) ---------- */

export function abonnerPreferences(f: () => void): () => void {
  const surStockage = (e: StorageEvent) => {
    if (e.key === CLE()) {
      cache = null;
      f();
    }
  };
  window.addEventListener(EVENEMENT_PREFERENCES, f);
  window.addEventListener("storage", surStockage);
  return () => {
    window.removeEventListener(EVENEMENT_PREFERENCES, f);
    window.removeEventListener("storage", surStockage);
  };
}

export const PREFERENCES_SERVEUR = PREFERENCES_PAR_DEFAUT;
