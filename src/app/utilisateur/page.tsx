import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BookOpenText,
  Compass,
  Feather,
  FlaskConical,
  Languages,
  LockKeyhole,
} from "lucide-react";
import { aAccesModules } from "@/lib/acces-modules";
import { EnTete } from "@/components/EnTete";
import { Astrolabe } from "@/components/scene/Astrolabe";
import { Ciel } from "@/components/scene/Ciel";
import { MarqueAccueil } from "@/lib/client/acces";
import { exigerCompte } from "@/lib/compte/session";
import { remplir } from "@/lib/modules/modules";
import { chargerModule, chiffresVocabulaire } from "@/lib/modules/page";
import { NOMBRE_PAYS } from "@/lib/monde/chiffres";
import { BandeauApercu } from "@/lib/modules/textes-client";

const ICONES = {
  calame: Feather,
  alambic: FlaskConical,
  langues: Languages,
  monde: Compass,
  bibliotheque: BookOpen,
  islam: BookOpenText,
} as const;
const LIENS = {
  calame: "/ecrire",
  alambic: "/alambic",
  langues: "/langues",
  monde: "/monde",
  bibliotheque: "/explorer",
  islam: "/islam",
} as const;
const ACCENTS = {
  calame: "or",
  alambic: "amethyste",
  langues: "azur",
  monde: "safran",
  bibliotheque: "emeraude",
  islam: "or",
} as const;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const [{ resolu }, chiffres] = await Promise.all([chargerModule("accueil"), chiffresVocabulaire()]);
  return {
    title: "Mode utilisateur",
    description: remplir(resolu.textes["meta.description"], chiffres),
  };
}

export default async function PageUtilisateur({ searchParams }: Props) {
  await exigerCompte("/utilisateur");
  const [{ resolu, apercu }, vocabulaire] = await Promise.all([chargerModule("accueil", searchParams), chiffresVocabulaire()]);
  const chiffres = { ...vocabulaire, pays: NOMBRE_PAYS };
  const cartes = (resolu.listes.cartes ?? []).filter((c) => c.id in LIENS);
  // Les deux modules réservés demandent un mot de passe : la carte le dit avant le clic.
  const acces = await aAccesModules();
  const reserve = (id: string) => !acces && (id === "bibliotheque" || id === "islam");
  return (
    <>
      <MarqueAccueil />
      {apercu && <BandeauApercu id="accueil" />}
      <EnTete />
      <Ciel nombre={26} graine={23} className="ciel-fixe" />
      {/* Le décor déborde à droite : on le coupe au bord de l'écran, sinon la page glisse de côté sur téléphone. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <Astrolabe
          viseur={false}
          couche="9,7"
          className="pointer-events-none absolute -right-[36vw] top-[8vw] w-[110vw] max-w-none opacity-30 md:-right-[16rem] md:top-24 md:w-[44rem] md:opacity-70"
        />
      </div>
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-20 pt-6 sm:px-8">
        {/* Chaque porte colore la salle quand on s'en approche. */}
        <div className="halos" aria-hidden="true">
          <span className="halo" data-accent="or" />
          <span className="halo" data-accent="emeraude" />
          <span className="halo" data-accent="amethyste" />
          <span className="halo" data-accent="azur" />
          <span className="halo" data-accent="safran" />
        </div>
        <h1 className="apparait text-4xl font-extrabold md:text-5xl">
          {resolu.textes.titre}
        </h1>
        <p className="apparait mt-3 max-w-[58ch] text-lg text-encre-douce" style={{ "--delai": "0.08s" } as React.CSSProperties}>
          {remplir(resolu.textes.intro, chiffres)}
        </p>

        <nav
          aria-label="Les espaces"
          className={`mt-10 grid gap-5 md:grid-cols-2 ${cartes.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
        >
          {cartes.map(
            ({ id, valeurs: { titre, soustitre, texte, marque } }, rang) => {
              const cle = id as keyof typeof LIENS;
              const Icone = ICONES[cle];
              return (
                <Link
                  key={id}
                  href={LIENS[cle]}
                  className="carte-choix carte-vivante apparait"
                  style={{ "--delai": `${0.16 + rang * 0.08}s` } as React.CSSProperties}
                  data-accent={ACCENTS[cle]}
                  data-inclinaison="7"
                  data-portail={titre}
                  data-portail-sur={soustitre}
                >
                  <span className="carte-lueur" aria-hidden="true" />
                  <span className="carte-choix-marque">
                    {reserve(id) ? (
                      <span className="inline-flex items-center gap-1.5">
                        <LockKeyhole className="size-3.5" aria-hidden="true" />
                        Réservé
                      </span>
                    ) : (
                      marque
                    )}
                  </span>
                  <Icone
                    className="carte-icone size-9 text-accent"
                    strokeWidth={1.4}
                    aria-hidden="true"
                  />
                  <span className="carte-choix-sur">{soustitre}</span>
                  <span className="carte-choix-titre">{titre}</span>
                  <span className="carte-choix-texte">{remplir(texte, chiffres)}</span>
                  <span className="carte-choix-pied">
                    {reserve(id) ? "Entrer avec le mot de passe" : "Entrer"}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              );
            },
          )}
        </nav>
      </main>
    </>
  );
}
