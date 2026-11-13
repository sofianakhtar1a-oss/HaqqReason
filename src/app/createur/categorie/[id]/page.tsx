import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, FolderInput, Pencil, Trash2 } from "lucide-react";
import { BadgeStatut } from "@/components/BadgeStatut";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { FilAriane } from "@/components/FilAriane";
import { Pagination, lirePage } from "@/components/Pagination";
import {
  ARTICLES_PAR_PAGE,
  ancetresAdmin,
  arbreCategories,
  categorieVisible,
  compterContenusAdmin,
  lireBlocAdmin,
  lireCategorieAdmin,
  listerArticlesAdmin,
  listerBlocsAdmin,
  listerCategoriesAdmin,
} from "@/lib/contenu-admin";
import { lireReglages } from "@/lib/reglages-donnees";
import { exigerCreateur } from "@/lib/session";
import { estUuid } from "@/lib/validation";
import { destinations } from "../../_composants/destinations";
import { EnTeteCreateur } from "../../_composants/EnTeteCreateur";
import { FormulaireCategorie } from "../../_composants/FormulaireCategorie";
import { FormulaireCreation } from "../../_composants/FormulaireCreation";
import { FormulaireDeplacement } from "../../_composants/FormulaireDeplacement";
import { ListeArticles } from "../../_composants/ListeArticles";
import { ListeDossiers } from "../../_composants/ListeDossiers";
import { SelecteurModele } from "../../_composants/SelecteurModele";
import { GestionnaireFichiers } from "../../_composants/GestionnaireFichiers";
import { listerFichiers } from "@/lib/fichiers-donnees";
import { MODELES_INTEGRES } from "@/lib/modeles-integres";
import { dbAdmin } from "@/lib/supabase";
import {
  creerArticle,
  creerCategorie,
  deplacerCategorie,
  mettreCategorieALaCorbeille,
  publierCategorie,
  restaurerCategorie,
} from "../../contenu-actions";

export const metadata: Metadata = { title: "Gérer une catégorie", robots: { index: false } };

export default async function GererCategorie({ params, searchParams }: PageProps<"/createur/categorie/[id]">) {
  await exigerCreateur();
  const reglages = await lireReglages();
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const categorie = await lireCategorieAdmin(id);
  if (!categorie) notFound();

  const page = lirePage((await searchParams).page);
  const [bloc, chemin, sousCategories, { articles, total }, visible, blocs, arbre] = await Promise.all([
    lireBlocAdmin({ id: categorie.bloc_id }),
    ancetresAdmin(id),
    listerCategoriesAdmin(categorie.bloc_id, id),
    listerArticlesAdmin(id, page),
    categorieVisible(id),
    listerBlocsAdmin(),
    arbreCategories(),
  ]);
  if (!bloc) notFound();
  const compteurs = await compterContenusAdmin(sousCategories.map((c) => c.id));
  const { data: modelesPerso } = await dbAdmin().from("modeles").select("id, nom").order("nom");
  const fichiers = await listerFichiers({ type: "categorie", id }, "createur");
  const pages = Math.max(1, Math.ceil(total / ARTICLES_PAR_PAGE));
  const parentEnCorbeille = chemin.slice(0, -1).some((c) => c.supprime_le);
  const enCorbeille = Boolean(categorie.supprime_le);

  const etapes = [
    { href: "/createur", libelle: "Espace créateur" },
    { href: `/createur/bloc/${bloc.slug}`, libelle: bloc.titre },
    ...chemin.map((c) => ({ href: `/createur/categorie/${c.id}`, libelle: c.titre })),
  ];

  let visibilite: string;
  if (enCorbeille) visibilite = "Dans la corbeille : invisible pour les lecteurs.";
  else if (parentEnCorbeille) visibilite = "Une catégorie parente est dans la corbeille : tout ce qui est ici est invisible pour les lecteurs.";
  else if (categorie.statut === "brouillon") visibilite = "En brouillon : invisible pour les lecteurs.";
  else if (!visible) visibilite = "Publiée, mais invisible pour les lecteurs : une catégorie parente est encore en brouillon.";
  else visibilite = "Visible par les lecteurs.";

  return (
    <div data-accent={bloc.accent} className="flex flex-1 flex-col">
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane etapes={etapes} />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-extrabold md:text-5xl">{categorie.titre}</h1>
          <BadgeStatut statut={categorie.statut} corbeille={enCorbeille} />
        </div>
        {categorie.description && <p className="mt-3 max-w-[60ch] text-lg text-encre-douce">{categorie.description}</p>}
        <p className="mt-3 font-semibold text-accent">{visibilite}</p>

        {enCorbeille ? (
          <div className="verre panneau mt-8 max-w-2xl">
            <p>Cette catégorie et tout son contenu sont dans la corbeille.</p>
            <form action={restaurerCategorie} className="mt-5">
              <input type="hidden" name="id" value={categorie.id} />
              <BoutonEnvoi enCours="Restauration…" className="bouton bouton-principal">
                Restaurer la catégorie
              </BoutonEnvoi>
            </form>
          </div>
        ) : (
          <>
            {/* Actions sur la catégorie */}
            <div className="mt-8 flex flex-wrap items-start gap-3">
              <form action={publierCategorie}>
                <input type="hidden" name="id" value={categorie.id} />
                <input type="hidden" name="statut" value={categorie.statut === "publie" ? "brouillon" : "publie"} />
                <BoutonEnvoi enCours="Un instant…" className={categorie.statut === "publie" ? "bouton bouton-discret" : "bouton bouton-principal"}>
                  {categorie.statut === "publie" ? "Repasser en brouillon" : "Publier la catégorie"}
                </BoutonEnvoi>
              </form>
              {visible && (
                <Link href={`/explorer/categorie/${categorie.id}`} className="bouton bouton-discret">
                  <Eye className="size-5" aria-hidden="true" />
                  Voir comme un lecteur
                </Link>
              )}
              <form action={mettreCategorieALaCorbeille}>
                <input type="hidden" name="id" value={categorie.id} />
                <BoutonEnvoi enCours="Un instant…" className="bouton bouton-danger">
                  <Trash2 className="size-5" aria-hidden="true" />
                  Mettre à la corbeille
                </BoutonEnvoi>
              </form>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <details className="tiroir verre rounded-3xl">
                <summary className="flex items-center gap-3 rounded-3xl border border-transparent px-6 py-4 font-semibold">
                  <Pencil className="size-5 text-accent" aria-hidden="true" />
                  Modifier le titre, la description ou l&apos;icône
                </summary>
                <div className="px-6 pb-6 pt-2">
                  <FormulaireCategorie id={categorie.id} titre={categorie.titre} description={categorie.description} icone={categorie.icone} />
                </div>
              </details>
              <details className="tiroir verre rounded-3xl">
                <summary className="flex items-center gap-3 rounded-3xl border border-transparent px-6 py-4 font-semibold">
                  <FolderInput className="size-5 text-accent" aria-hidden="true" />
                  Déplacer la catégorie
                </summary>
                <div className="px-6 pb-6 pt-2">
                  <FormulaireDeplacement
                    action={deplacerCategorie}
                    id={categorie.id}
                    groupes={destinations(blocs, arbre, { categorie: categorie.id, racines: true })}
                    aide="Ses sous-catégories et ses articles la suivent, y compris vers un autre bloc."
                  />
                </div>
              </details>
            </div>

            {/* Sous-catégories */}
            <section className="mt-14" aria-labelledby="titre-sous-categories">
              <h2 id="titre-sous-categories" className="text-2xl font-bold">
                Sous-catégories
              </h2>
              {sousCategories.length > 0 ? (
                <div className="mt-6">
                  <ListeDossiers categories={sousCategories} compteurs={Object.fromEntries(compteurs)} />
                </div>
              ) : (
                <p className="mt-2 text-encre-douce">Aucune sous-catégorie.</p>
              )}
              <div className="verre panneau mt-6 max-w-2xl">
                <FormulaireCreation
                  action={creerCategorie}
                  champsCaches={{ blocId: categorie.bloc_id, parentId: categorie.id }}
                  libelle="Nouvelle sous-catégorie"
                  bouton="Créer"
                  exemple="Par exemple : La Trinité"
                />
              </div>
            </section>

            {/* Articles */}
            <section className="mt-14" aria-labelledby="titre-articles">
              <h2 id="titre-articles" className="text-2xl font-bold">
                Articles {total > 0 && <span className="text-encre-douce">({total})</span>}
              </h2>
              <div className="verre panneau mt-6 max-w-2xl">
                <FormulaireCreation
                  action={creerArticle}
                  champsCaches={{ categorieId: categorie.id }}
                  libelle="Nouvel article"
                  bouton="Créer et écrire"
                  exemple="Par exemple : Jésus a-t-il revendiqué la divinité ?"
                >
                  <SelecteurModele integres={MODELES_INTEGRES.map(({ cle, nom }) => ({ cle, nom }))} perso={modelesPerso ?? []} />
                </FormulaireCreation>
              </div>
              {articles.length > 0 ? (
                <ListeArticles articles={articles} />
              ) : (
                <p className="mt-4 text-encre-douce">Aucun article dans cette catégorie.</p>
              )}
              <Pagination base={`/createur/categorie/${categorie.id}`} page={page} pages={pages} />
            </section>

            {/* Documents */}
            <section className="mt-14 max-w-3xl" aria-labelledby="titre-documents">
              <h2 id="titre-documents" className="text-2xl font-bold">
                Documents {fichiers.length > 0 && <span className="text-encre-douce">({fichiers.length})</span>}
              </h2>
              <p className="mt-2 text-encre-douce">Livres, études, manuscrits, images… visibles par les lecteurs quand la catégorie est publiée.</p>
              <div className="mt-5">
                <GestionnaireFichiers cible={{ type: "categorie", id: categorie.id }} fichiers={fichiers} tailleMaxMo={reglages.taille_max_mo} />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
