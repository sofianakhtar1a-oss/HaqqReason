import type { Metadata } from "next";
import Link from "next/link";
import { FilAriane } from "@/components/FilAriane";
import { editionPortulan, lireManques, lireSignalements, lireVitesse } from "@/lib/monde/atelier";
import { jourDeParis, PAR_CODE, paysDuJour, urlDrapeau } from "@/lib/monde/atlas";
import { PAYS } from "@/lib/monde/donnees";
import { NOUVEAUTES_ORIGINE, type MesureVitesse } from "@/lib/monde/edition";
import { adressePays } from "@/lib/monde/pages-publiques";
import { exigerCreateur } from "@/lib/session";
import { EnTeteCreateur } from "../_composants/EnTeteCreateur";
import { Annonces, BoutonPopulation, BoutonSignalement, ChoixPaysDuJour, CorrecteurFiche, type JourAtelier } from "./Ateliers";

export const metadata: Metadata = { title: "L'atelier du Portulan", robots: { index: false } };

/* Les repères de Google pour une page rapide : bon jusqu'au premier seuil, à revoir au-delà du second. */
const SEUILS: Record<MesureVitesse, { nom: string; bon: number; moyen: number; unite: "ms" | "" }> = {
  LCP: { nom: "Affichage du plus grand élément (LCP)", bon: 2500, moyen: 4000, unite: "ms" },
  INP: { nom: "Réponse à un geste (INP)", bon: 200, moyen: 500, unite: "ms" },
  CLS: { nom: "Stabilité de la mise en page (CLS)", bon: 0.1, moyen: 0.25, unite: "" },
  FCP: { nom: "Premier affichage (FCP)", bon: 1800, moyen: 3000, unite: "ms" },
  TTFB: { nom: "Réponse du serveur (TTFB)", bon: 800, moyen: 1800, unite: "ms" },
};

const collator = new Intl.Collator("fr", { sensitivity: "base" });
const dateCourte = (jour: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${jour}T12:00:00Z`));
const lisible = (iso: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" }).format(new Date(iso));

export default async function AtelierPortulan({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await exigerCreateur();
  const tous = (await searchParams).signalements === "tous";
  const [edition, signalements, manques, vitesse] = await Promise.all([editionPortulan(), lireSignalements(tous), lireManques(3), lireVitesse(28)]);
  const pays = PAYS.map((p) => ({ code: p.code, nom: p.nom })).sort((a, b) => collator.compare(a.nom, b.nom));
  const migration = manques === null || vitesse === null;

  // Les quatorze prochains jours : le pays tiré au sort, ou celui que le créateur a choisi.
  const aujourdhui = jourDeParis();
  const jours: JourAtelier[] = Array.from({ length: 14 }, (_, k) => {
    const d = new Date(`${aujourdhui}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + k);
    const jour = d.toISOString().slice(0, 10);
    const t = paysDuJour(jour);
    const c = edition.jour[jour];
    return {
      jour,
      libelle: k === 0 ? "Aujourd'hui" : k === 1 ? "Demain" : dateCourte(jour),
      tirage: { code: t.code, nom: t.nom },
      choisi: c ? { code: c.code, nom: PAR_CODE.get(c.code)?.nom ?? c.code, anecdote: c.anecdote } : null,
    };
  });
  const idsCreateur = new Set(edition.nouveautes.map((n) => n.id));
  const annonces = [...edition.nouveautes.map((n) => ({ ...n, origine: false })), ...NOUVEAUTES_ORIGINE.filter((n) => !idsCreateur.has(n.id)).map((n) => ({ ...n, origine: true }))].sort((a, b) =>
    b.le.localeCompare(a.le),
  );

  return (
    <>
      <EnTeteCreateur />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <FilAriane etapes={[{ href: "/createur", libelle: "Espace créateur" }, { href: "/createur/portulan", libelle: "L'atelier du Portulan" }]} />
        <h1 className="mt-6 text-4xl font-extrabold md:text-5xl">L&apos;atelier du Portulan</h1>
        <p className="mt-3 max-w-[66ch] text-lg text-encre-douce">
          Ce que disent les joueurs, ce qu&apos;ils manquent, la vitesse qu&apos;ils ressentent ; et, sans toucher au code, les fiches, le pays du jour, la population et les
          nouveautés.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Dans cette page">
          {[
            ["signalements", "Signalements"],
            ["manques", "Questions manquées"],
            ["vitesse", "Vitesse réelle"],
            ["fiches", "Corriger une fiche"],
            ["jour", "Pays du jour"],
            ["nouveautes", "Quoi de neuf"],
            ["population", "Population"],
          ].map(([id, nom]) => (
            <a key={id} href={`#${id}`} className="puce-filtre">
              {nom}
            </a>
          ))}
          <Link href="/monde/pays" className="puce-filtre">
            Les pages publiques
          </Link>
        </nav>

        {migration && (
          <p className="verre panneau mt-8 text-encre-douce" role="note">
            Les questions manquées et la vitesse réelle attendent la migration 019 (supabase/migrations/019_portulan_createur.sql). Le reste de l&apos;atelier
            marche déjà, signalements compris.
          </p>
        )}

        <section id="signalements" className="verre panneau mt-8 scroll-mt-24" aria-labelledby="titre-signalements">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="titre-signalements" className="text-2xl font-bold">
              Les signalements {signalements && signalements.length > 0 && <span className="text-base font-normal text-encre-douce">({signalements.length})</span>}
            </h2>
            <Link href={tous ? "/createur/portulan#signalements" : "/createur/portulan?signalements=tous#signalements"} className="text-sm font-semibold text-encre-douce hover:text-encre">
              {tous ? "Seulement ceux à traiter" : "Voir aussi ceux déjà traités"}
            </Link>
          </div>
          {!signalements ? (
            <p className="mt-3 text-encre-douce">Indisponible pour le moment.</p>
          ) : signalements.length === 0 ? (
            <p className="mt-3 text-encre-douce">Rien à traiter : aucun joueur n&apos;a signalé d&apos;erreur.</p>
          ) : (
            <ol className="mt-4 grid gap-4">
              {signalements.map((s) => {
                const p = s.code ? PAR_CODE.get(s.code) : undefined;
                const contexte = Object.entries(s.contexte ?? {}).filter(([, v]) => typeof v === "string" && v);
                return (
                  <li key={s.id} className={`border-b border-trait pb-4 ${s.traite ? "opacity-60" : ""}`}>
                    <p className="text-sm text-encre-douce">
                      {lisible(s.le)} · {s.sujet}
                      {p && (
                        <>
                          {" "}
                          ·{" "}
                          <Link href={adressePays(p)} className="font-semibold text-encre hover:underline">
                            {p.nom}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="mt-1 whitespace-pre-line">{s.texte}</p>
                    {contexte.length > 0 && (
                      <p className="mt-1 text-sm text-encre-douce">
                        {contexte.map(([k, v]) => (
                          <span key={k} className="mr-3">
                            {k} : {String(v)}
                          </span>
                        ))}
                      </p>
                    )}
                    <div className="mt-2">
                      <BoutonSignalement id={s.id} traite={s.traite} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section id="manques" className="verre panneau mt-6 scroll-mt-24" aria-labelledby="titre-manques">
          <h2 id="titre-manques" className="text-2xl font-bold">
            Les questions les plus manquées
          </h2>
          <p className="mt-2 text-encre-douce">Ces trois derniers mois, parmi les questions posées au moins dix fois (des totaux, aucun nom de joueur).</p>
          {!manques ? (
            <p className="mt-3 text-encre-douce">Indisponible pour le moment.</p>
          ) : manques.length === 0 ? (
            <p className="mt-3 text-encre-douce">Pas encore assez de réponses pour en tirer quelque chose.</p>
          ) : (
            <ol className="mt-4 grid gap-2">
              {manques.map((m) => {
                const p = PAR_CODE.get(m.cible)!;
                return (
                  <li key={`${m.type}:${m.cible}`} className="flex items-center gap-3 border-b border-trait pb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={urlDrapeau(p)} alt="" width={36} height={24} className="h-6 w-9 shrink-0 rounded-sm object-cover" loading="lazy" />
                    <span className="min-w-0 flex-1">
                      <strong>{m.pays}</strong> <span className="text-sm text-encre-douce">· {m.methode}</span>
                    </span>
                    <span className="tabular-nums text-sm text-encre-douce">
                      {m.fautes} sur {m.vues}
                    </span>
                    <span className="w-14 text-right font-bold tabular-nums">{Math.round(m.taux * 100)} %</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section id="vitesse" className="verre panneau mt-6 scroll-mt-24" aria-labelledby="titre-vitesse">
          <h2 id="titre-vitesse" className="text-2xl font-bold">
            La vitesse réelle
          </h2>
          <p className="mt-2 text-encre-douce">Mesurée dans les navigateurs des joueurs ces 28 derniers jours : le 75e centile (trois visites sur quatre font mieux).</p>
          {!vitesse ? (
            <p className="mt-3 text-encre-douce">Indisponible pour le moment.</p>
          ) : (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.keys(SEUILS) as MesureVitesse[]).map((m) => {
                const v = vitesse[m];
                const s = SEUILS[m];
                const note = v.p75 === null ? null : v.p75 <= s.bon ? "bon" : v.p75 <= s.moyen ? "à surveiller" : "lent";
                return (
                  <div key={m} className="rounded-2xl border border-trait p-4">
                    <dt className="text-sm text-encre-douce">{s.nom}</dt>
                    <dd className="mt-1">
                      {v.p75 === null ? (
                        <span className="text-encre-douce">Pas encore de mesure</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold tabular-nums">{s.unite === "ms" ? `${(v.p75 / 1000).toFixed(v.p75 < 1000 ? 2 : 1)} s` : v.p75.toFixed(2)}</span>{" "}
                          <span className={`text-sm font-semibold ${note === "bon" ? "text-emeraude" : note === "lent" ? "text-danger" : "text-or"}`}>{note}</span>
                          <span className="block text-xs text-encre-douce">{v.n} mesures</span>
                        </>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </section>

        <section id="fiches" className="verre panneau mt-6 scroll-mt-24" aria-labelledby="titre-fiches">
          <h2 id="titre-fiches" className="text-2xl font-bold">
            Corriger une fiche
          </h2>
          <p className="mt-2 text-encre-douce">
            La devise, l&apos;hymne, la fête nationale, l&apos;histoire du drapeau, l&apos;origine du nom, l&apos;anecdote : corrige ou complète, sans toucher au code.{" "}
            {Object.keys(edition.fiches).length > 0 && `${Object.keys(edition.fiches).length} fiche${Object.keys(edition.fiches).length > 1 ? "s" : ""} déjà corrigée${Object.keys(edition.fiches).length > 1 ? "s" : ""}.`}
          </p>
          <div className="mt-4">
            <CorrecteurFiche pays={pays} />
          </div>
        </section>

        <section id="jour" className="verre panneau mt-6 scroll-mt-24" aria-labelledby="titre-jour">
          <h2 id="titre-jour" className="text-2xl font-bold">
            Le pays du jour
          </h2>
          <p className="mt-2 text-encre-douce">Chaque jour, un pays est tiré au sort pour tout le monde ; choisis-le toi-même pour une date (une fête nationale, une actualité), avec son anecdote.</p>
          <div className="mt-4">
            <ChoixPaysDuJour jours={jours} pays={pays} />
          </div>
        </section>

        <section id="nouveautes" className="verre panneau mt-6 scroll-mt-24" aria-labelledby="titre-nouveautes">
          <h2 id="titre-nouveautes" className="text-2xl font-bold">
            Quoi de neuf
          </h2>
          <p className="mt-2 text-encre-douce">Ce qui s&apos;affiche dans « Quoi de neuf », sur l&apos;accueil du Portulan. La plus récente est annoncée aux joueurs par un point doré.</p>
          <div className="mt-4">
            <Annonces liste={annonces} aujourdhui={aujourdhui} />
          </div>
        </section>

        <section id="population" className="verre panneau mt-6 scroll-mt-24" aria-labelledby="titre-population">
          <h2 id="titre-population" className="text-2xl font-bold">
            La population
          </h2>
          <p className="mt-2 text-encre-douce">
            {edition.population?.maj
              ? `Relue le ${lisible(edition.population.maj)} : ${Object.keys(edition.population.valeurs).length} pays, ${edition.population.source}. `
              : "Pas encore relue : les chiffres d'origine s'affichent. "}
            Une tâche planifiée la relit chaque mois (rien ne change si la Banque mondiale n&apos;a rien publié de neuf).
          </p>
          <div className="mt-4">
            <BoutonPopulation />
          </div>
        </section>
      </main>
    </>
  );
}
