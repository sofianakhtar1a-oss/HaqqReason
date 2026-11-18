import type { Metadata } from "next";
import Link from "next/link";
import { PageTexte, type SectionTexte } from "@/components/PageTexte";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Ce que HaqqReason garde sur toi quand tu te connectes avec Google, pourquoi, où, et comment tout effacer.",
};

const lien = "font-semibold text-encre underline underline-offset-4";

const SECTIONS: SectionTexte[] = [
  {
    titre: "Lire sans compte",
    paragraphes: [
      "La bibliothèque (« Les preuves », « L'Islam authentique », la recherche, le débat express, le graphe) se lit sans compte. Le site ne te demande alors rien et ne garde rien sur toi.",
      "Ton thème clair ou sombre et tes réglages d'affichage restent sur ton appareil, dans ton navigateur.",
    ],
  },
  {
    titre: "Ce que le site reçoit de Google",
    paragraphes: [
      "Le mode utilisateur (Le Calame, L'Alambic, Le Truchement, tes favoris) s'ouvre avec ton compte Google. Google transmet au site quatre informations seulement : un identifiant de compte, ton nom, ton adresse e-mail et l'adresse de ta photo de profil.",
      "Le site n'a accès ni à tes e-mails, ni à tes fichiers Google, ni à ton carnet d'adresses, et il ne connaît jamais ton mot de passe.",
    ],
  },
  {
    titre: "Ce qui est enregistré sur ton compte",
    paragraphes: [
      "Ce que tu crées ou fais dans le mode utilisateur, pour le retrouver sur tous tes appareils : les documents du Calame et leurs images ou PDF joints, ta progression dans les leçons d'anglais, tes cartes de révision, ton dictionnaire, le texte de tes vidéos, sons et PDF, les transcriptions de L'Alambic, tes favoris, collections, historique de lecture et recherches sauvegardées.",
      "Ces données ne servent qu'à te les rendre. Elles ne sont ni vendues, ni louées, ni utilisées pour de la publicité, et personne d'autre que toi ne peut les lire depuis le site (seule exception, si tu le choisis : ta ligne du classement, décrite ci-dessous).",
    ],
  },
  {
    titre: "Les points et le classement du vocabulaire",
    paragraphes: [
      "Dans Le Truchement, chaque bonne réponse d'une séance de vocabulaire te rapporte des points. Ils sont calculés par le serveur et gardés sur ton compte, avec ta série de bonnes réponses et tes jours d'affilée.",
      "Tu n'apparais dans le classement que si tu le rejoins toi-même. Les autres apprenants connectés voient alors ton prénom suivi de l'initiale de ton nom, ta photo Google, tes points et tes jours d'affilée, jamais ton adresse e-mail. Tu peux quitter le classement à tout moment (« Comment gagner des points ? », puis « Quitter le classement ») : tu en disparais aussitôt, et tes points restent visibles de toi seul.",
    ],
  },
  {
    titre: "Où sont gardées tes données",
    paragraphes: [
      "Le site est hébergé par Vercel. Les comptes et leurs données sont gardés dans une base de données et un espace de stockage privé chez Supabase. Le navigateur ne lit jamais ces tables directement : seul le serveur du site y accède.",
      "Quand tu demandes une transcription, une traduction ou une analyse de texte dans L'Alambic ou Le Truchement, le son ou le texte concerné est envoyé au service Groq le temps du traitement, puis le résultat t'est rendu.",
    ],
  },
  {
    titre: "Sécurité et cookies",
    paragraphes: [
      "Ta connexion est gardée dans un cookie signé, illisible par les scripts de la page, qui dure 60 jours et se prolonge quand tu reviens. Un second cookie de dix minutes sert seulement pendant l'aller-retour chez Google.",
      "Pour repérer les abus, le site note certaines actions (par exemple la création d'un compte) avec une empreinte chiffrée de l'adresse IP et le type de navigateur, jamais l'adresse IP elle-même.",
      "Le site n'utilise ni publicité, ni outil de mesure d'audience, ni cookie d'un autre site.",
    ],
  },
  {
    titre: "Effacer tes données",
    paragraphes: [
      <>
        Depuis la page <Link href="/compte" className={lien}>Mon compte</Link>, tu peux te déconnecter, effacer ce qui est sur l&apos;appareil, déconnecter tous tes appareils, ou <strong>supprimer ton compte</strong>. La suppression efface ton compte et toutes ses données, documents, fichiers joints et points compris. Elle est définitive.
      </>,
      "Tu peux aussi retirer l'accès de HaqqReason à ton compte Google à tout moment, dans les réglages de ton compte Google (« Sécurité », puis « Vos connexions à des applications et services tiers »).",
    ],
  },
  {
    titre: "Une question ?",
    paragraphes: [
      <>
        Écris-nous depuis la page <Link href="/contribuer" className={lien}>Contribuer</Link> (« Suggérer une amélioration du site »). Si cette page change de façon importante, la date en haut sera mise à jour.
      </>,
    ],
  },
];

export default function PageConfidentialite() {
  return (
    <PageTexte
      titre="Confidentialité"
      intro="Ce que HaqqReason garde sur toi quand tu te connectes avec Google, pourquoi, où, et comment tout effacer."
      misAJour="18 novembre 2026"
      sections={SECTIONS}
    />
  );
}
