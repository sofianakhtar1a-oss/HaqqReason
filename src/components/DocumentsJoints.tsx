import Link from "next/link";
import { Download } from "lucide-react";
import { formatTaille, TYPES_FICHIERS } from "@/lib/fichiers";
import type { FichierResume } from "@/lib/fichiers-donnees";
import { IconeFichier } from "./IconeFichier";

/** Documents d'un article ou d'une catégorie, côté lecteur. */
export function DocumentsJoints({ fichiers, titre = "Documents joints" }: { fichiers: FichierResume[]; titre?: string }) {
  if (fichiers.length === 0) return null;
  return (
    <section className="mt-12 max-w-3xl" aria-labelledby="titre-documents">
      <h2 id="titre-documents" className="text-2xl font-bold">
        {titre}
      </h2>
      <ul className="mt-5 grid gap-3">
        {fichiers.map((f) => {
          const famille = TYPES_FICHIERS[f.type_mime]?.famille ?? "document";
          const details = [TYPES_FICHIERS[f.type_mime]?.libelle, f.pages ? `${f.pages} pages` : null, formatTaille(f.taille)].filter(Boolean).join(", ");
          const contenu = (
            <>
              <span className="vignette-fichier">
                {famille === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/fichiers/${f.id}`} alt="" loading="lazy" />
                ) : (
                  <IconeFichier typeMime={f.type_mime} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{f.nom}</span>
                <span className="block text-sm text-encre-douce">{details}</span>
              </span>
            </>
          );
          return (
            <li key={f.id}>
              {famille === "document" ? (
                <a href={`/fichiers/${f.id}?telecharger`} className="carte-article flex items-center gap-4">
                  {contenu}
                  <Download className="size-5 text-encre-douce" aria-label="Télécharger" />
                </a>
              ) : (
                <Link href={`/explorer/document/${f.id}`} className="carte-article flex items-center gap-4">
                  {contenu}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
