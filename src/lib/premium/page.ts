import "server-only";
import type { Compte } from "@/lib/compte/jeton";
import { porteJetonCreateur } from "@/lib/session";
import { abonnementActif, abonnementEnCache } from "./abonnements";
import { accesOffert } from "./catalogue";
import { lireConfigPremium, offreActive, tablesPremium } from "./config";

export type AttributsPremium = { offre?: "1"; premium?: "1" | "createur"; prixMois?: string; prixAnnee?: string };

/**
 * Ce que la page inscrit sur <html> : l'offre est-elle en service, la personne est-elle abonnée.
 * Le navigateur s'en sert pour l'affichage (badge doré, cadenas) ; chaque contenu réservé et chaque
 * compteur revérifient tout sur le serveur.
 */
export async function attributsPremium(compte: Compte | null, vueUtilisateur: boolean): Promise<AttributsPremium> {
  try {
    const config = await lireConfigPremium();
    const offre = await offreActive(config);
    let premium: AttributsPremium["premium"];
    if (compte && (await tablesPremium())) {
      const a = await abonnementEnCache(compte.id);
      if (a !== "indisponible" && (abonnementActif(a) || accesOffert(config, compte.email))) premium = "1";
    }
    if (!premium && offre && !vueUtilisateur && (await porteJetonCreateur())) premium = "createur";
    return offre ? { offre: "1", premium, prixMois: String(config.prixMois), prixAnnee: String(config.prixAnnee) } : { premium: premium === "1" ? "1" : undefined };
  } catch {
    return {};
  }
}
