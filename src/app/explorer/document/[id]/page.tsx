import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AffichageDocument } from "@/components/AffichageDocument";
import { EnTete } from "@/components/EnTete";
import { FilAriane } from "@/components/FilAriane";
import { contexteDocument } from "@/lib/fil-document";
import { lireAnnotations, lireFichier } from "@/lib/fichiers-donnees";
import { motsDeRequete } from "@/lib/recherche-texte";
import { sessionCreateur } from "@/lib/session";
import { estUuid } from "@/lib/validation";

export async function generateMetadata({ params }: PageProps<"/explorer/document/[id]">): Promise<Metadata> {
  const { id } = await params;
  const f = estUuid(id) ? await lireFichier(id, "public") : null;
  return { title: f?.nom ?? "Document introuvable" };
}

export default async function PageDocument({ params, searchParams }: PageProps<"/explorer/document/[id]">) {
  const { id } = await params;
  if (!estUuid(id)) notFound();
  const sp = await searchParams;
  // Lecteur : seulement un document rattaché à un contenu publié. Le créateur connecté peut aussi prévisualiser les autres.
  let mode: "public" | "createur" = "public";
  let fichier = await lireFichier(id, "public");
  const createur = (await sessionCreateur()) !== null;
  if (!fichier && createur) {
    fichier = await lireFichier(id, "createur");
    mode = "createur";
  }
  if (!fichier) notFound();

  const [{ etapes, accent }, annotations] = await Promise.all([contexteDocument(fichier, "public"), lireAnnotations(id, "public")]);
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const termes = typeof sp.q === "string" ? motsDeRequete(sp.q) : [];

  return (
    <div data-accent={accent} className="flex flex-1 flex-col">
      <EnTete>
        {createur && (
          <Link href={`/createur/document/${id}`} className="bouton bouton-discret !min-h-11">
            Annoter
          </Link>
        )}
      </EnTete>
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane etapes={mode === "public" ? etapes : etapes.slice(-1)} />
        <h1 className="mt-6 text-3xl font-extrabold md:text-4xl">{fichier.nom}</h1>
        {mode === "createur" && <p className="message message-succes mt-4">Aperçu : ce document n&apos;est pas encore visible par les lecteurs.</p>}
        <div className="mt-6">
          <AffichageDocument fichier={fichier} annotations={annotations} page={page} termes={termes} />
        </div>
      </main>
    </div>
  );
}
