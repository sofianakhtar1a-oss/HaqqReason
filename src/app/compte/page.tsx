import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Cloud, Smartphone } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { placeDuCompte } from "@/lib/compte/donnees";
import { PLAFOND_DONNEES, PLAFOND_FICHIERS } from "@/lib/compte/limites";
import { compteCourant, compteVerifie } from "@/lib/compte/session";
import { Deconnexion, EtatSynchronisation, SuppressionCompte } from "./PanneauCompte";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

const mo = (octets: number) => (octets < 100_000 ? "moins de 0,1 Mo" : `${(octets / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`);

function Jauge({ libelle, utilise, plafond }: { libelle: string; utilise: number; plafond: number }) {
  const part = Math.min(100, Math.round((utilise / plafond) * 100));
  return (
    <div>
      <p className="flex flex-wrap justify-between gap-x-4 font-semibold">
        <span>{libelle}</span>
        <span className="font-normal text-encre-douce">
          {mo(utilise)} sur {mo(plafond)}
        </span>
      </p>
      <div className="jauge-compte mt-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={part} aria-label={libelle}>
        <span style={{ width: `${Math.max(part, utilise > 0 ? 2 : 0)}%` }} data-plein={part >= 90 || undefined} />
      </div>
    </div>
  );
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PageCompte({ searchParams }: Props) {
  const verifie = await compteVerifie();
  // Base injoignable : on affiche quand même la page avec ce que dit le jeton, sans la place occupée.
  const compte = verifie === "indisponible" ? await compteCourant() : verifie;
  if (!compte) redirect("/connexion?retour=%2Fcompte");
  const [place, sp] = await Promise.all([verifie === "indisponible" ? null : placeDuCompte(compte.id), searchParams]);

  return (
    <>
      <EnTete outils={false} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <Link href="/utilisateur" className="inline-flex items-center gap-2 font-semibold text-encre-douce hover:text-encre">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Les espaces
        </Link>
        <h1 className="mt-4 text-4xl font-extrabold md:text-5xl">Mon compte</h1>
        <p className="mt-3 text-lg text-encre-douce">
          {compte.nom}
          {compte.email && compte.email !== compte.nom ? ` · ${compte.email}` : ""}
        </p>

        {sp.erreur === "suppression" && (
          <p className="message message-erreur mt-6" role="alert">
            Le compte n&apos;a pas pu être supprimé pour l&apos;instant. Réessaie dans un moment.
          </p>
        )}

        <section className="verre panneau mt-8" aria-label="Synchronisation">
          <EtatSynchronisation />
        </section>

        <section className="verre panneau mt-5" aria-labelledby="titre-enregistre">
          <h2 id="titre-enregistre" className="font-display text-xl font-bold">
            Ce qui te suit partout
          </h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <Cloud className="size-5 text-or" aria-hidden="true" />
                Enregistré sur ton compte
              </p>
              <ul className="liste-compte mt-2 text-encre-douce">
                <li>Tes documents du Calame, avec leurs images et leurs PDF</li>
                <li>Ta progression dans les Règles de l&apos;anglais</li>
                <li>Tes cartes de révision, ton dictionnaire et tes jours d&apos;étude</li>
                <li>Le texte de tes vidéos, sons et PDF, et l&apos;endroit où tu t&apos;es arrêté</li>
                <li>Tes transcriptions et leurs traductions</li>
                <li>Tes favoris, tes collections et ton historique de lecture</li>
              </ul>
            </div>
            <div>
              <p className="flex items-center gap-2 font-semibold">
                <Smartphone className="size-5 text-or" aria-hidden="true" />
                Reste sur chaque appareil
              </p>
              <ul className="liste-compte mt-2 text-encre-douce">
                <li>Les fichiers son et vidéo d&apos;origine (trop lourds pour voyager)</li>
                <li>L&apos;historique des versions d&apos;un document</li>
                <li>Les fichiers joints de plus de 20 Mo</li>
                <li>Le thème clair ou sombre et les réglages d&apos;affichage</li>
              </ul>
            </div>
          </div>
          {place && (
            <div className="mt-6 grid gap-4 border-t border-trait pt-5">
              <Jauge libelle="Textes et progression" utilise={place.donnees} plafond={PLAFOND_DONNEES} />
              <Jauge libelle="Images et PDF joints" utilise={place.fichiers} plafond={PLAFOND_FICHIERS} />
            </div>
          )}
        </section>

        <section className="verre panneau mt-5" aria-labelledby="titre-session">
          <h2 id="titre-session" className="font-display text-xl font-bold">
            Session
          </h2>
          <div className="mt-4">
            <Deconnexion />
          </div>
        </section>

        <section className="verre panneau mt-5" aria-labelledby="titre-suppression">
          <h2 id="titre-suppression" className="font-display text-xl font-bold">
            Supprimer mon compte
          </h2>
          <p className="mt-2 text-encre-douce">
            Tout ce qui est enregistré sur ton compte est effacé du serveur, définitivement, et retiré de cet appareil. Si tu veux garder un document, exporte-le d&apos;abord depuis Le Calame.
          </p>
          <SuppressionCompte />
        </section>
      </main>
    </>
  );
}
