import type { NextRequest } from "next/server";
import { reglerReglages } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, repondre } from "@/lib/assistant/http";
import { effortValide, modeleValide, type Effort, type IdModele } from "@/lib/assistant/modeles";

/* PATCH { modele?, effort?, plafond? } : les réglages du compte (modèle par défaut, réflexion, plafond mensuel). */
export async function PATCH(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const corps = await lireCorps<{ modele?: unknown; effort?: unknown; plafond?: unknown }>(requete, 2_000);
  if (!corps) return refus(400, "illisible");
  const choix: { modele?: IdModele; effort?: Effort; plafond?: number | null } = {};
  if (corps.modele !== undefined) {
    const m = modeleValide(corps.modele);
    if (!m) return refus(400, "modele", "Modèle inconnu.");
    choix.modele = m;
  }
  if (corps.effort !== undefined) {
    const ef = effortValide(corps.effort);
    if (!ef) return refus(400, "effort", "Réglage d'effort inconnu.");
    choix.effort = ef;
  }
  if (corps.plafond !== undefined) {
    if (corps.plafond === null || corps.plafond === "") choix.plafond = null;
    else {
      const p = typeof corps.plafond === "number" ? corps.plafond : Number(String(corps.plafond).replace(",", "."));
      if (!Number.isFinite(p) || p < 0 || p > 100_000) return refus(400, "plafond", "Le plafond doit être un montant entre 0 et 100 000 $.");
      choix.plafond = Math.round(p * 100) / 100;
    }
  }
  try {
    return repondre({ reglages: await reglerReglages(e.compte.id, choix) });
  } catch (err) {
    return erreurDonnees(err);
  }
}
