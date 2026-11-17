import type { Metadata } from "next";
import { TableauEspace } from "../_composants/TableauEspace";

export const metadata: Metadata = { title: "Les preuves de la véracité de l'islam · Créateur", robots: { index: false } };

export default function BibliothequeCreateur() {
  return <TableauEspace espace="preuves" />;
}
