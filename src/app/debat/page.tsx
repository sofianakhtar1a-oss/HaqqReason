import type { Metadata } from "next";
import { EnTete } from "@/components/EnTete";
import { RenduDocument } from "@/components/RenduDocument";
import { listerBlocs } from "@/lib/content";
import { fichesDebat } from "@/lib/debat";
import { DebatExpress } from "./DebatExpress";

export const metadata: Metadata = {
  title: "Débat express",
  description: "Les objections et leurs réponses, à retrouver en quelques secondes pendant une discussion.",
};

export default async function PageDebat() {
  const [fiches, blocs] = await Promise.all([fichesDebat(), listerBlocs()]);
  const listeBlocs = blocs.ok ? blocs.donnees : [];
  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Débat express</h1>
        <p className="mt-3 max-w-[60ch] text-lg text-encre-douce">
          Tape un mot de l&apos;objection que l&apos;on te fait : la réponse est à un geste. Les fiches viennent des blocs Objection → Réponse des
          articles.
        </p>
        <DebatExpress
          blocs={listeBlocs.map((b) => ({ id: b.id, titre: b.titre, accent: b.accent }))}
          fiches={fiches.map((f) => ({
            cle: f.cle,
            articleId: f.articleId,
            articleTitre: f.articleTitre,
            blocId: f.blocId,
            objection: f.objection,
            recherche: f.recherche,
            reponse: <RenduDocument document={f.reponse} />,
          }))}
        />
      </main>
    </>
  );
}
