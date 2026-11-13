import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleLecture } from "@/components/ArticleLecture";
import { lireArticleAdmin, lireBlocAdmin } from "@/lib/contenu-admin";
import { exigerCreateur } from "@/lib/session";
import { estUuid } from "@/lib/validation";
import { lireLiens, lireRetroliens } from "@/lib/liens-donnees";
import { sourcesDuDocument } from "@/lib/sources-donnees";
import { lirePrerequis } from "@/lib/navigation-donnees";
import { EnTeteCreateur } from "../../../_composants/EnTeteCreateur";

export const metadata: Metadata = { title: "Aperçu", robots: { index: false } };

/** Montre l'article exactement comme un lecteur le verra, même s'il est encore en brouillon. */
export default async function Apercu({ params }: PageProps<"/createur/article/[id]/apercu">) {
  await exigerCreateur();
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const article = await lireArticleAdmin(id);
  if (!article) notFound();
  const [bloc, liens, retroliens, sources, prerequis] = await Promise.all([
    lireBlocAdmin({ id: article.bloc_id }),
    lireLiens(id, "createur"),
    lireRetroliens(id, "createur"),
    sourcesDuDocument(article.contenu, "createur"),
    lirePrerequis(id, "createur"),
  ]);

  return (
    <div data-accent={bloc?.accent ?? "or"} className="flex flex-1 flex-col">
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <div className="message message-succes flex flex-wrap items-center justify-between gap-3">
          <span>Aperçu : voici ce que verront les lecteurs une fois l&apos;article publié.</span>
          <Link href={`/createur/article/${article.id}`} className="inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Revenir à l&apos;écriture
          </Link>
        </div>
        <div className="mt-10">
          <ArticleLecture
            id={article.id}
            apercu
            liens={liens}
            retroliens={retroliens}
            sources={sources}
            prerequis={prerequis}
            titre={article.titre}
            resume={article.resume}
            contenu={article.contenu}
            etiquettes={article.etiquettes}
            misAJour={article.updated_at}
          />
        </div>
      </main>
    </div>
  );
}
