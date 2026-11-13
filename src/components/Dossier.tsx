import Link from "next/link";
import { IconeCategorie } from "./IconeCategorie";

type Props = {
  href: string;
  titre: string;
  description?: string;
  icone: string;
  sousCategories: number;
  articles: number;
  /** Badge facultatif (mode créateur : brouillon ou publié). */
  badge?: React.ReactNode;
};

function contenu(sousCategories: number, articles: number): string {
  const morceaux: string[] = [];
  if (sousCategories > 0) morceaux.push(sousCategories === 1 ? "1 sous-catégorie" : `${sousCategories} sous-catégories`);
  if (articles > 0) morceaux.push(articles === 1 ? "1 article" : `${articles} articles`);
  return morceaux.length > 0 ? morceaux.join(", ") : "Vide pour l'instant";
}

/** Une catégorie, présentée comme un dossier à onglet. */
export function Dossier({ href, titre, description, icone, sousCategories, articles, badge }: Props) {
  return (
    <Link href={href} className="dossier">
      <div className="flex items-start justify-between gap-3">
        <span className="dossier-icone">
          <IconeCategorie icone={icone} />
        </span>
        {badge}
      </div>
      <h3 className="mt-4 text-xl font-bold">{titre}</h3>
      {description && <p className="mt-2 line-clamp-3 text-encre-douce">{description}</p>}
      <p className="mt-auto pt-5 text-sm font-semibold text-accent">{contenu(sousCategories, articles)}</p>
    </Link>
  );
}
