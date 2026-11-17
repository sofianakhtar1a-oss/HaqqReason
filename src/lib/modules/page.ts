import "server-only";
import { sessionCreateur } from "@/lib/session";
import { contenuAffiche } from "./donnees";
import type { ModuleId } from "./modules";

type Params = Promise<Record<string, string | string[] | undefined>> | undefined;

/** Les textes d'un module pour une page publique ; « ?apercu=1 » montre le brouillon au seul créateur. */
export async function chargerModule(id: ModuleId, searchParams?: Params) {
  const sp = (await searchParams) ?? {};
  const apercu = sp.apercu === "1" && Boolean(await sessionCreateur().catch(() => null));
  return { resolu: await contenuAffiche(id, apercu), apercu };
}
