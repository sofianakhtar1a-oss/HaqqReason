import "server-only";
import { referencesDuDocument, SOURCES_VIDES, type CitationAffichee, type DonneesSources, type OuvrageAffiche } from "./sources";
import { dbAdmin, dbPublic } from "./supabase";

const COLONNES_OUVRAGE = "id, titre, titre_original, auteur_id, auteur_texte, editeur, edition, lieu, annee, volumes, langue, isbn, lien, statut";
const COLONNES_CITATION = "id, ouvrage_id, texte, texte_original, tome, page, contexte, statut";

/** Ouvrages et citations utilisés dans un document (le public ne reçoit que ce qui est cité par un article visible). */
export async function sourcesDuDocument(document: unknown, mode: "public" | "createur"): Promise<DonneesSources> {
  const refs = referencesDuDocument(document);
  if (refs.ouvrages.length === 0 && refs.citations.length === 0) return SOURCES_VIDES;
  const db = mode === "createur" ? dbAdmin() : dbPublic();
  const citations: Record<string, CitationAffichee> = {};
  if (refs.citations.length > 0) {
    const { data } = await db.from("citations").select(COLONNES_CITATION).in("id", refs.citations.slice(0, 500));
    for (const c of (data ?? []) as CitationAffichee[]) citations[c.id] = c;
  }
  const idsOuvrages = [...new Set([...refs.ouvrages, ...Object.values(citations).map((c) => c.ouvrage_id)])].slice(0, 500);
  const ouvrages: Record<string, OuvrageAffiche> = {};
  if (idsOuvrages.length > 0) {
    const { data } = await db.from("ouvrages").select(COLONNES_OUVRAGE).in("id", idsOuvrages);
    const liste = (data ?? []) as OuvrageAffiche[];
    const idsAuteurs = [...new Set(liste.map((o) => o.auteur_id).filter((x): x is string => Boolean(x)))];
    const noms = new Map<string, string>();
    if (idsAuteurs.length > 0) {
      const { data: auteurs } = await db.from("auteurs").select("id, nom").in("id", idsAuteurs);
      for (const a of (auteurs ?? []) as { id: string; nom: string }[]) noms.set(a.id, a.nom);
    }
    for (const o of liste) ouvrages[o.id] = { ...o, auteur_nom: o.auteur_id ? noms.get(o.auteur_id) : undefined };
  }
  return { ouvrages, citations };
}

/** Met à jour la table des références d'un article (appelé à chaque enregistrement). */
export async function enregistrerReferences(articleId: string, document: unknown): Promise<void> {
  const { liste } = referencesDuDocument(document);
  await dbAdmin().rpc("enregistrer_references", { p_article: articleId, p_refs: liste.slice(0, 2000) });
}
