/*
 * Appels à l'API d'OpenAI (ChatGPT) AVEC LA CLÉ DE L'UTILISATEUR : API « Responses », en flux.
 * Comme pour Claude, la clé ne sort de la mémoire du serveur que vers api.openai.com, et rien
 * n'est gardé chez OpenAI (store: false). Le cache des longs débuts d'invite est automatique.
 */
import { lireSse, type Demande, type ErreurClaude, type EvenementClaude, type EvenementSse } from "./anthropic";
import type { Usage } from "./modeles";

export function baseOpenAI(): string {
  return (process.env.ASSISTANT_OPENAI_BASE?.trim() || "https://api.openai.com").replace(/\/+$/, "");
}

const RESEAU: ErreurClaude = { code: "reseau", statut: 0, message: "Impossible de joindre OpenAI pour l'instant. Vérifie ta connexion et réessaie." };

function lire(corps: unknown): { type: string; code: string; message: string } {
  const e = ((corps ?? {}) as { error?: { type?: unknown; code?: unknown; message?: unknown } }).error ?? (corps as { type?: unknown; code?: unknown; message?: unknown }) ?? {};
  return {
    type: typeof e.type === "string" ? e.type : "",
    code: typeof e.code === "string" ? e.code : "",
    message: typeof e.message === "string" ? e.message.slice(0, 300) : "",
  };
}

export function interpreterErreurOpenAI(statut: number, corps: unknown, retryAfter?: string | null): ErreurClaude {
  const { type, code, message } = lire(corps);
  const attente = Number.parseInt(retryAfter ?? "", 10);
  const dans = Number.isFinite(attente) && attente > 0 ? Math.min(attente, 3600) : undefined;
  if (statut === 401 || code === "invalid_api_key") return { code: "cle_invalide", statut, message: "OpenAI refuse ta clé (erronée ou révoquée). Colle une nouvelle clé dans les réglages de l'assistant." };
  if (code === "insufficient_quota" || /quota|billing|credit/i.test(message) && statut === 429) {
    return { code: "credit_epuise", statut, message: "Le crédit de ton compte OpenAI est épuisé. Recharge-le sur platform.openai.com (page Billing) : l'assistant repartira aussitôt." };
  }
  if (statut === 429) return { code: "limite_debit", statut, reessayerDans: dans, message: `Ton compte OpenAI a atteint sa limite de débit${dans ? ` : réessaie dans ${dans} s` : " : réessaie dans un instant"}.` };
  if (statut === 403) return { code: "acces_refuse", statut, message: "Ta clé OpenAI n'a pas accès à ce modèle (ou à ce pays). Choisis-en un autre, ou vérifie les droits de la clé." };
  if (statut === 404 || code === "model_not_found") return { code: "acces_refuse", statut, message: "Ce modèle n'est pas disponible avec ta clé OpenAI. Choisis-en un autre." };
  if (code === "context_length_exceeded" || /context length|too many tokens|maximum context/i.test(message)) return { code: "trop_long", statut, message: "C'est trop long pour une seule demande. Décoche des documents, ou passe en lecture par extraits." };
  if (statut === 503 || statut === 529 || type === "server_overloaded") return { code: "surcharge", statut, reessayerDans: dans, message: "ChatGPT est très sollicité en ce moment. Réessaie dans quelques secondes." };
  if (statut >= 500) return { code: "serveur", statut, message: "OpenAI a rencontré une erreur. Réessaie dans un moment." };
  return { code: "requete", statut, message: message ? `OpenAI a refusé la demande : ${message}` : "OpenAI a refusé la demande." };
}

export async function verifierCleOpenAI(cle: string): Promise<{ ok: true; modeles: string[] } | { ok: false; erreur: ErreurClaude }> {
  try {
    const r = await fetch(`${baseOpenAI()}/v1/models`, { headers: { authorization: `Bearer ${cle}` }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const corps = (await r.json().catch(() => null)) as { data?: { id?: unknown }[] } | null;
    if (!r.ok) return { ok: false, erreur: interpreterErreurOpenAI(r.status, corps, r.headers.get("retry-after")) };
    return { ok: true, modeles: (corps?.data ?? []).map((m) => (typeof m.id === "string" ? m.id : "")).filter(Boolean) };
  } catch {
    return { ok: false, erreur: RESEAU };
  }
}

type UsageOpenAI = { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } };
const nombre = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0);

export function usageOpenAI(u: UsageOpenAI | undefined): Usage {
  const entree = nombre(u?.input_tokens);
  const cache = Math.min(entree, nombre(u?.input_tokens_details?.cached_tokens));
  return { entree: entree - cache, lectureCache: cache, ecritureCache: 0, sortie: nombre(u?.output_tokens) };
}

/** Les événements de l'API Responses, ramenés aux événements communs. */
export async function* interpreterFluxOpenAI(sse: AsyncIterable<EvenementSse>): AsyncGenerator<EvenementClaude> {
  let reflexion = false;
  for await (const { event, data } of sse) {
    if (data === "[DONE]") return;
    let o: Record<string, unknown>;
    try {
      o = JSON.parse(data) as Record<string, unknown>;
    } catch {
      continue;
    }
    const type = typeof o.type === "string" ? o.type : event;
    if (type === "response.output_text.delta") {
      if (typeof o.delta === "string" && o.delta) yield { type: "texte", texte: o.delta };
    } else if (type.startsWith("response.reasoning") || (type === "response.output_item.added" && (o.item as { type?: string } | undefined)?.type === "reasoning")) {
      if (!reflexion) yield { type: "reflexion" };
      reflexion = true;
    } else if (type === "response.completed" || type === "response.incomplete") {
      const r = (o.response ?? {}) as { usage?: UsageOpenAI; incomplete_details?: { reason?: string } };
      yield { type: "usage", usage: usageOpenAI(r.usage) };
      const raison = r.incomplete_details?.reason;
      yield { type: "arret", raison: type === "response.completed" ? "end_turn" : raison === "max_output_tokens" ? "max_tokens" : raison === "content_filter" ? "refusal" : (raison ?? "interrompu") };
      return;
    } else if (type === "response.failed") {
      const r = (o.response ?? {}) as { error?: unknown; usage?: UsageOpenAI };
      if (r.usage) yield { type: "usage", usage: usageOpenAI(r.usage) };
      yield { type: "erreur", erreur: interpreterErreurOpenAI(500, { error: r.error }) };
      return;
    } else if (type === "error") {
      yield { type: "erreur", erreur: interpreterErreurOpenAI(Number(o.status) || 500, o) };
      return;
    }
  }
}

const EFFORT_OPENAI = { low: "low", medium: "medium", high: "high" } as const;

export async function demarrerOpenAI(cle: string, d: Demande, signal?: AbortSignal) {
  const corps = (avecReflexion: boolean) => ({
    model: d.modele,
    instructions: d.documents ? `${d.consigne}\n\n${d.documents}` : d.consigne,
    input: d.messages.map((m) => ({ role: m.role, content: m.texte })),
    max_output_tokens: d.maxJetons,
    stream: true,
    store: false,
    ...(avecReflexion ? { reasoning: { effort: EFFORT_OPENAI[d.effort] } } : {}),
  });
  let avecReflexion = true;
  let surcharge = false;
  for (let essai = 0; essai < 3; essai++) {
    let r: Response;
    try {
      r = await fetch(`${baseOpenAI()}/v1/responses`, {
        method: "POST",
        headers: { authorization: `Bearer ${cle}`, "content-type": "application/json", accept: "text/event-stream" },
        body: JSON.stringify(corps(avecReflexion)),
        cache: "no-store",
        signal,
      });
    } catch {
      return { ok: false as const, erreur: RESEAU };
    }
    if (r.ok && r.body) return { ok: true as const, evenements: interpreterFluxOpenAI(lireSse(r.body)) };
    const brut = await r.json().catch(() => null);
    const erreur = interpreterErreurOpenAI(r.status, brut, r.headers.get("retry-after"));
    if (avecReflexion && r.status === 400 && /reasoning|effort/i.test(lire(brut).message)) {
      avecReflexion = false;
      continue;
    }
    if (erreur.code === "surcharge" && !surcharge && !signal?.aborted) {
      surcharge = true;
      await new Promise((ok) => setTimeout(ok, 1500));
      continue;
    }
    return { ok: false as const, erreur };
  }
  return { ok: false as const, erreur: interpreterErreurOpenAI(500, null) };
}
