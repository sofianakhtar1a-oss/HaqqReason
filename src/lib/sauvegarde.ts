import "server-only";
import { supprimerObjets } from "./stockage";
import { dbAdmin } from "./supabase";

/*
 * Sauvegarde et restauration de toute la bibliothèque.
 * Le format est un JSON lisible : { format, version, date, blocs, tables: { nom: lignes[] } }.
 * Les fichiers (PDF, images) sont ajoutés à côté dans l'archive ZIP par le navigateur du créateur.
 */

export const FORMAT = "haqqreason-sauvegarde";
export const VERSION_FORMAT = 1;

/** Tables sauvegardées, dans l'ordre où il faut les restaurer, avec les colonnes autorisées. */
export const TABLES = {
  categories: ["id", "bloc_id", "parent_id", "titre", "slug", "description", "icone", "ordre", "statut", "supprime_le", "created_at", "updated_at"],
  articles: ["id", "bloc_id", "categorie_id", "titre", "slug", "resume", "contenu", "contenu_texte", "statut", "publie_le", "supprime_le", "ordre", "created_at", "updated_at", "etiquettes_texte", "texte_versets", "texte_hadiths", "texte_objections"],
  etiquettes: ["id", "nom", "cle", "created_at"],
  articles_etiquettes: ["article_id", "etiquette_id"],
  liens_articles: ["source_id", "cible_norm", "cible_texte"],
  versions_articles: ["id", "article_id", "titre", "resume", "contenu", "contenu_texte", "motif", "created_at"],
  fichiers: ["id", "article_id", "categorie_id", "nom", "chemin", "type_mime", "taille", "pages", "etat", "statut_texte", "dans_liste", "ordre", "empreinte", "created_at", "updated_at"],
  pages_fichiers: ["fichier_id", "numero", "texte", "ocr"],
  annotations: ["id", "fichier_id", "page", "type", "x", "y", "largeur", "hauteur", "couleur", "texte", "visible", "created_at"],
  modeles: ["id", "nom", "description", "contenu", "created_at", "updated_at"],
  synonymes: ["id", "termes", "created_at"],
  auteurs: ["id", "nom", "nom_original", "epoque", "biographie", "notes", "created_at", "updated_at"],
  ouvrages: ["id", "titre", "titre_original", "auteur_id", "auteur_texte", "editeur", "edition", "lieu", "annee", "volumes", "langue", "isbn", "lien", "fichier_id", "statut", "notes", "created_at", "updated_at"],
  citations: ["id", "ouvrage_id", "texte", "texte_original", "tome", "page", "contexte", "statut", "created_at", "updated_at"],
  references_articles: ["article_id", "ouvrage_id", "citation_id", "page", "cle"],
  articles_categories: ["article_id", "categorie_id"],
  prerequis: ["article_id", "prerequis_id", "ordre"],
} as const;

export type NomTable = keyof typeof TABLES;
export const ORDRE_TABLES = Object.keys(TABLES) as NomTable[];
export const estTable = (t: unknown): t is NomTable => typeof t === "string" && Object.hasOwn(TABLES, t);

/** Taille des paquets lus d'un coup (les tables lourdes par petits paquets). */
export const PAQUETS: Record<NomTable, number> = {
  categories: 1000,
  articles: 100,
  etiquettes: 1000,
  articles_etiquettes: 1000,
  liens_articles: 1000,
  versions_articles: 50,
  fichiers: 1000,
  pages_fichiers: 200,
  annotations: 1000,
  modeles: 50,
  synonymes: 1000,
  auteurs: 500,
  ouvrages: 500,
  citations: 300,
  references_articles: 1000,
  articles_categories: 1000,
  prerequis: 1000,
};

const TRI: Partial<Record<NomTable, string>> = {
  articles_etiquettes: "article_id",
  liens_articles: "source_id",
  pages_fichiers: "fichier_id",
  references_articles: "article_id",
  articles_categories: "article_id",
  prerequis: "article_id",
};

export async function lirePaquet(table: NomTable, debut: number): Promise<Record<string, unknown>[]> {
  const taille = PAQUETS[table];
  let requete = dbAdmin().from(table).select(TABLES[table].join(", "));
  requete = requete.order(TRI[table] ?? "id");
  if (table === "articles_etiquettes") requete = requete.order("etiquette_id");
  if (table === "liens_articles") requete = requete.order("cible_norm");
  if (table === "pages_fichiers") requete = requete.order("numero");
  if (table === "references_articles") requete = requete.order("cle");
  if (table === "articles_categories") requete = requete.order("categorie_id");
  if (table === "prerequis") requete = requete.order("prerequis_id");
  const { data, error } = await requete.range(debut, debut + taille - 1);
  if (error) throw new Error(`Lecture de ${table} impossible.`);
  return (data ?? []) as unknown as Record<string, unknown>[];
}

/** Toute la base (sans les fichiers) : utilisé par la sauvegarde automatique quotidienne. */
export async function instantaneComplet(): Promise<Record<string, unknown>> {
  const { data: blocs } = await dbAdmin().from("blocs").select("id, slug");
  const tables: Record<string, Record<string, unknown>[]> = {};
  for (const t of ORDRE_TABLES) {
    tables[t] = [];
    for (let debut = 0; ; debut += PAQUETS[t]) {
      const lignes = await lirePaquet(t, debut);
      tables[t].push(...lignes);
      if (lignes.length < PAQUETS[t]) break;
    }
  }
  return { format: FORMAT, version: VERSION_FORMAT, date: new Date().toISOString(), blocs: blocs ?? [], tables };
}

/**
 * Efface tout le contenu en gardant les trois blocs et le compte créateur.
 * fichiers : supprime aussi les PDF et images de l'espace de stockage.
 * outils : supprime aussi les modèles et les synonymes (utile avant une restauration).
 */
export async function viderContenu(options: { fichiers: boolean; outils: boolean }): Promise<number> {
  const base = dbAdmin();
  const chemins: string[] = [];
  for (let debut = 0; ; debut += 1000) {
    const { data } = await base.from("fichiers").select("chemin").range(debut, debut + 999);
    chemins.push(...(data ?? []).map((f) => f.chemin as string));
    if (!data || data.length < 1000) break;
  }
  if (options.fichiers) await supprimerObjets(chemins);
  // L'ordre compte : les articles (et leurs fichiers, versions, étiquettes) avant les catégories, les enfants avant les parents.
  await base.from("articles").delete().not("id", "is", null);
  await base.from("fichiers").delete().not("id", "is", null);
  for (let tour = 0; tour < 200; tour++) {
    const { data: restantes } = await base.from("categories").select("id, parent_id");
    if (!restantes || restantes.length === 0) break;
    const parents = new Set(restantes.map((c) => c.parent_id).filter(Boolean));
    const feuilles = restantes.filter((c) => !parents.has(c.id)).map((c) => c.id as string);
    for (let i = 0; i < feuilles.length; i += 200) await base.from("categories").delete().in("id", feuilles.slice(i, i + 200));
  }
  await base.from("etiquettes").delete().not("id", "is", null);
  // Sources : les citations partent avec leurs ouvrages.
  await base.from("ouvrages").delete().not("id", "is", null);
  await base.from("auteurs").delete().not("id", "is", null);
  if (options.outils) {
    await base.from("modeles").delete().not("id", "is", null);
    await base.from("synonymes").delete().not("id", "is", null);
  }
  return chemins.length;
}

/** Garde seulement les colonnes connues ; remplace les identifiants des blocs par ceux de cette installation. */
export function nettoyerLignes(table: NomTable, lignes: unknown[], blocs: Map<string, string>): Record<string, unknown>[] {
  const colonnes = TABLES[table] as readonly string[];
  return lignes
    .filter((l): l is Record<string, unknown> => Boolean(l) && typeof l === "object" && !Array.isArray(l))
    .map((l) => {
      const propre: Record<string, unknown> = {};
      for (const c of colonnes) if (Object.hasOwn(l, c)) propre[c] = l[c];
      if ((table === "categories" || table === "articles") && typeof propre.bloc_id === "string") propre.bloc_id = blocs.get(propre.bloc_id) ?? propre.bloc_id;
      return propre;
    });
}

/** Trie les catégories pour que chaque parent soit inséré avant ses enfants. */
export function ordonnerCategories(lignes: Record<string, unknown>[]): Record<string, unknown>[] {
  const parId = new Map(lignes.map((l) => [String(l.id), l]));
  const vues = new Set<string>();
  const sortie: Record<string, unknown>[] = [];
  const visiter = (l: Record<string, unknown>, profondeur: number) => {
    const id = String(l.id);
    if (vues.has(id) || profondeur > 300) return;
    const parent = l.parent_id ? parId.get(String(l.parent_id)) : undefined;
    if (parent) visiter(parent, profondeur + 1);
    vues.add(id);
    sortie.push(l);
  };
  for (const l of lignes) visiter(l, 0);
  return sortie;
}
