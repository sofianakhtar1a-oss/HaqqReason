import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnTete } from "@/components/EnTete";
import { editionPortulan } from "@/lib/monde/atelier";
import { formatPopulation, formatSuperficie, LIBELLES_STATUT, motCapitale, NOM_CONTINENT, PAR_CODE, urlDrapeau } from "@/lib/monde/atlas";
import { NOMBRE_PAYS } from "@/lib/monde/chiffres";
import { PAYS } from "@/lib/monde/donnees";
import { recitCorrige } from "@/lib/monde/edition";
import { capitaliser, duNom, habitantsDe, leNom } from "@/lib/monde/francais";
import { decalageMinutes, formatDecalage, formatDensite, formatKm, formatVille } from "@/lib/monde/geo";
import { ORGANISATIONS } from "@/lib/monde/organisations";
import { adressePays, paysDuSlug } from "@/lib/monde/pages-publiques";
import { RECITS } from "@/lib/monde/recits";
import type { Pays } from "@/lib/monde/types";
import { adresseDuSite } from "@/lib/site";
import "@fontsource-variable/literata/opsz.css";
import "@fontsource-variable/literata/opsz-italic.css";
import "../pays.css";

/*
 * La page publique d'un pays : ce qu'on cherche (sa capitale, son drapeau, sa population), puis ce
 * qu'on retient (sa devise, son hymne, l'histoire de son drapeau). Ouverte à tous, sans compte,
 * pour les moteurs de recherche et pour qui reçoit un lien ; le jeu, lui, demande un compte.
 */

type Props = { params: Promise<{ slug: string }> };

async function chiffresDe(p: Pays) {
  const edition = await editionPortulan();
  const v = edition.population?.valeurs[p.code];
  const population = v && (!p.anneePopulation || v[1] >= p.anneePopulation) ? { n: v[0], annee: v[1] as number | null } : { n: p.population, annee: p.anneePopulation };
  return { population, recit: recitCorrige(RECITS[p.code], edition.fiches[p.code]) };
}

function description(p: Pays, population: number | null): string {
  const morceaux = [
    p.capitale ? `${motCapitale(p)} : ${p.capitale}` : null,
    population ? `${formatPopulation(population)}` : null,
    p.langues.length ? `langue${p.langues.length > 1 ? "s" : ""} : ${p.langues.slice(0, 3).join(", ")}` : null,
    p.monnaies[0] ? `monnaie : ${p.monnaies[0].nom}` : null,
  ].filter(Boolean);
  return `${capitaliser(leNom(p))} (${NOM_CONTINENT[p.continent]}) : ${morceaux.join(", ")}. Son drapeau, sa devise, son hymne et l'histoire de son nom.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = paysDuSlug((await params).slug);
  if (!p) return { title: "Pays introuvable", robots: { index: false } };
  const { population } = await chiffresDe(p);
  const titre = p.capitale ? `${p.nom} : capitale, drapeau, population et devise` : `${p.nom} : drapeau, population et repères`;
  const adresse = adressePays(p);
  return {
    title: titre,
    description: description(p, population.n),
    alternates: { canonical: adresse },
    openGraph: { type: "article", title: `${p.nom} · Le Portulan`, description: description(p, population.n), url: adresse, locale: "fr_FR" },
    twitter: { card: "summary_large_image", title: `${p.nom} · Le Portulan` },
  };
}

function Fait({ terme, children }: { terme: string; children: React.ReactNode }) {
  return (
    <div className="pp-fait">
      <dt>{terme}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default async function PagePays({ params }: Props) {
  const p = paysDuSlug((await params).slug);
  if (!p) notFound();
  const { population, recit } = await chiffresDe(p);
  const voisins = p.voisins.map((c) => PAR_CODE.get(c)).filter((x): x is Pays => Boolean(x));
  const memeRegion = PAYS.filter((x) => x.sousRegion === p.sousRegion && x.code !== p.code).sort((a, b) => a.rang - b.rang).slice(0, 12);
  const decalage = p.fuseau ? formatDecalage(decalageMinutes(p.fuseau)) : null;
  const habitants = habitantsDe(p);
  const densite = formatDensite(population.n, p.superficie);
  const souverain = p.souverain ? PAR_CODE.get(p.souverain) : undefined;
  const site = adresseDuSite();

  // Les données structurées : un pays, sa capitale, son continent, et le fil d'Ariane.
  const donnees = [
    {
      "@context": "https://schema.org",
      "@type": "Country",
      name: p.nom,
      alternateName: [p.complet, p.nomEn].filter(Boolean),
      url: new URL(adressePays(p), site).toString(),
      image: new URL(urlDrapeau(p), site).toString(),
      containedInPlace: { "@type": "Continent", name: NOM_CONTINENT[p.continent] },
      ...(p.capitale ? { containsPlace: { "@type": "City", name: p.capitale } } : {}),
      geo: { "@type": "GeoCoordinates", latitude: p.latlng[0], longitude: p.latlng[1] },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Le Portulan", item: new URL("/monde/pays", site).toString() },
        { "@type": "ListItem", position: 2, name: NOM_CONTINENT[p.continent], item: new URL(`/monde/pays#${p.continent}`, site).toString() },
        { "@type": "ListItem", position: 3, name: p.nom, item: new URL(adressePays(p), site).toString() },
      ],
    },
  ];

  return (
    <>
      <EnTete />
      <main className="pp">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees).replace(/</g, "\\u003c") }} />
        <nav className="pp-ariane" aria-label="Fil d'Ariane">
          <Link href="/monde/pays">Les pays du monde</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/monde/pays#${p.continent}`}>{NOM_CONTINENT[p.continent]}</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{p.nom}</span>
        </nav>

        <header className="pp-tete">
          <figure className="pp-planche">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlDrapeau(p)} alt={`Le drapeau ${duNom(p)}`} width={360} height={240} fetchPriority="high" />
          </figure>
          <div className="pp-titres">
            <p className="pp-region">
              {p.sousRegion}
              {p.statut !== "etat" && <span className="pp-statut"> · {LIBELLES_STATUT[p.statut]}</span>}
            </p>
            <h1 className="pp-nom">{p.nom}</h1>
            {p.complet && p.complet !== p.nom && <p className="pp-complet">{p.complet}</p>}
            {p.capitale && (
              <p className="pp-capitale">
                {motCapitale(p)} : <strong>{p.capitale}</strong>
              </p>
            )}
            {recit?.devise && <p className="pp-devise">« {recit.devise} »</p>}
          </div>
        </header>

        <section className="pp-section" aria-labelledby="pp-chiffres">
          <h2 id="pp-chiffres" className="pp-sous-titre">
            {capitaliser(leNom(p))} en bref
          </h2>
          <dl className="pp-faits">
            {p.capitale && <Fait terme={motCapitale(p)}>{p.capitale}</Fait>}
            <Fait terme="Continent">
              {NOM_CONTINENT[p.continent]}
              {p.continents?.length ? ` (et ${p.continents.map((c) => NOM_CONTINENT[c]).join(", ")})` : ""}
            </Fait>
            <Fait terme="Population">
              {formatPopulation(population.n)}
              {population.annee ? <small> en {population.annee}</small> : null}
            </Fait>
            <Fait terme="Superficie">
              {formatSuperficie(p.superficie)}
              {densite && <small> · {densite}</small>}
            </Fait>
            {p.langues.length > 0 && <Fait terme={p.langues.length > 1 ? "Langues officielles" : "Langue officielle"}>{p.langues.join(", ")}</Fait>}
            {p.monnaies.length > 0 && (
              <Fait terme={p.monnaies.length > 1 ? "Monnaies" : "Monnaie"}>{p.monnaies.map((m) => `${m.nom}${m.symbole ? ` (${m.symbole})` : ""}`).join(", ")}</Fait>
            )}
            {habitants && <Fait terme="Ses habitants">{capitaliser(habitants)}</Fait>}
            {p.sommet && (
              <Fait terme="Point culminant">
                {p.sommet[0]} <small>· {new Intl.NumberFormat("fr-FR").format(p.sommet[1])} m</small>
              </Fait>
            )}
            {p.fleuve && (
              <Fait terme="Plus long fleuve">
                {p.fleuve[0]} <small>· {formatKm(p.fleuve[1])}</small>
              </Fait>
            )}
            {decalage && <Fait terme="Heure de la capitale">{decalage}</Fait>}
            {p.indicatif && <Fait terme="Indicatif">{p.indicatif}</Fait>}
            {p.tld && <Fait terme="Domaine Internet">{p.tld}</Fait>}
            {p.conduite && <Fait terme="On roule">à {p.conduite}</Fait>}
            {souverain && (
              <Fait terme="Dépend de">
                <Link href={adressePays(souverain)}>{souverain.nom}</Link>
              </Fait>
            )}
            {p.enclave && <Fait terme="La mer">Sans accès à la mer</Fait>}
          </dl>
        </section>

        {recit && (recit.hymne || recit.fete || recit.independance) && (
          <section className="pp-section" aria-labelledby="pp-symboles">
            <h2 id="pp-symboles" className="pp-sous-titre">
              Ses symboles
            </h2>
            <dl className="pp-faits">
              {recit.hymne && (
                <Fait terme="Hymne">
                  {recit.hymne}
                  {recit.auteurs && <small> · {recit.auteurs}</small>}
                </Fait>
              )}
              {recit.fete && <Fait terme="Fête nationale">{recit.fete}</Fait>}
              {recit.independance && <Fait terme={p.statut === "territoire" ? "Son statut" : "Indépendance"}>{recit.independance}</Fait>}
              {recit.anciens && recit.anciens.length > 0 && <Fait terme={recit.anciens.length > 1 ? "Anciens noms" : "Ancien nom"}>{recit.anciens.join(", ")}</Fait>}
            </dl>
          </section>
        )}

        {recit?.drapeau && (
          <section className="pp-section pp-recit" aria-labelledby="pp-drapeau">
            <h2 id="pp-drapeau" className="pp-sous-titre">
              L&apos;histoire de son drapeau
            </h2>
            <p>{recit.drapeau}</p>
          </section>
        )}
        {recit?.etymologie && (
          <section className="pp-section pp-recit" aria-labelledby="pp-nom">
            <h2 id="pp-nom" className="pp-sous-titre">
              L&apos;origine de son nom
            </h2>
            <p>{recit.etymologie}</p>
          </section>
        )}
        {recit?.anecdote && (
          <aside className="pp-anecdote" aria-label="Le savais-tu ?">
            <p className="pp-anecdote-titre">Le savais-tu ?</p>
            <p>{recit.anecdote}</p>
          </aside>
        )}

        {((recit?.villes?.length ?? 0) > 0 || (recit?.mers?.length ?? 0) > 0) && (
          <section className="pp-section" aria-labelledby="pp-geographie">
            <h2 id="pp-geographie" className="pp-sous-titre">
              Sa géographie
            </h2>
            <dl className="pp-faits">
              {recit?.villes && recit.villes.length > 0 && (
                <Fait terme="Grandes villes">
                  {recit.villes.map(([nom, n], i) => (
                    <span key={nom}>
                      {i > 0 && ", "}
                      {nom}
                      {n ? <small> ({formatVille(n)})</small> : null}
                    </span>
                  ))}
                </Fait>
              )}
              {recit?.mers && recit.mers.length > 0 && <Fait terme={recit.mers.length > 1 ? "Mers et océans" : "Mer"}>{recit.mers.join(", ")}</Fait>}
              {p.orgs && p.orgs.length > 0 && <Fait terme="Membre de">{p.orgs.map((o) => ORGANISATIONS[o].court).join(", ")}</Fait>}
            </dl>
          </section>
        )}

        {voisins.length > 0 && (
          <section className="pp-section" aria-labelledby="pp-voisins">
            <h2 id="pp-voisins" className="pp-sous-titre">
              Ses voisins
            </h2>
            <ul className="pp-liens">
              {voisins.map((v) => (
                <li key={v.code}>
                  <Link href={adressePays(v)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlDrapeau(v)} alt="" width={30} height={20} loading="lazy" />
                    {v.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="pp-jouer" aria-labelledby="pp-jouer">
          <h2 id="pp-jouer">
            {capitaliser(leNom(p))} et {NOMBRE_PAYS - 1} autres pays, en jouant
          </h2>
          <p>Le Portulan fait retenir les drapeaux, les capitales, les cartes, les continents et les monnaies du monde : quinze niveaux par route, des duels, et une mémoire qui revient au bon moment.</p>
          <Link href={`/monde#atlas/${p.code}`} className="bouton bouton-principal">
            Ouvrir sa fiche dans Le Portulan
          </Link>
        </section>

        {memeRegion.length > 0 && (
          <section className="pp-section" aria-labelledby="pp-region">
            <h2 id="pp-region" className="pp-sous-titre">
              Dans la même région : {p.sousRegion}
            </h2>
            <ul className="pp-liens">
              {memeRegion.map((v) => (
                <li key={v.code}>
                  <Link href={adressePays(v)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlDrapeau(v)} alt="" width={30} height={20} loading="lazy" />
                    {v.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="pp-sources">
          Sources : world-countries (ODbL), Banque mondiale (CC BY 4.0), GeoNames (CC BY 4.0), Natural Earth (domaine public), drapeaux de Wikimedia Commons. Textes
          rédigés pour Le Portulan. Une erreur ? Signale-la depuis la fiche du pays dans Le Portulan.
        </p>
      </main>
    </>
  );
}
