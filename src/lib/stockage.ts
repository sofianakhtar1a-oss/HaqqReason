import "server-only";
import { dbAdmin } from "./supabase";

/*
 * Accès à l'espace de stockage privé (Supabase Storage).
 * Le navigateur n'a jamais de droit d'écriture : il reçoit, pour un seul fichier, un jeton d'envoi
 * à usage unique créé ici après vérification de la session du créateur.
 */

export const ESPACE = "fichiers";

export async function creerLienEnvoi(chemin: string): Promise<{ url: string } | null> {
  const { data, error } = await dbAdmin().storage.from(ESPACE).createSignedUploadUrl(chemin);
  if (error || !data) return null;
  return { url: data.signedUrl };
}

/** Lien de lecture temporaire (10 minutes). */
export async function lienLecture(chemin: string, telechargerSous?: string): Promise<string | null> {
  const { data, error } = await dbAdmin()
    .storage.from(ESPACE)
    .createSignedUrl(chemin, 600, telechargerSous ? { download: telechargerSous } : undefined);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Premiers octets d'un fichier, pour vérifier son type réel. */
export async function lireDebut(chemin: string, nombre = 16): Promise<Uint8Array | null> {
  const lien = await lienLecture(chemin);
  if (!lien) return null;
  try {
    const reponse = await fetch(lien, { headers: { Range: `bytes=0-${nombre - 1}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
    if (!reponse.ok && reponse.status !== 206) return null;
    const lecteur = reponse.body?.getReader();
    if (!lecteur) return null;
    const morceaux: Uint8Array[] = [];
    let total = 0;
    while (total < nombre) {
      const { value, done } = await lecteur.read();
      if (done || !value) break;
      morceaux.push(value);
      total += value.length;
    }
    await lecteur.cancel().catch(() => {});
    const resultat = new Uint8Array(Math.min(total, nombre));
    let position = 0;
    for (const m of morceaux) {
      const part = m.subarray(0, Math.min(m.length, resultat.length - position));
      resultat.set(part, position);
      position += part.length;
      if (position >= resultat.length) break;
    }
    return resultat;
  } catch {
    return null;
  }
}

export async function supprimerObjets(chemins: string[]): Promise<void> {
  for (let i = 0; i < chemins.length; i += 100) {
    await dbAdmin().storage.from(ESPACE).remove(chemins.slice(i, i + 100));
  }
}

/** Envoi pendant une restauration : le chemin d'origine est réutilisé (et remplacé s'il existe déjà). */
export async function creerLienRestauration(chemin: string): Promise<string | null> {
  const { data, error } = await dbAdmin().storage.from(ESPACE).createSignedUploadUrl(chemin, { upsert: true });
  if (error || !data) return null;
  return data.signedUrl;
}

// ----------------------------------------------------------------------
// Espace « sauvegardes » (privé) : copies automatiques quotidiennes de la base.
// ----------------------------------------------------------------------
export const ESPACE_SAUVEGARDES = "sauvegardes";
export const SAUVEGARDES_GARDEES = 30;

export async function deposerSauvegarde(nom: string, contenu: string): Promise<boolean> {
  const { error } = await dbAdmin()
    .storage.from(ESPACE_SAUVEGARDES)
    .upload(nom, new Blob([contenu], { type: "application/json" }), { upsert: true, contentType: "application/json" });
  return !error;
}

export async function listerSauvegardes(): Promise<{ nom: string; taille: number; date: string }[]> {
  const { data } = await dbAdmin().storage.from(ESPACE_SAUVEGARDES).list("auto", { limit: 200, sortBy: { column: "name", order: "desc" } });
  return (data ?? [])
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => ({ nom: `auto/${f.name}`, taille: Number((f.metadata as { size?: number } | null)?.size ?? 0), date: f.created_at ?? "" }));
}

export async function lienSauvegarde(nom: string, telecharger = false): Promise<string | null> {
  const { data } = await dbAdmin()
    .storage.from(ESPACE_SAUVEGARDES)
    .createSignedUrl(nom, 600, telecharger ? { download: nom.split("/").pop() } : undefined);
  return data?.signedUrl ?? null;
}

export async function elaguerSauvegardes(): Promise<void> {
  const toutes = await listerSauvegardes();
  const anciennes = toutes.slice(SAUVEGARDES_GARDEES).map((s) => s.nom);
  if (anciennes.length > 0) await dbAdmin().storage.from(ESPACE_SAUVEGARDES).remove(anciennes);
}
