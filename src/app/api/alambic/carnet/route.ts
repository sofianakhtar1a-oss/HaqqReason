import { erreur, garder } from "@/lib/alambic/serveur/garde";
import { discuter, type Tour } from "@/lib/alambic/serveur/gemini";
import { ErreurGroq } from "@/lib/alambic/serveur/groq";
import { CONSIGNES_ACTIONS, SYSTEME_CARNET } from "@/lib/alambic/serveur/prompt-carnet";
import type { Action } from "@/lib/alambic/carnet/types";

/*
 * Le Carnet : une question (ou une action rapide), les extraits choisis par le navigateur,
 * et la réponse de Gemini renvoyée en continu, morceau par morceau.
 */

export const maxDuration = 300;

const MAX_SIGNES = 2_400_000;
const ACTIONS = new Set<Action>(["synthese", "divergences", "glossaire", "questions"]);

type Corps = {
  question?: unknown;
  action?: unknown;
  mode?: unknown;
  extraits?: unknown;
  historique?: unknown;
};

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export async function POST(requete: Request) {
  const refus = await garder(requete, "carnet");
  if (refus) return refus;
  let corps: Corps;
  try {
    corps = await requete.json();
  } catch {
    return erreur("Demande illisible.", 400);
  }
  const action = ACTIONS.has(corps.action as Action) ? (corps.action as Action) : null;
  const question = String(corps.question ?? "").trim().slice(0, 8000);
  if (!question && !action) return erreur("Pose une question.", 400);
  const extraits = (Array.isArray(corps.extraits) ? corps.extraits : [])
    .map((x) => x as { ref?: unknown; source?: unknown; texte?: unknown })
    .filter((x) => typeof x.texte === "string" && typeof x.ref === "string")
    .map((x) => ({ ref: String(x.ref).slice(0, 300), source: String(x.source ?? "").slice(0, 300), texte: String(x.texte) }));
  if (extraits.reduce((s, x) => s + x.texte.length, 0) > MAX_SIGNES) return erreur("Trop de texte envoyé d'un coup : décoche quelques sources.", 413);
  const historique = (Array.isArray(corps.historique) ? corps.historique : [])
    .slice(-8)
    .map((h) => h as { role?: unknown; texte?: unknown })
    .filter((h) => (h.role === "utilisateur" || h.role === "assistant") && typeof h.texte === "string")
    .map((h): Tour => ({ role: h.role === "assistant" ? "model" : "user", texte: String(h.texte).slice(0, 12000) }));

  // Les extraits, regroupés par source, avec la référence exacte à citer.
  const parSource = new Map<string, typeof extraits>();
  for (const x of extraits) parSource.set(x.source, [...(parSource.get(x.source) ?? []), x]);
  const sources = [...parSource.entries()]
    .map(([nom, liste]) => `<source nom="${echapper(nom)}">\n${liste.map((x) => `<extrait ref="${echapper(x.ref)}">\n${x.texte}\n</extrait>`).join("\n")}\n</source>`)
    .join("\n");
  const mode = corps.mode === "recherche" || corps.mode === "couverture" ? String(corps.mode) : "complet";
  const consigne = action ? CONSIGNES_ACTIONS[action] + (question ? `\n\nPrécision de l'utilisateur : ${question}` : "") : question;
  const message = `<mode>${mode}</mode>\n<sources>\n${sources || "(aucune source cochée)"}\n</sources>\n\n<demande>\n${consigne}\n</demande>`;

  // Le flux s'ouvre tout de suite : un battement invisible (U+200B) toutes les 8 s tant que Gemini réfléchit,
  // puis le texte. Une erreur s'écrit dans le flux, précédée du caractère U+0000.
  const encodeur = new TextEncoder();
  const flux = new ReadableStream<Uint8Array>({
    async start(controle) {
      const envoyer = (t: string) => {
        try {
          controle.enqueue(encodeur.encode(t));
        } catch {
          // flux déjà fermé
        }
      };
      envoyer("\u200b");
      const battement = setInterval(() => envoyer("\u200b"), 8000);
      try {
        await discuter(SYSTEME_CARNET, [...historique, { role: "user", texte: message }], envoyer, requete.signal);
      } catch (e) {
        if (!requete.signal.aborted) envoyer(`\u0000${e instanceof ErreurGroq ? e.message : "La réponse a échoué. Réessaie."}`);
      } finally {
        clearInterval(battement);
        try {
          controle.close();
        } catch {
          // déjà fermé
        }
      }
    },
  });
  return new Response(flux, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Accel-Buffering": "no" } });
}
