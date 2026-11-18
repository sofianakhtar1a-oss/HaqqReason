/*
 * Une seule porte vers les trois IA : vérifier une clé, lancer une réponse en flux.
 * Chaque appel part avec LA clé de l'utilisateur pour cette IA ; le site n'a de clé chez aucune.
 */
import { demarrerAnthropic, verifierCle as verifierAnthropic, type Demande, type ErreurClaude, type EvenementClaude } from "./anthropic";
import { demarrerGoogle, verifierCleGoogle } from "./google";
import type { Fournisseur } from "./modeles";
import { demarrerOpenAI, verifierCleOpenAI } from "./openai";

export type { Demande };
export type ErreurIA = ErreurClaude;
export type EvenementIA = EvenementClaude;

export function verifierCle(f: Fournisseur, cle: string) {
  return f === "openai" ? verifierCleOpenAI(cle) : f === "google" ? verifierCleGoogle(cle) : verifierAnthropic(cle);
}

export function demarrer(f: Fournisseur, cle: string, d: Demande, signal?: AbortSignal): Promise<{ ok: true; evenements: AsyncIterable<EvenementIA> } | { ok: false; erreur: ErreurIA }> {
  return f === "openai" ? demarrerOpenAI(cle, d, signal) : f === "google" ? demarrerGoogle(cle, d, signal) : demarrerAnthropic(cle, d, signal);
}
