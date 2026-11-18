import type { NextRequest } from "next/server";
import { verifierCle } from "@/lib/assistant/anthropic";
import { bilan, enregistrerCle, noterVerification, reglerCle, supprimerCle } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, repondre } from "@/lib/assistant/http";
import { LIMITES } from "@/lib/assistant/limites";
import { controlerFormatCle, EFFORT_PAR_DEFAUT, effortValide, MODELE_PAR_DEFAUT, MODELES, modeleValide, type Effort, type IdModele } from "@/lib/assistant/modeles";

/*
 * La clé API Anthropic du compte connecté (BYOK : « apporte ta propre clé »).
 *   PUT    { cle, modele?, effort? } : vérifie la clé auprès d'Anthropic (appel gratuit), puis
 *          l'enregistre chiffrée et liée au compte. Elle n'est jamais renvoyée, ni journalisée.
 *   PATCH  { modele?, effort?, plafond? } : les réglages, sans toucher à la clé.
 *   DELETE : oublie la clé (l'assistant ne peut plus rien envoyer pour ce compte).
 */

type CorpsPut = { cle?: unknown; modele?: unknown; effort?: unknown };
type CorpsPatch = { modele?: unknown; effort?: unknown; plafond?: unknown };

export async function PUT(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const corps = await lireCorps<CorpsPut>(requete, 4_000);
  if (!corps) return refus(400, "illisible");
  const format = controlerFormatCle(corps.cle);
  if (!format.ok) return refus(400, "format", format.message);

  try {
    // Le site ne doit pas servir à tester des clés en série.
    const b = await bilan(e.compte.id);
    if (b.verificationsHeure >= LIMITES.verificationsHeure) {
      return refus(429, "trop_essais", "Trop d'essais de clé en une heure. Vérifie la clé dans ta console Anthropic, puis réessaie un peu plus tard.");
    }
    const verdict = await verifierCle(format.cle);
    await noterVerification(e.compte.id, verdict.ok);
    if (!verdict.ok) {
      const statut = verdict.erreur.code === "cle_invalide" || verdict.erreur.code === "acces_refuse" ? 400 : 502;
      return refus(statut, verdict.erreur.code, verdict.erreur.message);
    }
    // Le modèle choisi, s'il est ouvert à cette clé ; sinon le premier des nôtres qui l'est.
    const voulu = modeleValide(corps.modele) ?? MODELE_PAR_DEFAUT;
    const ouverts = MODELES.map((m) => m.id).filter((id) => verdict.modeles.length === 0 || verdict.modeles.includes(id));
    const modele: IdModele = ouverts.includes(voulu) ? voulu : (ouverts[0] ?? voulu);
    const fiche = await enregistrerCle(e.compte.id, format.cle, { modele, effort: effortValide(corps.effort) ?? EFFORT_PAR_DEFAUT });
    return repondre({ cle: { ...fiche, lisible: true }, modelesOuverts: ouverts });
  } catch (err) {
    return erreurDonnees(err);
  }
}

export async function PATCH(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const corps = await lireCorps<CorpsPatch>(requete, 2_000);
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
    const fiche = await reglerCle(e.compte.id, choix);
    if (!fiche) return refus(404, "sans_cle", "Aucune clé n'est reliée à ton compte.");
    return repondre({ cle: fiche });
  } catch (err) {
    return erreurDonnees(err);
  }
}

export async function DELETE(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  try {
    await supprimerCle(e.compte.id);
    return repondre({ ok: true });
  } catch (err) {
    return erreurDonnees(err);
  }
}
