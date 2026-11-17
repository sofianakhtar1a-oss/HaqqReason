"use client";

/* Appels du Carnet : la réponse en continu, et les vecteurs de sens (facultatifs). */
import type { Action, Extrait, Message, Morceau } from "./types";

export class ErreurCarnet extends Error {}

export async function discuter(
  o: { question: string; action?: Action; mode: string; extraits: Extrait[]; historique: Pick<Message, "role" | "texte">[] },
  surTexte: (morceau: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const r = await fetch("/api/alambic/carnet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(o),
    signal,
    credentials: "same-origin",
  });
  if (!r.ok || !r.body) {
    let message = `Le service a répondu ${r.status}.`;
    try {
      message = ((await r.json()) as { erreur?: string }).erreur ?? message;
    } catch {
      // corps illisible
    }
    throw new ErreurCarnet(message);
  }
  const lecteur = r.body.getReader();
  const decodeur = new TextDecoder();
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    const brut = decodeur.decode(value, { stream: true });
    // U+0000 annonce une erreur du serveur ; U+200B est un battement qui garde la connexion ouverte.
    const coupure = brut.indexOf("\u0000");
    const texte = (coupure >= 0 ? brut.slice(0, coupure) : brut).replace(/\u200b/g, "");
    if (texte) surTexte(texte);
    if (coupure >= 0) throw new ErreurCarnet(brut.slice(coupure + 1).trim() || "La réponse a échoué.");
  }
}

async function demanderVecteurs(textes: string[], type: "document" | "requete", signal?: AbortSignal): Promise<number[][] | null> {
  try {
    const r = await fetch("/api/alambic/carnet/vecteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textes, type }),
      signal,
      credentials: "same-origin",
    });
    if (!r.ok) return null;
    return ((await r.json()) as { vecteurs: number[][] }).vecteurs;
  } catch {
    return null;
  }
}

/** Ajoute les vecteurs de sens aux morceaux. En cas d'échec, la recherche par mots suffit. */
export async function vectoriser(morceaux: Morceau[], signal?: AbortSignal): Promise<Morceau[]> {
  const sortie = [...morceaux];
  for (let i = 0; i < sortie.length; i += 100) {
    const lot = sortie.slice(i, i + 100);
    const v = await demanderVecteurs(lot.map((m) => m.texte), "document", signal);
    if (!v || v.length !== lot.length) return sortie;
    lot.forEach((m, k) => (sortie[i + k] = { ...m, vecteur: v[k] }));
  }
  return sortie;
}

export async function vecteurQuestion(question: string, signal?: AbortSignal): Promise<number[] | null> {
  if (!question.trim()) return null;
  return (await demanderVecteurs([question], "requete", signal))?.[0] ?? null;
}
