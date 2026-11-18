import Link from "next/link";
import { BookOpen, Heart, Lightbulb, MessagesSquare, Network, PenLine, Scale, Sparkles } from "lucide-react";
import { BoutonTheme } from "@/components/BoutonTheme";
import { BoutonCompte } from "@/components/compte/BoutonCompte";
import { BoutonRecherche } from "@/components/PaletteRecherche";
import { Astrolabe } from "@/components/scene/Astrolabe";
import { Ciel } from "@/components/scene/Ciel";
import { MarqueAccueil } from "@/lib/client/acces";
import { googleConfigure } from "@/lib/compte/jeton";

/** Chaque lettre du titre se pose à son tour (les lecteurs d'écran lisent le mot entier). */
function Lettres({ texte, depart = 0 }: { texte: string; depart?: number }) {
  return texte.split("").map((lettre, i) => (
    <span key={i} className="lettre" style={{ "--i": depart + i } as React.CSSProperties} aria-hidden="true">
      {lettre}
    </span>
  ));
}

const delai = (secondes: number) => ({ "--delai": `${secondes}s` }) as React.CSSProperties;

export default function Accueil() {
  return (
    <main className="accueil relative flex flex-1 flex-col overflow-hidden">
      <MarqueAccueil />
      <Ciel />
      <div className="apparait absolute right-5 top-5 z-10 flex gap-2 sm:right-8" style={delai(1.15)}>
        <BoutonRecherche />
        <BoutonTheme />
        <BoutonCompte />
      </div>

      <Astrolabe className="pointer-events-none absolute -right-[38vw] -top-[22vw] w-[120vw] max-w-none opacity-45 md:-right-[14rem] md:top-1/2 md:w-[52rem] md:-translate-y-1/2 md:opacity-90" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-10 pt-[46vw] sm:px-8 md:justify-center md:py-16">
        <div className="max-w-xl">
          <h1 className="titre-lettres text-[clamp(3.25rem,13vw,6.5rem)] font-extrabold">
            <span className="sr-only">HaqqReason</span>
            <Lettres texte="Haqq" />
            <span className="mot-or text-or">
              <Lettres texte="Reason" depart={4} />
              <span className="etincelle -right-[0.16em] top-[0.06em]" style={{ "--delai": "1.9s", "--cycle": "7.5s" } as React.CSSProperties} aria-hidden="true" />
              <span className="etincelle left-[1.1em] -top-[0.12em] scale-75" style={{ "--delai": "4.6s", "--cycle": "9s" } as React.CSSProperties} aria-hidden="true" />
            </span>
          </h1>
          <p className="apparait mt-5 max-w-[30ch] font-display text-2xl font-medium leading-snug text-encre-douce md:text-[1.75rem]" style={delai(0.5)}>
            La vérité de l&apos;islam, établie par la preuve et par la raison.
          </p>
          <span className="trait-or" aria-hidden="true" />

          <nav aria-label="Choix du mode" className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/utilisateur"
              className="verre carte-vivante apparait group rounded-3xl p-6 transition-colors hover:border-or"
              style={delai(0.8)}
              data-inclinaison="8"
              data-cible
              data-accent="or"
              data-portail="Mode utilisateur"
              data-portail-sur="Les espaces"
            >
              <span className="carte-lueur" aria-hidden="true" />
              <BookOpen className="carte-icone size-7 text-or" strokeWidth={1.5} aria-hidden="true" />
              <span className="mt-4 block font-display text-xl font-bold">Mode utilisateur</span>
              <span className="mt-1 block text-encre-douce">
                {googleConfigure()
                  ? "Écrire, apprendre, convertir ses fichiers, lire la bibliothèque. Avec ton compte Google : ton travail te suit partout."
                  : "Écrire, apprendre, convertir ses fichiers, ou lire la bibliothèque. Aucun mot de passe."}
              </span>
            </Link>
            <Link
              href="/createur/connexion"
              className="verre carte-vivante apparait group rounded-3xl p-6 transition-colors hover:border-or"
              style={delai(0.9)}
              data-inclinaison="8"
              data-cible
              data-accent="or"
              data-portail="Mode créateur"
              data-portail-sur="Espace protégé"
            >
              <span className="carte-lueur" aria-hidden="true" />
              <PenLine className="carte-icone size-7 text-or" strokeWidth={1.5} aria-hidden="true" />
              <span className="mt-4 block font-display text-xl font-bold">Mode créateur</span>
              <span className="mt-1 block text-encre-douce">Écrire, organiser, publier. Protégé par mot de passe.</span>
            </Link>
          </nav>
          <nav aria-label="Outils" className="mt-6 flex flex-wrap gap-2">
            <Link href="/debat" className="puce-filtre apparait" style={delai(1.00)} data-cible>
              <MessagesSquare className="size-4" aria-hidden="true" />
              Débat express
            </Link>
            <Link href="/graphe" className="puce-filtre apparait" style={delai(1.05)} data-cible>
              <Network className="size-4" aria-hidden="true" />
              Graphe de connaissances
            </Link>
            <Link href="/favoris" className="puce-filtre apparait" style={delai(1.10)} data-cible>
              <Heart className="size-4" aria-hidden="true" />
              Mes favoris
            </Link>
            <Link href="/sophismes" className="puce-filtre apparait" style={delai(1.15)} data-cible>
              <Scale className="size-4" aria-hidden="true" />
              Sophismes
            </Link>
            <Link href="/contribuer" className="puce-filtre apparait" style={delai(1.20)} data-cible>
              <Lightbulb className="size-4" aria-hidden="true" />
              Contribuer
            </Link>
            <Link href="/nouveautes" className="puce-filtre apparait" style={delai(1.25)} data-cible>
              <Sparkles className="size-4" aria-hidden="true" />
              Nouveautés
            </Link>
          </nav>
        </div>
      </div>
      <nav aria-label="Informations" className="apparait relative mx-auto flex w-full max-w-6xl gap-5 px-5 pb-6 text-sm text-encre-douce sm:px-8" style={delai(1.35)}>
        <Link href="/confidentialite" className="underline-offset-4 hover:text-encre hover:underline">
          Confidentialité
        </Link>
        <Link href="/conditions" className="underline-offset-4 hover:text-encre hover:underline">
          Conditions d&apos;utilisation
        </Link>
      </nav>
    </main>
  );
}
