import { Heart, Lightbulb, MessagesSquare, Network } from "lucide-react";
import { BoutonTheme } from "./BoutonTheme";
import { BoutonCompte } from "./compte/BoutonCompte";
import { LienOutil } from "./LienOutil";
import { Logo } from "./Logo";
import { BoutonRecherche } from "./PaletteRecherche";

const OUTILS = [
  { href: "/debat", libelle: "Débat express", Icone: MessagesSquare, cache: "lien-outil-etroit" },
  { href: "/graphe", libelle: "Graphe", Icone: Network, cache: "lien-outil-secondaire" },
  { href: "/contribuer", libelle: "Contribuer", Icone: Lightbulb, cache: "lien-outil-secondaire" },
  { href: "/favoris", libelle: "Favoris", Icone: Heart },
];

export function EnTete({
  children,
  outils = true,
  compte = true,
}: {
  children?: React.ReactNode;
  outils?: boolean;
  /** La pastille du compte utilisateur ; l'espace créateur, qui a sa propre session, ne l'affiche pas. */
  compte?: boolean;
}) {
  return (
    <header className="sans-impression mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
      <Logo />
      <div className="flex items-center gap-1.5 sm:gap-2">
        {outils && (
          <nav aria-label="Outils" className="flex items-center gap-1">
            {OUTILS.map(({ href, libelle, Icone, cache }) => (
              <LienOutil
                key={href}
                href={href}
                className={cache ? `lien-outil ${cache}` : "lien-outil"}
                title={libelle}
              >
                <Icone className="size-5" aria-hidden="true" />
                <span className="sr-only lg:not-sr-only">{libelle}</span>
              </LienOutil>
            ))}
          </nav>
        )}
        <BoutonRecherche />
        {children}
        <BoutonTheme />
        {compte && <BoutonCompte />}
      </div>
    </header>
  );
}
