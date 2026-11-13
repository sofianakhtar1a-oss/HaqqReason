import { Globe, Play } from "lucide-react";
import { domaine } from "@/lib/liens-web";

export type DonneesCarteLien = { url: string; titre: string; description: string; site: string; auteur: string; genre: string; video: string; liste: string; image: string };

/**
 * Carte d'un lien web ou YouTube, à la manière de Notion : vignette, titre, description et adresse.
 * Toute la carte ouvre le lien dans un nouvel onglet. La vignette vient de l'espace privé de HaqqReason.
 */
export function CarteLien({ d, actif = true }: { d: DonneesCarteLien; actif?: boolean }) {
  const youtube = d.genre === "youtube";
  const playlist = youtube && d.liste && !d.video;
  const contenu = (
    <>
      <span className="carte-lien-image" data-vide={!d.image || undefined}>
        {d.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/fichiers/${d.image}`} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="carte-lien-sans-image" aria-hidden="true">
            {youtube ? <Play className="size-10" /> : <Globe className="size-10" />}
          </span>
        )}
        {youtube && (
          <span className="carte-lien-lecture" aria-hidden="true">
            <Play className="size-6" fill="currentColor" />
          </span>
        )}
        {playlist && <span className="carte-lien-pastille">Playlist</span>}
      </span>
      <span className="carte-lien-texte">
        <span className="carte-lien-site">
          {youtube ? (
            <span className="carte-lien-logo-yt" aria-hidden="true">
              <Play className="size-3" fill="currentColor" />
            </span>
          ) : (
            <Globe className="size-4" aria-hidden="true" />
          )}
          {youtube ? (d.auteur ? `${d.auteur} sur YouTube` : "YouTube") : d.site || domaine(d.url)}
        </span>
        <span className="carte-lien-titre">{d.titre || d.url}</span>
        {d.description && <span className="carte-lien-description">{d.description}</span>}
        <span className="carte-lien-url">{d.url.replace(/^https?:\/\/(www\.)?/, "")}</span>
      </span>
    </>
  );
  if (!actif) return <span className="carte-lien" data-genre={d.genre}>{contenu}</span>;
  return (
    <a className="carte-lien" data-genre={d.genre} href={d.url} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${d.titre || d.url} (${youtube ? "YouTube" : domaine(d.url)}, s'ouvre dans un nouvel onglet)`}>
      {contenu}
    </a>
  );
}
