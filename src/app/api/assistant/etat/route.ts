import type { NextRequest } from "next/server";
import { bilan, effacerAnciennesCles, lireReglages } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, repondre } from "@/lib/assistant/http";
import { calculerQuota, LIMITES } from "@/lib/assistant/limites";
import { iasIndisponibles } from "@/lib/assistant/passerelle";

/*
 * GET : ce que l'Assistant doit savoir en s'ouvrant — l'IA choisie par CE compte, ses questions
 * gratuites restantes, et les IA que l'offre gratuite ne sert pas en ce moment.
 */
export async function GET(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  try {
    const [reglages, b] = await Promise.all([lireReglages(e.compte.id), bilan(e.compte.id)]);
    // Les clés reliées avant que le Vizir ne passe par la passerelle : inutiles, elles sont effacées.
    await effacerAnciennesCles(e.compte.id).catch(() => undefined);
    return repondre({ compte: { nom: e.compte.nom, email: e.compte.email }, reglages, quota: calculerQuota(b), indisponibles: iasIndisponibles(), limites: LIMITES });
  } catch (err) {
    return erreurDonnees(err);
  }
}
