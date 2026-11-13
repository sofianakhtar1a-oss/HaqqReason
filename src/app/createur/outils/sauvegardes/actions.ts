"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import { verifierSecret } from "@/lib/crypto";
import { enregistrerTentative, verifierLimite } from "@/lib/rate-limit";
import { infosRequete } from "@/lib/request-info";
import { estTable, FORMAT, lirePaquet, nettoyerLignes, ordonnerCategories, PAQUETS, VERSION_FORMAT, viderContenu } from "@/lib/sauvegarde";
import { sauvegarderMaintenant } from "@/lib/sauvegarde-auto";
import { sessionCreateur } from "@/lib/session";
import { creerLienRestauration, lienLecture, lienSauvegarde } from "@/lib/stockage";
import { dbAdmin } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";

const expire = { ok: false as const, message: "Ta session a expiré. Reconnecte-toi, puis recommence." };

// ------------------------------------------------------------------ Export
export async function debutExport() {
  if (!(await sessionCreateur())) return expire;
  const { data: blocs } = await dbAdmin().from("blocs").select("id, slug");
  await journaliser("sauvegarde_exportee");
  return { ok: true as const, entete: { format: FORMAT, version: VERSION_FORMAT, date: new Date().toISOString(), blocs: blocs ?? [] } };
}

export async function exporterPaquet(table: string, debut: number) {
  if (!(await sessionCreateur())) return expire;
  if (!estTable(table) || !Number.isInteger(debut) || debut < 0) return { ok: false as const, message: "Demande invalide." };
  const lignes = await lirePaquet(table, debut);
  return { ok: true as const, lignes, fin: lignes.length < PAQUETS[table] };
}

export async function liensFichiers(ids: string[]) {
  if (!(await sessionCreateur())) return expire;
  const propres = (Array.isArray(ids) ? ids : []).filter(estUuid).slice(0, 50);
  const { data } = await dbAdmin().from("fichiers").select("id, chemin").in("id", propres);
  const liens = await Promise.all(((data ?? []) as { id: string; chemin: string }[]).map(async (f) => ({ id: f.id, chemin: f.chemin, url: await lienLecture(f.chemin) })));
  return { ok: true as const, liens };
}

// ------------------------------------------------------------- Restauration
export async function commencerRestauration(formData: FormData) {
  const compte = await sessionCreateur();
  if (!compte) return expire;
  const { ipHash } = await infosRequete();
  const verdict = await verifierLimite("connexion", ipHash);
  if (!verdict.autorise) return { ok: false as const, message: `Trop de tentatives. Réessaie dans ${verdict.minutesRestantes} minutes.` };
  const correct = await verifierSecret(String(formData.get("motDePasseActuel") ?? ""), compte.password_hash);
  await enregistrerTentative("connexion", ipHash, correct);
  if (!correct) return { ok: false as const, message: "Mot de passe actuel incorrect." };
  if (String(formData.get("phrase") ?? "").trim().toUpperCase() !== "RESTAURER") return { ok: false as const, message: "Recopie exactement le mot RESTAURER pour confirmer." };
  const avecFichiers = formData.get("avecFichiers") === "oui";
  await viderContenu({ fichiers: avecFichiers, outils: true });
  const { data: blocs } = await dbAdmin().from("blocs").select("id, slug");
  return { ok: true as const, blocs: (blocs ?? []) as { id: string; slug: string }[] };
}

export async function restaurerLot(donnees: { table: string; lignes: unknown[]; blocs: Record<string, string> }) {
  if (!(await sessionCreateur())) return expire;
  if (!estTable(donnees.table) || !Array.isArray(donnees.lignes) || donnees.lignes.length > 2000) return { ok: false as const, message: "Lot invalide." };
  const blocs = new Map(Object.entries(donnees.blocs ?? {}).filter(([a, b]) => estUuid(a) && estUuid(b)));
  let lignes = nettoyerLignes(donnees.table, donnees.lignes, blocs);
  if (donnees.table === "categories") lignes = ordonnerCategories(lignes);
  if (lignes.length === 0) return { ok: true as const, nombre: 0 };
  const { error } = await dbAdmin().from(donnees.table).upsert(lignes);
  if (error) return { ok: false as const, message: `Restauration de « ${donnees.table} » impossible : ${error.message}` };
  return { ok: true as const, nombre: lignes.length };
}

export async function lienRestaurationFichier(chemin: string) {
  if (!(await sessionCreateur())) return expire;
  if (typeof chemin !== "string" || !/^(article|categorie)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{1,8}$/.test(chemin)) return { ok: false as const, message: "Chemin invalide." };
  const { data } = await dbAdmin().from("fichiers").select("id").eq("chemin", chemin).maybeSingle();
  if (!data) return { ok: false as const, message: "Fichier inconnu." };
  const url = await creerLienRestauration(chemin);
  return url ? { ok: true as const, url } : { ok: false as const, message: "Espace de stockage indisponible." };
}

export async function terminerRestauration(bilan: { lignes: number; fichiers: number; source: string }) {
  if (!(await sessionCreateur())) return;
  await journaliser("sauvegarde_restauree", { lignes: Number(bilan.lignes) || 0, fichiers: Number(bilan.fichiers) || 0, source: String(bilan.source).slice(0, 60) });
  revalidatePath("/", "layout");
}

// ---------------------------------------------------- Sauvegardes dans le cloud
export async function sauvegarderDansLeCloud() {
  if (!(await sessionCreateur())) return expire;
  const r = await sauvegarderMaintenant("manuelle");
  revalidatePath("/createur/outils/sauvegardes");
  return r.ok ? { ok: true as const, message: "Copie enregistrée dans l'espace « sauvegardes »." } : { ok: false as const, message: "Enregistrement impossible. Vérifie que le fichier 006_innovations.sql a bien été exécuté." };
}

export async function lienCopieCloud(nom: string, telecharger: boolean) {
  if (!(await sessionCreateur())) return expire;
  if (typeof nom !== "string" || !/^auto\/\d{4}-\d{2}-\d{2}\.json$/.test(nom)) return { ok: false as const, message: "Sauvegarde introuvable." };
  const url = await lienSauvegarde(nom, telecharger);
  return url ? { ok: true as const, url } : { ok: false as const, message: "Sauvegarde introuvable." };
}
