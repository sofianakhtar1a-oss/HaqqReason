import "server-only";
import { journaliser } from "./audit";
import { instantaneComplet } from "./sauvegarde";
import { deposerSauvegarde, elaguerSauvegardes } from "./stockage";

/** Copie de toute la base dans l'espace privé « sauvegardes » (une par jour, les 30 dernières sont gardées). */
export async function sauvegarderMaintenant(origine: "automatique" | "manuelle"): Promise<{ ok: boolean; nom: string; taille: number }> {
  const instantane = await instantaneComplet();
  const texte = JSON.stringify(instantane);
  const nom = `auto/${new Date().toISOString().slice(0, 10)}.json`;
  const ok = await deposerSauvegarde(nom, texte);
  if (ok) await elaguerSauvegardes();
  await journaliser("sauvegarde_automatique", { origine, ok, taille: texte.length });
  return { ok, nom, taille: texte.length };
}
