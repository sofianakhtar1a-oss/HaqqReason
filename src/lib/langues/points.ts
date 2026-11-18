/*
 * Les points du vocabulaire : règles communes au serveur, au navigateur et aux tests.
 *
 * Le navigateur n'envoie jamais un nombre de points : il envoie ses RÉPONSES (le mot, l'exercice,
 * ce qu'il a choisi ou écrit). Le serveur retrouve le mot dans les thèmes publiés, juge lui-même
 * la réponse (evaluer, ci-dessous), puis la base de données compte les points dans une transaction
 * (supabase/migrations/015_classement.sql). Le navigateur ne s'en sert que pour afficher tout de
 * suite la série et son palier, en attendant la réponse du serveur, qui a toujours le dernier mot.
 *
 *   Bonne réponse          : la base de l'exercice × le multiplicateur de série
 *   « Presque » (une faute) : la moitié de la base, la série tient
 *   Erreur                  : 0 point (pas de malus), la série repart de zéro
 *   1re bonne réponse du jour : + 5 × jours d'affilée (50 au plus)
 *   Un même mot ne rapporte qu'une fois par jour (il compte quand même dans la série) ; 2 500 points par jour au plus.
 */
import { trouDans } from "./exercices";
import type { Element } from "./types";
import { type Resultat, verifier } from "./verification";

/** Points de base : plus l'exercice demande de rappel (et non de reconnaissance), plus il rapporte. */
export const BASES = { qcm: 10, ecoute: 12, trou: 12, ecriture: 15, paires: 5, carte: 4 } as const;
export type ExercicePoints = keyof typeof BASES;
export const EXERCICES = Object.keys(BASES) as ExercicePoints[];

/** Les paliers de série. Les mêmes seuils que vocabulaire_multiplicateur (SQL) ; les tests le vérifient. */
export const PALIERS = [
  { des: 0, mult: 1, nom: "", teinte: "azur" },
  { des: 5, mult: 1.5, nom: "Étincelle", teinte: "ambre" },
  { des: 10, mult: 2, nom: "Flamme", teinte: "braise" },
  { des: 20, mult: 2.5, nom: "Brasier", teinte: "pourpre" },
  { des: 40, mult: 3, nom: "Comète", teinte: "aurore" },
] as const;
export type Palier = (typeof PALIERS)[number] & { index: number; prochain: number | null };

export function palier(serie: number): Palier {
  let index = 0;
  PALIERS.forEach((p, i) => {
    if (serie >= p.des) index = i;
  });
  return { ...PALIERS[index], index, prochain: PALIERS[index + 1]?.des ?? null };
}

export const multiplicateur = (serie: number) => palier(serie).mult;
export const bonusJour = (jours: number) => 5 * Math.min(Math.max(0, jours), 10);
export const PLAFOND_JOUR = 2500;

/** Les points d'une réponse (la série est celle d'APRÈS la réponse). Même calcul que la base de données. */
export function gain(base: number, resultat: Resultat, serieApres: number): number {
  if (resultat === "faux") return 0;
  if (resultat === "presque") return Math.ceil(base / 2);
  return Math.round(base * multiplicateur(serieApres));
}

/** Ce que le navigateur envoie pour une réponse. */
export type ReponseEnvoyee = {
  mot: string;
  exercice: ExercicePoints;
  /** QCM : traduire vers le français (« en-fr ») ou vers l'anglais (« fr-en »). */
  sens?: "en-fr" | "fr-en";
  /** Le choix cliqué ou le texte écrit. */
  reponse?: string;
  /** Paires et cartes mémoire : le résultat noté sur l'appareil (ces exercices ne se vérifient pas après coup). */
  resultat?: Resultat;
  /** Écriture : nombre d'indices demandés. */
  indices?: number;
};

const RESULTATS: Resultat[] = ["juste", "presque", "faux"];
const borne = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : undefined);

/** Lit une réponse envoyée, sans rien croire : tout champ inattendu disparaît. */
export function lireReponse(x: unknown): ReponseEnvoyee | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const mot = borne(o.mot, 200);
  const exercice = o.exercice as ExercicePoints;
  if (!mot || !EXERCICES.includes(exercice)) return null;
  return {
    mot,
    exercice,
    sens: o.sens === "fr-en" ? "fr-en" : o.sens === "en-fr" ? "en-fr" : undefined,
    reponse: borne(o.reponse, 300),
    resultat: RESULTATS.includes(o.resultat as Resultat) ? (o.resultat as Resultat) : undefined,
    indices: typeof o.indices === "number" && Number.isFinite(o.indices) ? Math.max(0, Math.min(50, Math.floor(o.indices))) : 0,
  };
}

const meme = (a: string | undefined, b: string | undefined) => Boolean(a && b) && a!.trim().toLowerCase() === b!.trim().toLowerCase();

/**
 * Le serveur juge la réponse avec SES données (el vient des thèmes publiés, jamais du navigateur).
 * Un mot inconnu (dictionnaire personnel, thème retiré…) ne rapporte rien : null.
 */
export function evaluer(r: ReponseEnvoyee, el: Element | undefined): { mot: string; resultat: Resultat; base: number } | null {
  if (!el) return null;
  let resultat: Resultat;
  switch (r.exercice) {
    case "qcm":
      resultat = meme(r.reponse, r.sens === "fr-en" ? el.en : el.fr) ? "juste" : "faux";
      break;
    case "ecoute":
      resultat = meme(r.reponse, el.fr) ? "juste" : "faux";
      break;
    case "trou": {
      const trou = trouDans(el);
      if (!trou) return null;
      resultat = meme(r.reponse, trou.mot) ? "juste" : "faux";
      break;
    }
    case "ecriture": {
      const v = verifier(r.reponse ?? "", el.en);
      // Avec plus d'un indice, une réponse exacte compte comme « presque ».
      resultat = v === "juste" && (r.indices ?? 0) > 1 ? "presque" : v;
      break;
    }
    case "paires":
    case "carte":
      if (!r.resultat) return null;
      resultat = r.resultat;
      break;
  }
  return { mot: el.id, resultat, base: BASES[r.exercice] };
}

/** Le nom montré aux autres : le prénom et l'initiale du nom (« Yasmine B. »). */
export function nomPublic(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (!mots.length) return "Apprenant";
  const prenom = mots[0].slice(0, 24);
  const initiale = mots.length > 1 ? ` ${mots.at(-1)!.charAt(0).toUpperCase()}.` : "";
  return prenom + initiale;
}

/** Seules les photos servies par Google passent (la base refuse le reste, l'affichage aussi). */
export function avatarSur(url: unknown): string {
  return typeof url === "string" && url.length <= 500 && /^https:\/\/lh[3-6]\.googleusercontent\.com\/[A-Za-z0-9._~/=+%-]+$/.test(url) ? url : "";
}
