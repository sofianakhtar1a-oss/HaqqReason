import "server-only";
import type { LiensResolus } from "./liens";
import { dbAdmin, dbPublic } from "./supabase";

type Mode = "public" | "createur";
const base = (mode: Mode) => (mode === "createur" ? dbAdmin() : dbPublic());

/** Liens [[…]] d'un article, résolus vers les articles que l'appelant a le droit de voir. */
export async function lireLiens(id: string, mode: Mode): Promise<LiensResolus> {
  const { data } = await base(mode).rpc("liens_resolus", { p_source: id });
  const liens: LiensResolus = {};
  for (const l of (data ?? []) as { cible_texte: string; id: string | null; titre: string | null }[]) {
    liens[l.cible_texte] = l.id && l.titre ? { id: l.id, titre: l.titre } : null;
  }
  return liens;
}

export async function lireRetroliens(id: string, mode: Mode): Promise<{ id: string; titre: string; resume: string }[]> {
  const { data } = await base(mode).rpc("retroliens", { p_article: id });
  return (data ?? []) as { id: string; titre: string; resume: string }[];
}
