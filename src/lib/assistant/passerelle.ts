/*
 * La seule porte du Vizir vers Claude, ChatGPT et Gemini : la passerelle IA de Vercel
 * (AI Gateway), dans son format « Chat Completions », en flux.
 *
 *   • Aucune clé : sur Vercel, le site se présente à la passerelle avec le jeton OIDC que Vercel lui
 *     donne à chaque requête. Les utilisateurs n'ont que leur connexion Google.
 *   • La dépense est prise sur le crédit gratuit de la passerelle, partagé par tous : chaque compte
 *     a son quota (limites.ts), contrôlé par la route avant chaque envoi.
 *   • Si l'offre gratuite refuse un modèle, le suivant de la liste de cette IA est essayé (modeles.ts),
 *     et le serveur s'en souvient quelques heures.
 * Le jeton n'est jamais journalisé ni renvoyé au navigateur.
 */
import { getVercelOidcTokenSync } from "@vercel/oidc";
import { CANDIDATS, coutEstime, infoFournisseur, USAGE_VIDE, type Fournisseur, type Usage } from "./modeles";
import { lireSse, type EvenementSse } from "./sse";

/** Adresse de la passerelle. ASSISTANT_PASSERELLE_BASE ne sert qu'aux tests (fausse passerelle locale). */
export function basePasserelle(): string {
  return (process.env.ASSISTANT_PASSERELLE_BASE?.trim() || "https://ai-gateway.vercel.sh/v1").replace(/\/+$/, "");
}

/** Le jeton du site pour la passerelle : celui que Vercel fournit (OIDC), ou AI_GATEWAY_API_KEY s'il existe. */
export function jetonPasserelle(): string | null {
  const cle = process.env.AI_GATEWAY_API_KEY?.trim();
  if (cle) return cle;
  try {
    return getVercelOidcTokenSync() || null;
  } catch {
    return null;
  }
}

/* ---------- Les erreurs, traduites pour l'utilisateur ---------- */

export type CodeErreur =
  | "configuration"
  | "activation"
  | "credit_site"
  | "modele_indisponible"
  | "limite_debit"
  | "surcharge"
  | "trop_long"
  | "requete"
  | "reseau"
  | "serveur";

export type ErreurIA = { code: CodeErreur; statut: number; message: string; reessayerDans?: number };

function lire(corps: unknown): { type: string; code: string; message: string } {
  const o = (corps ?? {}) as Record<string, unknown>;
  const e = (typeof o.error === "object" && o.error !== null ? o.error : o) as Record<string, unknown>;
  const texte = (v: unknown) => (typeof v === "string" ? v : "");
  return { type: texte(e.type) || texte(e.name), code: texte(e.code), message: texte(e.message).slice(0, 400) };
}

export function interpreterErreur(statut: number, corps: unknown, f: Fournisseur, retryAfter?: string | null): ErreurIA {
  const { type, code, message } = lire(corps);
  const tout = `${type} ${code} ${message}`;
  const ia = infoFournisseur(f).nom;
  const attente = Number.parseInt(retryAfter ?? "", 10);
  const dans = Number.isFinite(attente) && attente > 0 ? Math.min(attente, 3600) : undefined;
  if (/customer_verification_required|payment method/i.test(tout)) {
    return { code: "activation", statut, message: "Le Vizir n'est pas encore activé sur le service qui l'héberge. Réessaie un peu plus tard." };
  }
  if (statut === 401 || /authentication|unauthori[sz]ed|invalid (api key|token)|oidc/i.test(tout)) {
    return { code: "configuration", statut, message: "Le Vizir n'arrive pas à joindre son service d'IA pour le moment. Réessaie un peu plus tard." };
  }
  if (statut === 402 || /insufficient_funds|quota_for_entity_exceeded|insufficient (funds|credits?)/i.test(tout)) {
    return { code: "credit_site", statut, message: "Le crédit gratuit du Vizir est épuisé pour ce mois-ci. Il se renouvelle automatiquement : réessaie dans quelques jours." };
  }
  if ((statut === 403 && /free tier|restricted|no_providers_available|do not have access|not (available|eligible)/i.test(tout)) || statut === 404 || /model_not_found|model.*(not found|does not exist)/i.test(tout)) {
    return { code: "modele_indisponible", statut, message: `${ia} n'est pas compris dans l'offre gratuite du Vizir pour le moment. Choisis une autre IA en bas de l'écran.` };
  }
  if (statut === 429 || /rate.?limit/i.test(tout)) {
    return { code: "limite_debit", statut, reessayerDans: dans, message: `Beaucoup de questions en ce moment pour ${ia}${dans ? ` : réessaie dans ${dans} s` : " : réessaie dans quelques secondes"}.` };
  }
  if (statut === 413 || /context.?length|too many tokens|maximum context|prompt is too long|too long/i.test(tout)) {
    return { code: "trop_long", statut, message: "C'est trop long pour une seule demande. Décoche des documents, ou passe en lecture par extraits." };
  }
  if (statut === 503 || statut === 529 || /overloaded|unavailable/i.test(tout)) {
    return { code: "surcharge", statut, reessayerDans: dans, message: `${ia} est très sollicité en ce moment. Réessaie dans quelques secondes.` };
  }
  if (statut >= 500) return { code: "serveur", statut, message: `${ia} ne répond pas pour le moment. Réessaie dans un instant.` };
  return { code: "requete", statut, message: message ? `${ia} n'a pas pu traiter la demande (${message}).` : `${ia} n'a pas pu traiter la demande.` };
}

const reseau = (f: Fournisseur): ErreurIA => ({ code: "reseau", statut: 0, message: `Impossible de joindre ${infoFournisseur(f).nom} pour l'instant. Réessaie dans un instant.` });

/* ---------- Le flux de la réponse ---------- */

export type EvenementIA =
  | { type: "texte"; texte: string }
  | { type: "reflexion" }
  | { type: "usage"; usage: Usage; cout: number | null }
  | { type: "arret"; raison: string }
  | { type: "erreur"; erreur: ErreurIA };

type UsageBrut = {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number; cache_write_tokens?: number; cache_creation_tokens?: number };
  cache_creation_input_tokens?: number;
  cost?: number | string;
};

const nombre = (x: unknown) => {
  const n = typeof x === "string" ? Number(x) : x;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;
};

export function usageDe(u: UsageBrut | undefined): Usage {
  const invite = nombre(u?.prompt_tokens);
  const lecture = Math.min(invite, nombre(u?.prompt_tokens_details?.cached_tokens));
  const ecriture = Math.min(invite - lecture, nombre(u?.prompt_tokens_details?.cache_write_tokens ?? u?.prompt_tokens_details?.cache_creation_tokens ?? u?.cache_creation_input_tokens));
  return { entree: invite - lecture - ecriture, lectureCache: lecture, ecritureCache: ecriture, sortie: nombre(u?.completion_tokens) };
}

/** Le coût réel, quand la passerelle le donne (en dollars). */
function coutDonne(o: { usage?: UsageBrut; providerMetadata?: { gateway?: { cost?: unknown } } }): number | null {
  const brut = o.usage?.cost ?? o.providerMetadata?.gateway?.cost;
  if (brut === undefined || brut === null || brut === "") return null;
  const n = typeof brut === "string" ? Number(brut) : brut;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
}

const ARRETS: Record<string, string> = { stop: "end_turn", length: "max_tokens", content_filter: "refusal" };

type Morceau = {
  error?: unknown;
  choices?: { delta?: { content?: unknown; reasoning?: unknown; reasoning_content?: unknown }; finish_reason?: unknown }[];
  usage?: UsageBrut;
  providerMetadata?: { gateway?: { cost?: unknown } };
};

/** Les morceaux « chat.completion.chunk » de la passerelle, ramenés aux événements du Vizir. */
export async function* interpreterFlux(sse: AsyncIterable<EvenementSse>, f: Fournisseur): AsyncGenerator<EvenementIA> {
  let reflexion = false;
  let usage: Usage | null = null;
  let cout: number | null = null;
  let raison = "";
  for await (const { data } of sse) {
    if (data === "[DONE]") break;
    let o: Morceau;
    try {
      o = JSON.parse(data) as Morceau;
    } catch {
      continue;
    }
    if (o.error) {
      const e = o.error as { status?: unknown; statusCode?: unknown };
      yield { type: "erreur", erreur: interpreterErreur(Number(e.status ?? e.statusCode) || 500, o, f) };
      return;
    }
    const c = o.choices?.[0];
    const d = c?.delta;
    if ((typeof d?.reasoning === "string" && d.reasoning) || (typeof d?.reasoning_content === "string" && d.reasoning_content)) {
      if (!reflexion) yield { type: "reflexion" };
      reflexion = true;
    }
    if (typeof d?.content === "string" && d.content) yield { type: "texte", texte: d.content };
    if (typeof c?.finish_reason === "string" && c.finish_reason) raison = c.finish_reason;
    if (o.usage) {
      usage = usageDe(o.usage);
      cout = coutDonne(o) ?? cout;
    } else if (coutDonne(o) !== null) cout = coutDonne(o);
  }
  yield { type: "usage", usage: usage ?? { ...USAGE_VIDE }, cout };
  yield { type: "arret", raison: ARRETS[raison] ?? (raison || "end_turn") };
}

/* ---------- Le choix du modèle : celui qui a marché, ou le suivant de la liste ---------- */

/** Pendant ce délai, un modèle refusé par l'offre gratuite n'est plus essayé. */
const OUBLI_REFUS_MS = 6 * 60 * 60 * 1000;
const retenus = new Map<Fournisseur, string>();
const refuses = new Map<string, number>();

/** Les modèles à essayer pour cette IA, dans l'ordre. */
export function candidats(f: Fournisseur, maintenant = Date.now()): string[] {
  const ouverts = CANDIDATS[f].filter((m) => (refuses.get(m) ?? 0) <= maintenant);
  // Tout est refusé : on réessaie quand même (du crédit a peut-être été ajouté entre-temps).
  const liste = ouverts.length ? ouverts : [...CANDIDATS[f]];
  const retenu = retenus.get(f);
  return retenu && liste.includes(retenu) ? [retenu, ...liste.filter((m) => m !== retenu)] : liste;
}

/** Les IA dont tous les modèles viennent d'être refusés par l'offre gratuite. */
export function iasIndisponibles(maintenant = Date.now()): Fournisseur[] {
  return (Object.keys(CANDIDATS) as Fournisseur[]).filter((f) => CANDIDATS[f].every((m) => (refuses.get(m) ?? 0) > maintenant));
}

/** Pour les tests : on repart d'une mémoire vide. */
export function oublierModeles() {
  retenus.clear();
  refuses.clear();
}

/* ---------- L'appel ---------- */

export type Demande = {
  consigne: string;
  /** Le texte intégral des PDF (lecture complète) : un long début stable, gardé en cache par l'IA. */
  documents?: string;
  messages: { role: "user" | "assistant"; texte: string }[];
  maxJetons: number;
};

const attendre = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((ok) => {
    const t = setTimeout(ok, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      ok();
    });
  });

/** Ce qui est noté dans le journal du serveur quand la passerelle refuse : jamais le jeton ni le contenu. */
function noter(f: Fournisseur, modele: string, statut: number, corps: unknown) {
  const { type, code, message } = lire(corps);
  console.warn(`[vizir] passerelle ${statut} pour ${f} (${modele}) : ${[type, code].filter(Boolean).join(" / ")} ${message.slice(0, 200)}`);
}

export async function demarrer(
  f: Fournisseur,
  d: Demande,
  signal?: AbortSignal,
): Promise<{ ok: true; modele: string; evenements: AsyncIterable<EvenementIA> } | { ok: false; erreur: ErreurIA; modele: string | null }> {
  const jeton = jetonPasserelle();
  if (!jeton) {
    console.warn("[vizir] aucun jeton pour la passerelle IA (OIDC désactivé ou hors de Vercel)");
    return { ok: false, modele: null, erreur: interpreterErreur(401, null, f) };
  }
  const messages = [{ role: "system", content: d.documents ? `${d.consigne}\n\n${d.documents}` : d.consigne }, ...d.messages.map((m) => ({ role: m.role, content: m.texte }))];
  let derniere: ErreurIA | null = null;
  let dernierModele: string | null = null;
  for (const modele of candidats(f)) {
    dernierModele = modele;
    let surcharge = false;
    for (;;) {
      let r: Response;
      try {
        r = await fetch(`${basePasserelle()}/chat/completions`, {
          method: "POST",
          headers: { authorization: `Bearer ${jeton}`, "content-type": "application/json", accept: "text/event-stream" },
          body: JSON.stringify({
            model: modele,
            messages,
            stream: true,
            stream_options: { include_usage: true },
            max_completion_tokens: d.maxJetons,
            // La passerelle place elle-même les marqueurs de cache là où l'IA en demande (Claude).
            providerOptions: { gateway: { caching: "auto" } },
          }),
          cache: "no-store",
          signal,
        });
      } catch {
        return { ok: false, modele, erreur: reseau(f) };
      }
      if (r.ok && r.body) {
        retenus.set(f, modele);
        refuses.delete(modele);
        return { ok: true, modele, evenements: interpreterFlux(lireSse(r.body), f) };
      }
      const brut = await r.json().catch(() => null);
      noter(f, modele, r.status, brut);
      const erreur = interpreterErreur(r.status, brut, f, r.headers.get("retry-after"));
      if (erreur.code === "surcharge" && !surcharge && !signal?.aborted) {
        surcharge = true;
        await attendre(1500, signal);
        continue;
      }
      if (erreur.code === "modele_indisponible") {
        refuses.set(modele, Date.now() + OUBLI_REFUS_MS);
        if (retenus.get(f) === modele) retenus.delete(f);
        derniere = erreur;
        break;
      }
      if (erreur.code === "activation") {
        // La passerelle répond parfois « moyen de paiement requis » pour un modèle hors de l'offre
        // gratuite, même quand tout est en règle : on essaie le suivant, sans écarter celui-ci.
        // Un refus explicite de l'offre gratuite (plus haut) dit mieux ce qui se passe : il l'emporte.
        if (derniere?.code !== "modele_indisponible") derniere = erreur;
        break;
      }
      return { ok: false, modele, erreur };
    }
  }
  return { ok: false, modele: dernierModele, erreur: derniere ?? interpreterErreur(500, null, f) };
}

/** Coût d'une réponse : celui que donne la passerelle, sinon l'estimation au tarif du modèle. */
export function coutReponse(modele: string, usage: Usage, donne: number | null): number {
  return donne !== null ? Math.round(donne * 1_000_000) / 1_000_000 : coutEstime(modele, usage);
}
