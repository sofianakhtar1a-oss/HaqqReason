import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Folder, Trash2 } from "lucide-react";
import { BoutonConfirmation } from "@/components/BoutonConfirmation";
import { BoutonEnvoi } from "@/components/BoutonEnvoi";
import { FilAriane } from "@/components/FilAriane";
import { contenuCorbeille, listerBlocsAdmin, tailleSousArbre } from "@/lib/contenu-admin";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";
import {
  restaurerArticle,
  restaurerCategorie,
  supprimerArticleDefinitivement,
  supprimerCategorieDefinitivement,
  viderCorbeille,
} from "../contenu-actions";

export const metadata: Metadata = { title: "Corbeille", robots: { index: false } };

function contenuPerdu(t: { categories: number; articles: number }): string {
  const morceaux: string[] = [];
  if (t.categories > 0) morceaux.push(t.categories === 1 ? "1 sous-catégorie" : `${t.categories} sous-catégories`);
  if (t.articles > 0) morceaux.push(t.articles === 1 ? "1 article" : `${t.articles} articles`);
  return morceaux.length > 0 ? `Efface aussi ${morceaux.join(" et ")}.` : "";
}

export default async function Corbeille() {
  await exigerCreateur();
  const [elements, blocs] = await Promise.all([contenuCorbeille(), listerBlocsAdmin()]);
  const titresBlocs = new Map(blocs.map((b) => [b.id, b.titre]));
  const tailles = new Map(
    await Promise.all(
      elements.filter((e) => e.type === "categorie").map(async (e) => [e.id, await tailleSousArbre(e.id)] as const),
    ),
  );

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: "/createur/corbeille", libelle: "Corbeille" },
          ]}
        />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-extrabold md:text-5xl">Corbeille</h1>
          {elements.length > 0 && (
            <form action={viderCorbeille}>
              <BoutonConfirmation
                libelle="Vider la corbeille"
                confirmation="Oui, tout effacer"
                enCours="Effacement…"
                avertissement="Tout ce qui est ici sera effacé pour toujours."
              />
            </form>
          )}
        </div>
        <p className="mt-3 max-w-[60ch] text-lg text-encre-douce">
          Ce qui est ici est invisible pour les lecteurs, mais peut encore être restauré. Une suppression définitive ne peut
          pas être annulée.
        </p>

        {elements.length === 0 ? (
          <div className="verre panneau mt-10 max-w-2xl">
            <Trash2 className="size-9 text-encre-douce" strokeWidth={1.5} aria-hidden="true" />
            <p className="mt-3 text-lg">La corbeille est vide.</p>
          </div>
        ) : (
          <ul className="mt-10 space-y-3">
            {elements.map((e) => {
              const date = new Date(e.supprime_le).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });
              const avertissement = e.type === "categorie" ? contenuPerdu(tailles.get(e.id) ?? { categories: 0, articles: 0 }) : "";
              return (
                <li key={`${e.type}-${e.id}`} className="verre flex flex-wrap items-center gap-4 rounded-3xl p-5">
                  {e.type === "categorie" ? (
                    <Folder className="size-6 shrink-0 text-encre-douce" aria-label="Catégorie" />
                  ) : (
                    <FileText className="size-6 shrink-0 text-encre-douce" aria-label="Article" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={e.type === "categorie" ? `/createur/categorie/${e.id}` : `/createur/article/${e.id}`}
                      className="font-semibold hover:underline hover:underline-offset-4"
                    >
                      {e.titre}
                    </Link>
                    <p className="text-sm text-encre-douce">
                      {e.type === "categorie" ? "Catégorie" : "Article"} de « {titresBlocs.get(e.bloc_id)} », mise à la corbeille le {date}
                    </p>
                  </div>
                  <form action={e.type === "categorie" ? restaurerCategorie : restaurerArticle}>
                    <input type="hidden" name="id" value={e.id} />
                    <BoutonEnvoi enCours="Restauration…" className="bouton bouton-discret">
                      Restaurer
                    </BoutonEnvoi>
                  </form>
                  <form action={e.type === "categorie" ? supprimerCategorieDefinitivement : supprimerArticleDefinitivement}>
                    <input type="hidden" name="id" value={e.id} />
                    <BoutonConfirmation
                      libelle="Supprimer définitivement"
                      confirmation="Oui, supprimer"
                      enCours="Suppression…"
                      avertissement={avertissement || undefined}
                    />
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
