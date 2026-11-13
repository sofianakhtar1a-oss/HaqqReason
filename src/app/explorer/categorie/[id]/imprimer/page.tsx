import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Livre } from "@/components/lecture/Livre";
import { lireBloc, lireCategorie } from "@/lib/content";
import { contenuCategorie } from "@/lib/export";
import { estUuid } from "@/lib/validation";

export const metadata: Metadata = { title: "Export PDF", robots: { index: false } };

export default async function ImprimerCategorie({ params }: PageProps<"/explorer/categorie/[id]/imprimer">) {
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const categorie = await lireCategorie(id);
  if (!categorie) notFound();
  const [bloc, contenu, h] = await Promise.all([lireBloc({ id: categorie.bloc_id }), contenuCategorie(id, categorie.titre), headers()]);
  if (!bloc.ok || !bloc.donnees) notFound();
  return (
    <Livre
      accent={bloc.donnees.accent}
      bloc={bloc.donnees.titre}
      titre={categorie.titre}
      sousTitre={categorie.description || undefined}
      sections={contenu.sections}
      tronque={contenu.tronque}
      url={`${h.get("host") ?? ""}/explorer/categorie/${id}`}
    />
  );
}
