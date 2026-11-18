"use server";

import { redirect } from "next/navigation";
import { controlerMotDePasseModules, ouvrirAccesModules } from "@/lib/acces-modules";
import { retourSur } from "@/lib/acces-modules-jeton";
import { journaliser } from "@/lib/audit";
import type { EtatFormulaire } from "@/lib/form-state";
import { infosRequete } from "@/lib/request-info";
import { dbAdmin } from "@/lib/supabase";

/*
 * Point d'entrée public : un visiteur donne le mot de passe des modules réservés.
 * Les essais ratés sont comptés dans le journal d'audit, par appareil (adresse anonymisée)
 * et pour tout le site, pour qu'un robot ne puisse pas deviner le mot de passe.
 */

const PAR_APPAREIL = { essais: 5, minutes: 15 };
const POUR_TOUT_LE_SITE = { essais: 200, minutes: 60 };

async function tropDEssais(ipHash: string): Promise<number | null> {
  const compter = async (minutes: number, ip?: string) => {
    let requete = dbAdmin()
      .from("audit_log")
      .select("created_at", { count: "exact" })
      .eq("action", "acces_modules_refuse")
      .gte("created_at", new Date(Date.now() - minutes * 60_000).toISOString())
      .order("created_at", { ascending: true })
      .limit(1);
    if (ip) requete = requete.eq("ip_hash", ip);
    const { count, data } = await requete;
    return { nombre: count ?? 0, premier: (data?.[0]?.created_at as string | undefined) ?? null };
  };
  const [moi, tous] = await Promise.all([compter(PAR_APPAREIL.minutes, ipHash), compter(POUR_TOUT_LE_SITE.minutes)]);
  if (moi.nombre >= PAR_APPAREIL.essais && moi.premier) {
    return Math.max(1, Math.ceil((new Date(moi.premier).getTime() + PAR_APPAREIL.minutes * 60_000 - Date.now()) / 60_000));
  }
  if (tous.nombre >= POUR_TOUT_LE_SITE.essais) return POUR_TOUT_LE_SITE.minutes;
  return null;
}

export async function entrerDansLesModules(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const motDePasse = typeof formData.get("motDePasse") === "string" ? (formData.get("motDePasse") as string) : "";
  const retour = retourSur(formData.get("retour"));
  const { ipHash } = await infosRequete();

  const attente = await tropDEssais(ipHash);
  if (attente) return { statut: "erreur", message: `Trop d'essais. Réessaie dans ${attente} minute${attente > 1 ? "s" : ""}.` };

  const version = motDePasse.length > 0 && motDePasse.length <= 200 ? await controlerMotDePasseModules(motDePasse) : null;
  if (version === null) {
    await journaliser("acces_modules_refuse");
    return { statut: "erreur", message: "Mot de passe incorrect. Demande-le sur Instagram ou TikTok si tu ne l'as pas." };
  }

  await ouvrirAccesModules(version);
  await journaliser("acces_modules_ouvert");
  redirect(retour);
}
