import type { Metadata } from "next";
import { exigerCompte } from "@/lib/compte/session";
import { chargerModule } from "@/lib/modules/page";
import { BandeauApercu, TextesModule } from "@/lib/modules/textes-client";
import { Ecorche } from "./Ecorche";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { resolu } = await chargerModule("corps");
  return {
    title: resolu.textes["meta.titre"],
    description: resolu.textes["meta.description"],
  };
}

export default async function PageCorps({ searchParams }: Props) {
  await exigerCompte("/corps");
  const { resolu, apercu } = await chargerModule("corps", searchParams);
  return (
    <TextesModule id="corps" resolu={resolu}>
      {apercu && <BandeauApercu id="corps" />}
      <Ecorche />
    </TextesModule>
  );
}
