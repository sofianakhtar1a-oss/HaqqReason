import type { Metadata } from "next";
import { chargerModule } from "@/lib/modules/page";
import { BandeauApercu, TextesModule } from "@/lib/modules/textes-client";
import { Calame } from "./Calame";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { resolu } = await chargerModule("calame");
  return { title: resolu.textes["meta.titre"], description: resolu.textes["meta.description"] };
}

export default async function PageEcrire({ searchParams }: Props) {
  const { resolu, apercu } = await chargerModule("calame", searchParams);
  return (
    <TextesModule id="calame" resolu={resolu}>
      {apercu && <BandeauApercu id="calame" />}
      <Calame />
    </TextesModule>
  );
}
