import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Hors ligne", robots: { index: false } };

/** Page affichée par le service hors-ligne quand une page n'a jamais été consultée et que la connexion manque. */
export default function HorsLigne() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
      <Logo />
      <WifiOff className="mt-10 size-12 text-or" strokeWidth={1.5} aria-hidden="true" />
      <h1 className="mt-6 text-4xl font-extrabold">Pas de connexion</h1>
      <p className="mt-4 text-lg text-encre-douce">
        Cette page n&apos;a pas encore été enregistrée sur ton appareil. Les articles déjà ouverts et tes favoris restent lisibles.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/favoris" className="bouton bouton-principal">
          Mes favoris
        </Link>
        <Link href="/" className="bouton bouton-discret">
          Accueil
        </Link>
      </div>
    </main>
  );
}
