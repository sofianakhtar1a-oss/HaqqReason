/*
 * Les deux espaces de la bibliothèque. Ils partagent la même mécanique
 * (blocs, catégories, articles, brouillons, corbeille) ; seuls le contenu
 * et la porte d'entrée changent.
 */

export type Espace = "preuves" | "islam";

export const ESPACES: Record<Espace, { titre: string; public: string; libellePublic: string; createur: string; libelleCreateur: string }> = {
  preuves: {
    titre: "Les preuves de la véracité de l'islam",
    public: "/explorer",
    libellePublic: "La bibliothèque",
    createur: "/createur/bibliotheque",
    libelleCreateur: "Les preuves",
  },
  islam: {
    titre: "L'Islam authentique",
    public: "/islam",
    libellePublic: "L'Islam authentique",
    createur: "/createur/islam",
    libelleCreateur: "L'Islam authentique",
  },
};

export function espaceValide(valeur: unknown): Espace {
  return valeur === "islam" ? "islam" : "preuves";
}

/** Première étape du fil d'Ariane, selon l'espace du bloc. */
export function racineEspace(espace: unknown, mode: "public" | "createur"): { href: string; libelle: string } {
  const e = ESPACES[espaceValide(espace)];
  return mode === "public" ? { href: e.public, libelle: e.libellePublic } : { href: e.createur, libelle: e.libelleCreateur };
}

/**
 * Début du fil d'Ariane jusqu'au bloc compris. « L'Islam authentique » n'a qu'un bloc, invisible :
 * ses catégories sont rangées directement sous le module.
 */
export function etapesBloc(bloc: { espace: unknown; slug: string; titre: string }, mode: "public" | "createur"): { href: string; libelle: string }[] {
  const racine = racineEspace(bloc.espace, mode);
  if (espaceValide(bloc.espace) === "islam") return [racine];
  return [racine, { href: mode === "public" ? `/explorer/${bloc.slug}` : `/createur/bloc/${bloc.slug}`, libelle: bloc.titre }];
}
