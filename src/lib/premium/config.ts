import "server-only";
import { googleConfigure } from "@/lib/compte/jeton";
import { dbAdmin } from "@/lib/supabase";
import { type ConfigPremium, configParDefaut, nettoyerConfig, vendeurComplet } from "./catalogue";
import { stripeConfigure } from "./stripe";

/*
 * Les réglages Premium du créateur, rangés dans la table « reglages » (réservée au serveur), sous
 * « premium_config ». Ils ne contiennent aucun secret : les clés Stripe restent dans Vercel.
 */

const CLE = "premium_config";
const DUREE_CACHE_MS = 15_000;
let cache: { valeur: ConfigPremium; expire: number } | null = null;

export async function lireConfigPremium(frais = false): Promise<ConfigPremium> {
  if (!frais && cache && cache.expire > Date.now()) return cache.valeur;
  try {
    const { data, error } = await dbAdmin().from("reglages").select("valeur").eq("cle", CLE).maybeSingle();
    if (error) throw new Error(error.message);
    const valeur = nettoyerConfig((data as { valeur: unknown } | null)?.valeur ?? null);
    cache = { valeur, expire: Date.now() + DUREE_CACHE_MS };
    return valeur;
  } catch {
    // Base injoignable : la dernière version connue, sinon l'offre éteinte (tout reste ouvert, comme avant).
    return cache?.valeur ?? configParDefaut();
  }
}

export async function ecrireConfigPremium(config: ConfigPremium): Promise<ConfigPremium> {
  const propre = nettoyerConfig({ ...config, maj: new Date().toISOString() });
  const { error } = await dbAdmin().from("reglages").upsert({ cle: CLE, valeur: propre as never }, { onConflict: "cle" });
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  cache = { valeur: propre, expire: Date.now() + DUREE_CACHE_MS };
  return propre;
}

/* ---------- La base est-elle prête (migration 021 exécutée) ? ---------- */

let tables: { pretes: boolean; expire: number } | null = null;

export async function tablesPremium(): Promise<boolean> {
  if (tables && tables.expire > Date.now()) return tables.pretes;
  let pretes = false;
  try {
    const { error } = await dbAdmin().from("abonnements_premium").select("compte", { head: true, count: "exact" }).limit(1);
    pretes = !error;
  } catch {
    pretes = false;
  }
  // Un résultat positif se garde une minute ; un négatif, dix secondes (le temps d'exécuter le script).
  tables = { pretes, expire: Date.now() + (pretes ? 60_000 : 10_000) };
  return pretes;
}

/** Ce qui manque encore pour que l'offre payante puisse fonctionner. */
export async function prerequisOffre(config: ConfigPremium): Promise<{ stripe: boolean; base: boolean; comptes: boolean; vendeur: boolean }> {
  return { stripe: stripeConfigure(), base: await tablesPremium(), comptes: googleConfigure(), vendeur: vendeurComplet(config.vendeur) };
}

/**
 * L'offre payante est-elle en service ? Il faut l'interrupteur du créateur ET tout ce qui la fait
 * marcher : Stripe réglé, la base prête, la connexion des comptes, les informations du vendeur
 * (obligatoires dans les conditions de vente). Sinon tout reste ouvert, comme avant.
 */
export async function offreActive(config?: ConfigPremium): Promise<boolean> {
  const c = config ?? (await lireConfigPremium());
  if (!c.active || !stripeConfigure() || !googleConfigure() || !vendeurComplet(c.vendeur)) return false;
  return tablesPremium();
}
