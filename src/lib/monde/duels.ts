/*
 * Le Portulan : ce que partagent le navigateur et le serveur pour les duels et les salons
 * (les réglages permis, les réactions, l'arbitrage du temps). Ni React ni base ici.
 */

export type Reaction = "bravo" | "oups" | "vite" | "bien-joue" | "salam" | "revanche";

/** Les réactions rapides, montrées à l'adversaire pendant le duel. */
export const REACTIONS: readonly { id: Reaction; texte: string }[] = [
  { id: "salam", texte: "Salam !" },
  { id: "bravo", texte: "Bravo !" },
  { id: "bien-joue", texte: "Bien joué" },
  { id: "vite", texte: "Vite !" },
  { id: "oups", texte: "Oups…" },
  { id: "revanche", texte: "Revanche ?" },
];
export const estReaction = (x: unknown): x is Reaction => REACTIONS.some((r) => r.id === x);

/** Un duel réglable : cinq, dix ou quinze questions, de cinq à trente secondes chacune. */
export const NOMBRES_DUEL = [5, 10, 15] as const;
export const DUREES_DUEL = [5_000, 10_000, 15_000, 20_000, 30_000] as const;
export const nombreDuelValide = (n: unknown): n is (typeof NOMBRES_DUEL)[number] => NOMBRES_DUEL.includes(n as never);
export const dureeDuelValide = (d: unknown): d is (typeof DUREES_DUEL)[number] => DUREES_DUEL.includes(d as never);

/** Un salon : de trois à huit joueurs, six à quinze questions (un multiple de trois pour l'élimination). */
export type FormuleSalon = "classique" | "elimination";
export const NOMBRES_SALON = [6, 9, 12, 15] as const;
export const TAILLE_SALON = { min: 3, max: 8 } as const;
/** Le temps d'une question de salon, comme en duel classique. */
export const DUREE_SALON = 15_000;
/** Dans un salon à élimination, le dernier sort toutes les trois questions. */
export const PAS_ELIMINATION = 3;

/** Le temps de la pause qui suit chaque réponse (la bonne réponse s'affiche). */
export const PAUSE_REPONSE = 1_300;
/** Personne ne lit une question et n'y répond en moins de 0,4 s. */
export const REFLEXE_MIN = 400;

/** Les points d'une réponse : 100 si elle est juste, plus jusqu'à 50 pour la rapidité (sur la durée de la question). */
export function pointsReponse(juste: boolean, ms: number, duree: number): number {
  if (!juste) return 0;
  const t = Math.min(Math.max(ms, 0), duree);
  return 100 + Math.round(50 * (1 - t / duree));
}

/**
 * L'arbitrage du temps : le navigateur annonce le temps qu'il a mis à répondre, le serveur sait quand
 * la question a pu s'afficher (la réponse d'avant, plus la pause ; ou le début de la partie). Un temps
 * annoncé bien plus court que le temps réel est remplacé par le temps réel : la vitesse ne s'invente
 * pas. Une marge d'une seconde et demie couvre le réseau et les horloges.
 *
 *   annonce : le temps annoncé (ms) ; reel : le temps écoulé depuis que la question a pu s'afficher
 *   (null : inconnu) ; duree : le temps de la question.
 */
export function tempsArbitre(annonce: number, reel: number | null, duree: number): number {
  const ms = Math.min(duree, Math.max(REFLEXE_MIN, Math.round(Number.isFinite(annonce) ? annonce : duree)));
  if (reel === null || !Number.isFinite(reel)) return ms;
  // Répondre plus vite que la question n'a pu s'afficher : aucune vitesse ne compte.
  if (reel < REFLEXE_MIN - 1_500) return duree;
  return Math.max(ms, Math.min(duree, Math.round(reel) - 1_500));
}
