import "server-only";
import type { BlocAdmin, NoeudArbre } from "@/lib/contenu-admin";
import type { GroupeDestinations } from "./FormulaireDeplacement";

const INDENT = "    ";

/**
 * Construit la liste des destinations possibles.
 * - Pour une catégorie : la racine de chaque bloc, et toutes les catégories sauf elle-même et ses descendantes.
 * - Pour un article : toutes les catégories.
 */
export function destinations(blocs: BlocAdmin[], arbre: NoeudArbre[], exclure: { categorie?: string; racines: boolean }): GroupeDestinations[] {
  // Repère la catégorie à exclure et tout son sous-arbre (l'arbre est trié en profondeur d'abord).
  const exclues = new Set<string>();
  if (exclure.categorie) {
    let dedans = false;
    let profondeurDepart = 0;
    for (const n of arbre) {
      if (n.id === exclure.categorie) {
        dedans = true;
        profondeurDepart = n.profondeur;
        exclues.add(n.id);
        continue;
      }
      if (dedans && n.profondeur > profondeurDepart) exclues.add(n.id);
      else dedans = false;
    }
  }

  return blocs.map((bloc) => {
    const options: GroupeDestinations["options"] = [];
    if (exclure.racines) options.push({ valeur: `bloc:${bloc.id}`, libelle: `${bloc.titre} (premier niveau)` });
    for (const n of arbre) {
      if (n.bloc_id !== bloc.id || exclues.has(n.id)) continue;
      options.push({ valeur: `categorie:${n.id}`, libelle: `${INDENT.repeat(n.profondeur + 1)}${n.titre}` });
    }
    if (options.length === 0) options.push({ valeur: `vide:${bloc.id}`, libelle: "Aucune catégorie", desactive: true });
    return { groupe: bloc.titre, options };
  });
}
