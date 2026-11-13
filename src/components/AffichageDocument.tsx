import { Download } from "lucide-react";
import type { Annotation } from "@/app/createur/fichiers-actions";
import { formatTaille, TYPES_FICHIERS } from "@/lib/fichiers";
import type { FichierDetail } from "@/lib/fichiers-donnees";
import { IconeFichier } from "./IconeFichier";
import { LecteurPdf } from "./LecteurPdf";

/** Affiche un document selon son type : lecteur pour un PDF, image en grand, ou carte de téléchargement. */
export function AffichageDocument({
  fichier,
  annotations,
  page,
  termes,
  createur = false,
}: {
  fichier: FichierDetail;
  annotations: Annotation[];
  page: number;
  termes: string[];
  createur?: boolean;
}) {
  const famille = TYPES_FICHIERS[fichier.type_mime]?.famille ?? "document";
  if (famille === "pdf") {
    return <LecteurPdf fichierId={fichier.id} nom={fichier.nom} pageInitiale={page} termes={termes} annotations={annotations} createur={createur} />;
  }
  if (famille === "image") {
    return (
      <figure className="image-bloc" data-largeur="large">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/fichiers/${fichier.id}`} alt={fichier.nom} />
        <figcaption>
          <a href={`/fichiers/${fichier.id}?telecharger`} className="lien-document">
            Télécharger l&apos;image ({formatTaille(fichier.taille)})
          </a>
        </figcaption>
      </figure>
    );
  }
  return (
    <a href={`/fichiers/${fichier.id}?telecharger`} className="verre panneau flex max-w-xl items-center gap-5 hover:border-or">
      <span className="vignette-fichier !size-16">
        <IconeFichier typeMime={fichier.type_mime} className="size-8" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{fichier.nom}</span>
        <span className="block text-sm text-encre-douce">
          {TYPES_FICHIERS[fichier.type_mime]?.libelle}, {formatTaille(fichier.taille)}
        </span>
      </span>
      <Download className="size-6 text-accent" aria-label="Télécharger" />
    </a>
  );
}
