import "server-only";
import { sessionCreateur } from "./session";
import { dbAdmin, dbPublic } from "./supabase";
import { estUuid } from "./validation";

/*
 * Recherche côté serveur. Un lecteur passe par la clé publique (la base ne lui montre que le contenu publié) ;
 * le créateur connecté peut inclure ses brouillons.
 */

export const TYPES_RECHERCHE = ["article", "document", "dossier", "verset", "hadith", "objection"] as const;
export const TRIS = ["pertinence", "date", "titre"] as const;

export type Criteres = {
  q: string;
  blocs: string[];
  categories: string[];
  types: string[];
  etiquettes: string[];
  depuis: string | null;
  jusqua: string | null;
  statut: "tous" | "publie" | "brouillon";
  tri: (typeof TRIS)[number];
  page: number;
};

export type Resultat = {
  type: "article" | "verset" | "hadith" | "objection" | "document" | "page" | "dossier";
  id: string;
  page: number | null;
  titre: string;
  fenetre: string;
  bloc_id: string | null;
  categorie_id: string | null;
  chemin: string;
  statut: "publie" | "brouillon";
  date: string;
  approchant: boolean;
};

export const PAR_PAGE = 20;

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function liste(valeur: string | null, filtre: (v: string) => boolean, max = 500): string[] {
  if (!valeur) return [];
  return [...new Set(valeur.split(",").map((v) => v.trim()).filter(filtre))].slice(0, max);
}

/** Lit les critères depuis l'adresse de la page (?q=…&types=…). Toute valeur inattendue est ignorée. */
export function lireCriteres(p: URLSearchParams): Criteres {
  const tri = p.get("tri");
  const statut = p.get("statut");
  const page = Number.parseInt(p.get("page") ?? "1", 10);
  return {
    q: (p.get("q") ?? "").slice(0, 200),
    blocs: liste(p.get("blocs"), estUuid, 3),
    categories: liste(p.get("categories"), estUuid),
    types: liste(p.get("types"), (t) => (TYPES_RECHERCHE as readonly string[]).includes(t), 6),
    etiquettes: liste(p.get("etiquettes"), (e) => e.length > 0 && e.length <= 60, 30),
    depuis: DATE.test(p.get("depuis") ?? "") ? p.get("depuis") : null,
    jusqua: DATE.test(p.get("jusqua") ?? "") ? p.get("jusqua") : null,
    statut: statut === "publie" || statut === "brouillon" ? statut : "tous",
    tri: (TRIS as readonly string[]).includes(tri ?? "") ? (tri as Criteres["tri"]) : "pertinence",
    page: Number.isFinite(page) && page >= 1 && page <= 500 ? page : 1,
  };
}

export async function rechercher(c: Criteres, limite = PAR_PAGE): Promise<{ resultats: Resultat[]; total: number; createur: boolean; erreur: boolean }> {
  const createur = (await sessionCreateur()) !== null;
  const vide = !c.q.trim() && c.blocs.length + c.categories.length + c.etiquettes.length === 0 && !c.depuis && !c.jusqua && c.types.length === 0;
  if (vide) return { resultats: [], total: 0, createur, erreur: false };

  const base = createur ? dbAdmin() : dbPublic();
  const { data, error } = await base.rpc("rechercher", {
    p_requete: c.q,
    p_blocs: c.blocs.length ? c.blocs : null,
    p_categories: c.categories.length ? c.categories : null,
    p_types: c.types.length ? c.types : null,
    p_etiquettes: c.etiquettes.length ? c.etiquettes : null,
    p_depuis: c.depuis,
    p_jusqua: c.jusqua,
    p_brouillons: createur && c.statut !== "publie",
    p_tri: c.tri,
    p_limite: limite,
    p_decalage: (c.page - 1) * limite,
  });
  if (error) return { resultats: [], total: 0, createur, erreur: true };

  let lignes = (data ?? []) as (Omit<Resultat, "chemin"> & { total: number })[];

  // Statistique anonyme : les sujets cherchés sans résultat exact indiquent quels articles écrire ensuite.
  if (!createur && c.page === 1 && c.q.trim().length >= 3 && (lignes.length === 0 || lignes.every((l) => l.approchant))) {
    const { after } = await import("next/server");
    after(async () => {
      await dbAdmin().rpc("noter_recherche_vide", { p_terme: c.q });
    });
  }
  if (createur && c.statut === "brouillon") lignes = lignes.filter((l) => l.statut === "brouillon");

  // Fil d'Ariane de chaque résultat, en une seule requête.
  const categories = [...new Set(lignes.map((l) => l.categorie_id).filter((x): x is string => Boolean(x)))];
  const chemins = new Map<string, string>();
  if (categories.length > 0) {
    const { data: ch } = await base.rpc("chemins_categories", { p_categories: categories });
    for (const l of (ch ?? []) as { categorie_id: string; chemin: string | null }[]) chemins.set(l.categorie_id, l.chemin ?? "");
  }
  return {
    resultats: lignes.map((ligne) => {
      const { total, ...l } = ligne;
      void total;
      return { ...l, chemin: l.categorie_id ? (chemins.get(l.categorie_id) ?? "") : "" };
    }),
    total: Number(lignes[0]?.total ?? 0),
    createur,
    erreur: false,
  };
}

export type ArbreFiltres = {
  blocs: { id: string; titre: string; accent: string }[];
  categories: { id: string; titre: string; parent_id: string | null; bloc_id: string }[];
  etiquettes: { nom: string; cle: string }[];
};

/** Arborescence et étiquettes proposées comme filtres (le lecteur ne voit que ce qui est publié). */
export async function donneesFiltres(createur: boolean): Promise<ArbreFiltres> {
  const base = createur ? dbAdmin() : dbPublic();
  const [blocs, etiquettes] = await Promise.all([
    base.from("blocs").select("id, titre, accent").order("ordre"),
    base.from("etiquettes").select("nom, cle").order("nom").limit(500),
  ]);
  let categories: ArbreFiltres["categories"] = [];
  if (createur) {
    const { arbreCategories } = await import("./contenu-admin");
    categories = (await arbreCategories()).map(({ id, titre, parent_id, bloc_id }) => ({ id, titre, parent_id, bloc_id }));
  } else {
    const { data } = await dbPublic().from("categories").select("id, titre, parent_id, bloc_id").order("ordre").order("created_at").limit(5000);
    categories = (data ?? []) as ArbreFiltres["categories"];
  }
  return { blocs: (blocs.data ?? []) as ArbreFiltres["blocs"], categories, etiquettes: (etiquettes.data ?? []) as ArbreFiltres["etiquettes"] };
}
