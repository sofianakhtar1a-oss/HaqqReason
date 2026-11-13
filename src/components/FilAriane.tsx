import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Etape = { href: string; libelle: string };

/**
 * « Bloc › Catégorie › Sous-catégorie ». La dernière étape est la page en cours.
 * Sur téléphone, seul un lien de retour vers le niveau parent est affiché, pour ne pas occuper tout l'écran.
 */
export function FilAriane({ etapes }: { etapes: Etape[] }) {
  const parent = etapes.length > 1 ? etapes[etapes.length - 2] : null;
  return (
    <nav aria-label="Fil d'Ariane" className="sans-impression">
      {parent && (
        <Link href={parent.href} className="inline-flex max-w-full items-center gap-1 font-semibold text-encre-douce hover:text-encre sm:hidden">
          <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{parent.libelle}</span>
        </Link>
      )}
      <ol className="hidden flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.9375rem] text-encre-douce sm:flex">
        {etapes.map((etape, i) => {
          const derniere = i === etapes.length - 1;
          return (
            <li key={etape.href} className="inline-flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden="true" />}
              {derniere ? (
                <span aria-current="page" className="font-semibold text-encre">
                  {etape.libelle}
                </span>
              ) : (
                <Link href={etape.href} className="hover:text-encre hover:underline hover:underline-offset-4">
                  {etape.libelle}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
