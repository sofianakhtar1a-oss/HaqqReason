import type { Metadata } from "next";
import { BoutonConfirmation } from "@/components/BoutonConfirmation";
import { FilAriane } from "@/components/FilAriane";
import { exigerCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";
import { supprimerSynonymes } from "./actions";
import { FormulaireSynonymes } from "./FormulaireSynonymes";

export const metadata: Metadata = { title: "Synonymes de recherche", robots: { index: false } };

export default async function Synonymes() {
  await exigerCreateur();
  const { data } = await dbAdmin().from("synonymes").select("id, termes").order("created_at", { ascending: false });
  const groupes = (data ?? []) as { id: string; termes: string[] }[];

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: "/createur/synonymes", libelle: "Synonymes" },
          ]}
        />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Synonymes de recherche</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Un groupe relie des mots qui désignent la même chose. Quand un lecteur cherche l&apos;un d&apos;eux, la recherche trouve aussi les articles
          qui emploient les autres.
        </p>
        <div className="verre panneau mt-8">
          <FormulaireSynonymes />
        </div>
        {groupes.length > 0 && (
          <ul className="mt-8 space-y-3">
            {groupes.map((g) => (
              <li key={g.id} className="verre flex flex-wrap items-center gap-4 rounded-3xl p-5">
                <ul className="flex flex-1 flex-wrap gap-2" aria-label="Termes du groupe">
                  {g.termes.map((t) => (
                    <li key={t} className="etiquette-puce">
                      {t}
                    </li>
                  ))}
                </ul>
                <form action={supprimerSynonymes}>
                  <input type="hidden" name="id" value={g.id} />
                  <BoutonConfirmation libelle="Supprimer" confirmation="Oui, supprimer" enCours="Suppression…" className="bouton bouton-danger !min-h-10 text-sm" />
                </form>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
