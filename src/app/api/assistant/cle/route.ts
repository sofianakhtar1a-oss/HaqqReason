import type { NextRequest } from "next/server";
import { bilan, enregistrerCle, noterVerification, supprimerCle } from "@/lib/assistant/donnees";
import { entree, erreurDonnees, lireCorps, refus, repondre } from "@/lib/assistant/http";
import { verifierCle } from "@/lib/assistant/ia";
import { LIMITES } from "@/lib/assistant/limites";
import { controlerFormatCle, fournisseurValide, modelesDe } from "@/lib/assistant/modeles";

/*
 * Les clés API du compte connecté, une par IA (BYOK : « apporte ta propre clé »).
 *   PUT    { fournisseur, cle } : vérifie la clé auprès de l'IA (appel gratuit : la liste des
 *          modèles), puis l'enregistre chiffrée et liée au compte. Jamais renvoyée, ni journalisée.
 *   DELETE ?fournisseur=… : oublie la clé de cette IA.
 */

export async function PUT(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const corps = await lireCorps<{ fournisseur?: unknown; cle?: unknown }>(requete, 4_000);
  if (!corps) return refus(400, "illisible");
  const fournisseur = fournisseurValide(corps.fournisseur ?? "anthropic");
  if (!fournisseur) return refus(400, "fournisseur", "IA inconnue.");
  const format = controlerFormatCle(fournisseur, corps.cle);
  if (!format.ok) return refus(400, "format", format.message);

  try {
    // Le site ne doit pas servir à tester des clés en série.
    const b = await bilan(e.compte.id);
    if (b.verificationsHeure >= LIMITES.verificationsHeure) {
      return refus(429, "trop_essais", "Trop d'essais de clé en une heure. Vérifie la clé sur le site de l'IA, puis réessaie un peu plus tard.");
    }
    const verdict = await verifierCle(fournisseur, format.cle);
    await noterVerification(e.compte.id, verdict.ok);
    if (!verdict.ok) {
      const statut = verdict.erreur.code === "cle_invalide" || verdict.erreur.code === "acces_refuse" ? 400 : 502;
      return refus(statut, verdict.erreur.code, verdict.erreur.message);
    }
    const ouverts = modelesDe(fournisseur)
      .map((m) => m.id)
      .filter((id) => verdict.modeles.length === 0 || verdict.modeles.includes(id));
    const fiche = await enregistrerCle(e.compte.id, fournisseur, format.cle);
    return repondre({ cle: fiche, modelesOuverts: ouverts });
  } catch (err) {
    return erreurDonnees(err);
  }
}

export async function DELETE(requete: NextRequest) {
  const e = await entree(requete);
  if ("refus" in e) return e.refus;
  const fournisseur = fournisseurValide(requete.nextUrl.searchParams.get("fournisseur") ?? "anthropic");
  if (!fournisseur) return refus(400, "fournisseur", "IA inconnue.");
  try {
    await supprimerCle(e.compte.id, fournisseur);
    return repondre({ ok: true });
  } catch (err) {
    return erreurDonnees(err);
  }
}
