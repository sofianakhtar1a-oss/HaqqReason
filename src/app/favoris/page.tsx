import type { Metadata } from "next";
import { EnTete } from "@/components/EnTete";
import { ListeFavoris } from "./ListeFavoris";

export const metadata: Metadata = { title: "Mes favoris", robots: { index: false } };

export default function PageFavoris() {
  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Mes favoris</h1>
        <p className="mt-3 max-w-[60ch] text-lg text-encre-douce">
          Les articles que tu as gardés sur cet appareil. Ils restent lisibles même sans connexion.
        </p>
        <ListeFavoris />
      </main>
    </>
  );
}
