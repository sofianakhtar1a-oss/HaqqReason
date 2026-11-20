import { extrasDe, type DocumentAtelier } from "@/lib/atelier/modele";
import type { Tri } from "@/lib/atelier/preferences";

/** Tous les dossiers connus (ceux des préférences et ceux des documents), parents compris, triés. */
export function tousLesDossiers(documents: DocumentAtelier[], preferes: string[]): string[] {
  const tous = new Set<string>();
  const ajouter = (chemin: string) => {
    const parties = chemin.split("/").filter(Boolean);
    for (let i = 1; i <= parties.length; i++) tous.add(parties.slice(0, i).join("/"));
  };
  for (const d of preferes) ajouter(d);
  for (const doc of documents) if (doc.dossier) ajouter(doc.dossier);
  return [...tous].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

export function trierDocuments(documents: DocumentAtelier[], tri: Tri): DocumentAtelier[] {
  const liste = [...documents];
  const cmp: Record<Tri, (a: DocumentAtelier, b: DocumentAtelier) => number> = {
    modification: (a, b) => b.modifie.localeCompare(a.modifie),
    creation: (a, b) => b.cree.localeCompare(a.cree),
    titre: (a, b) => a.titre.localeCompare(b.titre, "fr", { sensitivity: "base", numeric: true }),
    longueur: (a, b) => b.mots - a.mots,
  };
  // Les documents épinglés passent devant, chacun gardant ensuite l'ordre choisi.
  return liste.sort((a, b) => Number(extrasDe(b).epingle) - Number(extrasDe(a).epingle) || cmp[tri](a, b));
}

export type Vue = "documents" | "archives" | "corbeille";

/** Les documents d'une vue : actifs, archivés ou à la corbeille. */
export function documentsDeLaVue(documents: DocumentAtelier[], vue: Vue): DocumentAtelier[] {
  return documents.filter((d) => {
    const x = extrasDe(d);
    if (vue === "corbeille") return x.corbeille !== null;
    if (x.corbeille !== null) return false;
    return vue === "archives" ? x.archive : !x.archive;
  });
}

export type NoeudDossier = { chemin: string; nom: string; enfants: NoeudDossier[]; documents: DocumentAtelier[] };

/** L'arbre des dossiers d'une liste de documents (la racine porte les documents sans dossier). */
export function arbreDossiers(documents: DocumentAtelier[], dossiers: string[]): NoeudDossier {
  const racine: NoeudDossier = { chemin: "", nom: "", enfants: [], documents: [] };
  const index = new Map<string, NoeudDossier>([["", racine]]);
  const noeud = (chemin: string): NoeudDossier => {
    const existant = index.get(chemin);
    if (existant) return existant;
    const parties = chemin.split("/");
    const parent = noeud(parties.slice(0, -1).join("/"));
    const cree: NoeudDossier = { chemin, nom: parties[parties.length - 1], enfants: [], documents: [] };
    parent.enfants.push(cree);
    index.set(chemin, cree);
    return cree;
  };
  for (const d of dossiers) noeud(d);
  for (const doc of documents) noeud(doc.dossier || "").documents.push(doc);
  const trier = (n: NoeudDossier) => {
    n.enfants.sort((a, b) => a.nom.localeCompare(b.nom, "fr", { sensitivity: "base", numeric: true }));
    n.enfants.forEach(trier);
  };
  trier(racine);
  return racine;
}

/** Nombre de documents dans un dossier et ses sous-dossiers. */
export function compte(n: NoeudDossier): number {
  return n.documents.length + n.enfants.reduce((s, e) => s + compte(e), 0);
}
