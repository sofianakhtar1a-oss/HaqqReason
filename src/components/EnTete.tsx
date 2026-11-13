import Link from "next/link";
import { Heart, MessagesSquare, Network } from "lucide-react";
import { BoutonTheme } from "./BoutonTheme";
import { Logo } from "./Logo";
import { BoutonRecherche } from "./PaletteRecherche";

const OUTILS = [
  { href: "/debat", libelle: "Débat express", Icone: MessagesSquare },
  { href: "/graphe", libelle: "Graphe", Icone: Network, cache: "lien-outil-secondaire" },
  { href: "/favoris", libelle: "Favoris", Icone: Heart },
];

export function EnTete({
  children,
  outils = true,
}: {
  children?: React.ReactNode;
  outils?: boolean;
}) {
  return (
    <header className="sans-impression mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
      <Logo />
      <div className="flex items-center gap-1.5 sm:gap-2">
        {outils && (
          <nav aria-label="Outils" className="flex items-center gap-1">
            {OUTILS.map(({ href, libelle, Icone, cache }) => (
              <Link
                key={href}
                href={href}
                className={cache ? `lien-outil ${cache}` : "lien-outil"}
                title={libelle}
              >
                <Icone className="size-5" aria-hidden="true" />
                <span className="sr-only lg:not-sr-only">{libelle}</span>
              </Link>
            ))}
          </nav>
        )}
        <BoutonRecherche />
        {children}
        <BoutonTheme />
      </div>
    </header>
  );
}
