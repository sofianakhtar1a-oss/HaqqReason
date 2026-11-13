import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AffichageDocument } from "@/components/AffichageDocument";
import { FilAriane } from "@/components/FilAriane";
import { contexteDocument } from "@/lib/fil-document";
import { lireAnnotations, lireFichier } from "@/lib/fichiers-donnees";
import { motsDeRequete } from "@/lib/recherche-texte";
import { exigerCreateur } from "@/lib/session";
import { estUuid } from "@/lib/validation";
import { EnTeteCreateur } from "../../_composants/EnTeteCreateur";
import { GestionnaireFichiers } from "../../_composants/GestionnaireFichiers";

export const metadata: Metadata = { title: "Document", robots: { index: false } };

export default async function DocumentCreateur({ params, searchParams }: PageProps<"/createur/document/[id]">) {
  await exigerCreateur();
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const fichier = await lireFichier(id, "createur");
  if (!fichier) notFound();
  const sp = await searchParams;
  const [{ etapes, accent, parent }, annotations] = await Promise.all([contexteDocument(fichier, "createur"), lireAnnotations(id, "createur")]);
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const termes = typeof sp.q === "string" ? motsDeRequete(sp.q) : [];

  return (
    <div data-accent={accent} className="flex flex-1 flex-col">
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane etapes={etapes} />
        <h1 className="mt-6 text-3xl font-extrabold md:text-4xl">{fichier.nom}</h1>
        {fichier.type_mime === "application/pdf" && (
          <p className="mt-3 max-w-[70ch] text-encre-douce">
            Pour annoter : choisis l&apos;outil Surligner et trace un rectangle sur la page, ou l&apos;outil Note et clique à l&apos;endroit voulu. Une
            annotation est visible par les lecteurs, sauf si tu la rends privée.
          </p>
        )}
        <div className="mt-6">
          <AffichageDocument fichier={fichier} annotations={annotations} page={page} termes={termes} createur />
        </div>
        <section className="mt-10 max-w-3xl" aria-labelledby="titre-gestion">
          <h2 id="titre-gestion" className="text-2xl font-bold">
            Gérer ce document
          </h2>
          <p className="mt-2 text-encre-douce">Il est rattaché à « {parent.titre} ».</p>
          <div className="mt-4">
            <GestionnaireFichiers cible={{ type: parent.type, id: parent.id }} fichiers={[fichier]} />
          </div>
        </section>
      </main>
    </div>
  );
}
