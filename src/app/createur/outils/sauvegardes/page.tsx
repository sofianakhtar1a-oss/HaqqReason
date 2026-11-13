import type { Metadata } from "next";
import { FilAriane } from "@/components/FilAriane";
import { exigerCreateur } from "@/lib/session";
import { listerSauvegardes } from "@/lib/stockage";
import { EnTeteCreateur } from "../../_composants/EnTeteCreateur";
import { Sauvegardes } from "./Sauvegardes";

export const metadata: Metadata = { title: "Sauvegardes", robots: { index: false } };

export default async function PageSauvegardes() {
  await exigerCreateur();
  const copies = await listerSauvegardes().catch(() => []);
  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: "/createur/outils", libelle: "Outils" },
            { href: "/createur/outils/sauvegardes", libelle: "Sauvegardes" },
          ]}
        />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Sauvegardes</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">Des années de travail ne doivent jamais dépendre d&apos;un seul endroit.</p>
        <Sauvegardes copies={copies} />
      </main>
    </>
  );
}
