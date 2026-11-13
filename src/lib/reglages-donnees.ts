import "server-only";
import { after } from "next/server";
import { dbAdmin } from "./supabase";
import { nettoyerReglages, type Reglages } from "./reglages";

/**
 * Lecture et écriture des réglages (table « reglages »).
 * Un court cache en mémoire évite d'interroger la base à chaque page ;
 * il ne dure que quelques secondes, le temps d'une navigation.
 */
let cache: { valeurs: Reglages; expire: number } | null = null;
const DUREE_CACHE_MS = 15_000;

export async function lireReglages(): Promise<Reglages> {
  if (cache && cache.expire > Date.now()) return cache.valeurs;
  let brut: Record<string, unknown> = {};
  try {
    const { data } = await dbAdmin().from("reglages").select("cle, valeur");
    for (const ligne of (data ?? []) as { cle: string; valeur: unknown }[]) brut[ligne.cle] = ligne.valeur;
  } catch {
    // Base inaccessible ou migration 008 pas encore exécutée : on garde les valeurs par défaut.
    brut = {};
  }
  const valeurs = nettoyerReglages(brut);
  cache = { valeurs, expire: Date.now() + DUREE_CACHE_MS };
  return valeurs;
}

/** Oublie le cache : à appeler après toute modification. */
export function oublierReglages(): void {
  cache = null;
}

export async function ecrireReglages(valeurs: Reglages): Promise<void> {
  const lignes = Object.entries(valeurs).map(([cle, valeur]) => ({ cle, valeur: valeur as never }));
  const { error } = await dbAdmin().from("reglages").upsert(lignes, { onConflict: "cle" });
  if (error) throw new Error(`Enregistrement des réglages impossible : ${error.message}`);
  oublierReglages();
  after(() => {
    cache = null;
  });
}
