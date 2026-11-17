import type { Metadata } from "next";
import { Truchement } from "./Truchement";

export const metadata: Metadata = {
  title: "Le Truchement, apprendre l'anglais",
  description:
    "Apprendre l'anglais depuis le français : 600 mots en douze thèmes révisés au bon moment, des vidéos et des PDF où chaque mot se traduit d'un toucher, et ton dictionnaire personnel. Ta progression reste sur ton appareil.",
};

export default function PageLangues() {
  return <Truchement />;
}
