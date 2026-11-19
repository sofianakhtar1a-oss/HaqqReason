import type { Metadata } from "next";
import { exigerCompte } from "@/lib/compte/session";
import { remplir } from "@/lib/modules/modules";
import { chargerModule } from "@/lib/modules/page";
import { BandeauApercu, TextesModule } from "@/lib/modules/textes-client";
import { NOMBRE_PAYS } from "@/lib/monde/chiffres";
import { Portulan } from "./Portulan";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  const { resolu } = await chargerModule("monde");
  return {
    title: resolu.textes["meta.titre"],
    description: remplir(resolu.textes["meta.description"], { pays: NOMBRE_PAYS }),
    // Le Portulan s'installe à part, avec sa propre icône (voir /portulan.webmanifest).
    manifest: "/portulan.webmanifest",
    icons: { apple: "/icones/portulan-apple-touch.png" },
  };
}

export default async function PageMonde({ searchParams }: Props) {
  await exigerCompte("/monde");
  const { resolu, apercu } = await chargerModule("monde", searchParams);
  return (
    <TextesModule id="monde" resolu={resolu}>
      {apercu && <BandeauApercu id="monde" />}
      <Portulan />
    </TextesModule>
  );
}
