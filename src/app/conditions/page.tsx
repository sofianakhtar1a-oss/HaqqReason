import type { Metadata } from "next";
import Link from "next/link";
import { PageTexte, type SectionTexte } from "@/components/PageTexte";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Les règles simples pour utiliser HaqqReason : la bibliothèque, le mode utilisateur et les contributions.",
};

const lien = "font-semibold text-encre underline underline-offset-4";

const SECTIONS: SectionTexte[] = [
  {
    titre: "Le service",
    paragraphes: [
      "HaqqReason est une bibliothèque d'apologétique islamique, gratuite, accompagnée d'outils personnels : un traitement de texte (Le Calame), des outils de fichiers et de transcription (L'Alambic), un module d'apprentissage de l'anglais (Le Truchement) et un assistant IA (Le Vizir), qui fonctionne avec Claude, ChatGPT ou Gemini et la clé API de chaque utilisateur, à ses frais.",
      "La bibliothèque se lit sans compte. Le mode utilisateur demande une connexion avec un compte Google, pour que ton travail soit enregistré sur ton compte et te suive d'un appareil à l'autre.",
    ],
  },
  {
    titre: "Ton compte et ton contenu",
    paragraphes: [
      "Ce que tu écris ou importes dans le mode utilisateur t'appartient et reste privé. Tu es responsable de ce que tu y mets : n'y dépose pas de contenu illégal ni de fichiers que tu n'as pas le droit d'utiliser.",
      "Pour protéger l'hébergement gratuit, chaque compte dispose d'une place limitée (textes, fichiers joints, et taille de chaque fichier). Quand une limite est atteinte, le site te le signale et garde ton travail sur l'appareil.",
      <>
        Tu peux supprimer ton compte et toutes ses données à tout moment depuis la page <Link href="/compte" className={lien}>Mon compte</Link>.
      </>,
    ],
  },
  {
    titre: "Bon usage",
    paragraphes: [
      "Il est interdit de chercher à contourner les protections du site, d'accéder aux données d'un autre compte, de surcharger volontairement le service ou de l'utiliser pour envoyer des messages en masse.",
      "Un compte utilisé de cette façon peut être fermé.",
    ],
  },
  {
    titre: "Contributions",
    paragraphes: [
      "Les propositions envoyées depuis la page « Contribuer » (sujets, arguments, améliorations) peuvent être relues, modifiées et publiées sur le site. N'y mets pas d'informations personnelles.",
    ],
  },
  {
    titre: "Les contenus de la bibliothèque",
    paragraphes: [
      "Les articles sont rédigés avec soin et appuyés sur leurs sources, citées pour que chacun puisse les vérifier. Les citations d'ouvrages et de vidéos restent la propriété de leurs auteurs.",
      "Le site est fourni tel quel, sans garantie qu'il soit toujours disponible ou exempt d'erreur. Si tu repères une erreur, signale-la depuis la page « Contribuer ».",
    ],
  },
  {
    titre: "Confidentialité",
    paragraphes: [
      <>
        Ce que le site garde sur toi, et comment tout effacer, est expliqué sur la page <Link href="/confidentialite" className={lien}>Confidentialité</Link>.
      </>,
    ],
  },
];

export default function PageConditions() {
  return (
    <PageTexte
      titre="Conditions d'utilisation"
      intro="Les règles simples pour utiliser HaqqReason : la bibliothèque, le mode utilisateur et les contributions."
      misAJour="18 novembre 2026"
      sections={SECTIONS}
    />
  );
}
