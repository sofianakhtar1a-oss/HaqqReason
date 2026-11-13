"use server";

import { revalidatePath } from "next/cache";
import { journaliser } from "@/lib/audit";
import { sessionCreateur } from "@/lib/session";
import { STATUTS_SOURCE, type CitationAffichee, type DonneesSources, type OuvrageAffiche } from "@/lib/sources";
import { sourcesDuDocument } from "@/lib/sources-donnees";
import { dbAdmin } from "@/lib/supabase";
import { estUuid } from "@/lib/validation";

type Retour<T = undefined> = { ok: true; donnees: T } | { ok: false; message: string };
const expire = { ok: false as const, message: "Ta session a expiré. Reconnecte-toi." };
const STATUTS: string[] = STATUTS_SOURCE.map((s) => s.cle);
const t = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max) : "");
const lienWeb = (v: unknown) => {
  const s = t(v, 2000);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : "";
  } catch {
    return "";
  }
};

export type ChampsOuvrage = Omit<OuvrageAffiche, "id" | "auteur_nom"> & { notes: string };
export type ChampsCitation = Omit<CitationAffichee, "id">;
export type ChampsAuteur = { nom: string; nom_original: string; epoque: string; biographie: string; notes: string };

function propreOuvrage(c: Partial<ChampsOuvrage>) {
  return {
    titre: t(c.titre, 400),
    titre_original: t(c.titre_original, 400),
    auteur_id: estUuid(c.auteur_id) ? c.auteur_id : null,
    auteur_texte: t(c.auteur_texte, 300),
    editeur: t(c.editeur, 200),
    edition: t(c.edition, 200),
    lieu: t(c.lieu, 120),
    annee: t(c.annee, 40),
    volumes: t(c.volumes, 60),
    langue: t(c.langue, 60),
    isbn: t(c.isbn, 40),
    lien: lienWeb(c.lien),
    statut: STATUTS.includes(c.statut as string) ? c.statut : "a-verifier",
    notes: t(c.notes, 20000),
  };
}

export async function enregistrerOuvrage(id: string | null, champs: Partial<ChampsOuvrage>): Promise<Retour<{ id: string }>> {
  if (!(await sessionCreateur())) return expire;
  const propre = propreOuvrage(champs);
  if (!propre.titre) return { ok: false, message: "Le titre de l'ouvrage est obligatoire." };
  const requete = id && estUuid(id) ? dbAdmin().from("ouvrages").update(propre).eq("id", id).select("id").single() : dbAdmin().from("ouvrages").insert(propre).select("id").single();
  const { data, error } = await requete;
  if (error || !data) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/createur/sources", "layout");
  return { ok: true, donnees: { id: data.id as string } };
}

export async function supprimerOuvrage(id: string): Promise<Retour> {
  if (!(await sessionCreateur())) return expire;
  if (!estUuid(id)) return { ok: false, message: "Ouvrage introuvable." };
  const { count } = await dbAdmin().from("references_articles").select("article_id", { count: "exact", head: true }).eq("ouvrage_id", id);
  if ((count ?? 0) > 0) return { ok: false, message: `Cet ouvrage est cité dans ${count} article${(count ?? 0) > 1 ? "s" : ""} : retire d'abord ces références.` };
  await dbAdmin().from("ouvrages").delete().eq("id", id);
  await journaliser("ouvrage_supprime", {});
  revalidatePath("/createur/sources", "layout");
  return { ok: true, donnees: undefined };
}

export async function enregistrerAuteur(id: string | null, champs: Partial<ChampsAuteur>): Promise<Retour<{ id: string }>> {
  if (!(await sessionCreateur())) return expire;
  const propre = { nom: t(champs.nom, 200), nom_original: t(champs.nom_original, 200), epoque: t(champs.epoque, 120), biographie: t(champs.biographie, 20000), notes: t(champs.notes, 20000) };
  if (!propre.nom) return { ok: false, message: "Le nom de l'auteur est obligatoire." };
  const requete = id && estUuid(id) ? dbAdmin().from("auteurs").update(propre).eq("id", id).select("id").single() : dbAdmin().from("auteurs").insert(propre).select("id").single();
  const { data, error } = await requete;
  if (error || !data) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/createur/sources", "layout");
  return { ok: true, donnees: { id: data.id as string } };
}

export async function supprimerAuteur(id: string): Promise<Retour> {
  if (!(await sessionCreateur())) return expire;
  if (!estUuid(id)) return { ok: false, message: "Auteur introuvable." };
  await dbAdmin().from("auteurs").delete().eq("id", id);
  revalidatePath("/createur/sources", "layout");
  return { ok: true, donnees: undefined };
}

export async function enregistrerCitation(id: string | null, champs: Partial<ChampsCitation>): Promise<Retour<{ id: string }>> {
  if (!(await sessionCreateur())) return expire;
  const propre = {
    ouvrage_id: estUuid(champs.ouvrage_id) ? champs.ouvrage_id : null,
    texte: t(champs.texte, 10000),
    texte_original: t(champs.texte_original, 10000),
    tome: t(champs.tome, 30),
    page: t(champs.page, 60),
    contexte: t(champs.contexte, 5000),
    statut: STATUTS.includes(champs.statut as string) ? champs.statut : "a-verifier",
  };
  if (!propre.ouvrage_id) return { ok: false, message: "Choisis l'ouvrage d'où vient la citation." };
  if (!propre.texte) return { ok: false, message: "Le texte de la citation est obligatoire." };
  const requete = id && estUuid(id) ? dbAdmin().from("citations").update(propre).eq("id", id).select("id").single() : dbAdmin().from("citations").insert(propre).select("id").single();
  const { data, error } = await requete;
  if (error || !data) return { ok: false, message: "Enregistrement impossible." };
  revalidatePath("/createur/sources", "layout");
  return { ok: true, donnees: { id: data.id as string } };
}

export async function supprimerCitation(id: string): Promise<Retour> {
  if (!(await sessionCreateur())) return expire;
  if (!estUuid(id)) return { ok: false, message: "Citation introuvable." };
  await dbAdmin().from("citations").delete().eq("id", id);
  revalidatePath("/createur/sources", "layout");
  return { ok: true, donnees: undefined };
}

export type ResultatSource = { type: "ouvrage" | "citation"; id: string; titre: string; detail: string; ouvrage_id: string };

/** Recherche rapide d'ouvrages et de citations (choix d'une référence dans l'éditeur). */
export async function rechercherSources(q: string): Promise<Retour<ResultatSource[]>> {
  if (!(await sessionCreateur())) return expire;
  const motif = `%${t(q, 100).replace(/[%_,()]/g, " ")}%`;
  const [ouvrages, citations] = await Promise.all([
    dbAdmin().from("ouvrages").select("id, titre, auteur_texte, annee, auteurs(nom)").or(`titre.ilike.${motif},auteur_texte.ilike.${motif},titre_original.ilike.${motif}`).order("titre").limit(12),
    dbAdmin().from("citations").select("id, texte, page, ouvrage_id, ouvrages(titre)").ilike("texte", motif).limit(8),
  ]);
  const sortie: ResultatSource[] = [];
  for (const o of (ouvrages.data ?? []) as unknown as { id: string; titre: string; auteur_texte: string; annee: string; auteurs: { nom: string } | null }[]) {
    sortie.push({ type: "ouvrage", id: o.id, titre: o.titre, detail: [o.auteurs?.nom || o.auteur_texte, o.annee].filter(Boolean).join(", "), ouvrage_id: o.id });
  }
  for (const c of (citations.data ?? []) as unknown as { id: string; texte: string; page: string; ouvrage_id: string; ouvrages: { titre: string } | null }[]) {
    sortie.push({ type: "citation", id: c.id, titre: c.texte.length > 120 ? `${c.texte.slice(0, 118)}…` : c.texte, detail: `${c.ouvrages?.titre ?? ""}${c.page ? `, p. ${c.page}` : ""}`, ouvrage_id: c.ouvrage_id });
  }
  return { ok: true, donnees: sortie };
}

export async function ouvragesSemblables(titre: string): Promise<Retour<{ id: string; titre: string; auteur_texte: string; annee: string }[]>> {
  if (!(await sessionCreateur())) return expire;
  if (t(titre, 400).length < 4) return { ok: true, donnees: [] };
  const { data } = await dbAdmin().rpc("ouvrages_semblables", { p_titre: t(titre, 400) });
  return { ok: true, donnees: (data ?? []) as { id: string; titre: string; auteur_texte: string; annee: string }[] };
}

/** Données d'affichage des références d'un passage (éditeur). */
export async function lireSourcesEditeur(refs: { ouvrages: string[]; citations: string[] }): Promise<DonneesSources> {
  if (!(await sessionCreateur())) return { ouvrages: {}, citations: {} };
  const contenu = [
    ...(refs.ouvrages ?? []).filter(estUuid).slice(0, 200).map((o) => ({ type: "reference", attrs: { ouvrage: o } })),
    ...(refs.citations ?? []).filter(estUuid).slice(0, 200).map((c) => ({ type: "citationOuvrage", attrs: { citation: c } })),
  ];
  return sourcesDuDocument({ type: "doc", content: contenu }, "createur");
}
