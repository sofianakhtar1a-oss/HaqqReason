import type { NextRequest } from "next/server";
import { lireConversation, lireMessages, listerDocuments, modifierConversation, supprimerConversation } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, repondre, texteLibre } from "@/lib/assistant/http";
import { LIMITES } from "@/lib/assistant/limites";

/*
 * Une conversation du compte connecté.
 *   GET : la conversation, ses derniers messages et la fiche de ses PDF (sans leur texte).
 *   PATCH { titre?, lecture? } : renommer ; « integrale » fait lire les PDF en entier.
 *   DELETE : efface la conversation, ses messages et ses PDF.
 */

type Contexte = { params: Promise<{ id: string }> };

export async function GET(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const { id } = await contexte.params;
  try {
    const conversation = await lireConversation(e.compte.id, id);
    if (!conversation) return refus(404, "absent", "Cette conversation n'existe plus.");
    const [messages, documents] = await Promise.all([
      lireMessages(e.compte.id, id, LIMITES.messagesHistorique),
      conversation.espace === "pdf" ? listerDocuments(e.compte.id, id) : Promise.resolve([]),
    ]);
    return repondre({ conversation, messages, documents });
  } catch (err) {
    return erreurDonnees(err);
  }
}

export async function PATCH(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const { id } = await contexte.params;
  const corps = await lireCorps<{ titre?: unknown; lecture?: unknown }>(requete, 2_000);
  if (!corps) return refus(400, "illisible");
  const champs: { titre?: string; lecture?: "auto" | "integrale" } = {};
  if (corps.titre !== undefined) champs.titre = texteLibre(corps.titre, 200) ?? "";
  if (corps.lecture !== undefined) {
    if (corps.lecture !== "auto" && corps.lecture !== "integrale") return refus(400, "lecture");
    champs.lecture = corps.lecture;
  }
  try {
    const conversation = await modifierConversation(e.compte.id, id, champs);
    if (!conversation) return refus(404, "absent", "Cette conversation n'existe plus.");
    return repondre({ conversation });
  } catch (err) {
    return erreurDonnees(err);
  }
}

export async function DELETE(requete: NextRequest, contexte: Contexte) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const { id } = await contexte.params;
  try {
    if (!(await supprimerConversation(e.compte.id, id))) return refus(404, "absent");
    return repondre({ ok: true });
  } catch (err) {
    return erreurDonnees(err);
  }
}
