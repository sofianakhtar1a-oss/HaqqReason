import type { Metadata } from "next";
import { exigerCompte } from "@/lib/compte/session";
import { chargerModule } from "@/lib/modules/page";
import { BandeauApercu, TextesModule } from "@/lib/modules/textes-client";
import { Alambic } from "./Alambic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { resolu } = await chargerModule("alambic");
  return { title: resolu.textes["meta.titre"], description: resolu.textes["meta.description"] };
}

export default async function PageAlambic({ searchParams }: Props) {
  await exigerCompte("/alambic");
  const { resolu, apercu } = await chargerModule("alambic", searchParams);
  return (
    <TextesModule id="alambic" resolu={resolu}>
      {apercu && <BandeauApercu id="alambic" />}
      <Alambic />
    </TextesModule>
  );
}
