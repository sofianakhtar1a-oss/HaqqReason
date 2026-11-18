/*
 * Le flux d'une réponse, du serveur au navigateur : une ligne JSON par événement (NDJSON).
 * Partagé par la route /api/assistant/message et par l'interface.
 */
import type { Usage } from "./modeles";

export type EtatMessage = "complet" | "interrompu" | "erreur";

/** Ce que l'IA a lu des PDF pour cette réponse (affiché sous la réponse). */
export type InfoContexte = {
  mode: "complet" | "extraits";
  jetons: number;
  documents: { numero: number; nom: string; pages: string }[];
  /** La lecture intégrale était demandée, mais les documents cochés dépassent la limite. */
  integraleImpossible: boolean;
};

export type EvenementFlux =
  /** modele : le modèle de la passerelle qui répond (« openai/gpt-6-luna »). */
  | { t: "debut"; questionId: string; modele: string; contexte: InfoContexte | null }
  | { t: "reflexion" }
  | { t: "texte"; v: string }
  | { t: "erreur"; code: string; message: string }
  | { t: "fin"; id: string | null; etat: EtatMessage; raison: string; usage: Usage; cout: number };

/** Les raisons d'arrêt qui méritent une explication sous la réponse. */
export function noteArret(raison: string, etat: EtatMessage): string | null {
  if (etat === "erreur") return null;
  if (raison === "max_tokens") return "Réponse coupée : elle a atteint la longueur maximale. Demande « continue » pour la suite.";
  if (raison === "model_context_window_exceeded") return "Réponse coupée : la conversation est devenue trop longue. Ouvre une nouvelle conversation.";
  if (raison === "refusal") return "L'IA a refusé de poursuivre cette réponse.";
  if (raison === "duree") return "Réponse interrompue : elle prenait plus de quatre minutes et demie. Demande « continue » pour la suite.";
  if (etat === "interrompu") return "Réponse interrompue.";
  return null;
}
