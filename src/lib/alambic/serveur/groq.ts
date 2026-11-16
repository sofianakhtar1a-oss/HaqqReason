import "server-only";

/*
 * Groq : Whisper pour transcrire, un modèle de langue pour traduire.
 * La clé reste sur le serveur (variable GROQ_API_KEY) : le navigateur ne la voit jamais.
 * Le palier gratuit suffit : environ 2 h d'audio par heure, 8 h par jour.
 */

const BASE = "https://api.groq.com/openai/v1";

/** Whisper large v3 : le plus juste pour l'arabe. Remplaçable sans toucher au code. */
const MODELE_AUDIO = process.env.GROQ_MODELE_AUDIO || "whisper-large-v3";
/** Traduction des phrases : le grand modèle (production chez Groq en novembre 2026). */
export const MODELE_PHRASES = process.env.GROQ_MODELE_TEXTE || "openai/gpt-oss-120b";
/** Sens des mots : le petit modèle, plus rapide, avec son propre quota gratuit. */
export const MODELE_MOTS = process.env.GROQ_MODELE_MOTS || "openai/gpt-oss-20b";

export class ErreurGroq extends Error {
  constructor(
    message: string,
    readonly statut: number,
    readonly attente?: number,
  ) {
    super(message);
  }
}

function cle(): string {
  const valeur = process.env.GROQ_API_KEY;
  if (!valeur) throw new ErreurGroq("La clé Groq n'est pas encore installée sur le serveur (variable GROQ_API_KEY).", 503);
  return valeur;
}

export function groqActif(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

async function echec(reponse: Response): Promise<never> {
  const attente = Number(reponse.headers.get("retry-after")) || undefined;
  let detail = "";
  try {
    const corps = (await reponse.json()) as { error?: { message?: string } };
    detail = corps.error?.message ?? "";
  } catch {
    // Corps illisible : le statut suffit.
  }
  if (reponse.status === 429) throw new ErreurGroq("Le service de transcription est très demandé. Nouvel essai dans un instant.", 429, attente ?? 10);
  if (reponse.status === 401 || reponse.status === 403) throw new ErreurGroq("La clé Groq est refusée : vérifie-la dans les réglages de Vercel.", 503);
  if (reponse.status === 413) throw new ErreurGroq("Ce morceau de son est trop lourd pour le service.", 413);
  throw new ErreurGroq(detail ? `Le service a refusé : ${detail.slice(0, 200)}` : `Le service a répondu ${reponse.status}.`, 502);
}

export type MotWhisper = { word: string; start: number; end: number };
export type SegmentWhisper = { start: number; end: number; text: string; no_speech_prob?: number; avg_logprob?: number; compression_ratio?: number };
export type ReponseWhisper = { text: string; language?: string; duration?: number; segments?: SegmentWhisper[]; words?: MotWhisper[] };

export async function transcrireAudio(fichier: Blob, nom: string, langue: string | null, signal?: AbortSignal): Promise<ReponseWhisper> {
  const formulaire = new FormData();
  formulaire.append("file", fichier, nom);
  formulaire.append("model", MODELE_AUDIO);
  formulaire.append("response_format", "verbose_json");
  formulaire.append("timestamp_granularities[]", "word");
  formulaire.append("timestamp_granularities[]", "segment");
  formulaire.append("temperature", "0");
  if (langue) formulaire.append("language", langue);
  const reponse = await fetch(`${BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cle()}` },
    body: formulaire,
    signal,
  });
  if (!reponse.ok) await echec(reponse);
  return (await reponse.json()) as ReponseWhisper;
}

/** Demande une réponse JSON au modèle de langue. */
export async function demanderJson<T>(modele: string, systeme: string, utilisateur: string, maxJetons: number, signal?: AbortSignal): Promise<T> {
  const reponse = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cle()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modele,
      messages: [
        { role: "system", content: systeme },
        { role: "user", content: utilisateur },
      ],
      response_format: { type: "json_object" },
      reasoning_effort: "low",
      temperature: 0.2,
      max_completion_tokens: maxJetons,
    }),
    signal,
  });
  if (!reponse.ok) await echec(reponse);
  const corps = (await reponse.json()) as { choices?: { message?: { content?: string } }[] };
  const texte = corps.choices?.[0]?.message?.content ?? "";
  const debut = texte.indexOf("{");
  const fin = texte.lastIndexOf("}");
  if (debut < 0 || fin < debut) throw new ErreurGroq("La traduction est revenue vide. Réessaie.", 502);
  try {
    return JSON.parse(texte.slice(debut, fin + 1)) as T;
  } catch {
    throw new ErreurGroq("La traduction est revenue mal formée. Réessaie.", 502);
  }
}
