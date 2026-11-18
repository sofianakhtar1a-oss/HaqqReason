import type { Metadata } from "next";
import { exigerCompte } from "@/lib/compte/session";
import { chargerModule } from "@/lib/modules/page";
import { BandeauApercu, TextesModule } from "@/lib/modules/textes-client";
import { Assistant } from "./Assistant";

/*
 * Le Vizir, l'assistant IA : « Chat général » et « ChatPDF ».
 * La page ne lit aucune donnée : l'interface interroge /api/assistant/*, qui ne répond
 * qu'au compte Google connecté et appelle Claude avec la clé de ce compte.
 */

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { resolu } = await chargerModule("assistant");
  return { title: resolu.textes["meta.titre"], description: resolu.textes["meta.description"] };
}

export default async function PageAssistant({ searchParams }: Props) {
  await exigerCompte("/assistant");
  const { resolu, apercu } = await chargerModule("assistant", searchParams);
  return (
    <TextesModule id="assistant" resolu={resolu}>
      {apercu && <BandeauApercu id="assistant" />}
      <Assistant />
    </TextesModule>
  );
}
