import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { LienAccueil } from "@/components/LienAccueil";
import { Logo } from "@/components/Logo";
import { RetourConnexion } from "./RetourConnexion";

export const metadata: Metadata = { title: "Hors ligne", robots: { index: false } };

/** Page affichée par le service hors-ligne quand une page n'a jamais été consultée et que la connexion manque. */
export default function HorsLigne() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
      <Logo />
      {/* Le signal cherche : deux ondes d'or partent de l'icône (voir .signal-perdu). */}
      <span className="signal-perdu mt-10">
        <WifiOff className="size-12 text-or" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-4xl font-extrabold">Pas de connexion</h1>
      <p className="mt-4 text-lg text-encre-douce">
        Cette page n&apos;a pas encore été enregistrée sur ton appareil. Les articles déjà ouverts et tes favoris restent lisibles.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/favoris" className="bouton bouton-principal">
          Mes favoris
        </Link>
        <LienAccueil className="bouton bouton-discret">Accueil</LienAccueil>
      </div>
      <RetourConnexion />
    </main>
  );
}
