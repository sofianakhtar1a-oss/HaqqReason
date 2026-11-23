import type { Metadata } from "next";
import Link from "next/link";
import { PageTexte, type SectionTexte } from "@/components/PageTexte";
import { prixLisible, vendeurComplet } from "@/lib/premium/catalogue";
import { lireConfigPremium } from "@/lib/premium/config";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Les conditions de l'abonnement HaqqReason Premium : prix, paiement, renouvellement, résiliation et rétractation.",
};

const lien = "font-semibold text-encre underline underline-offset-4";
const date = (jour: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${jour}T12:00:00Z`));

/**
 * Les conditions générales de vente de l'abonnement, écrites à partir des informations que le
 * créateur a données dans son espace (nom, adresse, SIRET, médiateur…). Elles doivent être relues
 * par un professionnel du droit avant d'ouvrir les ventes.
 */
export default async function ConditionsVente() {
  const c = await lireConfigPremium();
  const v = c.vendeur;
  const manque = "(à compléter)";
  const sections: SectionTexte[] = [
    {
      titre: "Le vendeur",
      paragraphes: [
        `Le service HaqqReason Premium est vendu par ${v.nom || manque}${v.forme ? `, ${v.forme}` : ""}, immatriculé sous le numéro SIRET ${v.siret || manque}, dont l'adresse est ${v.adresse || manque}.`,
        <>
          Pour toute question, écris à{" "}
          {v.email ? (
            <a href={`mailto:${v.email}`} className={lien}>
              {v.email}
            </a>
          ) : (
            manque
          )}
          . {v.tva}
        </>,
      ],
    },
    {
      titre: "Ce que tu achètes",
      paragraphes: [
        "HaqqReason Premium est un abonnement qui ouvre, depuis ton compte, les parties réservées du site et lève les limites de la version gratuite (histoires, dictées, outils, examens…).",
        <>
          Le détail de ce qui est gratuit et de ce qui est réservé est toujours à jour sur la page <Link href="/premium" className={lien}>Accès premium</Link>. Le contenu du site peut évoluer : des parties s&apos;ajoutent régulièrement.
        </>,
      ],
    },
    {
      titre: "Prix et paiement",
      paragraphes: [
        `Deux formules : ${prixLisible(c.prixMois)} par mois, ou ${prixLisible(c.prixAnnee)} par an, toutes taxes comprises.${c.essaiJours > 0 ? ` Les ${c.essaiJours} premiers jours sont un essai gratuit : rien n'est prélevé avant la fin de l'essai, et tu peux résilier pendant l'essai sans rien payer.` : ""}`,
        "Le paiement se fait par carte bancaire (ou les autres moyens proposés) sur la page sécurisée de Stripe, prestataire de paiement agréé. HaqqReason ne reçoit ni ne garde jamais ton numéro de carte. Une facture est émise à chaque paiement.",
        "Le prix d'un abonnement en cours ne change pas sans que tu en sois prévenu au moins un mois à l'avance par e-mail ; tu peux alors résilier avant que le nouveau prix s'applique.",
      ],
    },
    {
      titre: "Durée, renouvellement et résiliation",
      paragraphes: [
        "L'abonnement est sans engagement. Il se renouvelle automatiquement à la fin de chaque période (un mois ou un an), au même prix, jusqu'à ce que tu le résilies.",
        <>
          Tu peux résilier à tout moment depuis <Link href="/compte" className={lien}>Mon compte</Link>, bouton « Résilier votre contrat », puis confirmation. La résiliation prend effet à la fin de la période déjà payée : l&apos;accès reste ouvert jusque-là, puis plus rien n&apos;est prélevé. Une confirmation datée s&apos;affiche et se télécharge.
        </>,
        "La période en cours n'est pas remboursée, sauf si la loi l'impose. Si tu supprimes ton compte, l'abonnement est résilié aussitôt.",
      ],
    },
    {
      titre: "Droit de rétractation",
      paragraphes: [
        "Pour un achat à distance, la loi prévoit en principe un délai de rétractation de quatorze jours. Comme l'accès à Premium commence dès le paiement, il t'est demandé, avant de payer, de cocher une case par laquelle tu demandes cet accès immédiat et reconnais perdre ton droit de rétractation dès qu'il commence (article L221-28 du Code de la consommation). La date et la version des conditions acceptées sont conservées.",
      ],
    },
    {
      titre: "Un problème ?",
      paragraphes: [
        `En cas de difficulté, écris d'abord au vendeur${v.email ? ` (${v.email})` : ""} : une réponse t'est apportée au plus vite. Si le désaccord persiste, tu peux recourir gratuitement au médiateur de la consommation : ${v.mediateur || manque}.`,
        "Ces conditions sont soumises au droit français.",
      ],
    },
    {
      titre: "Tes données",
      paragraphes: [
        <>
          Ce que le site garde pour l&apos;abonnement (l&apos;identifiant client chez Stripe, l&apos;état et la date de fin de l&apos;abonnement, les cases cochées) est expliqué sur la page{" "}
          <Link href="/confidentialite" className={lien}>
            Confidentialité
          </Link>
          .
        </>,
      ],
    },
  ];

  return (
    <PageTexte
      titre="Conditions générales de vente"
      intro={vendeurComplet(v) ? "Les conditions de l'abonnement HaqqReason Premium : prix, paiement, renouvellement, résiliation et rétractation." : "L'abonnement HaqqReason Premium n'est pas encore ouvert : ces conditions seront complétées avant l'ouverture."}
      misAJour={date(c.versionCgv)}
      sections={sections}
    />
  );
}
