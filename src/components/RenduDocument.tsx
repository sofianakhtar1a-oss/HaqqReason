import { Fragment, type ReactNode } from "react";
import { partiesLien, RE_LIEN_INTERNE, type LiensResolus } from "@/lib/liens";
import { DEGRES_HADITH, ENCADRES, libelleDe, lienSur, LIMITES_DOCUMENT, MARQUES, NOEUDS, type NoeudJSON } from "@/lib/document-schema";
import type { DonneesLogique } from "@/lib/logique/bloc";
import type { DonneesSchema } from "@/lib/schemas/modele";
import { sophismeParCle } from "@/lib/sophismes";
import { localisation, partiesReference, SOURCES_VIDES, statutSource, type DonneesSources, type OuvrageAffiche } from "@/lib/sources";
import { CarteLien } from "./CarteLien";
import { RenduLogique } from "./logique/RenduLogique";
import { SchemaInteractif } from "./schemas/SchemaInteractif";

/*
 * Affichage d'un article pour le lecteur.
 * Le document est transformé en éléments React à partir d'une liste blanche : aucun HTML brut n'est
 * injecté dans la page. Un élément inconnu ou un lien dangereux est simplement ignoré, même si la base
 * de données contenait un document altéré.
 */

type Contexte = {
  liens: LiensResolus;
  bibliotheque: DonneesSources;
  /** Ouvrages cités, dans l'ordre de première citation, avec les pages citées. */
  cites: { ouvrage: string; pages: Set<string> }[];
  notes: string[];
  sources: Record<string, string>[];
  titres: number;
};

const ALIGNEMENTS: Record<string, string> = { left: "text-left", center: "text-center", right: "text-right", justify: "text-justify" };

function chaine(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function classeAlignement(attrs: NoeudJSON["attrs"]): string | undefined {
  return ALIGNEMENTS[chaine(attrs?.textAlign)];
}

/** Remplace [[Titre]] par un lien vers l'article (ou une mention discrète si l'article n'existe pas encore). */
function avecLiensInternes(texte: string, ctx: Contexte, cle: string): ReactNode {
  if (!texte.includes("[[")) return texte;
  const morceaux: ReactNode[] = [];
  let position = 0;
  let i = 0;
  for (const m of texte.matchAll(RE_LIEN_INTERNE)) {
    if (m.index > position) morceaux.push(texte.slice(position, m.index));
    const { cible, texte: affiche } = partiesLien(m[1]);
    const article = ctx.liens[cible];
    morceaux.push(
      article ? (
        <a key={`${cle}-l${i++}`} href={`/explorer/article/${article.id}`} className="lien-interne" title={article.titre}>
          {affiche}
        </a>
      ) : (
        <span key={`${cle}-l${i++}`} className="lien-interne-absent" title="Article pas encore écrit">
          {affiche}
        </span>
      ),
    );
    position = m.index + m[0].length;
  }
  if (position < texte.length) morceaux.push(texte.slice(position));
  return morceaux;
}

function appliquerMarques(texte: ReactNode, marques: NoeudJSON["marks"], cle: string): ReactNode {
  let element: ReactNode = texte;
  for (const m of marques ?? []) {
    if (!Object.hasOwn(MARQUES, m.type)) continue;
    const a = m.attrs ?? {};
    switch (m.type) {
      case "bold":
        element = <strong>{element}</strong>;
        break;
      case "italic":
        element = <em>{element}</em>;
        break;
      case "strike":
        element = <s>{element}</s>;
        break;
      case "superscript":
        element = <sup>{element}</sup>;
        break;
      case "subscript":
        element = <sub>{element}</sub>;
        break;
      case "link": {
        const href = lienSur(a.href);
        if (href) {
          const externe = /^(https?:|mailto:)/.test(href);
          element = (
            <a href={href} {...(externe ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})} className="lien-document">
              {element}
            </a>
          );
        }
        break;
      }
      case "surligne":
        element = <mark className={`fluo fluo-${MARQUES.surligne.couleur(a.couleur)}`}>{element}</mark>;
        break;
      case "souligne": {
        const style = MARQUES.souligne.style(a.style);
        const couleur = MARQUES.souligne.couleur(a.couleur);
        element = <span className={`souligne souligne-${style}${couleur ? ` souligne-${couleur}` : ""}`}>{element}</span>;
        break;
      }
      case "couleur":
        element = <span className={`texte-${MARQUES.couleur.couleur(a.couleur)}`}>{element}</span>;
        break;
      case "effet":
        element = <span className={`effet-${MARQUES.effet.type(a.type)}`}>{element}</span>;
        break;
    }
  }
  return <Fragment key={cle}>{element}</Fragment>;
}

function enfants(n: NoeudJSON, ctx: Contexte, profondeur: number): ReactNode[] {
  return (n.content ?? []).map((e, i) => rendre(e, ctx, profondeur + 1, `${profondeur}-${i}`));
}

function rendre(n: NoeudJSON, ctx: Contexte, profondeur: number, cle: string): ReactNode {
  if (profondeur > LIMITES_DOCUMENT.profondeur || !Object.hasOwn(NOEUDS, n.type)) return null;
  const c = () => enfants(n, ctx, profondeur);
  const a = n.attrs ?? {};

  switch (n.type) {
    case "text":
      return appliquerMarques(avecLiensInternes(chaine(n.text), ctx, cle), n.marks, cle);
    case "hardBreak":
      return <br key={cle} />;
    case "paragraph":
      return (
        <p key={cle} className={classeAlignement(a)}>
          {c()}
        </p>
      );
    case "heading": {
      ctx.titres++;
      const niveau = NOEUDS.heading.level(a.level) as 2 | 3 | 4;
      const Balise = `h${niveau}` as const;
      return (
        <Balise key={cle} id={`section-${ctx.titres}`} className={classeAlignement(a)}>
          {c()}
        </Balise>
      );
    }
    case "bulletList":
      return <ul key={cle}>{c()}</ul>;
    case "orderedList":
      return (
        <ol key={cle} start={NOEUDS.orderedList.start(a.start) as number}>
          {c()}
        </ol>
      );
    case "listItem":
      return <li key={cle}>{c()}</li>;
    case "taskList":
      return (
        <ul key={cle} className="liste-taches">
          {c()}
        </ul>
      );
    case "taskItem":
      return (
        <li key={cle} data-coche={a.checked === true}>
          <input type="checkbox" checked={a.checked === true} disabled aria-label={a.checked === true ? "Fait" : "À faire"} />
          <div>{c()}</div>
        </li>
      );
    case "blockquote":
      return <blockquote key={cle}>{c()}</blockquote>;
    case "horizontalRule":
      return <hr key={cle} />;
    case "encadre": {
      const type = chaine(NOEUDS.encadre.type(a.type));
      return (
        <aside key={cle} className="encadre" data-encadre={type} data-libelle={libelleDe(ENCADRES, type)}>
          {c()}
        </aside>
      );
    }
    case "objectionReponse":
      return (
        <section key={cle} className="objection-reponse">
          {c()}
        </section>
      );
    case "objection":
      return (
        <div key={cle} className="objection" data-libelle="Objection">
          {c()}
        </div>
      );
    case "reponse":
      return (
        <div key={cle} className="reponse" data-libelle="Réponse">
          {c()}
        </div>
      );
    case "comparaison":
      return (
        <div key={cle} className="comparaison">
          {c()}
        </div>
      );
    case "colonne":
      return (
        <div key={cle} className="colonne">
          {c()}
        </div>
      );
    case "accordeon": {
      const [titre, corps] = n.content ?? [];
      return (
        <details key={cle} className="accordeon">
          <summary className="accordeon-titre">{titre ? enfants(titre, ctx, profondeur + 1) : null}</summary>
          <div className="accordeon-corps">{corps ? enfants(corps, ctx, profondeur + 1) : null}</div>
        </details>
      );
    }
    case "accordeonTitre":
    case "accordeonCorps":
      return <Fragment key={cle}>{c()}</Fragment>;
    case "frise":
      return (
        <ol key={cle} className="frise">
          {c()}
        </ol>
      );
    case "evenement":
      return (
        <li key={cle} className="evenement">
          {c()}
        </li>
      );
    case "evenementDate":
      return (
        <p key={cle} className="evenement-date">
          {c()}
        </p>
      );
    case "verset": {
      const reference = chaine(NOEUDS.verset.reference(a.reference));
      const [arabe, traduction] = n.content ?? [];
      return (
        <figure key={cle} className="verset">
          {arabe && (
            <p className="verset-arabe" lang="ar" dir="rtl">
              {enfants(arabe, ctx, profondeur + 1)}
            </p>
          )}
          {traduction && <p className="verset-traduction">{enfants(traduction, ctx, profondeur + 1)}</p>}
          {reference && <figcaption>Coran, {reference}</figcaption>}
        </figure>
      );
    }
    case "hadith": {
      const recueil = chaine(NOEUDS.hadith.recueil(a.recueil));
      const numero = chaine(NOEUDS.hadith.numero(a.numero));
      const degre = chaine(NOEUDS.hadith.degre(a.degre));
      const [arabe, traduction] = n.content ?? [];
      return (
        <figure key={cle} className="hadith">
          {degre && (
            <span className="badge-degre" data-degre={degre}>
              {libelleDe(DEGRES_HADITH, degre)}
            </span>
          )}
          {arabe && (
            <p className="hadith-arabe" lang="ar" dir="rtl">
              {enfants(arabe, ctx, profondeur + 1)}
            </p>
          )}
          {traduction && <p className="hadith-traduction">{enfants(traduction, ctx, profondeur + 1)}</p>}
          {(recueil || numero) && <figcaption>{[recueil, numero ? `n° ${numero}` : ""].filter(Boolean).join(", ")}</figcaption>}
        </figure>
      );
    }
    case "versetArabe":
    case "versetTraduction":
    case "hadithArabe":
    case "hadithTraduction":
      return <Fragment key={cle}>{c()}</Fragment>;
    case "source": {
      const champs = {
        auteur: chaine(NOEUDS.source.auteur(a.auteur)),
        ouvrage: chaine(NOEUDS.source.ouvrage(a.ouvrage)),
        edition: chaine(NOEUDS.source.edition(a.edition)),
        page: chaine(NOEUDS.source.page(a.page)),
        lien: chaine(NOEUDS.source.lien(a.lien)),
      };
      if (!champs.auteur && !champs.ouvrage) return null;
      ctx.sources.push(champs);
      const numero = ctx.sources.length;
      return (
        <p key={cle} className="source-bloc" id={`source-${numero}`}>
          <span className="source-libelle">Source {numero}</span>
          <span>
            <Reference {...champs} />
          </span>
        </p>
      );
    }
    case "note": {
      const texte = chaine(NOEUDS.note.texte(a.texte)).trim();
      if (!texte) return null;
      ctx.notes.push(texte);
      const numero = ctx.notes.length;
      return (
        <sup key={cle} id={`appel-${numero}`} className="note-appel">
          <a href={`#note-${numero}`} aria-label={`Note ${numero}`}>
            {numero}
          </a>
        </sup>
      );
    }
    case "image": {
      const fichier = chaine(NOEUDS.image.fichier(a.fichier));
      if (!fichier) return null;
      const legende = chaine(NOEUDS.image.legende(a.legende));
      return (
        <figure key={cle} className="image-bloc" data-largeur={chaine(NOEUDS.image.largeur(a.largeur))}>
          {/* Fichier privé délivré par l'application : l'optimiseur d'images n'y a pas accès. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/fichiers/${fichier}`} alt={chaine(NOEUDS.image.alt(a.alt))} loading="lazy" decoding="async" />
          {legende && <figcaption>{legende}</figcaption>}
        </figure>
      );
    }
    case "documentPdf": {
      const fichier = chaine(NOEUDS.documentPdf.fichier(a.fichier));
      if (!fichier) return null;
      const page = NOEUDS.documentPdf.page(a.page) as number;
      return (
        <p key={cle}>
          <a href={`/explorer/document/${fichier}${page > 1 ? `?page=${page}` : ""}`} className="document-bloc">
            <span className="source-libelle">Document PDF</span>
            <span>
              {chaine(NOEUDS.documentPdf.nom(a.nom)) || "Lire le document"}
              {page > 1 ? `, à partir de la page ${page}` : ""}
            </span>
          </a>
        </p>
      );
    }
    case "lienCarte": {
      const url = chaine(NOEUDS.lienCarte.url(a.url));
      if (!url) return null;
      const champ = (k: keyof typeof NOEUDS.lienCarte) => chaine(NOEUDS.lienCarte[k](a[k]));
      return (
        <div key={cle} className="carte-lien-conteneur">
          <CarteLien d={{ url, titre: champ("titre"), description: champ("description"), site: champ("site"), auteur: champ("auteur"), genre: champ("genre"), video: champ("video"), liste: champ("liste"), image: champ("image") }} />
        </div>
      );
    }
    case "schema":
      return <SchemaInteractif key={cle} donnees={NOEUDS.schema.donnees(a.donnees) as DonneesSchema} />;
    case "logique":
      return <RenduLogique key={cle} donnees={NOEUDS.logique.donnees(a.donnees) as DonneesLogique} />;
    case "sophisme": {
      const s = sophismeParCle(chaine(NOEUDS.sophisme.cle(a.cle)));
      if (!s) return null;
      const commentaire = chaine(NOEUDS.sophisme.commentaire(a.commentaire));
      return (
        <aside key={cle} className="sophisme-carte" aria-label={`Sophisme : ${s.nom}`}>
          <p className="sophisme-surtitre">Sophisme identifié</p>
          <p className="sophisme-nom">
            {s.nom}
            {s.latin && <span className="sophisme-latin"> ({s.latin})</span>}
          </p>
          <p>{s.definition}</p>
          {commentaire && <p className="sophisme-commentaire">{commentaire}</p>}
          <a href={`/sophismes#${s.cle}`} className="sophisme-lien">
            Comment y répondre
          </a>
        </aside>
      );
    }
    case "reference": {
      const citationId = chaine(NOEUDS.reference.citation(a.citation));
      const citation = citationId ? ctx.bibliotheque.citations[citationId] : undefined;
      const ouvrageId = citation?.ouvrage_id ?? chaine(NOEUDS.reference.ouvrage(a.ouvrage));
      const ouvrage = ctx.bibliotheque.ouvrages[ouvrageId];
      if (!ouvrage) return null;
      const page = citation ? localisation(citation.tome, citation.page) : localisation(chaine(NOEUDS.reference.tome(a.tome)), chaine(NOEUDS.reference.page(a.page)));
      let index = ctx.cites.findIndex((c) => c.ouvrage === ouvrageId);
      if (index < 0) {
        ctx.cites.push({ ouvrage: ouvrageId, pages: new Set() });
        index = ctx.cites.length - 1;
      }
      if (page) ctx.cites[index].pages.add(page);
      const { auteur, titre } = partiesReference(ouvrage);
      return (
        <sup key={cle} className="reference-appel">
          <a href={`#reference-${index + 1}`} title={`${auteur ? `${auteur}, ` : ""}${titre}${page ? `, ${page}` : ""}`} aria-label={`Référence ${index + 1}`}>
            {index + 1}
          </a>
        </sup>
      );
    }
    case "citationOuvrage": {
      const citation = ctx.bibliotheque.citations[chaine(NOEUDS.citationOuvrage.citation(a.citation))];
      const ouvrage = citation ? ctx.bibliotheque.ouvrages[citation.ouvrage_id] : undefined;
      if (!citation || !ouvrage) return null;
      let index = ctx.cites.findIndex((c) => c.ouvrage === ouvrage.id);
      if (index < 0) {
        ctx.cites.push({ ouvrage: ouvrage.id, pages: new Set() });
        index = ctx.cites.length - 1;
      }
      const page = localisation(citation.tome, citation.page);
      if (page) ctx.cites[index].pages.add(page);
      const { auteur, titre } = partiesReference(ouvrage);
      const statut = statutSource(citation.statut);
      return (
        <figure key={cle} className="citation-ouvrage">
          {citation.texte_original && (
            <blockquote className="citation-originale" dir="auto" lang={/[\u0600-\u06ff]/.test(citation.texte_original) ? "ar" : undefined}>
              {citation.texte_original}
            </blockquote>
          )}
          <blockquote>{citation.texte}</blockquote>
          <figcaption>
            <a href={`#reference-${index + 1}`}>
              {auteur && `${auteur}, `}
              <cite>{titre}</cite>
              {page && `, ${page}`}
            </a>
            <span className="statut-source" data-teinte={statut.teinte}>
              {statut.court}
            </span>
          </figcaption>
        </figure>
      );
    }
    default:
      return null;
  }
}

function EntreeBibliographie({ o, pages }: { o: OuvrageAffiche; pages: string[] }) {
  const { auteur, titre, suite } = partiesReference(o);
  const statut = statutSource(o.statut);
  return (
    <>
      {auteur && <span className="biblio-auteur">{auteur}, </span>}
      <a href={`/sources/ouvrage/${o.id}`} className="biblio-titre">
        <cite>{titre}</cite>
      </a>
      {suite && `, ${suite}`}
      {pages.length > 0 && `. Cité : ${pages.join(" ; ")}`}.{" "}
      <span className="statut-source" data-teinte={statut.teinte} title={statut.libelle}>
        {statut.court}
      </span>
    </>
  );
}

function Reference({ auteur, ouvrage, edition, page, lien }: Record<string, string>) {
  return (
    <>
      {auteur && <>{auteur}, </>}
      {ouvrage && <cite>{ouvrage}</cite>}
      {edition && <>, {edition}</>}
      {page && <>, p. {page}</>}
      {lien && (
        <>
          {" "}
          <a href={lien} target="_blank" rel="noopener noreferrer nofollow" className="lien-document">
            consulter
          </a>
        </>
      )}
    </>
  );
}

/** Affiche le document, puis les notes et la bibliographie générées automatiquement. */
export function RenduDocument({ document, liens = {}, sources = SOURCES_VIDES }: { document: unknown; liens?: LiensResolus; sources?: DonneesSources }) {
  const racine = document && typeof document === "object" ? (document as NoeudJSON) : { type: "doc" };
  const ctx: Contexte = { liens, bibliotheque: sources, cites: [], notes: [], sources: [], titres: 0 };
  const corps = (racine.content ?? []).map((n, i) => rendre(n, ctx, 1, `r-${i}`));

  return (
    <div className="document">
      {corps}
      {ctx.notes.length > 0 && (
        <section className="document-annexe" aria-labelledby="titre-notes">
          <h2 id="titre-notes">Notes</h2>
          <ol>
            {ctx.notes.map((texte, i) => (
              <li key={i} id={`note-${i + 1}`}>
                {texte}{" "}
                <a href={`#appel-${i + 1}`} className="lien-document" aria-label={`Revenir à l'appel de note ${i + 1}`}>
                  ↩
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
      {ctx.cites.length > 0 && (
        <section className="document-annexe" aria-labelledby="titre-bibliographie">
          <h2 id="titre-bibliographie">Bibliographie</h2>
          <ol>
            {ctx.cites.map((c, i) => {
              const o = ctx.bibliotheque.ouvrages[c.ouvrage];
              return o ? (
                <li key={c.ouvrage} id={`reference-${i + 1}`}>
                  <EntreeBibliographie o={o} pages={[...c.pages]} />
                </li>
              ) : null;
            })}
          </ol>
        </section>
      )}
      {ctx.sources.length > 0 && (
        <section className="document-annexe" aria-labelledby="titre-sources">
          <h2 id="titre-sources">Sources</h2>
          <ol>
            {ctx.sources.map((s, i) => (
              <li key={i}>
                <Reference {...s} />
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
