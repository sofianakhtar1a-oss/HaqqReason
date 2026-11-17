import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { lireBlocAdmin } from "@/lib/contenu-admin";
import { exigerCreateur } from "@/lib/session";
import { GestionBloc } from "../../_composants/GestionBloc";

export const metadata: Metadata = { title: "Gérer un bloc", robots: { index: false } };

export default async function GererBloc({ params }: PageProps<"/createur/bloc/[slug]">) {
  await exigerCreateur();
  const { slug } = await params;
  const bloc = await lireBlocAdmin({ slug });
  if (!bloc) notFound();
  if (bloc.espace === "islam") redirect("/createur/islam");
  return <GestionBloc bloc={bloc} />;
}
