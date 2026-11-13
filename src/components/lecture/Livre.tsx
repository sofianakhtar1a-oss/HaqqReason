import { RenduDocument } from "@/components/RenduDocument";
import type { ArticleExport, SectionExport } from "@/lib/export";
import { ImprimerAuto } from "./ImprimerAuto";

/*
 * Mise en page « livre » commune à l'export PDF d'un article et d'une catégorie :
 * page de titre, sommaire, puis chaque article sur une nouvelle page. Le navigateur produit le PDF
 * (« Enregistrer au format PDF » dans la fenêtre d'impression), sans service extérieur.
 */

function dateLongue(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

function ArticleLivre({ a, niveau }: { a: ArticleExport; niveau: "h1" | "h2" }) {
  const Titre = niveau;
  return (
    <section className="livre-article" id={`article-${a.id}`}>
      <Titre className="livre-titre-article">{a.titre}</Titre>
      <p className="livre-meta">Mis à jour le {dateLongue(a.updated_at)}</p>
      {a.resume && <p className="livre-resume">{a.resume}</p>}
      <div className="lecture-corps livre-corps">
        <RenduDocument document={a.contenu} liens={a.liens} sources={a.sources} />
      </div>
    </section>
  );
}

type Props = {
  accent: string;
  bloc: string;
  titre: string;
  sousTitre?: string;
  sections: SectionExport[];
  tronque?: boolean;
  url: string;
};

export function Livre({ accent, bloc, titre, sousTitre, sections, tronque, url }: Props) {
  const articles = sections.flatMap((s) => s.articles);
  const unSeul = articles.length === 1 && sections.length === 1 && sections[0].chemin.length === 0;
  const aujourdhui = dateLongue(new Date().toISOString());

  return (
    <div data-accent={accent}>
      <ImprimerAuto />
      <div className="feuille-impression livre">
        <header className="livre-couverture">
          <p className="livre-marque">HaqqReason</p>
          <p className="livre-bloc">{bloc}</p>
          <h1 className="livre-titre">{titre}</h1>
          {sousTitre && <p className="livre-sous-titre">{sousTitre}</p>}
          <p className="livre-pied-couverture">
            {unSeul ? "Article" : `${articles.length} article${articles.length > 1 ? "s" : ""}`}, exporté le {aujourdhui}
            <br />
            {url}
          </p>
        </header>

        {!unSeul && articles.length > 1 && (
          <nav className="livre-sommaire" aria-label="Sommaire">
            <h2>Sommaire</h2>
            {sections.map((s) => (
              <div key={s.id}>
                {s.chemin.length > 1 && <p className="livre-sommaire-section">{s.chemin.slice(1).join(" › ")}</p>}
                <ol>
                  {s.articles.map((a) => (
                    <li key={a.id}>
                      <a href={`#article-${a.id}`}>{a.titre}</a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </nav>
        )}

        {unSeul ? (
          <ArticleLivre a={articles[0]} niveau="h2" />
        ) : (
          sections.map((s) => (
            <div key={s.id}>
              {s.chemin.length > 1 && <p className="livre-section">{s.chemin.slice(1).join(" › ")}</p>}
              {s.articles.map((a) => (
                <ArticleLivre key={a.id} a={a} niveau="h2" />
              ))}
            </div>
          ))
        )}
        {articles.length === 0 && <p>Cette catégorie ne contient encore aucun article publié.</p>}
        {tronque && <p className="livre-meta">Export limité aux 300 premiers articles.</p>}
      </div>
    </div>
  );
}
