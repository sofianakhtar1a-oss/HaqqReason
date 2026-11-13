import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Livre } from "@/components/lecture/Livre";
import { lireArticle, lireBloc } from "@/lib/content";
import { lireLiens } from "@/lib/liens-donnees";
import { sourcesDuDocument } from "@/lib/sources-donnees";
import { estUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Export PDF", robots: { index: false } };

export default async function ImprimerArticle({ params }: PageProps<"/explorer/article/[id]/imprimer">) {
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const article = await lireArticle(id);
  if (!article) notFound();
  const [bloc, liens, h, sources] = await Promise.all([lireBloc({ id: article.bloc_id }), lireLiens(id, "public"), headers(), sourcesDuDocument(article.contenu, "public")]);
  if (!bloc.ok || !bloc.donnees) notFound();
  const hote = h.get("host") ?? "";
  return (
    <Livre
      accent={bloc.donnees.accent}
      bloc={bloc.donnees.titre}
      titre={article.titre}
      sections={[{ id, chemin: [], articles: [{ ...article, liens, sources }] }]}
      url={`${hote}/explorer/article/${id}`}
    />
  );
}
