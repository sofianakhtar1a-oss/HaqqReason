import "server-only";
import { dbAdmin } from "@/lib/supabase";
import { type Contenu, type ModuleId, memeContenu, nettoyerContenu, type Resolu, resoudre } from "./modules";

/*
 * Brouillon, version publiée et historique de chaque module, rangés dans la table « reglages »
 * (lecture et écriture réservées au serveur, aucune migration à exécuter) :
 *   module_<id>_brouillon   le travail en cours du créateur ;
 *   module_<id>_publie      ce que voient les visiteurs ;
 *   module_<id>_historique  les 15 publications précédentes, pour revenir en arrière.
 */

type Publie = { contenu: Contenu; le: string };
type Brouillon = { contenu: Contenu; le: string };
export type Version = { contenu: Contenu; le: string };

const cle = (id: ModuleId, quoi: "brouillon" | "publie" | "historique") => `module_${id}_${quoi}`;
const HISTORIQUE_MAX = 15;

async function lire<T>(k: string): Promise<T | null> {
  const { data, error } = await dbAdmin().from("reglages").select("valeur").eq("cle", k).maybeSingle();
  if (error) throw new Error(error.message);
  return ((data as { valeur: T } | null)?.valeur ?? null) as T | null;
}

async function ecrire(k: string, valeur: unknown) {
  const { error } = await dbAdmin().from("reglages").upsert({ cle: k, valeur: valeur as never }, { onConflict: "cle" });
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
}

async function effacer(k: string) {
  await dbAdmin().from("reglages").delete().eq("cle", k);
}

/* ---------- Côté visiteur : la version publiée, avec un court cache ---------- */

const cache = new Map<ModuleId, { valeur: Contenu | null; expire: number }>();
const DUREE_CACHE_MS = 15_000;

export async function contenuPublie(id: ModuleId): Promise<Contenu | null> {
  const c = cache.get(id);
  if (c && c.expire > Date.now()) return c.valeur;
  let valeur: Contenu | null = null;
  try {
    const p = await lire<Publie>(cle(id, "publie"));
    valeur = p ? nettoyerContenu(id, p.contenu) : null;
  } catch {
    // Base indisponible : les textes d'origine s'affichent, le site reste debout.
    valeur = null;
  }
  cache.set(id, { valeur, expire: Date.now() + DUREE_CACHE_MS });
  return valeur;
}

/** Ce que la page affiche : la version publiée, ou le brouillon en aperçu pour le créateur. */
export async function contenuAffiche(id: ModuleId, apercu: boolean): Promise<Resolu> {
  if (apercu) {
    const b = await lire<Brouillon>(cle(id, "brouillon")).catch(() => null);
    if (b) return resoudre(id, nettoyerContenu(id, b.contenu));
  }
  return resoudre(id, await contenuPublie(id));
}

/* ---------- Côté créateur ---------- */

export type EtatModule = { brouillon: Contenu; publie: Contenu | null; publieLe: string | null; modifieLe: string | null; enAttente: boolean; historique: { le: string }[] };

export async function etatModule(id: ModuleId): Promise<EtatModule> {
  const [b, p, h] = await Promise.all([lire<Brouillon>(cle(id, "brouillon")), lire<Publie>(cle(id, "publie")), lire<Version[]>(cle(id, "historique"))]);
  const publie = p ? nettoyerContenu(id, p.contenu) : null;
  const brouillon = b ? nettoyerContenu(id, b.contenu) : (publie ?? nettoyerContenu(id, {}));
  return {
    brouillon,
    publie,
    publieLe: p?.le ?? null,
    modifieLe: b?.le ?? null,
    enAttente: Boolean(b) && !memeContenu(brouillon, publie),
    historique: (h ?? []).map((v) => ({ le: v.le })),
  };
}

export async function resumeModules(ids: ModuleId[]) {
  const sortie: Record<string, { enAttente: boolean; publieLe: string | null }> = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const e = await etatModule(id);
        sortie[id] = { enAttente: e.enAttente, publieLe: e.publieLe };
      } catch {
        sortie[id] = { enAttente: false, publieLe: null };
      }
    }),
  );
  return sortie;
}

export async function enregistrerBrouillon(id: ModuleId, brut: unknown) {
  const contenu = nettoyerContenu(id, brut);
  await ecrire(cle(id, "brouillon"), { contenu, le: new Date().toISOString() } satisfies Brouillon);
  return contenu;
}

export async function publier(id: ModuleId) {
  const [b, p, h] = await Promise.all([lire<Brouillon>(cle(id, "brouillon")), lire<Publie>(cle(id, "publie")), lire<Version[]>(cle(id, "historique"))]);
  if (!b) return;
  const contenu = nettoyerContenu(id, b.contenu);
  // La version remplacée part dans l'historique : on peut toujours y revenir.
  if (p) await ecrire(cle(id, "historique"), [{ contenu: p.contenu, le: p.le }, ...(h ?? [])].slice(0, HISTORIQUE_MAX));
  else await ecrire(cle(id, "historique"), [{ contenu: nettoyerContenu(id, {}), le: "origine" }, ...(h ?? [])].slice(0, HISTORIQUE_MAX));
  await ecrire(cle(id, "publie"), { contenu, le: new Date().toISOString() } satisfies Publie);
  await effacer(cle(id, "brouillon"));
  cache.delete(id);
}

/** Abandonne le brouillon : on repart de la version publiée. */
export async function abandonnerBrouillon(id: ModuleId) {
  await effacer(cle(id, "brouillon"));
}

/** Une ancienne publication redevient le brouillon (à relire, puis publier). */
export async function restaurerVersion(id: ModuleId, index: number) {
  const h = (await lire<Version[]>(cle(id, "historique"))) ?? [];
  const v = h[index];
  if (!v) throw new Error("Cette version n'existe plus.");
  await enregistrerBrouillon(id, v.contenu);
}
