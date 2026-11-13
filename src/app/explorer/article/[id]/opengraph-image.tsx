import { imageApercu, TAILLE_APERCU } from "@/lib/apercu-social";
import { lireArticle, lireBloc } from "@/lib/content";
import { estUuid } from "@/lib/validation";

export const size = TAILLE_APERCU;
export const contentType = "image/png";
export const alt = "Article HaqqReason";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = estUuid(id) ? await lireArticle(id) : null;
  if (!article) return imageApercu({ titre: "HaqqReason", surtitre: "Bibliothèque" });
  const bloc = await lireBloc({ id: article.bloc_id });
  const b = bloc.ok ? bloc.donnees : null;
  return imageApercu({ titre: article.titre, surtitre: b?.titre ?? "Article", accent: b?.accent });
}
