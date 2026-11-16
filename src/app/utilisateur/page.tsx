import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Feather, FlaskConical } from "lucide-react";
import { EnTete } from "@/components/EnTete";
import { Rosace } from "@/components/Rosace";
import { MarqueAccueil } from "@/lib/client/acces";

export const metadata: Metadata = {
  title: "Mode utilisateur",
  description: "Trois espaces : Le Calame pour écrire, L'Alambic pour convertir ses fichiers, et la bibliothèque des preuves de la véracité de l'islam.",
};

const CHOIX = [
  {
    href: "/ecrire",
    titre: "Le Calame",
    soustitre: "Atelier d'écriture",
    texte:
      "Un traitement de texte complet, dans ton navigateur : pages A4 réelles, styles, tableaux, images, PDF, frises chronologiques et cartes mentales. Tes documents restent sur ton appareil, et s'exportent en PDF, Word ou Markdown.",
    Icone: Feather,
    accent: "or",
    marque: "Écrire",
  },
  {
    href: "/alambic",
    titre: "L'Alambic",
    soustitre: "Studio de fichiers",
    texte:
      "Convertir d'un format à l'autre (documents, tableurs, images, sons, vidéos, archives), fusionner, découper et protéger par mot de passe. Tout se fait dans ton navigateur : aucun fichier n'est envoyé.",
    Icone: FlaskConical,
    accent: "amethyste",
    marque: "Transformer",
  },
  {
    href: "/explorer",
    titre: "Les preuves de la véracité de l'islam",
    soustitre: "La bibliothèque",
    texte:
      "Les trois grands ensembles de la bibliothèque : la véracité de l'islam, la défense de l'islam et la réfutation des autres croyances. Articles, dossiers, sources et outils de lecture.",
    Icone: BookOpen,
    accent: "emeraude",
    marque: "Lire",
  },
] as const;

export default function PageUtilisateur() {
  return (
    <>
      <MarqueAccueil />
      <EnTete />
      <Rosace className="pointer-events-none absolute -right-[36vw] top-[8vw] w-[110vw] max-w-none opacity-30 md:-right-[16rem] md:top-24 md:w-[44rem] md:opacity-70" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-20 pt-6 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Par où veux-tu commencer ?</h1>
        <p className="mt-3 max-w-[58ch] text-lg text-encre-douce">
          Trois espaces : écrire, transformer tes fichiers, lire. Tu passes de l&apos;un à l&apos;autre quand tu veux.
        </p>

        <nav aria-label="Les trois espaces" className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CHOIX.map(({ href, titre, soustitre, texte, Icone, accent, marque }) => (
            <Link key={href} href={href} className="carte-choix" data-accent={accent}>
              <span className="carte-choix-marque">{marque}</span>
              <Icone className="size-9 text-accent" strokeWidth={1.4} aria-hidden="true" />
              <span className="carte-choix-sur">{soustitre}</span>
              <span className="carte-choix-titre">{titre}</span>
              <span className="carte-choix-texte">{texte}</span>
              <span className="carte-choix-pied">
                Entrer
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </nav>
      </main>
    </>
  );
}
