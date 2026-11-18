import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { CadreCreateur } from "@/components/CadreCreateur";
import { ContactReseaux } from "@/components/ContactReseaux";
import { aAccesModules } from "@/lib/acces-modules";
import { retourSur } from "@/lib/acces-modules-jeton";
import { FormulaireAcces } from "./FormulaireAcces";

export const metadata: Metadata = { title: "Accès réservé", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const NOMS = {
  preuves: "Les preuves de la véracité de l'islam",
  islam: "L'Islam authentique",
} as const;

/** Porte des deux modules réservés : le mot de passe, ou les comptes où le demander. */
export default async function PageAcces({ searchParams }: Props) {
  const sp = await searchParams;
  const retour = retourSur(typeof sp.retour === "string" ? sp.retour : null);
  if (await aAccesModules()) redirect(retour);
  const espace = sp.module === "islam" ? "islam" : "preuves";

  return (
    <CadreCreateur>
      <span className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--or)_18%,transparent)] text-or">
        <LockKeyhole className="size-6" strokeWidth={1.7} aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-3xl font-extrabold">Module réservé</h1>
      <p className="mt-3 text-encre-douce">
        «&nbsp;{NOMS[espace]}&nbsp;» s&apos;ouvre avec un mot de passe. Il donne aussi accès à «&nbsp;{NOMS[espace === "islam" ? "preuves" : "islam"]}&nbsp;»,
        au graphe de connaissances et à la recherche dans la bibliothèque.
      </p>

      <div className="mt-6">
        <FormulaireAcces retour={retour} />
      </div>

      <h2 className="mt-8 text-lg font-bold">Tu n&apos;as pas le mot de passe ?</h2>
      <p className="mt-1.5 text-encre-douce">Envoie-moi un message sur Instagram ou sur TikTok : je te le donnerai.</p>
      <ContactReseaux className="mt-4" />

      <Link href="/" className="mt-7 inline-flex items-center gap-2 font-semibold text-encre-douce hover:text-encre">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Retour à l&apos;accueil
      </Link>
    </CadreCreateur>
  );
}
