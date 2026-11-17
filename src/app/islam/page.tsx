import type { Metadata } from "next";
import { PorteEspace } from "@/components/PorteEspace";

export const metadata: Metadata = {
  title: "L'Islam authentique",
  description: "Des vidéos qui expliquent l'islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs.",
};

export default function IslamAuthentique() {
  return (
    <PorteEspace
      espace="islam"
      titre="L'Islam authentique"
      intro="Des vidéos qui expliquent chaque aspect de l'islam selon le Coran, la Sunna et la compréhension des pieux prédécesseurs. Choisis une porte."
    />
  );
}
