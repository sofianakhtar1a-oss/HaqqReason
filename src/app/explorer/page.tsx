import type { Metadata } from "next";
import { PorteEspace } from "@/components/PorteEspace";

export const metadata: Metadata = { title: "La bibliothèque" };

export default function Explorer() {
  return <PorteEspace espace="preuves" titre="La bibliothèque" intro="Trois portes, trois démarches. Entre par celle qui correspond à ta question." />;
}
