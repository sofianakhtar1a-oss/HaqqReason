/** Sources et références : types partagés, statuts de vérification et mise en forme bibliographique. */

export const STATUTS_SOURCE = [
  { cle: "a-verifier", libelle: "À vérifier", court: "À vérifier", teinte: "gris" },
  { cle: "verifiee", libelle: "Référence vérifiée", court: "Vérifiée", teinte: "emeraude" },
  { cle: "citation-verifiee", libelle: "Citation vérifiée sur l'ouvrage original", court: "Vérifiée sur l'original", teinte: "or" },
  { cle: "incomplete", libelle: "Référence incomplète", court: "Incomplète", teinte: "orange" },
  { cle: "secondaire", libelle: "Source secondaire", court: "Secondaire", teinte: "bleu" },
  { cle: "contestee", libelle: "Source contestée", court: "Contestée", teinte: "rouge" },
] as const;
export type StatutSource = (typeof STATUTS_SOURCE)[number]["cle"];
export const statutSource = (cle: string) => STATUTS_SOURCE.find((s) => s.cle === cle) ?? STATUTS_SOURCE[0];

export type OuvrageAffiche = {
  id: string;
  titre: string;
  titre_original: string;
  auteur_id: string | null;
  auteur_texte: string;
  auteur_nom?: string;
  editeur: string;
  edition: string;
  lieu: string;
  annee: string;
  volumes: string;
  langue: string;
  isbn: string;
  lien: string;
  statut: StatutSource;
};
export type CitationAffichee = { id: string; ouvrage_id: string; texte: string; texte_original: string; tome: string; page: string; contexte: string; statut: StatutSource };
export type DonneesSources = { ouvrages: Record<string, OuvrageAffiche>; citations: Record<string, CitationAffichee> };
export const SOURCES_VIDES: DonneesSources = { ouvrages: {}, citations: {} };

export function auteurDe(o: OuvrageAffiche): string {
  return o.auteur_nom || o.auteur_texte;
}

/** « Auteur, Titre (Titre original), éditeur, édition, lieu, année » ; les parties absentes sont omises. */
export function partiesReference(o: OuvrageAffiche): { auteur: string; titre: string; suite: string } {
  const suite = [o.titre_original ? `(${o.titre_original})` : "", o.editeur, o.edition, o.lieu, o.annee, o.volumes ? `${o.volumes} vol.` : ""].filter(Boolean).join(", ");
  return { auteur: auteurDe(o), titre: o.titre, suite };
}

export function localisation(tome: string, page: string): string {
  return [tome ? `t. ${tome}` : "", page ? `p. ${page}` : ""].filter(Boolean).join(", ");
}

/** Ce qu'il manque à un ouvrage pour une référence complète. */
export function manquesOuvrage(o: Pick<OuvrageAffiche, "auteur_id" | "auteur_texte" | "editeur" | "annee" | "titre">): string[] {
  const manques: string[] = [];
  if (!o.auteur_id && !o.auteur_texte.trim()) manques.push("auteur");
  if (!o.editeur.trim()) manques.push("éditeur");
  if (!o.annee.trim()) manques.push("année");
  return manques;
}

/** Références d'un document (pour la table des références et le chargement des données). */
export function referencesDuDocument(document: unknown): { ouvrages: string[]; citations: string[]; liste: { ouvrage: string; citation: string; page: string }[] } {
  const ouvrages = new Set<string>();
  const citations = new Set<string>();
  const liste: { ouvrage: string; citation: string; page: string }[] = [];
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const parcourir = (n: unknown, profondeur: number) => {
    if (!n || typeof n !== "object" || profondeur > 40) return;
    const noeud = n as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] };
    if (noeud.type === "reference" || noeud.type === "citationOuvrage") {
      const o = String(noeud.attrs?.ouvrage ?? "");
      const c = String(noeud.attrs?.citation ?? "");
      if (UUID.test(o)) ouvrages.add(o.toLowerCase());
      if (UUID.test(c)) citations.add(c.toLowerCase());
      if (UUID.test(o) || UUID.test(c)) liste.push({ ouvrage: UUID.test(o) ? o.toLowerCase() : "", citation: UUID.test(c) ? c.toLowerCase() : "", page: String(noeud.attrs?.page ?? "").slice(0, 60) });
    }
    for (const e of noeud.content ?? []) parcourir(e, profondeur + 1);
  };
  parcourir(document, 0);
  return { ouvrages: [...ouvrages], citations: [...citations], liste };
}
