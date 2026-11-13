import type { Metadata } from "next";
import { EnTete } from "@/components/EnTete";
import { FAMILLES_SOPHISMES, SOPHISMES } from "@/lib/sophismes";
import { FiltreSophismes } from "./FiltreSophismes";

export const metadata: Metadata = {
  title: "Bibliothèque des sophismes",
  description: "Les erreurs de raisonnement les plus courantes dans les débats, avec un exemple et la manière d'y répondre.",
};

export default function PageSophismes() {
  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">Bibliothèque des sophismes</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">
          Reconnaître une erreur de raisonnement, c&apos;est pouvoir y répondre avec calme et précision. Chaque fiche donne une définition, un
          exemple, et la façon de ramener la discussion sur le fond.
        </p>
        <FiltreSophismes />
        {FAMILLES_SOPHISMES.map((famille) => (
          <section key={famille} className="mt-12 famille-sophismes" data-famille={famille} aria-labelledby={`famille-${famille}`}>
            <h2 id={`famille-${famille}`} className="text-2xl font-bold">
              {famille}
            </h2>
            <div className="mt-5 grid gap-4">
              {SOPHISMES.filter((s) => s.famille === famille).map((s) => (
                <article key={s.cle} id={s.cle} className="fiche-sophisme" data-recherche={`${s.nom} ${s.latin ?? ""} ${s.definition}`.toLowerCase()}>
                  <h3 className="font-display text-xl font-bold">
                    {s.nom}
                    {s.latin && <span className="ml-2 text-base font-normal italic text-encre-douce">{s.latin}</span>}
                  </h3>
                  <p className="mt-2">{s.definition}</p>
                  <p className="mt-3 text-encre-douce">
                    <strong className="text-encre">Exemple.</strong> {s.exemple}
                  </p>
                  <p className="mt-2">
                    <strong className="text-accent">Comment répondre.</strong> {s.reponse}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
