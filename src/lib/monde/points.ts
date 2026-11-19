import { jugerCabinet, METHODES, reponseCabinetValide } from "./cabinets";
import { TYPES, type TypeQuestion } from "./categories";
import { juger } from "./quiz";
import type { CabinetId, MethodeCabinet } from "./types";

/*
 * Le Portulan : l'expérience (XP), les ducats et les trophées.
 *
 *   • XP : chaque bonne réponse en rapporte, selon la méthode (4 choix, 6 choix, écrire, situer).
 *     Le navigateur n'envoie que ses RÉPONSES ; le serveur les juge (juger, quiz.ts) puis la base
 *     compte l'XP (supabase/migrations/017_portulan.sql). Un même pays, pour une même méthode,
 *     ne rapporte qu'une fois par jour ; 3 000 XP par jour au plus.
 *   • Les ducats (la monnaie de Venise, celle des portulans) restent sur l'appareil et le compte :
 *     ils achètent les jokers.
 *   • Les trophées ne se gagnent qu'en duel contre une autre personne.
 */

export const BASES = { qcm2: 6, qcm4: 10, qcm6: 12, ecrit: 15, clic: 15 } as const;
export const PLAFOND_JOUR = 3000;

export function baseDe(type: TypeQuestion, nb: number): number {
  const r = TYPES[type]?.reponse;
  if (r === "ecrit") return BASES.ecrit;
  // Toucher le globe, poser une capitale, colorier un drapeau, ranger des pays : autant qu'écrire.
  if (r === "clic" || r === "placer" || r === "coloriage" || r === "classer" || r === "puzzle") return BASES.clic;
  if (r === "vraifaux" || nb === 2) return BASES.qcm2;
  return nb >= 6 ? BASES.qcm6 : BASES.qcm4;
}

/** Ce que le navigateur envoie pour une réponse : une question sur un pays, ou sur un cabinet. */
export type ReponsePays = { type: TypeQuestion; cible: string; reponse: string; nb: number; cabinet?: undefined };
export type ReponseCabinetEnvoyee = { cabinet: CabinetId; type: MethodeCabinet; cible: string; reponse: string; nb: number };
export type ReponseEnvoyee = ReponsePays | ReponseCabinetEnvoyee;

/** Lit une réponse envoyée, sans rien croire : tout champ inattendu disparaît. */
export function lireReponse(x: unknown): ReponseEnvoyee | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (o.cabinet !== undefined) {
    if (!reponseCabinetValide(o.cabinet, o.type, o.cible)) return null;
    if (typeof o.reponse !== "string" || o.reponse.length > 120) return null;
    return { cabinet: o.cabinet as CabinetId, type: o.type as MethodeCabinet, cible: o.cible as string, reponse: o.reponse, nb: o.nb === 2 ? 2 : o.nb === 0 ? 0 : 4 };
  }
  const type = o.type as TypeQuestion;
  if (typeof type !== "string" || !(type in TYPES)) return null;
  if (typeof o.cible !== "string" || !/^[a-z]{2}$/.test(o.cible)) return null;
  if (typeof o.reponse !== "string" || o.reponse.length > 120) return null;
  const nb = o.nb === 6 ? 6 : o.nb === 0 ? 0 : o.nb === 2 ? 2 : 4;
  return { type, cible: o.cible, reponse: o.reponse, nb };
}

/** L'XP de base d'une question de cabinet : comme pour les pays (4 choix, ou écrire). */
export const baseCabinet = (m: MethodeCabinet, nb: number): number => (METHODES[m]?.reponse === "ecrit" ? BASES.ecrit : nb === 2 ? BASES.qcm2 : BASES.qcm4);

/** Le serveur juge avec SES données ; la base reçoit le résultat et la base de points. */
export function evaluer(r: ReponseEnvoyee): { cle: string; resultat: "juste" | "presque" | "faux"; base: number } {
  if (r.cabinet) return { cle: `${r.type}:${r.cabinet}:${r.cible}`, resultat: jugerCabinet(r.cabinet, r.type, r.cible, r.reponse), base: baseCabinet(r.type, r.nb) };
  return { cle: `${r.type}:${r.cible}`, resultat: juger(r.type, r.cible, r.reponse), base: baseDe(r.type, r.nb) };
}

/** L'XP d'une réponse (le même calcul que la base). */
export const gainDe = (resultat: "juste" | "presque" | "faux", base: number) => (resultat === "juste" ? base : resultat === "presque" ? Math.ceil(base / 2) : 0);

/* ---------- Les ducats et les jokers ---------- */

export const DUCATS = {
  /** Par bonne réponse. */
  bonne: 2,
  /** Un niveau réussi, puis le bonus des étoiles. */
  niveau: 15,
  parEtoile: 10,
  /** Le premier niveau réussi de la journée. */
  jour: 25,
} as const;

export type Joker = "seconde" | "moitie" | "coeur" | "sablier";
export const JOKERS: Record<Joker, { nom: string; texte: string; prix: number }> = {
  seconde: { nom: "Seconde chance", texte: "Une erreur ne coûte pas de cœur : tu peux rejouer la question.", prix: 120 },
  moitie: { nom: "Moitié-moitié", texte: "La moitié des mauvais choix disparaît.", prix: 160 },
  coeur: { nom: "Cœur de secours", texte: "Un cœur de plus, pour finir le niveau.", prix: 250 },
  sablier: { nom: "Sablier", texte: "Le temps s'arrête pour cette question.", prix: 60 },
};
export const DUCATS_DE_DEPART = 300;

/* ---------- Les duels ---------- */

/** Une bonne réponse vaut 100 points, plus 50 au plus pour la rapidité (rien après 15 secondes). */
export const DUREE_QUESTION_DUEL = 15_000;
export function pointsDuel(juste: boolean, ms: number): number {
  if (!juste) return 0;
  const t = Math.min(Math.max(ms, 0), DUREE_QUESTION_DUEL);
  return 100 + Math.round(50 * (1 - t / DUREE_QUESTION_DUEL));
}
export const TROPHEES = { victoire: 20, nul: 8, defaite: 0 } as const;
