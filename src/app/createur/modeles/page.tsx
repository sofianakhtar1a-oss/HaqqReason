import type { Metadata } from "next";
import { LayoutTemplate } from "lucide-react";
import { BoutonConfirmation } from "@/components/BoutonConfirmation";
import { FilAriane } from "@/components/FilAriane";
import { MODELES_INTEGRES } from "@/lib/modeles-integres";
import { exigerCreateur } from "@/lib/session";
import { dbAdmin } from "@/lib/supabase";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";
import { supprimerModele } from "../contenu-actions";

export const metadata: Metadata = { title: "Modèles d'articles", robots: { index: false } };

export default async function Modeles() {
  await exigerCreateur();
  const { data } = await dbAdmin().from("modeles").select("id, nom, description, created_at").order("nom");
  const perso = data ?? [];

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane
          etapes={[
            { href: "/createur", libelle: "Espace créateur" },
            { href: "/createur/modeles", libelle: "Modèles" },
          ]}
        />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">Modèles d&apos;articles</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Un modèle donne sa structure à un nouvel article. Choisis-le au moment de créer l&apos;article. Pour créer ton propre
          modèle, ouvre un article et utilise « Enregistrer comme modèle ».
        </p>

        <section className="mt-12" aria-labelledby="titre-fournis">
          <h2 id="titre-fournis" className="text-2xl font-bold">
            Modèles fournis
          </h2>
          <p className="mt-2 text-encre-douce">Ils ne contiennent qu&apos;une structure et des consignes, que tu remplaces par ton texte.</p>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {MODELES_INTEGRES.map((m) => (
              <li key={m.cle} className="verre rounded-3xl p-6">
                <LayoutTemplate className="size-6 text-or" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="mt-3 text-lg font-bold">{m.nom}</h3>
                <p className="mt-1 text-encre-douce">{m.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12" aria-labelledby="titre-perso">
          <h2 id="titre-perso" className="text-2xl font-bold">
            Mes modèles
          </h2>
          {perso.length === 0 ? (
            <p className="mt-2 text-encre-douce">Aucun pour l&apos;instant.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {perso.map((m) => (
                <li key={m.id} className="verre flex flex-wrap items-center gap-4 rounded-3xl p-5">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{m.nom}</h3>
                    {m.description && <p className="text-sm text-encre-douce">{m.description}</p>}
                  </div>
                  <form action={supprimerModele}>
                    <input type="hidden" name="id" value={m.id} />
                    <BoutonConfirmation libelle="Supprimer" confirmation="Oui, supprimer" enCours="Suppression…" />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
