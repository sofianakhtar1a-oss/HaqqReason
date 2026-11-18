import type { NextRequest } from "next/server";
import { reglerReglages } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, repondre } from "@/lib/assistant/http";
import { fournisseurValide } from "@/lib/assistant/modeles";

/* PATCH { ia } : l'IA que ce compte retrouve en ouvrant le Vizir (Claude, ChatGPT ou Gemini). */
export async function PATCH(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const corps = await lireCorps<{ ia?: unknown }>(requete, 1_000);
  if (!corps) return refus(400, "illisible");
  const ia = fournisseurValide(corps.ia);
  if (!ia) return refus(400, "ia", "IA inconnue.");
  try {
    return repondre({ reglages: await reglerReglages(e.compte.id, ia) });
  } catch (err) {
    return erreurDonnees(err);
  }
}
