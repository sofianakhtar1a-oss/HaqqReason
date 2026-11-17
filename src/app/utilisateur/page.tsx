import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BookOpenText,
  Feather,
  FlaskConical,
  Languages,
} from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { Rosace } from "@/components/Rosace";
import { MarqueAccueil } from "@/lib/client/acces";
import { chargerModule } from "@/lib/modules/page";
import { BandeauApercu } from "@/lib/modules/textes-client";

const ICONES = {
  calame: Feather,
  alambic: FlaskConical,
  langues: Languages,
  bibliotheque: BookOpen,
  islam: BookOpenText,
} as const;
const LIENS = {
  calame: "/ecrire",
  alambic: "/alambic",
  langues: "/langues",
  bibliotheque: "/explorer",
  islam: "/islam",
} as const;
const ACCENTS = {
  calame: "or",
  alambic: "amethyste",
  langues: "azur",
  bibliotheque: "emeraude",
  islam: "or",
} as const;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  const { resolu } = await chargerModule("accueil");
  return {
    title: "Mode utilisateur",
    description: resolu.textes["meta.description"],
  };
}

export default async function PageUtilisateur({ searchParams }: Props) {
  const { resolu, apercu } = await chargerModule("accueil", searchParams);
  const cartes = (resolu.listes.cartes ?? []).filter((c) => c.id in LIENS);
  return (
    <>
      <MarqueAccueil />
      {apercu && <BandeauApercu id="accueil" />}
      <EnTete />
      <Rosace className="pointer-events-none absolute -right-[36vw] top-[8vw] w-[110vw] max-w-none opacity-30 md:-right-[16rem] md:top-24 md:w-[44rem] md:opacity-70" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-20 pt-6 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">
          {resolu.textes.titre}
        </h1>
        <p className="mt-3 max-w-[58ch] text-lg text-encre-douce">
          {resolu.textes.intro}
        </p>

        <nav
          aria-label="Les espaces"
          className={`mt-10 grid gap-5 md:grid-cols-2 ${cartes.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}
        >
          {cartes.map(
            ({ id, valeurs: { titre, soustitre, texte, marque } }) => {
              const cle = id as keyof typeof LIENS;
              const Icone = ICONES[cle];
              return (
                <Link
                  key={id}
                  href={LIENS[cle]}
                  className="carte-choix"
                  data-accent={ACCENTS[cle]}
                >
                  <span className="carte-choix-marque">{marque}</span>
                  <Icone
                    className="size-9 text-accent"
                    strokeWidth={1.4}
                    aria-hidden="true"
                  />
                  <span className="carte-choix-sur">{soustitre}</span>
                  <span className="carte-choix-titre">{titre}</span>
                  <span className="carte-choix-texte">{texte}</span>
                  <span className="carte-choix-pied">
                    Entrer
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
