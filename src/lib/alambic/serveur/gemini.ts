import "server-only";
import { ErreurGroq as ErreurService } from "./groq";

/*
 * Gemini (Google AI Studio) : le cerveau du Carnet.
 * La clé GEMINI_API_KEY reste sur le serveur : l'outil est gratuit pour les visiteurs.
 * Palier gratuit de Gemini 2.5 Flash : une mémoire d'un million de jetons, 250 000 jetons par minute.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta";
export const MODELE_CHAT = process.env.GEMINI_MODELE || "gemini-2.5-flash";
const MODELE_VECTEURS = process.env.GEMINI_MODELE_VECTEURS || "gemini-embedding-001";
export const DIMENSIONS = 256;

export const geminiActif = () => Boolean(process.env.GEMINI_API_KEY);

function cle(): string {
  const v = process.env.GEMINI_API_KEY;
  if (!v) throw new ErreurService("La clé Gemini n'est pas encore installée sur le serveur (variable GEMINI_API_KEY).", 503);
  return v;
}

async function echec(r: Response): Promise<never> {
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

/**
 * Réponse en continu : renvoie un flux de texte brut (les morceaux arrivent au fil de l'écriture).
 * Gemini parle en « Server-Sent Events » ; on n'en garde que le texte.
 */
export async function discuterEnFlux(systeme: string, tours: Tour[], signal?: AbortSignal): Promise<ReadableStream<Uint8Array>> {
  const r = await fetch(`${BASE}/models/${MODELE_CHAT}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": cle() },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systeme }] },
      contents: tours.map((t) => ({ role: t.role, parts: [{ text: t.texte }] })),
      generationConfig: { temperature: 0.35, maxOutputTokens: 32768, thinkingConfig: { thinkingBudget: 2048 } },
    }),
    signal,
  });
  if (!r.ok || !r.body) await echec(r);
  const encodeur = new TextEncoder();
  const decodeur = new TextDecoder();
  const lecteur = r.body!.getReader();
  let tampon = "";
  let fin = "";
  return new ReadableStream<Uint8Array>({
    async pull(controle) {
      for (;;) {
        const { done, value } = await lecteur.read();
        if (done) {
          if (fin === "MAX_TOKENS") controle.enqueue(encodeur.encode("\n\n*(La réponse a atteint sa longueur maximale : demande la suite.)*"));
          if (fin === "SAFETY" || fin === "RECITATION") controle.enqueue(encodeur.encode("\n\n*(Gemini a interrompu cette réponse par prudence.)*"));
          controle.close();
          return;
        }
        tampon += decodeur.decode(value, { stream: true });
        const lignes = tampon.split("\n");
        tampon = lignes.pop() ?? "";
        let ecrit = false;
        for (const l of lignes) {
          if (!l.startsWith("data:")) continue;
          try {
            const j = JSON.parse(l.slice(5)) as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[] };
            const c = j.candidates?.[0];
            if (c?.finishReason) fin = c.finishReason;
            const texte = (c?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");
            if (texte) {
              controle.enqueue(encodeur.encode(texte));
              ecrit = true;
            }
          } catch {
            // ligne incomplète : ignorée
          }
        }
        if (ecrit) return;
      }
    },
    cancel() {
      void lecteur.cancel();
    },
  });
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
