/*
 * Les appels de l'interface vers /api/assistant/*. Toutes les requêtes partent avec le cookie
 * du compte Google : le serveur ne répond que pour ce compte-là.
 */
import type { Quota } from "@/lib/assistant/limites";
import type { Fournisseur, Usage } from "@/lib/assistant/modeles";
import type { EtatMessage, EvenementFlux } from "@/lib/assistant/protocole";

export type Espace = "general" | "pdf";
export type Reglages = { ia: Fournisseur };
export type Conversation = { id: string; espace: Espace; titre: string; lecture: "auto" | "integrale"; creeLe: string; maj: string };
export type Message = { id: string; role: "user" | "assistant"; contenu: string; modele: string; etat: EtatMessage; usage: Usage; cout: number; creeLe: string };
export type FicheDocument = { id: string; numero: number; nom: string; pages: number; pagesVides: number; caracteres: number; jetons: number; actif: boolean; creeLe: string };
export type Etat = { compte: { nom: string; email: string }; reglages: Reglages; quota: Quota; indisponibles: Fournisseur[]; limites: Record<string, number> };

/** Une erreur du serveur, avec son code (« quota_jour », « installation », « modele_indisponible »…). */
export class ErreurApi extends Error {
  constructor(
    public code: string,
    message: string,
    public statut: number,
    public extra: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

const MESSAGES: Record<string, string> = {
  deconnecte: "Connecte-toi avec ton compte Google pour utiliser l'assistant.",
  refuse: "Requête refusée.",
  indisponible: "Le serveur ne répond pas. Réessaie dans un instant.",
  illisible: "Requête incomplète.",
  absent: "Introuvable.",
};

async function appel<T>(chemin: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...reste } = init;
  let reponse: Response;
  try {
    reponse = await fetch(chemin, {
      ...reste,
      cache: "no-store",
      credentials: "same-origin",
      headers: json !== undefined ? { "Content-Type": "application/json", ...reste.headers } : reste.headers,
      body: json !== undefined ? JSON.stringify(json) : reste.body,
    });
  } catch {
    throw new ErreurApi("reseau", "Pas de connexion : vérifie ton accès à internet.", 0);
  }
  const corps = (await reponse.json().catch(() => null)) as (Record<string, unknown> & { erreur?: string; message?: string }) | null;
  if (!reponse.ok) {
    const code = corps?.erreur ?? `http_${reponse.status}`;
    throw new ErreurApi(code, corps?.message ?? MESSAGES[code] ?? "Une erreur est survenue.", reponse.status, corps ?? {});
  }
  return corps as T;
}

export const api = {
  etat: () => appel<Etat>("/api/assistant/etat"),
  regler: (ia: Fournisseur) => appel<{ reglages: Reglages }>("/api/assistant/reglages", { method: "PATCH", json: { ia } }),
  conversations: (espace: Espace) => appel<{ conversations: Conversation[] }>(`/api/assistant/conversations?espace=${espace}`),
  creerConversation: (espace: Espace, titre = "") => appel<{ conversation: Conversation }>("/api/assistant/conversations", { method: "POST", json: { espace, titre } }),
  conversation: (id: string) => appel<{ conversation: Conversation; messages: Message[]; documents: FicheDocument[] }>(`/api/assistant/conversations/${id}`),
  modifierConversation: (id: string, champs: { titre?: string; lecture?: "auto" | "integrale" }) => appel<{ conversation: Conversation }>(`/api/assistant/conversations/${id}`, { method: "PATCH", json: champs }),
  supprimerConversation: (id: string) => appel<{ ok: true }>(`/api/assistant/conversations/${id}`, { method: "DELETE" }),
  ajouterDocument: (d: { conversationId: string; nom: string; pages: number; pagesVides: number; empreinte: string; texte: string }) => appel<{ document: FicheDocument }>("/api/assistant/documents", { method: "POST", json: d }),
  basculerDocument: (id: string, actif: boolean) => appel<{ document: FicheDocument }>(`/api/assistant/documents/${id}`, { method: "PATCH", json: { actif } }),
  supprimerDocument: (id: string) => appel<{ ok: true }>(`/api/assistant/documents/${id}`, { method: "DELETE" }),
  page: (id: string, page: number) => appel<{ page: number; texte: string }>(`/api/assistant/documents/${id}?page=${page}`),
};

/**
 * Envoie une question et lit la réponse au fil de l'eau. `recevoir` est appelé pour chaque
 * événement. Une erreur avant le début du flux (quota atteint, IA indisponible…) est levée en ErreurApi.
 */
export async function envoyerQuestion(
  corps: { conversationId: string; texte?: string; ia: Fournisseur; reessayer?: boolean },
  recevoir: (ev: EvenementFlux) => void,
  signal: AbortSignal,
): Promise<void> {
  let reponse: Response;
  try {
    reponse = await fetch("/api/assistant/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify(corps),
      signal,
    });
  } catch (e) {
    if ((e as { name?: string }).name === "AbortError") return;
    throw new ErreurApi("reseau", "Pas de connexion : vérifie ton accès à internet.", 0);
  }
  if (!reponse.ok || !reponse.body) {
    const c = (await reponse.json().catch(() => null)) as (Record<string, unknown> & { erreur?: string; message?: string }) | null;
    const code = c?.erreur ?? `http_${reponse.status}`;
    throw new ErreurApi(code, c?.message ?? MESSAGES[code] ?? "Une erreur est survenue.", reponse.status, c ?? {});
  }
  const lecteur = reponse.body.getReader();
  const decodeur = new TextDecoder();
  let tampon = "";
  try {
    for (;;) {
      const { value, done } = await lecteur.read();
      tampon += decodeur.decode(value, { stream: !done });
      let fin: number;
      while ((fin = tampon.indexOf("\n")) !== -1) {
        const ligne = tampon.slice(0, fin).trim();
        tampon = tampon.slice(fin + 1);
        if (!ligne) continue;
        try {
          recevoir(JSON.parse(ligne) as EvenementFlux);
        } catch {
          // Ligne abîmée : ignorée.
        }
      }
      if (done) break;
    }
  } catch (e) {
    if ((e as { name?: string }).name === "AbortError" || signal.aborted) return;
    throw new ErreurApi("reseau", "La connexion a été coupée pendant la réponse.", 0);
  }
}
