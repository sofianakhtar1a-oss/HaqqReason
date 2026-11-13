import Link from "next/link";

/** Liens « page précédente / suivante » pour les longues listes d'articles. */
export function Pagination({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  const lien = (n: number) => (n === 1 ? base : `${base}?page=${n}`);
  return (
    <nav aria-label="Pages" className="mt-8 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={lien(page - 1)} className="bouton bouton-discret">
          Page précédente
        </Link>
      ) : (
        <span />
      )}
      <span className="text-encre-douce">
        Page {page} sur {pages}
      </span>
      {page < pages ? (
        <Link href={lien(page + 1)} className="bouton bouton-discret">
          Page suivante
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/** Lit « ?page=3 » en refusant toute valeur absurde. */
export function lirePage(valeur: string | string[] | undefined): number {
  const n = Number.parseInt(Array.isArray(valeur) ? (valeur[0] ?? "") : (valeur ?? ""), 10);
  return Number.isFinite(n) && n >= 1 && n <= 100_000 ? n : 1;
}
