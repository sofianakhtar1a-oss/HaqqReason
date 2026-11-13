"use server";

import { apercuLien, type Apercu } from "@/lib/apercu-lien";
import { sessionCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";

/** Prépare une carte de lien (titre, description, vignette) pour un article. Réservé au créateur. */
export async function creerApercu(donnees: { articleId: string; url: string }): Promise<{ ok: true; apercu: Apercu } | { ok: false; message: string }> {
  if (!(await sessionCreateur())) return { ok: false, message: "Ta session a expiré. Reconnecte-toi." };
  if (!estUuid(donnees.articleId) || typeof donnees.url !== "string" || donnees.url.length > 2000) return { ok: false, message: "Adresse invalide." };
  const { data } = await dbAdmin().from("articles").select("id").eq("id", donnees.articleId).maybeSingle();
  if (!data) return { ok: false, message: "Article introuvable." };
  const apercu = await apercuLien(donnees.url, donnees.articleId);
  if (!apercu) return { ok: false, message: "Cette adresse n'est pas un lien web valide (elle doit commencer par https://)." };
  return { ok: true, apercu };
}
