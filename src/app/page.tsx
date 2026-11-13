import Link from "next/link";
import { BookOpen, Heart, MessagesSquare, Network, PenLine, Scale, Sparkles } from "lucide-react";
import { BoutonTheme } from "@/components/BoutonTheme";
import { BoutonRecherche } from "@/components/PaletteRecherche";
import { Rosace } from "@/components/Rosace";

export default function Accueil() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div className="absolute right-5 top-5 z-10 flex gap-2 sm:right-8">
        <BoutonRecherche />
        <BoutonTheme />
      </div>

      <Rosace className="pointer-events-none absolute -right-[38vw] -top-[22vw] w-[120vw] max-w-none opacity-45 md:-right-[14rem] md:top-1/2 md:w-[52rem] md:-translate-y-1/2 md:opacity-90" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-10 pt-[46vw] sm:px-8 md:justify-center md:py-16">
        <div className="max-w-xl">
          <h1 className="text-[clamp(3.25rem,13vw,6.5rem)] font-extrabold">
            Haqq
            <span className="text-or">Reason</span>
          </h1>
          <p className="mt-5 max-w-[30ch] font-display text-2xl font-medium leading-snug text-encre-douce md:text-[1.75rem]">
            La vérité de l&apos;islam, établie par la preuve et par la raison.
          </p>

          <nav aria-label="Choix du mode" className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link href="/explorer" className="verre group rounded-3xl p-6 transition-colors hover:border-or">
              <BookOpen className="size-7 text-or" strokeWidth={1.5} aria-hidden="true" />
              <span className="mt-4 block font-display text-xl font-bold">Mode utilisateur</span>
              <span className="mt-1 block text-encre-douce">Lire la bibliothèque. Aucun mot de passe.</span>
            </Link>
            <Link href="/createur/connexion" className="verre group rounded-3xl p-6 transition-colors hover:border-or">
              <PenLine className="size-7 text-or" strokeWidth={1.5} aria-hidden="true" />
              <span className="mt-4 block font-display text-xl font-bold">Mode créateur</span>
              <span className="mt-1 block text-encre-douce">Écrire, organiser, publier. Protégé par mot de passe.</span>
            </Link>
          </nav>
          <nav aria-label="Outils" className="mt-6 flex flex-wrap gap-2">
            <Link href="/debat" className="puce-filtre">
              <MessagesSquare className="size-4" aria-hidden="true" />
              Débat express
            </Link>
            <Link href="/graphe" className="puce-filtre">
              <Network className="size-4" aria-hidden="true" />
              Graphe de connaissances
            </Link>
            <Link href="/favoris" className="puce-filtre">
              <Heart className="size-4" aria-hidden="true" />
              Mes favoris
            </Link>
            <Link href="/sophismes" className="puce-filtre">
              <Scale className="size-4" aria-hidden="true" />
              Sophismes
            </Link>
            <Link href="/nouveautes" className="puce-filtre">
              <Sparkles className="size-4" aria-hidden="true" />
              Nouveautés
            </Link>
          </nav>
        </div>
      </div>
    </main>
  );
}
