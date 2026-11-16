import type { Metadata } from "next";
import { Calame } from "./Calame";

export const metadata: Metadata = {
  title: "Le Calame — atelier d'écriture",
  description:
    "Un traitement de texte complet dans le navigateur : pages A4 réelles, styles, tableaux, images, frises et cartes mentales. Les documents restent sur ton appareil.",
};

export default function PageEcrire() {
  return <Calame />;
}
