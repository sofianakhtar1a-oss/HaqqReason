import type { NextRequest } from "next/server";
import { bilan, creerConversation, listerConversations } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, repondre, texteLibre } from "@/lib/assistant/http";
import { LIMITES } from "@/lib/assistant/limites";

/*
 * Les conversations du compte connecté, par espace (« general » ou « pdf »).
 *   GET ?espace=… : la liste, la plus récente d'abord.
 *   POST { espace, titre? } : une nouvelle conversation.
 */

const espaceDe = (v: unknown) => (v === "pdf" ? "pdf" : v === "general" ? "general" : null);

export async function GET(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const espace = espaceDe(requete.nextUrl.searchParams.get("espace"));
  if (!espace) return refus(400, "espace");
  try {
    return repondre({ conversations: await listerConversations(e.compte.id, espace) });
  } catch (err) {
    return erreurDonnees(err);
  }
}

export async function POST(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const corps = await lireCorps<{ espace?: unknown; titre?: unknown }>(requete, 2_000);
  const espace = espaceDe(corps?.espace);
  if (!espace) return refus(400, "espace");
  try {
    const b = await bilan(e.compte.id);
    if (b.conversations >= LIMITES.conversationsMax) {
      return refus(409, "trop_conversations", `Tu as ${LIMITES.conversationsMax} conversations : supprime les plus anciennes pour en ouvrir de nouvelles.`);
    }
    const conversation = await creerConversation(e.compte.id, espace, texteLibre(corps?.titre, 200) ?? "");
    return repondre({ conversation }, 201);
  } catch (err) {
    return erreurDonnees(err);
  }
}
