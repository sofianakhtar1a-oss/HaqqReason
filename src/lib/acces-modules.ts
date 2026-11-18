import "server-only";
import { cookies } from "next/headers";
import { hacherSecret, verifierSecret } from "./crypto";
import { sessionCreateurVisible } from "./session";
import { dbAdmin } from "./supabase";
import {
  CLE_REGLAGE,
  lireReglageAcces,
  NOM_COOKIE_MODULES,
  oublierVersionAccesModules,
  optionsCookieModules,
  type ReglageAcces,
  signerAccesModules,
  verifierAccesModules,
  versionAccesModules,
} from "./acces-modules-jeton";

/** Lit l'empreinte et la version du mot de passe des modules réservés (null si jamais choisi). */
export async function lireAccesModules(): Promise<ReglageAcces | null> {
  const { data, error } = await dbAdmin().from("reglages").select("valeur").eq("cle", CLE_REGLAGE).maybeSingle();
  if (error) throw new Error(`Lecture du mot de passe des modules impossible : ${error.message}`);
  return lireReglageAcces(data?.valeur);
}

async function ecrire(reglage: ReglageAcces): Promise<void> {
  const { error } = await dbAdmin().from("reglages").upsert({ cle: CLE_REGLAGE, valeur: reglage as never }, { onConflict: "cle" });
  if (error) throw new Error(`Enregistrement du mot de passe des modules impossible : ${error.message}`);
  oublierVersionAccesModules();
}

/** Nouveau mot de passe : les visiteurs déjà entrés devront donner le nouveau. */
export async function definirMotDePasseModules(motDePasse: string): Promise<void> {
  const actuel = await lireAccesModules();
  await ecrire({ empreinte: await hacherSecret(motDePasse), version: (actuel?.version ?? 0) + 1 });
}

/** Retire l'accès à tous les visiteurs, sans changer le mot de passe. */
export async function revoquerAccesModules(): Promise<void> {
  const actuel = await lireAccesModules();
  if (!actuel) return;
  await ecrire({ empreinte: actuel.empreinte, version: actuel.version + 1 });
}

/** Ferme complètement les deux modules : plus aucun mot de passe ne les ouvre. */
export async function fermerModules(): Promise<void> {
  const actuel = await lireAccesModules();
  await ecrire({ empreinte: "", version: (actuel?.version ?? 0) + 1 });
}

/** Vérifie un mot de passe donné par un visiteur. Renvoie la version à inscrire dans son cookie, ou null. */
export async function controlerMotDePasseModules(motDePasse: string): Promise<number | null> {
  const actuel = await lireAccesModules();
  if (!actuel?.empreinte || !motDePasse) return null;
  return (await verifierSecret(motDePasse, actuel.empreinte)) ? actuel.version : null;
}

export async function ouvrirAccesModules(version: number): Promise<void> {
  (await cookies()).set(NOM_COOKIE_MODULES, await signerAccesModules(version), optionsCookieModules());
}

export async function fermerAccesModules(): Promise<void> {
  (await cookies()).set(NOM_COOKIE_MODULES, "", optionsCookieModules(0));
}

/** Le visiteur peut-il lire les modules réservés ? Le créateur toujours, sauf dans la vue utilisateur. */
export async function aAccesModules(): Promise<boolean> {
  if (await sessionCreateurVisible()) return true;
  return verifierAccesModules((await cookies()).get(NOM_COOKIE_MODULES)?.value, await versionAccesModules());
}
