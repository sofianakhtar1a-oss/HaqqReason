import { imageApercu, TAILLE_APERCU } from "@/lib/apercu-social";
import { lireBloc, lireCategorie } from "@/lib/content";
import { estUuid } from "@/lib/validation";

export const size = TAILLE_APERCU;
export const contentType = "image/png";
export const alt = "Catégorie HaqqReason";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const categorie = estUuid(id) ? await lireCategorie(id) : null;
  if (!categorie) return imageApercu({ titre: "HaqqReason", surtitre: "Bibliothèque" });
  const bloc = await lireBloc({ id: categorie.bloc_id });
  const b = bloc.ok ? bloc.donnees : null;
  return imageApercu({ titre: categorie.titre, surtitre: b?.titre ?? "Catégorie", accent: b?.accent });
}
