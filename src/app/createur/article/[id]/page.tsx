import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Copy, FolderInput, Trash2 } from "lucide-react";
import { BadgeStatut } from "@/components/BadgeStatut";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { FilAriane } from "@/components/FilAriane";
import { ancetresAdmin, arbreCategories, categorieVisible, lireArticleAdmin, lireBlocAdmin, listerBlocsAdmin } from "@/lib/contenu-admin";
import { nettoyerDocument } from "@/lib/document-schema";
import { lireReglages } from "@/lib/reglages-donnees";
import { exigerCreateur } from "@/lib/session";
import { estUuid } from "@/lib/validation";
import { destinations } from "../../_composants/destinations";
import { EditeurRiche } from "../../_composants/editeur/EditeurRiche";
import { EnTeteCreateur } from "../../_composants/EnTeteCreateur";
import { FormulaireDeplacement } from "../../_composants/FormulaireDeplacement";
import { GestionnaireFichiers } from "../../_composants/GestionnaireFichiers";
import { listerFichiers } from "@/lib/fichiers-donnees";
import { categoriesSecondaires, lirePrerequis } from "@/lib/navigation-donnees";
import { ReglagesNavigation } from "../../_composants/ReglagesNavigation";
import { deplacerArticle, dupliquerArticle, mettreArticleALaCorbeille, restaurerArticle } from "../../contenu-actions";

export const metadata: Metadata = { title: "Écrire un article", robots: { index: false } };

export default async function EcrireArticle({ params }: PageProps<"/createur/article/[id]">) {
  await exigerCreateur();
  const reglages = await lireReglages();
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const article = await lireArticleAdmin(id);
  if (!article) notFound();

  const [bloc, chemin, categorieAffichee, blocs, arbre, fichiers] = await Promise.all([
    lireBlocAdmin({ id: article.bloc_id }),
    ancetresAdmin(article.categorie_id),
    categorieVisible(article.categorie_id),
    listerBlocsAdmin(),
    arbreCategories(),
    listerFichiers({ type: "article", id }, "createur"),
  ]);
  const [secondaires, prerequis] = await Promise.all([categoriesSecondaires(id, "createur"), lirePrerequis(id, "createur")]);
  if (!bloc) notFound();

  const enCorbeille = Boolean(article.supprime_le);
  const visible = !enCorbeille && article.statut === "publie" && categorieAffichee;
  let visibilite: string;
  if (enCorbeille) visibilite = "Dans la corbeille : invisible pour les lecteurs.";
  else if (article.statut === "brouillon") visibilite = "En brouillon : invisible pour les lecteurs.";
  else if (!categorieAffichee) visibilite = "Publié, mais invisible : sa catégorie (ou une catégorie parente) n'est pas publiée.";
  else visibilite = "Visible par les lecteurs.";

  return (
    <div data-accent={bloc.accent} className="flex flex-1 flex-col">
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: `/createur/bloc/${bloc.slug}`, libelle: bloc.titre },
            ...chemin.map((c) => ({ href: `/createur/categorie/${c.id}`, libelle: c.titre })),
            { href: `/createur/article/${article.id}`, libelle: article.titre },
          ]}
        />

        {enCorbeille ? (
          <div className="verre panneau mt-6 max-w-2xl">
            <BadgeStatut statut={article.statut} corbeille />
            <h1 className="mt-3 text-3xl font-bold">{article.titre}</h1>
            <p className="mt-3 text-encre-douce">Cet article est dans la corbeille. Restaure-le pour le modifier.</p>
            <form action={restaurerArticle} className="mt-5">
              <input type="hidden" name="id" value={article.id} />
              <BoutonEnvoi enCours="Restauration…" className="bouton bouton-principal">
                Restaurer l&apos;article
              </BoutonEnvoi>
            </form>
          </div>
        ) : (
          <div className="mt-6">
            <h1 className="sr-only">Écrire : {article.titre}</h1>
            <EditeurRiche
              article={{
                id: article.id,
                titre: article.titre,
                resume: article.resume,
                contenu: nettoyerDocument(article.contenu),
                etiquettes: article.etiquettes.join(", "),
                statut: article.statut,
                updated_at: article.updated_at,
              }}
              visibilite={visibilite}
              enLigne={visible ? `/explorer/article/${article.id}` : null}
              actions={
                <>
                  <details className="tiroir verre rounded-3xl">
                    <summary className="flex items-center gap-3 rounded-3xl border border-transparent px-6 py-4 font-semibold">
                      <FolderInput className="size-5 text-accent" aria-hidden="true" />
                      Déplacer
                    </summary>
                    <div className="px-6 pb-6 pt-2">
                      <FormulaireDeplacement
                        action={deplacerArticle}
                        id={article.id}
                        groupes={destinations(blocs, arbre, { racines: false })}
                        aide="Choisis la catégorie qui accueillera l'article."
                      />
                    </div>
                  </details>
                  <ReglagesNavigation
                    articleId={article.id}
                    categoriePrincipale={article.categorie_id}
                    groupes={blocs.map((b) => ({ bloc: b.titre, categories: arbre.filter((c) => c.bloc_id === b.id).map((c) => ({ id: c.id, libelle: `${"\u00a0\u00a0".repeat(c.profondeur)}${c.titre}` })) }))}
                    secondaires={secondaires.map((c) => c.id)}
                    prerequis={prerequis.map((p) => ({ id: p.id, titre: p.titre }))}
                  />
                  <form action={dupliquerArticle}>
                    <input type="hidden" name="id" value={article.id} />
                    <BoutonEnvoi enCours="Duplication…" className="bouton bouton-discret w-full">
                      <Copy className="size-5" aria-hidden="true" />
                      Dupliquer l&apos;article
                    </BoutonEnvoi>
                  </form>
                  <form action={mettreArticleALaCorbeille}>
                    <input type="hidden" name="id" value={article.id} />
                    <input type="hidden" name="retour" value="categorie" />
                    <BoutonEnvoi enCours="Un instant…" className="bouton bouton-danger w-full">
                      <Trash2 className="size-5" aria-hidden="true" />
                      Mettre à la corbeille
                    </BoutonEnvoi>
                  </form>
                </>
              }
            />
            <section className="mt-10 max-w-3xl" aria-labelledby="titre-documents">
              <h2 id="titre-documents" className="text-2xl font-bold">
                Documents joints {fichiers.length > 0 && <span className="text-encre-douce">({fichiers.length})</span>}
              </h2>
              <p className="mt-2 text-encre-douce">
                Affichés sous l&apos;article. Pour placer une image ou un PDF au fil du texte, tape « /image » ou « /document » dans l&apos;éditeur.
              </p>
              <div className="mt-5">
                <GestionnaireFichiers cible={{ type: "article", id: article.id }} fichiers={fichiers} tailleMaxMo={reglages.taille_max_mo} />
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
