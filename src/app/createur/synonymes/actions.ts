"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import type { EtatFormulaire } from "@/lib/form-state";
import { sessionCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { estUuid, ligne } from "@/lib/validation";

export async function ajouterSynonymes(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  if (!(await sessionCreateur())) return { statut: "erreur", message: "Ta session a expiré. Reconnecte-toi." };
  const brut = String(formData.get("termes") ?? "");
  const termes = [...new Set(brut.split(/[,;\n]/).map((t) => ligne(t).slice(0, 80)).filter(Boolean))];
  if (termes.length < 2) return { statut: "erreur", message: "Indique au moins deux termes, séparés par des virgules." };
  if (termes.length > 20) return { statut: "erreur", message: "20 termes au plus par groupe." };
  const { error } = await dbAdmin().from("synonymes").insert({ termes });
  if (error) return { statut: "erreur", message: "Enregistrement impossible." };
  await journaliser("synonymes_ajoutes", { termes });
  revalidatePath("/createur/synonymes");
  return { statut: "succes", message: `Groupe enregistré : ${termes.join(", ")}.` };
}

export async function supprimerSynonymes(formData: FormData): Promise<void> {
  if (!(await sessionCreateur())) return;
  const id = formData.get("id");
  if (!estUuid(id)) return;
  await dbAdmin().from("synonymes").delete().eq("id", id);
  revalidatePath("/createur/synonymes");
}
