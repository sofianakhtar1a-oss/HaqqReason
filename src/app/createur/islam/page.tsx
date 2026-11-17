import type { Metadata } from "next";
import { TableauEspace } from "../_composants/TableauEspace";

export const metadata: Metadata = { title: "L'Islam authentique · Créateur", robots: { index: false } };

export default function IslamCreateur() {
  return <TableauEspace espace="islam" />;
}
