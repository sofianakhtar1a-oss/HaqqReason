"use client";

import { BadgeStatut } from "@/components/BadgeStatut";
import { Dossier } from "@/components/Dossier";
import type { CategorieAdmin, Compteur } from "@/lib/contenu-admin";
import { ListeTriable } from "./Triable";

type Props = { categories: CategorieAdmin[]; compteurs: Record<string, Compteur> };

/** Les sous-catégories d'un niveau, sous forme de dossiers que l'on peut réordonner par glisser-déposer. */
export function ListeDossiers({ categories, compteurs }: Props) {
  return (
    <ListeTriable
      // Une nouvelle liste venue du serveur remplace l'ordre local.
      key={categories.map((c) => `${c.id}:${c.ordre}`).join(",")}
      table="categories"
      grille
      className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3"
      elements={categories}
      rendre={(c) => {
        const compte = compteurs[c.id] ?? { sous_categories: 0, articles: 0 };
        return (
          <Dossier
            href={`/createur/categorie/${c.id}`}
            titre={c.titre}
            description={c.description}
            icone={c.icone}
            sousCategories={compte.sous_categories}
            articles={compte.articles}
            badge={<BadgeStatut statut={c.statut} />}
          />
        );
      }}
    />
  );
}
