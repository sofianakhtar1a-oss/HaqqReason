/*
 * Appels à l'API Claude (Anthropic) AVEC LA CLÉ DE L'UTILISATEUR.
 *   • Aucune clé du site n'existe ni n'est utilisée : si l'utilisateur n'a pas relié sa clé,
 *     rien n'est envoyé. Chaque jeton consommé est donc facturé sur SON compte Anthropic.
 *   • La clé ne sort de la mémoire du serveur que vers api.anthropic.com, dans l'en-tête
 *     x-api-key ; elle n'est jamais journalisée ni renvoyée au navigateur.
 *   • Les réponses arrivent en flux (server-sent events) et sont relayées au fil de l'eau.
 * Ce module ne touche pas à la base ; le lecteur de flux est testé à part (tests/test-assistant.mts).
 */
import type { Effort, Usage } from "./modeles";

const VERSION_API = "2023-06-01";

/** Adresse de l'API. ASSISTANT_ANTHROPIC_BASE ne sert qu'aux tests (faux serveur local). */
export function baseAnthropic(): string {
  return (process.env.ASSISTANT_ANTHROPIC_BASE?.trim() || "https://api.anthropic.com").replace(/\/+$/, "");
}

/* ---------- Les erreurs, traduites pour l'utilisateur ---------- */

export type CodeErreur =
  | "cle_invalide"
  | "acces_refuse"
  | "credit_epuise"
  | "limite_debit"
  | "surcharge"
  | "trop_long"
  | "requete"
  | "reseau"
  | "serveur";

export type ErreurClaude = { code: CodeErreur; message: string; statut: number; reessayerDans?: number };

function messageDuCorps(corps: unknown): { type: string; message: string } {
  const o = (corps ?? {}) as { error?: { type?: unknown; message?: unknown }; type?: unknown; message?: unknown };
  const e = o.error ?? o;
  return {
    type: typeof e.type === "string" ? e.type : "",
    message: typeof e.message === "string" ? e.message.slice(0, 300) : "",
  };
}

export function interpreterErreur(statut: number, corps: unknown, retryAfter?: string | null): ErreurClaude {
  const { type, message } = messageDuCorps(corps);
  const attente = Number.parseInt(retryAfter ?? "", 10);
  const dans = Number.isFinite(attente) && attente > 0 ? Math.min(attente, 3600) : undefined;
  if (statut === 401 || type === "authentication_error") {
    return { code: "cle_invalide", statut, message: "Anthropic refuse ta clé API (erronée ou révoquée). Colle une nouvelle clé dans les réglages de l'assistant." };
  }
  if (statut === 402 || type === "billing_error" || /credit balance|crédit|billing/i.test(message)) {
    return { code: "credit_epuise", statut, message: "Le crédit de ton compte Anthropic est épuisé. Recharge-le dans ta console (platform.claude.com, page Billing) : l'assistant repartira aussitôt." };
  }
  if (statut === 403 || type === "permission_error") {
    return { code: "acces_refuse", statut, message: "Ta clé n'a pas accès à ce modèle. Choisis-en un autre, ou vérifie les droits de la clé dans ta console Anthropic." };
  }
  if (statut === 404 || type === "not_found_error") {
    return { code: "acces_refuse", statut, message: "Ce modèle n'est pas disponible avec ta clé. Choisis-en un autre." };
  }
  if (statut === 429 || type === "rate_limit_error") {
    return {
      code: "limite_debit",
      statut,
      reessayerDans: dans,
      message: `Ton compte Anthropic a atteint sa limite de débit${dans ? ` : réessaie dans ${dans} s` : " : réessaie dans un instant"}. Les limites dépendent du niveau de ton compte dans la console.`,
    };
  }
  if (statut === 529 || statut === 503 || type === "overloaded_error") {
    return { code: "surcharge", statut, reessayerDans: dans, message: "Claude est très sollicité en ce moment. Réessaie dans quelques secondes." };
  }
  if (statut === 413 || type === "request_too_large" || /prompt is too long|too many tokens|context window/i.test(message)) {
    return { code: "trop_long", statut, message: "C'est trop long pour une seule demande. Décoche des documents, ou passe en lecture par extraits." };
  }
  if (statut >= 500 || type === "api_error") {
    return { code: "serveur", statut, message: "Anthropic a rencontré une erreur. Réessaie dans un moment." };
  }
  return { code: "requete", statut, message: message ? `Anthropic a refusé la demande : ${message}` : "Anthropic a refusé la demande." };
}

const ERREUR_RESEAU: ErreurClaude = { code: "reseau", statut: 0, message: "Impossible de joindre Anthropic pour l'instant. Vérifie ta connexion et réessaie." };

/** Une demande, dans la même forme pour les trois IA (voir ia.ts). */
export type Demande = {
  modele: string;
  consigne: string;
  /** Le texte intégral des PDF (lecture complète) : un long début stable, mis en cache. */
  documents?: string;
  messages: { role: "user" | "assistant"; texte: string; cache?: boolean }[];
  maxJetons: number;
  effort: Effort;
};

/* ---------- Vérifier une clé (gratuit : liste des modèles) ---------- */

export async function verifierCle(cle: string): Promise<{ ok: true; modeles: string[] } | { ok: false; erreur: ErreurClaude }> {
  try {
    const reponse = await fetch(`${baseAnthropic()}/v1/models?limit=100`, {
      headers: { "x-api-key": cle, "anthropic-version": VERSION_API },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const corps = (await reponse.json().catch(() => null)) as { data?: { id?: unknown }[] } | null;
    if (!reponse.ok) return { ok: false, erreur: interpreterErreur(reponse.status, corps, reponse.headers.get("retry-after")) };
    const modeles = (corps?.data ?? []).map((m) => (typeof m.id === "string" ? m.id : "")).filter(Boolean);
    return { ok: true, modeles };
  } catch {
    return { ok: false, erreur: ERREUR_RESEAU };
  }
}

/* ---------- Lecture d'un flux SSE ---------- */

export type EvenementSse = { event: string; data: string };

/** Découpe un flux d'octets en événements SSE (gère les coupures au milieu d'une ligne). */
export async function* lireSse(flux: ReadableStream<Uint8Array>): AsyncGenerator<EvenementSse> {
  const lecteur = flux.getReader();
  const decodeur = new TextDecoder();
  let tampon = "";
  let evenement = "";
  let donnees: string[] = [];
  const emettre = function* () {
    if (donnees.length) yield { event: evenement || "message", data: donnees.join("\n") };
    evenement = "";
    donnees = [];
  };
  try {
    for (;;) {
      const { value, done } = await lecteur.read();
      tampon += done ? decodeur.decode() : decodeur.decode(value, { stream: true });
      let fin: number;
      while ((fin = tampon.search(/\r\n|\r|\n/)) !== -1) {
        const ligne = tampon.slice(0, fin);
        tampon = tampon.slice(tampon[fin] === "\r" && tampon[fin + 1] === "\n" ? fin + 2 : fin + 1);
        if (ligne === "") yield* emettre();
        else if (ligne.startsWith(":")) continue;
        else {
          const deuxPoints = ligne.indexOf(":");
          const champ = deuxPoints === -1 ? ligne : ligne.slice(0, deuxPoints);
          let valeur = deuxPoints === -1 ? "" : ligne.slice(deuxPoints + 1);
          if (valeur.startsWith(" ")) valeur = valeur.slice(1);
          if (champ === "event") evenement = valeur;
          else if (champ === "data") donnees.push(valeur);
        }
      }
      if (done) {
        if (tampon) {
          if (tampon.startsWith("data:")) donnees.push(tampon.slice(5).trimStart());
          tampon = "";
        }
        yield* emettre();
        return;
      }
    }
  } finally {
    lecteur.releaseLock();
  }
}

/* ---------- Ce que le serveur garde d'un flux de l'API Messages ---------- */

export type EvenementClaude =
  | { type: "texte"; texte: string }
  | { type: "reflexion" }
  | { type: "usage"; usage: Usage }
  | { type: "arret"; raison: string }
  | { type: "erreur"; erreur: ErreurClaude };

type UsageBrut = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

function fusionner(u: Usage, b: UsageBrut | undefined): Usage {
  if (!b) return u;
  const n = (x: unknown, defaut: number) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : defaut);
  return {
    entree: n(b.input_tokens, u.entree),
    sortie: n(b.output_tokens, u.sortie),
    ecritureCache: n(b.cache_creation_input_tokens, u.ecritureCache),
    lectureCache: n(b.cache_read_input_tokens, u.lectureCache),
  };
}

/** Transforme les événements SSE de l'API en événements utiles : texte, réflexion, consommation, arrêt, erreur. */
export async function* interpreterFlux(sse: AsyncIterable<EvenementSse>): AsyncGenerator<EvenementClaude> {
  let usage: Usage = { entree: 0, sortie: 0, ecritureCache: 0, lectureCache: 0 };
  for await (const { event, data } of sse) {
    if (event === "ping") continue;
    let o: Record<string, unknown>;
    try {
      o = JSON.parse(data) as Record<string, unknown>;
    } catch {
      continue;
    }
    const type = typeof o.type === "string" ? o.type : event;
    if (type === "message_start") {
      usage = fusionner(usage, (o.message as { usage?: UsageBrut } | undefined)?.usage);
      yield { type: "usage", usage };
    } else if (type === "content_block_start") {
      const bloc = o.content_block as { type?: string } | undefined;
      if (bloc?.type === "thinking" || bloc?.type === "redacted_thinking") yield { type: "reflexion" };
    } else if (type === "content_block_delta") {
      const delta = o.delta as { type?: string; text?: unknown } | undefined;
      if (delta?.type === "text_delta" && typeof delta.text === "string" && delta.text) yield { type: "texte", texte: delta.text };
    } else if (type === "message_delta") {
      usage = fusionner(usage, o.usage as UsageBrut | undefined);
      yield { type: "usage", usage };
      const raison = (o.delta as { stop_reason?: unknown } | undefined)?.stop_reason;
      if (typeof raison === "string") yield { type: "arret", raison };
    } else if (type === "error") {
      const { type: t } = messageDuCorps(o);
      yield { type: "erreur", erreur: interpreterErreur(t === "overloaded_error" ? 529 : 500, o) };
      return;
    } else if (type === "message_stop") {
      return;
    }
  }
}

/* ---------- Appel en flux à l'API Messages ---------- */

const attendre = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resoudre) => {
    const minuteur = setTimeout(resoudre, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(minuteur);
      resoudre();
    });
  });

/**
 * Ouvre le flux d'une réponse. `corps(avecEffort)` construit le JSON de la requête : si l'API
 * refuse le réglage d'effort pour ce modèle, on relance une fois sans lui. Une surcharge passagère
 * (529) est retentée une fois, avant que le moindre octet n'ait été relayé.
 */
export async function ouvrirFlux(
  cle: string,
  corps: (avecEffort: boolean) => Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ ok: true; flux: ReadableStream<Uint8Array> } | { ok: false; erreur: ErreurClaude }> {
  let avecEffort = true;
  let surchargeRetentee = false;
  for (let essai = 0; essai < 3; essai++) {
    let reponse: Response;
    try {
      reponse = await fetch(`${baseAnthropic()}/v1/messages`, {
        method: "POST",
        headers: {
          "x-api-key": cle,
          "anthropic-version": VERSION_API,
          "content-type": "application/json",
          accept: "text/event-stream",
        },
        body: JSON.stringify({ ...corps(avecEffort), stream: true }),
        cache: "no-store",
        signal,
      });
    } catch {
      return { ok: false, erreur: ERREUR_RESEAU };
    }
    if (reponse.ok && reponse.body) return { ok: true, flux: reponse.body };
    const brut = await reponse.json().catch(() => null);
    const erreur = interpreterErreur(reponse.status, brut, reponse.headers.get("retry-after"));
    if (avecEffort && reponse.status === 400 && /effort|output_config/i.test(messageDuCorps(brut).message)) {
      avecEffort = false;
      continue;
    }
    if (erreur.code === "surcharge" && !surchargeRetentee && !signal?.aborted) {
      surchargeRetentee = true;
      await attendre(1500, signal);
      continue;
    }
    return { ok: false, erreur };
  }
  return { ok: false, erreur: interpreterErreur(500, null) };
}

/** Claude : consigne et documents en blocs système, points de cache explicites (cache_control). */
export async function demarrerAnthropic(cle: string, d: Demande, signal?: AbortSignal) {
  const systeme: { type: "text"; text: string; cache_control?: { type: "ephemeral" } }[] = [{ type: "text", text: d.consigne }];
  if (d.documents) systeme.push({ type: "text", text: d.documents, cache_control: { type: "ephemeral" } });
  const messages = d.messages.map((m) => ({ role: m.role, content: [{ type: "text", text: m.texte, ...(m.cache ? { cache_control: { type: "ephemeral" } } : {}) }] }));
  const ouverture = await ouvrirFlux(
    cle,
    (avecEffort) => ({ model: d.modele, max_tokens: d.maxJetons, system: systeme, messages, ...(avecEffort ? { output_config: { effort: d.effort } } : {}) }),
    signal,
  );
  if (!ouverture.ok) return ouverture;
  return { ok: true as const, evenements: interpreterFlux(lireSse(ouverture.flux)) };
}
