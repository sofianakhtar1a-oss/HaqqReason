"use server";

import { redirect } from "next/navigation";
import { journaliser } from "@/lib/audit";
import { lireCompteCreateur } from "@/lib/auth-store";
import { egaliteSure, genererCleRecuperation, hacherSecret, verifierSecret } from "@/lib/crypto";
import { env, variablesManquantes } from "@/lib/env";
import type { EtatFormulaire } from "@/lib/form-state";
import { nombreDeFuites } from "@/lib/hibp";
import { evaluerMotDePasse } from "@/lib/password-policy";
import { enregistrerTentative, verifierLimite, type TypeTentative } from "@/lib/rate-limit";
import { normaliserCle } from "@/lib/recovery-key";
import { infosRequete } from "@/lib/request-info";
import { fermerSession, ouvrirSession, sessionCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { viderContenu } from "@/lib/sauvegarde";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import QRCode from "qrcode";
import { noterConnexion } from "@/lib/appareils";
import { chiffrer, dechiffrer, lienApplication, nouveauSecret, verifierCode } from "@/lib/totp";

/*
 * Chaque fonction de ce fichier est un point d'entrée public du serveur :
 * elle revérifie donc elle-même toutes les autorisations, sans jamais faire confiance au navigateur.
 */

const erreur = (message: string): EtatFormulaire => ({ statut: "erreur", message });

function champ(formData: FormData, nom: string): string {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur : "";
}

function messageBlocage(minutes: number): string {
  return `Trop de tentatives. Réessaie dans ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}

async function limiteAtteinte(kind: TypeTentative, ipHash: string): Promise<EtatFormulaire | null> {
  const verdict = await verifierLimite(kind, ipHash);
  return verdict.autorise ? null : erreur(messageBlocage(verdict.minutesRestantes));
}

/** Contrôle complet d'un nouveau mot de passe. Renvoie un message d'erreur, ou null s'il est accepté. */
async function refusDuMotDePasse(motDePasse: string, confirmation: string): Promise<string | null> {
  if (motDePasse !== confirmation) return "Les deux mots de passe ne sont pas identiques.";
  const robustesse = evaluerMotDePasse(motDePasse);
  if (robustesse.problemes.length > 0) return `Mot de passe refusé. ${robustesse.problemes.join(" ")}`;
  const fuites = await nombreDeFuites(motDePasse);
  if (fuites !== null && fuites > 0) {
    return "Ce mot de passe apparaît dans des fuites de données connues : il est donc déjà dans les listes des pirates. Choisis-en un autre.";
  }
  return null;
}

/** Premier lancement : création du mot de passe créateur et de la clé de récupération. */
export async function configurer(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (variablesManquantes().length > 0) return erreur("L'application n'est pas encore configurée côté serveur.");
  const { ipHash } = await infosRequete();
  const bloque = await limiteAtteinte("configuration", ipHash);
  if (bloque) return bloque;

  if (await lireCompteCreateur()) {
    return erreur("Le compte créateur existe déjà. Utilise la page de connexion.");
  }

  if (!egaliteSure(champ(formData, "code").trim(), env("SETUP_TOKEN"))) {
    await enregistrerTentative("configuration", ipHash, false);
    return erreur("Code d'installation incorrect.");
  }

  const motDePasse = champ(formData, "motDePasse");
  const refus = await refusDuMotDePasse(motDePasse, champ(formData, "confirmation"));
  if (refus) return erreur(refus);

  const cle = genererCleRecuperation();
  const { error } = await dbAdmin()
    .from("creator_auth")
    .insert({
      id: 1,
      password_hash: await hacherSecret(motDePasse),
      recovery_hash: await hacherSecret(cle),
      session_version: 1,
    });
  if (error) {
    if (error.code === "23505") return erreur("Le compte créateur existe déjà. Utilise la page de connexion.");
    return erreur("Enregistrement impossible. Vérifie que le fichier SQL a bien été exécuté dans Supabase.");
  }

  await enregistrerTentative("configuration", ipHash, true);
  await ouvrirSession(1);
  await noterConnexion(true);
  await journaliser("compte_createur_cree");
  return { statut: "succes", cle };
}

export async function seConnecter(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (variablesManquantes().length > 0) return erreur("L'application n'est pas encore configurée côté serveur.");
  const { ipHash } = await infosRequete();
  const bloque = await limiteAtteinte("connexion", ipHash);
  if (bloque) return bloque;

  const compte = await lireCompteCreateur();
  if (!compte) redirect("/createur/configuration");

  const correct = await verifierSecret(champ(formData, "motDePasse"), compte.password_hash);
  await enregistrerTentative("connexion", ipHash, correct);
  if (!correct) {
    await journaliser("connexion_echouee");
    return erreur("Mot de passe incorrect.");
  }

  if (compte.totp_actif) {
    // Le mot de passe est bon : il reste à fournir le code de l'application d'authentification.
    await poserDeuxiemeEtape(compte.session_version);
    redirect("/createur/connexion/code");
  }

  await ouvrirSession(compte.session_version);
  await noterConnexion();
  await journaliser("connexion_reussie");
  redirect("/createur");
}

// ----------------------------------------------------------------------
// Double authentification
// ----------------------------------------------------------------------
const NOM_ETAPE = process.env.NODE_ENV === "production" ? "__Host-hr_etape2" : "hr_etape2";
const cleEtape = () => new TextEncoder().encode(env("SESSION_SECRET"));

async function poserDeuxiemeEtape(sessionVersion: number): Promise<void> {
  const jeton = await new SignJWT({ sv: sessionVersion }).setProtectedHeader({ alg: "HS256" }).setSubject("deuxieme-etape").setIssuedAt().setExpirationTime("5m").sign(cleEtape());
  (await cookies()).set(NOM_ETAPE, jeton, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 300 });
}

/** Le mot de passe a-t-il été validé il y a moins de 5 minutes sur ce navigateur ? */
export async function deuxiemeEtapeEnCours(): Promise<number | null> {
  const jeton = (await cookies()).get(NOM_ETAPE)?.value;
  if (!jeton) return null;
  try {
    const { payload } = await jwtVerify(jeton, cleEtape(), { algorithms: ["HS256"], subject: "deuxieme-etape" });
    return typeof payload.sv === "number" ? payload.sv : null;
  } catch {
    return null;
  }
}

export async function verifierCodeConnexion(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const { ipHash } = await infosRequete();
  const bloque = await limiteAtteinte("double_authentification", ipHash);
  if (bloque) return bloque;
  const sv = await deuxiemeEtapeEnCours();
  if (sv === null) return erreur("Le délai de 5 minutes est dépassé. Recommence la connexion avec ton mot de passe.");
  const compte = await lireCompteCreateur();
  if (!compte || compte.session_version !== sv || !compte.totp_actif) return erreur("Recommence la connexion avec ton mot de passe.");
  const secret = dechiffrer(compte.totp_secret);
  const pas = secret ? verifierCode(champ(formData, "code"), secret, compte.totp_dernier_pas) : null;
  await enregistrerTentative("double_authentification", ipHash, pas !== null);
  if (pas === null) {
    await journaliser("code_double_authentification_refuse");
    return erreur("Code incorrect ou déjà utilisé. Attends le code suivant et réessaie.");
  }
  await dbAdmin().from("creator_auth").update({ totp_dernier_pas: pas }).eq("id", 1);
  (await cookies()).set(NOM_ETAPE, "", { path: "/", maxAge: 0, secure: process.env.NODE_ENV === "production" });
  await ouvrirSession(compte.session_version);
  await noterConnexion();
  await journaliser("connexion_reussie", { double_authentification: true });
  redirect("/createur");
}

export type EtatDoubleAuth = EtatFormulaire & { qr?: string; secret?: string };

/** Étape 1 de l'activation : crée un secret (pas encore actif) et renvoie le QR code à scanner. */
export async function preparerDoubleAuth(_: EtatDoubleAuth, formData: FormData): Promise<EtatDoubleAuth> {
  const identite = await confirmerIdentite(formData);
  if (identite.refus) return identite.refus;
  if (identite.compte.totp_actif) return erreur("La double authentification est déjà active.");
  const secret = nouveauSecret();
  const { error } = await dbAdmin().from("creator_auth").update({ totp_secret: chiffrer(secret), totp_actif: false, totp_dernier_pas: 0 }).eq("id", 1);
  if (error) return erreur("Enregistrement impossible. Vérifie que le fichier 006_innovations.sql a bien été exécuté dans Supabase.");
  const qr = await QRCode.toDataURL(lienApplication(secret), { margin: 1, width: 240, color: { dark: "#0b1233", light: "#ffffff" } });
  return { statut: "succes", qr, secret: secret.replace(/(.{4})/g, "$1 ").trim() };
}

/** Étape 2 : le premier code donné par l'application confirme que tout fonctionne. */
export async function activerDoubleAuth(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const compte = await sessionCreateur();
  if (!compte) redirect("/createur/connexion");
  const { ipHash } = await infosRequete();
  const bloque = await limiteAtteinte("double_authentification", ipHash);
  if (bloque) return bloque;
  const secret = dechiffrer(compte.totp_secret);
  if (!secret) return erreur("Recommence l'activation depuis le début.");
  const pas = verifierCode(champ(formData, "code"), secret, compte.totp_dernier_pas);
  await enregistrerTentative("double_authentification", ipHash, pas !== null);
  if (pas === null) return erreur("Code incorrect. Vérifie l'heure de ton téléphone, puis tape le code affiché maintenant.");
  await dbAdmin().from("creator_auth").update({ totp_actif: true, totp_dernier_pas: pas }).eq("id", 1);
  await journaliser("double_authentification_activee");
  revalidatePath("/createur/securite");
  return { statut: "succes", message: "Double authentification activée. À chaque connexion, ton application te donnera un code." };
}

export async function desactiverDoubleAuth(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const identite = await confirmerIdentite(formData);
  if (identite.refus) return identite.refus;
  const secret = dechiffrer(identite.compte.totp_secret);
  const pas = secret ? verifierCode(champ(formData, "code"), secret, identite.compte.totp_dernier_pas) : null;
  if (pas === null) return erreur("Code incorrect.");
  await dbAdmin().from("creator_auth").update({ totp_actif: false, totp_secret: null, totp_dernier_pas: 0 }).eq("id", 1);
  await journaliser("double_authentification_desactivee");
  revalidatePath("/createur/securite");
  return { statut: "succes", message: "Double authentification désactivée." };
}

// ----------------------------------------------------------------------
// Appareils
// ----------------------------------------------------------------------
export async function confirmerAppareil(formData: FormData): Promise<void> {
  if (!(await sessionCreateur())) redirect("/createur/connexion");
  const cle = champ(formData, "empreinte");
  if (!/^[a-f0-9]{64}$/.test(cle)) return;
  await dbAdmin().from("appareils_connus").update({ confirme: true }).eq("empreinte", cle);
  await journaliser("appareil_confirme");
  revalidatePath("/createur");
}

/** « Ce n'est pas moi » : l'appareil est oublié et toutes les AUTRES sessions sont fermées. */
export async function signalerAppareil(formData: FormData): Promise<void> {
  const compte = await sessionCreateur();
  if (!compte) redirect("/createur/connexion");
  const cle = champ(formData, "empreinte");
  if (/^[a-f0-9]{64}$/.test(cle)) await dbAdmin().from("appareils_connus").delete().eq("empreinte", cle);
  const nouvelleVersion = compte.session_version + 1;
  await dbAdmin().from("creator_auth").update({ session_version: nouvelleVersion }).eq("id", 1);
  await ouvrirSession(nouvelleVersion);
  await journaliser("appareil_signale_inconnu");
  redirect("/createur/securite?alerte=appareil");
}

export async function oublierAppareil(formData: FormData): Promise<void> {
  if (!(await sessionCreateur())) redirect("/createur/connexion");
  const cle = champ(formData, "empreinte");
  if (/^[a-f0-9]{64}$/.test(cle)) await dbAdmin().from("appareils_connus").delete().eq("empreinte", cle);
  revalidatePath("/createur/securite");
}

/** Mot de passe oublié : la clé de récupération permet d'en définir un nouveau. */
export async function recuperer(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (variablesManquantes().length > 0) return erreur("L'application n'est pas encore configurée côté serveur.");
  const { ipHash } = await infosRequete();
  const bloque = await limiteAtteinte("recuperation", ipHash);
  if (bloque) return bloque;

  const compte = await lireCompteCreateur();
  if (!compte) redirect("/createur/configuration");

  const cleSaisie = normaliserCle(champ(formData, "cle"));
  const cleValide = cleSaisie !== null && (await verifierSecret(cleSaisie, compte.recovery_hash));
  if (!cleValide) {
    await enregistrerTentative("recuperation", ipHash, false);
    await journaliser("recuperation_echouee");
    return erreur("Clé de récupération incorrecte.");
  }

  const motDePasse = champ(formData, "motDePasse");
  const refus = await refusDuMotDePasse(motDePasse, champ(formData, "confirmation"));
  if (refus) return erreur(refus);

  // L'ancienne clé est invalidée, une nouvelle est créée, et tous les appareils sont déconnectés.
  const nouvelleCle = genererCleRecuperation();
  const nouvelleVersion = compte.session_version + 1;
  const { error, data } = await dbAdmin()
    .from("creator_auth")
    .update({
      password_hash: await hacherSecret(motDePasse),
      recovery_hash: await hacherSecret(nouvelleCle),
      session_version: nouvelleVersion,
      password_changed_at: new Date().toISOString(),
      // Téléphone perdu : la clé de récupération désactive aussi la double authentification.
      totp_actif: false,
      totp_secret: null,
      totp_dernier_pas: 0,
    })
    .eq("id", 1)
    .eq("session_version", compte.session_version)
    .select("id");
  if (error || !data || data.length !== 1) return erreur("Enregistrement impossible. Réessaie.");

  await enregistrerTentative("recuperation", ipHash, true);
  await ouvrirSession(nouvelleVersion);
  await noterConnexion();
  await journaliser("mot_de_passe_reinitialise_par_cle");
  return { statut: "succes", cle: nouvelleCle };
}

/** Vérifie la session ET le mot de passe actuel avant une opération sensible. */
async function confirmerIdentite(formData: FormData) {
  const compte = await sessionCreateur();
  if (!compte) redirect("/createur/connexion");
  const { ipHash } = await infosRequete();
  const bloque = await limiteAtteinte("connexion", ipHash);
  if (bloque) return { refus: bloque, compte: null };
  const correct = await verifierSecret(champ(formData, "motDePasseActuel"), compte.password_hash);
  await enregistrerTentative("connexion", ipHash, correct);
  if (!correct) return { refus: erreur("Mot de passe actuel incorrect."), compte: null };
  return { refus: null, compte };
}

export async function changerMotDePasse(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const identite = await confirmerIdentite(formData);
  if (identite.refus) return identite.refus;

  const motDePasse = champ(formData, "motDePasse");
  const refus = await refusDuMotDePasse(motDePasse, champ(formData, "confirmation"));
  if (refus) return erreur(refus);

  const nouvelleVersion = identite.compte.session_version + 1;
  const { error } = await dbAdmin()
    .from("creator_auth")
    .update({
      password_hash: await hacherSecret(motDePasse),
      session_version: nouvelleVersion,
      password_changed_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return erreur("Enregistrement impossible. Réessaie.");

  await ouvrirSession(nouvelleVersion);
  await journaliser("mot_de_passe_change");
  return { statut: "succes", message: "Mot de passe changé. Les autres appareils ont été déconnectés." };
}

export async function regenererCle(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const identite = await confirmerIdentite(formData);
  if (identite.refus) return identite.refus;

  const cle = genererCleRecuperation();
  const { error } = await dbAdmin()
    .from("creator_auth")
    .update({ recovery_hash: await hacherSecret(cle) })
    .eq("id", 1);
  if (error) return erreur("Enregistrement impossible. Réessaie.");

  await journaliser("cle_de_recuperation_regeneree");
  return { statut: "succes", cle };
}

export async function seDeconnecter(): Promise<void> {
  if (await sessionCreateur()) await journaliser("deconnexion");
  await fermerSession();
  redirect("/");
}

export async function deconnecterTousLesAppareils(): Promise<void> {
  const compte = await sessionCreateur();
  if (!compte) redirect("/createur/connexion");
  await dbAdmin()
    .from("creator_auth")
    .update({ session_version: compte.session_version + 1 })
    .eq("id", 1);
  await journaliser("deconnexion_de_tous_les_appareils");
  await fermerSession();
  redirect("/createur/connexion");
}

/**
 * Efface TOUT le contenu (catégories, articles, fichiers, étiquettes, historique), en gardant les trois blocs,
 * le compte créateur, les modèles et les synonymes. Exige le mot de passe et une phrase de confirmation.
 */
export async function effacerToutLeContenu(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const identite = await confirmerIdentite(formData);
  if (identite.refus) return identite.refus;
  if (champ(formData, "phrase").trim().toUpperCase() !== "TOUT EFFACER") {
    return erreur("Recopie exactement la phrase TOUT EFFACER pour confirmer.");
  }
  const nombre = await viderContenu({ fichiers: true, outils: false });
  await journaliser("contenu_entierement_efface", { fichiers: nombre });
  revalidatePath("/", "layout");
  return { statut: "succes", message: "Tout le contenu a été effacé. Les trois blocs, tes modèles et tes synonymes sont conservés." };
}
