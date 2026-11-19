"use client";

import { BookOpen, Check, Compass, Hammer, Languages, LoaderCircle, Pin, RotateCcw, Swords, TriangleAlert, Volume2, X } from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { parler, voixDisponible } from "@/lib/langues/voix";
import { chargerCours } from "@/lib/regles/cours";
import type { Cours, Lecon, Section } from "@/lib/regles/types";
import { Phrase } from "./Phrase";

/*
 * L'explication : entre la démonstration et le défi, la règle racontée en français, posément.
 * La règle en clair, la fabrique de la forme, les emplois avec leur traduction, le lien avec
 * le français, les pièges des francophones, et la phrase à retenir.
 * Chaque palier (A1-A2, B1-B2, C1-C2) n'est chargé qu'à l'ouverture d'une de ses leçons.
 */

type EtatCours = { cle: string; cours?: Cours | null; erreur?: boolean };
export type CoursCharge = { charge: boolean; erreur: boolean; cours: Cours | null; reessayer: () => void };

/** Charge l'explication dès l'ouverture de la leçon : elle est prête quand on y arrive. */
export function useCours(section: Section["id"], lecon: Pick<Lecon, "id" | "niveau">): CoursCharge {
  const { id, niveau } = lecon;
  const cle = `${section}/${id}`;
  const [etat, setEtat] = useState<EtatCours | null>(null);
  const [essai, setEssai] = useState(0);
  useEffect(() => {
    let vivant = true;
    chargerCours(section, { id, niveau }).then(
      (cours) => vivant && setEtat({ cle, cours }),
      () => vivant && setEtat({ cle, erreur: true }),
    );
    return () => {
      vivant = false;
    };
  }, [section, id, niveau, cle, essai]);
  const courant = etat?.cle === cle ? etat : null;
  return {
    charge: !courant,
    erreur: Boolean(courant?.erreur),
    cours: courant?.cours ?? null,
    reessayer: () => {
      setEtat(null);
      setEssai((e) => e + 1);
    },
  };
}

/** Typographie française : une espace insécable avant ? ! : ; » et après «, pour qu'aucun signe ne reste seul en début de ligne. */
const fr = (t: string) => t.replace(/ ([?!:;»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");

/** Du texte français où les mots anglais, écrits {ainsi}, sont marqués comme de l'anglais. */
function Texte({ t }: { t: string }) {
  return (
    <>
      {t.split(/\{([^}]*)\}/).map((m, i) =>
        i % 2 ? (
          // Un mot seul ({-ing}, {twenty-first}) ne se coupe jamais à son trait d'union.
          <span key={i} className="rg-en" lang="en" data-mot={!/\s/.test(m) || undefined}>
            {m}
          </span>
        ) : (
          <Fragment key={i}>{fr(m)}</Fragment>
        ),
      )}
    </>
  );
}

const sansCouleurs = (p: string) => p.replace(/\[[a-z]:([^\]]*)\]/g, "$1");

/** Écouter la phrase anglaise (voix du navigateur), quand l'appareil en a une. */
function Ecoute({ p }: { p: string }) {
  const [parle, setParle] = useState(false);
  const texte = sansCouleurs(p);
  if (!voixDisponible()) return null;
  return (
    <button
      type="button"
      className="lg-ecoute rg-cours-ecoute"
      data-parle={parle || undefined}
      aria-label={`Écouter « ${texte} »`}
      onClick={() => {
        setParle(true);
        void parler(texte).then(() => setParle(false));
      }}
    >
      <Volume2 className="size-4" aria-hidden="true" />
    </button>
  );
}

export function Explication({ etat, onDefi }: { etat: CoursCharge; onDefi: () => void }) {
  if (etat.charge) {
    return (
      <section className="rg-cours" aria-label="L'explication" aria-busy="true">
        <p className="rg-cours-attente">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          L&apos;explication arrive…
        </p>
      </section>
    );
  }
  if (etat.erreur || !etat.cours) {
    return (
      <section className="rg-cours" aria-label="L'explication">
        <p className="rg-cours-attente">
          {etat.erreur
            ? "L'explication n'a pas pu se charger. Vérifie ta connexion à Internet, puis réessaie : la leçon, elle, reste disponible."
            : "Cette leçon n'a pas encore d'explication détaillée."}
        </p>
        <div className="rg-actions">
          {etat.erreur && (
            <button type="button" className="bouton" onClick={etat.reessayer}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Réessayer
            </button>
          )}
          <button type="button" className="bouton bouton-principal" onClick={onDefi}>
            <Swords className="size-4" aria-hidden="true" />
            Relever le défi
          </button>
        </div>
      </section>
    );
  }

  const c = etat.cours;
  return (
    <section className="rg-cours" aria-label="L'explication">
      <div className="rg-cours-regle">
        <p className="rg-cours-etiquette">
          <BookOpen className="size-4" aria-hidden="true" />
          La règle, en clair
        </p>
        <p className="rg-cours-lead">
          <Texte t={c.regle} />
        </p>
      </div>

      {c.forme && c.forme.length > 0 && (
        <div className="rg-cours-bloc">
          <h3 className="rg-cours-titre">
            <Hammer className="size-4" aria-hidden="true" />
            Comment on la fabrique
          </h3>
          <dl className="rg-fabrique">
            {c.forme.map((f, i) => (
              <div key={i} className="rg-fabrique-ligne">
                <dt>{fr(f.nom)}</dt>
                <dd className="rg-fabrique-modele">
                  <Texte t={f.modele} />
                </dd>
                <dd className="rg-fabrique-exemple">
                  <span lang="en">
                    <Phrase p={f.exemple} />
                  </span>
                  <Ecoute p={f.exemple} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="rg-cours-bloc">
        <h3 className="rg-cours-titre">
          <Compass className="size-4" aria-hidden="true" />
          Quand l&apos;utiliser
        </h3>
        <ul className="rg-usages">
          {c.usages.map((u, i) => (
            <li key={i} className="rg-usage">
              <p className="rg-usage-quand">
                <Texte t={u.quand} />
              </p>
              <p className="rg-usage-en">
                <span lang="en">
                  <Phrase p={u.en} />
                </span>
                <Ecoute p={u.en} />
              </p>
              <p className="rg-usage-fr">{fr(u.fr)}</p>
            </li>
          ))}
        </ul>
      </div>

      <aside className="rg-cours-bloc rg-cours-francais" aria-label="Et en français ?">
        <h3 className="rg-cours-titre">
          <Languages className="size-4" aria-hidden="true" />
          {"Et en français\u00a0?"}
        </h3>
        <p>
          <Texte t={c.francais} />
        </p>
      </aside>

      <div className="rg-cours-bloc">
        <h3 className="rg-cours-titre">
          <TriangleAlert className="size-4" aria-hidden="true" />
          Les pièges des francophones
        </h3>
        <ul className="rg-pieges">
          {c.pieges.map((p, i) => (
            <li key={i} className="rg-piege">
              <p className="rg-piege-faux">
                <X className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">À éviter : </span>
                <span lang="en">
                  <Phrase p={p.faux} />
                </span>
              </p>
              <p className="rg-piege-juste">
                <Check className="size-4 shrink-0" aria-hidden="true" />
                <span className="sr-only">Correct : </span>
                <span lang="en">
                  <Phrase p={p.juste} />
                </span>
                <Ecoute p={p.juste} />
              </p>
              <p className="rg-piege-pourquoi">
                <Texte t={p.pourquoi} />
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="rg-retenir">
        <Pin className="size-5 shrink-0" aria-hidden="true" />
        <span>
          <strong>À retenir :</strong> <Texte t={c.retenir} />
        </span>
      </p>

      <div className="rg-actions">
        <button type="button" className="bouton bouton-principal" onClick={onDefi}>
          <Swords className="size-4" aria-hidden="true" />
          Relever le défi
        </button>
      </div>
    </section>
  );
}
