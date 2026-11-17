import type { Metadata } from "next";
import { EnTete } from "@/components/EnTete";
import { exigerCompte } from "@/lib/compte/session";
import { ListeFavoris } from "./ListeFavoris";

export const metadata: Metadata = { title: "Mes favoris", robots: { index: false } };

export default async function PageFavoris() {
  const compte = await exigerCompte("/favoris");
  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Mes favoris</h1>
        <p className="mt-3 max-w-[60ch] text-lg text-encre-douce">
          {compte ? "Les articles que tu as gardés. Ils te suivent sur tous tes appareils, et restent lisibles même sans connexion." : "Les articles que tu as gardés sur cet appareil. Ils restent lisibles même sans connexion."}
        </p>
        <ListeFavoris />
      </main>
    </>
  );
}
