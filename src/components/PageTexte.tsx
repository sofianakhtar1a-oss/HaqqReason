import { EnTete } from "./EnTete";

export type SectionTexte = { titre: string; paragraphes: React.ReactNode[] };

/** Mise en page des pages de texte suivi (confidentialité, conditions d'utilisation). */
export function PageTexte({ titre, intro, misAJour, sections }: { titre: string; intro: string; misAJour: string; sections: SectionTexte[] }) {
  return (
    <>
      <EnTete />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-20 pt-4 sm:px-8">
        <h1 className="text-4xl font-extrabold md:text-5xl">{titre}</h1>
        <p className="mt-3 max-w-[64ch] text-lg text-encre-douce">{intro}</p>
        <p className="mt-2 text-sm text-encre-douce">Dernière mise à jour : {misAJour}</p>
        <div className="mt-10 grid gap-9">
          {sections.map((s, n) => (
            <section key={s.titre} aria-labelledby={`section-${n}`}>
              <h2 id={`section-${n}`} className="font-display text-2xl font-bold">
                {s.titre}
              </h2>
              <div className="mt-3 grid max-w-[68ch] gap-3 leading-relaxed text-encre-douce">
                {s.paragraphes.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
