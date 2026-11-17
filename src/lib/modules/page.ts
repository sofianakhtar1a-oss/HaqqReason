import "server-only";
import { sessionCreateurVisible } from "@/lib/session";
import { contenuAffiche } from "./donnees";
import type { ModuleId, Resolu } from "./modules";

type Params = Promise<Record<string, string | string[] | undefined>> | undefined;

/** Les textes d'un module pour une page publique ; « ?apercu=1 » montre le brouillon au seul créateur. */
export async function chargerModule(id: ModuleId, searchParams?: Params) {
  const sp = (await searchParams) ?? {};
  const apercu = sp.apercu === "1" && Boolean(await sessionCreateurVisible().catch(() => null));
  return { resolu: await contenuAffiche(id, apercu), apercu };
}

/** Les nombres réels du vocabulaire publié, pour remplir {mots} et {themes} dans les textes. */
export function chiffresDe(resolu: Resolu) {
  const themes = resolu.themes ?? [];
  return { mots: themes.reduce((n, t) => n + t.entrees.length, 0).toLocaleString("fr-FR"), themes: themes.length };
}

/** Les mêmes nombres, lus depuis le vocabulaire publié du Truchement. */
export async function chiffresVocabulaire() {
  return chiffresDe(await contenuAffiche("langues", false));
}
