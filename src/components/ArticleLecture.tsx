import Link from "next/link";
import { BookMarked, Compass, Link2, Milestone } from "lucide-react";
import type { DonneesSources } from "@/lib/sources";
import type { ArticleCourt } from "@/lib/navigation-donnees";
import { NoterVisite } from "./lecture/NoterVisite";
import { minutesDeLecture } from "@/lib/document";
import type { LiensResolus } from "@/lib/liens";
import { sommaireDuDocument } from "@/lib/sommaire";
import { BarreLecture } from "./lecture/BarreLecture";
import { Sommaire } from "./lecture/Sommaire";
import { RenduDocument } from "./RenduDocument";

type Props = {
  id: string;
  titre: string;
  resume: string;
  contenu: unknown;
  etiquettes: string[];
  misAJour: string;
  liens?: LiensResolus;
  retroliens?: { id: string; titre: string; resume: string }[];
  sources?: DonneesSources;
  prerequis?: ArticleCourt[];
  suites?: ArticleCourt[];
  lies?: ArticleCourt[];
  aussiDans?: { id: string; titre: string }[];
  /** Aperçu du créateur : pas de favoris ni de statistiques. */
  apercu?: boolean;
  apres?: React.ReactNode;
};

/** La page de lecture d'un article, identique pour le lecteur et pour l'aperçu du créateur. */
function ListeArticles({ titre, icone: Icone, articles, id }: { titre: string; icone: typeof Link2; articles: ArticleCourt[]; id: string }) {
  if (articles.length === 0) return null;
  return (
    <section className="lecture masque-immersif mt-12" aria-labelledby={id}>
      <h2 id={id} className="flex items-center gap-2 text-xl font-bold">
        <Icone className="size-5 text-accent" aria-hidden="true" />
        {titre}
      </h2>
      <ul className="mt-4 grid gap-3">
        {articles.map((r) => (
          <li key={r.id}>
            <Link href={`/explorer/article/${r.id}`} className="verre block rounded-2xl p-4 hover:border-accent">
              <span className="font-semibold">{r.titre}</span>
              {r.resume && <span className="mt-1 line-clamp-2 block text-sm text-encre-douce">{r.resume}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ArticleLecture({ id, titre, resume, contenu, etiquettes, misAJour, liens, retroliens = [], sources, prerequis = [], suites = [], lies = [], aussiDans = [], apercu = false, apres }: Props) {
  const minutes = minutesDeLecture(contenu);
  const date = new Date(misAJour).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
  const sommaire = sommaireDuDocument(contenu);

  return (
    <div className="lecture-grille">
      <div className="min-w-0">
        <article className="lecture">
          <h1 className="text-[clamp(2.25rem,6vw,3.75rem)] font-extrabold">{titre}</h1>
          <p className="mt-4 text-encre-douce">
            {minutes === 1 ? "1 minute" : `${minutes} minutes`} de lecture, mis à jour le {date}
          </p>
          {!apercu && <BarreLecture id={id} titre={titre} resume={resume} lienPdf={`/explorer/article/${id}/imprimer`} />}
          {!apercu && <NoterVisite id={id} titre={titre} />}
          {aussiDans.length > 0 && (
            <p className="mt-3 text-sm text-encre-douce">
              Aussi classé dans :{" "}
              {aussiDans.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && ", "}
                  <Link href={`/explorer/categorie/${c.id}`} className="underline underline-offset-4 hover:text-encre">
                    {c.titre}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {resume && <p className="mt-8 border-l-2 border-accent pl-5 text-xl leading-relaxed text-encre-douce">{resume}</p>}
          {prerequis.length > 0 && (
            <nav className="prerequis-encart masque-immersif" aria-label="À lire avant">
              <p className="flex items-center gap-2 font-semibold">
                <Milestone className="size-5 text-accent" aria-hidden="true" />
                À lire avant, pour bien comprendre
              </p>
              <ol>
                {prerequis.map((p) => (
                  <li key={p.id}>
                    <Link href={`/explorer/article/${p.id}`}>{p.titre}</Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <Sommaire entrees={sommaire} />

          <div className="lecture-corps mt-10">
            <RenduDocument document={contenu} liens={liens} sources={sources} />
          </div>

          {etiquettes.length > 0 && (
            <ul aria-label="Étiquettes" className="mt-12 flex flex-wrap gap-2 border-t border-trait pt-6">
              {etiquettes.map((nom) => (
                <li key={nom} className="etiquette-puce">
                  {nom}
                </li>
              ))}
            </ul>
          )}
        </article>

        {retroliens.length > 0 && (
          <section className="lecture masque-immersif mt-12" aria-labelledby="titre-retroliens">
            <h2 id="titre-retroliens" className="flex items-center gap-2 text-xl font-bold">
              <Link2 className="size-5 text-accent" aria-hidden="true" />
              Articles qui citent celui-ci
            </h2>
            <ul className="mt-4 grid gap-3">
              {retroliens.map((r) => (
                <li key={r.id}>
                  <Link href={`/explorer/article/${r.id}`} className="verre block rounded-2xl p-4 hover:border-accent">
                    <span className="font-semibold">{r.titre}</span>
                    {r.resume && <span className="mt-1 line-clamp-2 block text-sm text-encre-douce">{r.resume}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <ListeArticles titre="Pour aller plus loin" icone={Compass} articles={suites} id="titre-suites" />
        <ListeArticles titre="Articles liés" icone={BookMarked} articles={lies} id="titre-lies" />
        {apres}
      </div>
    </div>
  );
}
