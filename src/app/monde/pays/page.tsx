import type { Metadata } from "next";
import Link from "next/link";
import { EnTete } from "@/components/EnTete";
import { CONTINENTS, motCapitale, urlDrapeau } from "@/lib/monde/atlas";
import { NOMBRE_PAYS } from "@/lib/monde/chiffres";
import { PAYS } from "@/lib/monde/donnees";
import { adressePays } from "@/lib/monde/pages-publiques";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import "./pays.css";

/* Tous les pays du monde, rangés par continent : la porte d'entrée publique du Portulan. */

export const metadata: Metadata = {
  title: "Tous les pays du monde : capitales, drapeaux et chiffres",
  description: `Les ${NOMBRE_PAYS} pays et territoires du monde, continent par continent : capitale, drapeau, population, langues, monnaie, devise et histoire de chacun.`,
  alternates: { canonical: "/monde/pays" },
  openGraph: { type: "website", title: "Tous les pays du monde · Le Portulan", locale: "fr_FR" },
};

const collator = new Intl.Collator("fr", { sensitivity: "base" });

export default function PagePays() {
  return (
    <>
      <EnTete />
      <main className="pp">
        <header className="pp-index-tete">
          <h1 className="pp-nom">Les pays du monde</h1>
          <p className="pp-chapo">
            {NOMBRE_PAYS} pays et territoires, continent par continent. Chacun a sa page : sa capitale, son drapeau, ses chiffres, sa devise et l&apos;histoire de son
            nom. Pour les retenir, Le Portulan les fait jouer.
          </p>
          <nav className="pp-continents" aria-label="Les continents">
            {CONTINENTS.map((c) => (
              <a key={c.id} href={`#${c.id}`}>
                {c.nom}
              </a>
            ))}
          </nav>
        </header>
        {CONTINENTS.map((c) => {
          const liste = PAYS.filter((p) => p.continent === c.id).sort((a, b) => collator.compare(a.nom, b.nom));
          if (!liste.length) return null;
          return (
            <section key={c.id} id={c.id} className="pp-section pp-continent" aria-labelledby={`pp-c-${c.id}`}>
              <h2 id={`pp-c-${c.id}`} className="pp-sous-titre">
                {c.nom} <small>{liste.length}</small>
              </h2>
              <ul className="pp-grille">
                {liste.map((p) => (
                  <li key={p.code}>
                    <Link href={adressePays(p)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urlDrapeau(p)} alt="" width={42} height={28} loading="lazy" />
                      <span>
                        <strong>{p.nom}</strong>
                        {p.capitale && (
                          <small>
                            {motCapitale(p)} : {p.capitale}
                          </small>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <section className="pp-jouer" aria-labelledby="pp-jouer">
          <h2 id="pp-jouer">Les retenir pour de bon</h2>
          <p>Drapeaux, capitales, cartes, continents et monnaies : quinze niveaux par route, des duels entre amis, et des révisions qui reviennent au bon moment.</p>
          <Link href="/monde" className="bouton bouton-principal">
            Jouer au Portulan
          </Link>
        </section>
      </main>
    </>
  );
}
