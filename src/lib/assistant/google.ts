/*
 * Appels à l'API Gemini (Google) AVEC LA CLÉ DE L'UTILISATEUR, en flux (streamGenerateContent, SSE).
 * La clé ne sort de la mémoire du serveur que vers generativelanguage.googleapis.com, dans
 * l'en-tête x-goog-api-key (jamais dans l'adresse). Le cache des longs débuts d'invite est implicite.
 */
import { lireSse, type Demande, type ErreurClaude, type EvenementClaude, type EvenementSse } from "./anthropic";
import type { Usage } from "./modeles";

export function baseGoogle(): string {
  return (process.env.ASSISTANT_GOOGLE_BASE?.trim() || "https://generativelanguage.googleapis.com").replace(/\/+$/, "");
}

const RESEAU: ErreurClaude = { code: "reseau", statut: 0, message: "Impossible de joindre Google pour l'instant. Vérifie ta connexion et réessaie." };

function lire(corps: unknown): { statut: string; message: string; raisons: string } {
  const e = ((corps ?? {}) as { error?: { status?: unknown; message?: unknown; details?: unknown } }).error ?? {};
  return {
    statut: typeof e.status === "string" ? e.status : "",
    message: typeof e.message === "string" ? e.message.slice(0, 300) : "",
    raisons: JSON.stringify(e.details ?? ""),
  };
}

export function interpreterErreurGoogle(statut: number, corps: unknown): ErreurClaude {
  const { statut: s, message, raisons } = lire(corps);
  if (statut === 401 || /API_KEY_INVALID|API key not valid|API key expired/i.test(`${message} ${raisons}`)) {
    return { code: "cle_invalide", statut, message: "Google refuse ta clé Gemini (erronée, expirée ou supprimée). Colle une nouvelle clé dans les réglages de l'assistant." };
  }
  if (statut === 429 || s === "RESOURCE_EXHAUSTED") {
    return { code: "limite_debit", statut, message: "Ton quota Gemini est atteint (l'usage gratuit est limité). Réessaie un peu plus tard, ou active la facturation dans Google AI Studio." };
  }
  if (/billing|prepay|credit/i.test(message)) return { code: "credit_epuise", statut, message: "Ton compte Google n'a plus de crédit pour Gemini. Vérifie la facturation dans Google AI Studio." };
  if (statut === 403 || s === "PERMISSION_DENIED") return { code: "acces_refuse", statut, message: "Ta clé Gemini n'a pas accès à ce modèle (ou elle est limitée à d'autres services). Choisis-en un autre, ou vérifie la clé dans AI Studio." };
  if (statut === 404 || s === "NOT_FOUND") return { code: "acces_refuse", statut, message: "Ce modèle Gemini n'est pas disponible avec ta clé. Choisis-en un autre." };
  if (/exceeds the maximum number of tokens|token count|too long/i.test(message)) return { code: "trop_long", statut, message: "C'est trop long pour une seule demande. Décoche des documents, ou passe en lecture par extraits." };
  if (statut === 503 || s === "UNAVAILABLE") return { code: "surcharge", statut, message: "Gemini est très sollicité en ce moment. Réessaie dans quelques secondes." };
  if (statut >= 500) return { code: "serveur", statut, message: "Google a rencontré une erreur. Réessaie dans un moment." };
  return { code: "requete", statut, message: message ? `Google a refusé la demande : ${message}` : "Google a refusé la demande." };
}

export async function verifierCleGoogle(cle: string): Promise<{ ok: true; modeles: string[] } | { ok: false; erreur: ErreurClaude }> {
  try {
    const r = await fetch(`${baseGoogle()}/v1beta/models?pageSize=1000`, { headers: { "x-goog-api-key": cle }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const corps = (await r.json().catch(() => null)) as { models?: { name?: unknown }[] } | null;
    if (!r.ok) return { ok: false, erreur: interpreterErreurGoogle(r.status, corps) };
    return { ok: true, modeles: (corps?.models ?? []).map((m) => (typeof m.name === "string" ? m.name.replace(/^models\//, "") : "")).filter(Boolean) };
  } catch {
    return { ok: false, erreur: RESEAU };
  }
}

type UsageGoogle = { promptTokenCount?: number; cachedContentTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
const nombre = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0);

export function usageGoogle(u: UsageGoogle | undefined): Usage {
  const invite = nombre(u?.promptTokenCount);
  const cache = Math.min(invite, nombre(u?.cachedContentTokenCount));
  // La réflexion (« thoughts ») est facturée comme la réponse.
  return { entree: invite - cache, lectureCache: cache, ecritureCache: 0, sortie: nombre(u?.candidatesTokenCount) + nombre(u?.thoughtsTokenCount) };
}

const ARRETS: Record<string, string> = { STOP: "end_turn", MAX_TOKENS: "max_tokens", SAFETY: "refusal", RECITATION: "refusal", PROHIBITED_CONTENT: "refusal", BLOCKLIST: "refusal", SPII: "refusal" };

export async function* interpreterFluxGoogle(sse: AsyncIterable<EvenementSse>): AsyncGenerator<EvenementClaude> {
  let reflexion = false;
  let usage: UsageGoogle | undefined;
  let raison = "";
  for await (const { data } of sse) {
    let o: { candidates?: { content?: { parts?: { text?: unknown; thought?: unknown }[] }; finishReason?: unknown }[]; usageMetadata?: UsageGoogle; promptFeedback?: { blockReason?: unknown }; error?: unknown };
    try {
      o = JSON.parse(data);
    } catch {
      continue;
    }
    if (o.error) {
      yield { type: "erreur", erreur: interpreterErreurGoogle(500, o) };
      return;
    }
    if (o.promptFeedback?.blockReason) {
      yield { type: "erreur", erreur: { code: "requete", statut: 400, message: "Gemini a refusé de traiter cette demande (filtre de sécurité de Google)." } };
      return;
    }
    if (o.usageMetadata) usage = o.usageMetadata;
    if (!reflexion && nombre(o.usageMetadata?.thoughtsTokenCount) > 0) {
      reflexion = true;
      yield { type: "reflexion" };
    }
    const c = o.candidates?.[0];
    for (const p of c?.content?.parts ?? []) {
      if (p.thought === true) {
        if (!reflexion) yield { type: "reflexion" };
        reflexion = true;
      } else if (typeof p.text === "string" && p.text) yield { type: "texte", texte: p.text };
    }
    if (typeof c?.finishReason === "string" && c.finishReason !== "FINISH_REASON_UNSPECIFIED") raison = ARRETS[c.finishReason] ?? c.finishReason.toLowerCase();
  }
  yield { type: "usage", usage: usageGoogle(usage) };
  yield { type: "arret", raison: raison || "end_turn" };
}

const NIVEAU = { low: "low", medium: null, high: "high" } as const;

export async function demarrerGoogle(cle: string, d: Demande, signal?: AbortSignal) {
  const niveau = NIVEAU[d.effort];
  const corps = (avecReflexion: boolean) => ({
    systemInstruction: { parts: [{ text: d.documents ? `${d.consigne}\n\n${d.documents}` : d.consigne }] },
    contents: d.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.texte }] })),
    generationConfig: { maxOutputTokens: d.maxJetons, ...(avecReflexion && niveau ? { thinkingConfig: { thinkingLevel: niveau } } : {}) },
  });
  let avecReflexion = true;
  let surcharge = false;
  for (let essai = 0; essai < 3; essai++) {
    let r: Response;
    try {
      r = await fetch(`${baseGoogle()}/v1beta/models/${encodeURIComponent(d.modele)}:streamGenerateContent?alt=sse`, {
        method: "POST",
        headers: { "x-goog-api-key": cle, "content-type": "application/json" },
        body: JSON.stringify(corps(avecReflexion)),
        cache: "no-store",
        signal,
      });
    } catch {
      return { ok: false as const, erreur: RESEAU };
    }
    if (r.ok && r.body) return { ok: true as const, evenements: interpreterFluxGoogle(lireSse(r.body)) };
    const brut = await r.json().catch(() => null);
    const erreur = interpreterErreurGoogle(r.status, brut);
    if (avecReflexion && niveau && r.status === 400 && /thinking/i.test(lire(brut).message)) {
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
  return { ok: false as const, erreur: interpreterErreurGoogle(500, null) };
}
