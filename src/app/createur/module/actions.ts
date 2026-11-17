"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import { abandonnerBrouillon, enregistrerBrouillon, etatModule, type EtatModule, publier, restaurerVersion } from "@/lib/modules/donnees";
import { estModule, MODULES, type ModuleId } from "@/lib/modules/modules";
import { sessionCreateur } from "@/lib/session";

type Reponse = { ok: true; etat: EtatModule } | { ok: false; erreur: string };

const SESSION = "Ta session a expiré. Reconnecte-toi, puis recommence (ton brouillon reste dans cet onglet).";

async function garde(id: string): Promise<ModuleId | string> {
  if (!(await sessionCreateur())) return SESSION;
  if (!estModule(id)) return "Module inconnu.";
  return id;
}

const echec = (e: unknown): Reponse => ({ ok: false, erreur: e instanceof Error ? e.message : "L'opération a échoué." });

function rafraichir(id: ModuleId) {
  revalidatePath(MODULES[id].adresse);
  revalidatePath("/createur");
  revalidatePath(`/createur/module/${id}`);
}

/** Le brouillon est enregistré au fil de l'eau : rien n'est encore visible des visiteurs. */
export async function enregistrerModule(id: string, contenu: unknown): Promise<Reponse> {
  const m = await garde(id);
  if (!estModule(m)) return { ok: false, erreur: m };
  try {
    await enregistrerBrouillon(m, contenu);
    return { ok: true, etat: await etatModule(m) };
  } catch (e) {
    return echec(e);
  }
}

export async function publierModule(id: string, contenu: unknown): Promise<Reponse> {
  const m = await garde(id);
  if (!estModule(m)) return { ok: false, erreur: m };
  try {
    await enregistrerBrouillon(m, contenu);
    await publier(m);
    await journaliser("module_publie", { module: m });
    rafraichir(m);
    return { ok: true, etat: await etatModule(m) };
  } catch (e) {
    return echec(e);
  }
}

export async function abandonnerModule(id: string): Promise<Reponse> {
  const m = await garde(id);
  if (!estModule(m)) return { ok: false, erreur: m };
  try {
    await abandonnerBrouillon(m);
    return { ok: true, etat: await etatModule(m) };
  } catch (e) {
    return echec(e);
  }
}

export async function restaurerModule(id: string, index: number): Promise<Reponse> {
  const m = await garde(id);
  if (!estModule(m)) return { ok: false, erreur: m };
  try {
    await restaurerVersion(m, Math.max(0, Math.floor(Number(index) || 0)));
    await journaliser("module_version_restauree", { module: m, index });
    return { ok: true, etat: await etatModule(m) };
  } catch (e) {
    return echec(e);
  }
}
