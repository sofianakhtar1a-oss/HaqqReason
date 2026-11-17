import "server-only";
import { ErreurGroq as ErreurService } from "./groq";

/*
 * Gemini (Google AI Studio) : le cerveau du Carnet.
 * La clé GEMINI_API_KEY reste sur le serveur : l'outil est gratuit pour les visiteurs.
 * Palier gratuit de Gemini 2.5 Flash : une mémoire d'un million de jetons, 250 000 jetons par minute.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta";
/** Modèle par défaut (novembre 2026). Si Google le retire, le serveur suit sa recommandation tout seul. */
let modeleChat = process.env.GEMINI_MODELE || "gemini-3.8-flash";
const MODELE_VECTEURS = process.env.GEMINI_MODELE_VECTEURS || "gemini-embedding-001";
export const DIMENSIONS = 256;

export const geminiActif = () => Boolean(process.env.GEMINI_API_KEY);

function cle(): string {
  const v = process.env.GEMINI_API_KEY;
  if (!v) throw new ErreurService("La clé Gemini n'est pas encore installée sur le serveur (variable GEMINI_API_KEY).", 503);
  return v;
}

export async function echec(r: Response): Promise<never> {
  let detail = "";
  try {
    detail = ((await r.json()) as { error?: { message?: string } }).error?.message ?? "";
  } catch {
    // corps illisible
  }
  if (r.status === 429) throw new ErreurService("Gemini est très demandé en ce moment (quota gratuit atteint). Réessaie dans une minute.", 429, 30);
  if (r.status === 400 && /API key/i.test(detail)) throw new ErreurService("La clé Gemini est refusée : vérifie-la dans les réglages de Vercel.", 503);
  if (r.status === 403) throw new ErreurService("La clé Gemini n'a pas accès à ce modèle.", 503);
  throw new ErreurService(detail ? `Gemini a refusé : ${detail.slice(0, 200)}` : `Gemini a répondu ${r.status}.`, 502);
}

export type Tour = { role: "user" | "model"; texte: string };

/* ---------- Modèles disponibles pour la clé (liste gardée une heure) ---------- */

let listeCache: { noms: string[]; quand: number } | null = null;

export async function modelesDisponibles(): Promise<string[]> {
  if (listeCache && Date.now() - listeCache.quand < 3600_000) return listeCache.noms;
  try {
    const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": cle() }, signal: AbortSignal.timeout(8000) });
    const j = (await r.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const noms = (j.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => m.name.replace(/^models\//, ""))
      .filter((n) => /^gemini-/.test(n) && !/(image|tts|audio|live|embedding|vision|exp|preview)/i.test(n));
    listeCache = { noms, quand: Date.now() };
    return noms;
  } catch {
    return [];
  }
}

/** Ordre d'essai : le modèle choisi, puis les autres « flash » du plus récent au plus ancien, puis le reste. */
async function candidats(): Promise<string[]> {
  const version = (n: string) => Number(/gemini-(\d+(?:\.\d+)?)/.exec(n)?.[1] ?? 0);
  const dispo = (await modelesDisponibles()).sort((a, b) => version(b) - version(a) || a.length - b.length);
  const flash = dispo.filter((n) => /flash/.test(n) && !/lite/.test(n));
  const legers = dispo.filter((n) => /flash-lite/.test(n));
  return [...new Set([modeleChat, ...flash, ...legers])].slice(0, 4);
}

export const modeleActuel = () => modeleChat;

const PREMIER_MOT_MAX_MS = 25_000;

/** Ouvre la réponse de Gemini en continu ; renvoie un lecteur d'événements, ou lève une erreur claire. */
async function ouvrir(modele: string, systeme: string, tours: Tour[], signal?: AbortSignal) {
  const controle = new AbortController();
  const arret = () => controle.abort();
  signal?.addEventListener("abort", arret, { once: true });
  const minuteur = setTimeout(arret, PREMIER_MOT_MAX_MS);
  try {
    const r = await fetch(`${BASE}/models/${modele}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": cle() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systeme }] },
        contents: tours.map((t) => ({ role: t.role, parts: [{ text: t.texte }] })),
        generationConfig: { temperature: 0.35, maxOutputTokens: 32768 },
      }),
      signal: controle.signal,
    });
    if (!r.ok || !r.body) {
      const corps = await r.text().catch(() => "");
      const successeur = /use (?:models\/)?(gemini-[\w.-]+)/i.exec(corps)?.[1];
      return { ok: false as const, statut: r.status, corps, successeur };
    }
    return { ok: true as const, corps: r.body, liberer: () => clearTimeout(minuteur), controle };
  } catch (e) {
    if (signal?.aborted) throw e;
    return { ok: false as const, statut: 504, corps: "délai dépassé", successeur: undefined };
  } finally {
    signal?.removeEventListener("abort", arret);
  }
}

/**
 * Écrit la réponse dans « ecrire », morceau par morceau. Essaie plusieurs modèles si le premier est
 * retiré, saturé ou muet plus de 25 secondes. Renvoie le nom du modèle qui a répondu.
 */
export async function discuter(systeme: string, tours: Tour[], ecrire: (texte: string) => void, signal?: AbortSignal): Promise<string> {
  const essais = await candidats();
  let derniere = "";
  for (let i = 0; i < essais.length; i++) {
    const modele = essais[i];
    const o = await ouvrir(modele, systeme, tours, signal);
    if (!o.ok) {
      if (o.statut === 400 && /API key/i.test(o.corps)) throw new ErreurService("La clé Gemini est refusée : vérifie-la dans les réglages de Vercel.", 503);
      if (o.successeur && !essais.includes(o.successeur)) essais.splice(i + 1, 0, o.successeur);
      derniere = `${modele} : ${o.statut}`;
      if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
      await new Promise((x) => setTimeout(x, 800));
      continue;
    }
    // Lecture des événements ; le premier texte doit arriver avant le délai.
    const lecteur = o.corps.getReader();
    const decodeur = new TextDecoder();
    let tampon = "";
    let fin = "";
    let ecrit = false;
    try {
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) break;
        tampon += decodeur.decode(value, { stream: true });
        const lignes = tampon.split(/\r?\n/);
        tampon = lignes.pop() ?? "";
        for (const l of lignes) {
          if (!l.startsWith("data:")) continue;
          try {
            const j = JSON.parse(l.slice(5)) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[]; error?: { message?: string } };
            if (j.error) throw new ErreurService(`Gemini : ${j.error.message ?? "erreur"}`, 502);
            const c = j.candidates?.[0];
            if (c?.finishReason) fin = c.finishReason;
            const texte = (c?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
            if (texte) {
              if (!ecrit) o.liberer();
              ecrit = true;
              ecrire(texte);
            }
          } catch (e) {
            if (e instanceof ErreurService) throw e;
          }
        }
      }
    } catch (e) {
      if (signal?.aborted) throw e;
      if (ecrit) throw e instanceof ErreurService ? e : new ErreurService("La connexion à Gemini a été coupée en cours de réponse.", 502);
      derniere = `${modele} : silence`;
      continue;
    } finally {
      o.liberer();
    }
    if (!ecrit) {
      derniere = `${modele} : réponse vide (${fin || "sans motif"})`;
      continue;
    }
    if (fin === "MAX_TOKENS") ecrire("\n\n*(La réponse a atteint sa longueur maximale : demande la suite.)*");
    if (fin === "SAFETY" || fin === "RECITATION") ecrire("\n\n*(Gemini a interrompu cette réponse par prudence.)*");
    if (modele !== modeleChat) modeleChat = modele;
    return modele;
  }
  throw new ErreurService(`Gemini est saturé en ce moment (${derniere}). Réessaie dans une minute.`, 503, 30);
}

/** Vecteurs de sens (256 dimensions suffisent et pèsent peu dans le navigateur). */
export async function vecteurs(textes: string[], type: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY", signal?: AbortSignal): Promise<number[][]> {
  const r = await fetch(`${BASE}/models/${MODELE_VECTEURS}:batchEmbedContents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": cle() },
    body: JSON.stringify({
      requests: textes.map((t) => ({ model: `models/${MODELE_VECTEURS}`, content: { parts: [{ text: t.slice(0, 8000) }] }, taskType: type, outputDimensionality: DIMENSIONS })),
    }),
    signal,
  });
  if (!r.ok) await echec(r);
  const j = (await r.json()) as { embeddings?: { values: number[] }[] };
  return (j.embeddings ?? []).map((e) => e.values.map((v) => Math.round(v * 10000) / 10000));
}
