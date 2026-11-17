import type { Metadata } from "next";
import { exigerCompte } from "@/lib/compte/session";
import { chargerModule } from "@/lib/modules/page";
import { BandeauApercu, TextesModule } from "@/lib/modules/textes-client";
import { Truchement } from "./Truchement";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { resolu } = await chargerModule("langues");
  return { title: resolu.textes["meta.titre"], description: resolu.textes["meta.description"] };
}

export default async function PageLangues({ searchParams }: Props) {
  await exigerCompte("/langues");
  const { resolu, apercu } = await chargerModule("langues", searchParams);
  return (
    <TextesModule id="langues" resolu={resolu}>
      {apercu && <BandeauApercu id="langues" />}
      <Truchement />
    </TextesModule>
  );
}
