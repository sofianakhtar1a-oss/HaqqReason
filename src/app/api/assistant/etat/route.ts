import type { NextRequest } from "next/server";
import { bilan, lireCles, lireReglages } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, repondre } from "@/lib/assistant/http";
import { LIMITES } from "@/lib/assistant/limites";

/*
 * GET : ce que l'Assistant doit savoir en s'ouvrant — quelles clés sont reliées (Claude, ChatGPT,
 * Gemini ; jamais les clés elles-mêmes), les réglages, et la consommation du mois de CE compte.
 */
export async function GET(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  try {
    const [cles, reglages, b] = await Promise.all([lireCles(e.compte.id), lireReglages(e.compte.id), bilan(e.compte.id)]);
    return repondre({ compte: { nom: e.compte.nom, email: e.compte.email }, cles, reglages, bilan: b, limites: LIMITES });
  } catch (err) {
    return erreurDonnees(err);
  }
}
