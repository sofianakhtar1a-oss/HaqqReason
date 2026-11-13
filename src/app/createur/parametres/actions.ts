"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import type { EtatFormulaire } from "@/lib/form-state";
import { CHOIX, nettoyerReglages, type Reglages } from "@/lib/reglages";
import { ecrireReglages, lireReglages } from "@/lib/reglages-donnees";
import { ouvrirSession, sessionCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";

const nonConnecte: EtatFormulaire = { statut: "erreur", message: "Ta session a expiré. Reconnecte-toi, puis recommence." };

/**
 * Enregistre les réglages. La session est aussitôt re-signée pour que la nouvelle durée
 * de déconnexion automatique s'applique sans attendre.
 */
export async function enregistrerReglages(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const compte = await sessionCreateur();
  if (!compte) return nonConnecte;

  const brut = {
    inactivite_minutes: formData.get("inactivite_minutes"),
    session_max_heures: formData.get("session_max_heures"),
    lier_appareil: formData.get("lier_appareil"),
    taille_max_mo: formData.get("taille_max_mo"),
    recherche_sens: formData.get("recherche_sens"),
  };
  // Toute valeur hors des listes autorisées est ramenée à l'ancienne ou à celle par défaut.
  const avant = await lireReglages();
  const demande = nettoyerReglages({ ...brut, lier_appareil: brut.lier_appareil === "on", recherche_sens: brut.recherche_sens === "on" });
  const valeurs: Reglages = {
    inactivite_minutes: CHOIX.inactivite_minutes.includes(Number(brut.inactivite_minutes) as never) ? demande.inactivite_minutes : avant.inactivite_minutes,
    session_max_heures: CHOIX.session_max_heures.includes(Number(brut.session_max_heures) as never) ? demande.session_max_heures : avant.session_max_heures,
    lier_appareil: demande.lier_appareil,
    taille_max_mo: CHOIX.taille_max_mo.includes(Number(brut.taille_max_mo) as never) ? demande.taille_max_mo : avant.taille_max_mo,
    recherche_sens: demande.recherche_sens,
  };

  try {
    await ecrireReglages(valeurs);
  } catch {
    return { statut: "erreur", message: "Enregistrement impossible. Vérifie que le fichier 008_reglages.sql a bien été exécuté dans Supabase." };
  }

  /*
   * Un réglage plus strict ne vaudrait rien si les sessions déjà ouvertes gardaient l'ancien :
   * leur durée et leur rattachement à l'appareil sont inscrits dans le jeton au moment de la connexion.
   * On ferme donc les autres appareils, et on re-signe celui-ci.
   */
  const plusStrict =
    (valeurs.lier_appareil && !avant.lier_appareil) ||
    valeurs.inactivite_minutes < avant.inactivite_minutes ||
    valeurs.session_max_heures < avant.session_max_heures;
  let version = compte.session_version;
  if (plusStrict) {
    version = compte.session_version + 1;
    const { error } = await dbAdmin().from("creator_auth").update({ session_version: version }).eq("id", 1);
    if (error) version = compte.session_version;
  }

  await ouvrirSession(version);
  await journaliser("reglages_modifies", {
    inactivite_minutes: valeurs.inactivite_minutes,
    session_max_heures: valeurs.session_max_heures,
    lier_appareil: valeurs.lier_appareil,
    taille_max_mo: valeurs.taille_max_mo,
    recherche_sens: valeurs.recherche_sens,
  });
  revalidatePath("/createur/parametres");
  return {
    statut: "succes",
    message: plusStrict ? "Réglages enregistrés. Les autres appareils ont été déconnectés pour que les nouvelles règles s'y appliquent." : "Réglages enregistrés.",
  };
}
