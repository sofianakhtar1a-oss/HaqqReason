/* Vocabulaire commun au serveur et au navigateur pour l'outil « Transcrire ». */

export type Langue = "en" | "ar" | "es";

export const LANGUES: { id: Langue; nom: string; natif: string }[] = [
  { id: "en", nom: "Anglais", natif: "English" },
  { id: "ar", nom: "Arabe", natif: "العربية" },
  { id: "es", nom: "Espagnol", natif: "Español" },
];

export function nomLangue(code: string): string {
  return LANGUES.find((l) => l.id === code)?.nom ?? code.toUpperCase();
}

/** Whisper renvoie parfois le nom anglais de la langue (« arabic ») au lieu du code. */
export function codeLangue(valeur: string | undefined | null): string {
  const v = (valeur ?? "").toLowerCase().trim();
  const noms: Record<string, string> = { english: "en", arabic: "ar", spanish: "es", french: "fr" };
  return noms[v] ?? (v.slice(0, 2) || "en");
}

export const estRtl = (langue: string) => ["ar", "fa", "ur", "he"].includes(langue);

/** Un mot, avec son instant de début et de fin en secondes. */
export type Mot = { t: string; d: number; f: number };

/** Morceau de texte horodaté, tel que le renvoie le moteur (segment Whisper ou sous-titre YouTube). */
export type Fragment = { texte: string; d: number; f: number; mots?: Mot[] };

export type Phrase = {
  id: number;
  debut: number;
  fin: number;
  mots: Mot[];
  paragraphe: number;
};

export type Source =
  | { type: "fichier"; nom: string; mime: string; video: boolean }
  | { type: "youtube"; id: string; auteur?: string };

export type Glose = { i: number; sens: string; nature?: string; lemme?: string; racine?: string };
export type Analyse = { traduction: string; mots: Glose[] };

export type Transcription = {
  id: string;
  titre: string;
  langue: string;
  duree: number;
  source: Source;
  phrases: Phrase[];
  creeLe: number;
  /** Traduction française de chaque phrase, par identifiant. */
  traductions: Record<number, string>;
  /** Analyse mot à mot d'une phrase, par identifiant. */
  analyses: Record<number, Analyse>;
};

export const texteDe = (p: Pick<Phrase, "mots">) => p.mots.map((m) => m.t).join(" ");
