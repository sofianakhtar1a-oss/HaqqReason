import "server-only";
import { dbAdmin } from "@/lib/supabase";
import { MAGASINS, OBJET_MAX, PLAFOND_DONNEES, REPONSE_MAX, type NomMagasin } from "./limites";

/* Accès aux données d'un compte. À n'appeler qu'APRÈS avoir vérifié la session (lib/compte/session.ts). */

export const ESPACE_COMPTES = "comptes";

export type Ecriture = { m: NomMagasin; c: string; v: unknown; q: number };
export type Ligne = { m: string; c: string; v: unknown; q: number; j: number };

/**
 * Retire le caractère nul (U+0000) de tous les textes et de tous les noms de champ d'une valeur.
 * La base (jsonb) le refuse, et un seul suffirait à faire échouer tout l'envoi. On le trouve
 * surtout dans le texte extrait de certains PDF ; il ne s'affiche nulle part : rien de visible n'est perdu.
 */
export function sansCaractereNul(valeur: unknown, profondeur = 0): unknown {
  if (typeof valeur === "string") return valeur.includes("\u0000") ? valeur.replaceAll("\u0000", "") : valeur;
  if (valeur === null || typeof valeur !== "object" || profondeur > 200) return valeur;
  if (Array.isArray(valeur)) return valeur.map((x) => sansCaractereNul(x, profondeur + 1));
  const sortie: Record<string, unknown> = {};
  for (const [cle, x] of Object.entries(valeur)) sortie[cle.replaceAll("\u0000", "")] = sansCaractereNul(x, profondeur + 1);
  return sortie;
}

/** Ne garde que les écritures bien formées ; les autres sont ignorées sans bruit. */
export function nettoyerEcritures(brut: unknown): { valides: Ecriture[]; tropLourdes: { m: string; c: string }[] } {
  const valides: Ecriture[] = [];
  const tropLourdes: { m: string; c: string }[] = [];
  if (!Array.isArray(brut)) return { valides, tropLourdes };
  const maintenant = Date.now();
  for (const e of brut) {
    if (!e || typeof e !== "object") continue;
    const { m, c, v, q } = e as Record<string, unknown>;
    if (typeof m !== "string" || !(MAGASINS as readonly string[]).includes(m)) continue;
    if (typeof c !== "string" || c.length < 1 || c.length > 200) continue;
    if (typeof q !== "number" || !Number.isFinite(q) || q < 0) continue;
    // Une horloge d'appareil très en avance ne doit pas verrouiller un objet pour toujours.
    const quand = Math.min(Math.floor(q), maintenant + 5 * 60_000);
    const valeur = v === undefined ? null : sansCaractereNul(v);
    if (valeur !== null && JSON.stringify(valeur).length > OBJET_MAX) {
      tropLourdes.push({ m, c });
      continue;
    }
    valides.push({ m: m as NomMagasin, c, v: valeur, q: quand });
  }
  return { valides, tropLourdes };
}

export async function ecrireDonnees(utilisateur: string, ecritures: Ecriture[]): Promise<{ refusees: { m: string; c: string }[] } | null> {
  if (ecritures.length === 0) return { refusees: [] };
  const { data, error } = await dbAdmin().rpc("donnees_ecrire", { p_utilisateur: utilisateur, p_ecritures: ecritures, p_plafond: PLAFOND_DONNEES });
  if (error) return null;
  const refusees = (data as { refusees?: { m: string; c: string }[] } | null)?.refusees;
  return { refusees: Array.isArray(refusees) ? refusees : [] };
}

export async function lireDonnees(utilisateur: string, depuis: number): Promise<{ lignes: Ligne[]; suite: boolean } | null> {
  const LIMITE = 300;
  const { data, error } = await dbAdmin().rpc("donnees_lire", { p_utilisateur: utilisateur, p_depuis: depuis, p_limite: LIMITE, p_octets: REPONSE_MAX });
  if (error || !Array.isArray(data)) return null;
  const lignes = (data as { magasin: string; cle: string; valeur: unknown; quand: number | string; maj: number | string }[]).map((l) => ({
    m: l.magasin,
    c: l.cle,
    v: l.valeur ?? null,
    q: Number(l.quand),
    j: Number(l.maj),
  }));
  // Tant qu'une réponse contient des lignes, l'appareil redemande la suite à partir de la dernière.
  return { lignes, suite: lignes.length > 0 };
}

export type Place = { donnees: number; objets: number; fichiers: number; nbFichiers: number };

export async function placeDuCompte(utilisateur: string): Promise<Place | null> {
  const { data, error } = await dbAdmin().rpc("compte_place", { p_utilisateur: utilisateur });
  const l = Array.isArray(data) ? data[0] : data;
  if (error || !l) return null;
  return { donnees: Number(l.donnees), objets: Number(l.objets), fichiers: Number(l.fichiers), nbFichiers: Number(l.nb_fichiers) };
}

/** Efface le compte, toutes ses données et tous ses fichiers. Rien n'est récupérable ensuite. */
export async function supprimerCompte(utilisateur: string): Promise<boolean> {
  const stockage = dbAdmin().storage.from(ESPACE_COMPTES);
  const { data: fichiers } = await dbAdmin().from("fichiers_utilisateur").select("id").eq("utilisateur_id", utilisateur).limit(5000);
  const chemins = (fichiers ?? []).map((f) => `${utilisateur}/${f.id as string}`);
  for (let i = 0; i < chemins.length; i += 100) await stockage.remove(chemins.slice(i, i + 100));
  const { error } = await dbAdmin().from("utilisateurs").delete().eq("id", utilisateur);
  return !error;
}
