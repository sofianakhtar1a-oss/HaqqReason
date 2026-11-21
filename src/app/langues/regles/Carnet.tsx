"use client";

import { ArrowLeft, Check, LoaderCircle, NotebookPen, Play, X } from "lucide-react";
import { useMemo, useState } from "react";
import { exercicesDe } from "@/lib/regles/banque";
import { SECTIONS } from "@/lib/regles/index";
import { lireRef, noterReponses, REUSSITES_POUR_SORTIR, retirerErreur, useSuivi } from "@/lib/regles/suivi";
import { BilanSerie, Enonce, type Item, type Reponse, SerieVue } from "./Exercices";

/*
 * Le carnet d'erreurs : chaque exercice raté (défi ou entraînement) y entre. Il revient en séance de révision
 * jusqu'à être réussi deux fois du premier coup ; on peut aussi le retirer à la main.
 */

const PAR_SEANCE = 15;

export function Carnet({ onRetour, onLecon }: { onRetour: () => void; onLecon: (chemin: string) => void }) {
  const { erreurs } = useSuivi();
  const [seance, setSeance] = useState<{ items: Item[]; tour: number } | null>(null);
  const [fin, setFin] = useState<{ items: Item[]; reponses: Reponse[] } | null>(null);
  const [charge, setCharge] = useState(false);
  const [apercus, setApercus] = useState<Record<string, string>>({});
  const liste = useMemo(() => Object.values(erreurs).sort((a, b) => a.vue - b.vue), [erreurs]);

  // Les erreurs rangées par leçon, dans l'ordre du parcours.
  const parLecon = useMemo(() => {
    const groupes: { cle: string; section: (typeof SECTIONS)[number]; titre: string; niveau: string; refs: string[] }[] = [];
    for (const s of SECTIONS)
      for (const l of s.lecons) {
        const refs = liste.filter((x) => {
          const r = lireRef(x.ref);
          return r?.section === s.id && r.lecon === l.id;
        });
        if (refs.length) groupes.push({ cle: `${s.id}/${l.id}`, section: s, titre: l.titre, niveau: l.niveau, refs: refs.map((x) => x.ref) });
      }
    return groupes;
  }, [liste]);

  const lancer = async (refs: string[]) => {
    setCharge(true);
    const trouves = await exercicesDe(refs.slice(0, PAR_SEANCE)).catch(() => []);
    setCharge(false);
    if (!trouves.length) return;
    setFin(null);
    setSeance((s) => ({ items: trouves.map((x) => ({ ref: x.ref, exercice: x.exercice, origine: `${x.lecon.niveau} · ${x.lecon.titre}` })), tour: (s?.tour ?? 0) + 1 }));
  };

  const montrer = async (refs: string[]) => {
    const manquants = refs.filter((r) => !apercus[r]);
    if (!manquants.length) return;
    const trouves = await exercicesDe(manquants).catch(() => []);
    setApercus((a) => ({ ...a, ...Object.fromEntries(trouves.map((x) => [x.ref, x.exercice.q])) }));
  };

  if (seance && !fin)
    return (
      <section className="rg-lecon" aria-label="Révision du carnet d'erreurs">
        <button type="button" className="rg-retour" onClick={() => setSeance(null)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Le carnet
        </button>
        <SerieVue
          key={seance.tour}
          items={seance.items}
          mode="guide"
          onFini={(reponses) => {
            noterReponses(reponses.map((r) => ({ ref: r.ref, juste: r.juste, premierCoup: r.juste && r.essais <= 1 })));
            setFin({ items: seance.items, reponses });
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </section>
    );

  if (fin)
    return (
      <section className="rg-lecon" aria-label="Bilan de la révision">
        <button type="button" className="rg-retour" onClick={() => (setFin(null), setSeance(null))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Le carnet
        </button>
        <BilanSerie
          items={fin.items}
          reponses={fin.reponses}
          mode="guide"
          titre="Révision du carnet d'erreurs"
          phrase={`Chaque exercice réussi du premier coup se rapproche de la sortie : ${REUSSITES_POUR_SORTIR} réussites et il quitte ton carnet.`}
          onRecommencer={() => (setFin(null), setSeance(null))}
        />
      </section>
    );

  return (
    <section className="rg rg-carnet" aria-labelledby="titre-carnet">
      <button type="button" className="rg-retour" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Les règles
      </button>
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-carnet" className="lg-titre">
            Mon carnet d&apos;erreurs
          </h2>
          <p className="lg-chapo">
            Chaque exercice raté, dans le défi ou l&apos;entraînement, s&apos;écrit ici. Il revient en révision jusqu&apos;à ce que tu le réussisses {REUSSITES_POUR_SORTIR} fois du premier coup : alors il quitte le carnet. C&apos;est le chemin le plus court vers zéro faute.
          </p>
        </div>
      </div>

      {liste.length === 0 ? (
        <div className="lg-vide">
          <NotebookPen className="size-8" strokeWidth={1.3} aria-hidden="true" />
          <p>Ton carnet est vide. Fais un défi ou un entraînement : les exercices ratés t&apos;attendront ici.</p>
        </div>
      ) : (
        <>
          <div className="rg-carnet-action">
            <p>
              <strong>{liste.length}</strong> exercice{liste.length > 1 ? "s" : ""} à revoir, dans {parLecon.length} leçon{parLecon.length > 1 ? "s" : ""}.
            </p>
            <button type="button" className="bouton bouton-principal" disabled={charge} onClick={() => void lancer(liste.map((x) => x.ref))}>
              {charge ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" fill="currentColor" aria-hidden="true" />}
              Réviser {Math.min(PAR_SEANCE, liste.length)} erreur{Math.min(PAR_SEANCE, liste.length) > 1 ? "s" : ""}
            </button>
          </div>
          <ul className="rg-carnet-lecons">
            {parLecon.map((g) => (
              <li key={g.cle}>
                <details onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && void montrer(g.refs)}>
                  <summary>
                    <span className="rg-carnet-niveau">{g.niveau}</span>
                    <span className="rg-carnet-titre">
                      {g.titre}
                      <small>{g.section.nom}</small>
                    </span>
                    <span className="rg-carnet-nombre">{g.refs.length}</span>
                  </summary>
                  <ul className="rg-carnet-erreurs">
                    {g.refs.map((ref) => {
                      const e = erreurs[ref];
                      return (
                        <li key={ref}>
                          <span className="rg-carnet-enonce">{apercus[ref] ? <Enonce texte={apercus[ref]} /> : "…"}</span>
                          <span className="rg-carnet-suivi" title="Réussites du premier coup depuis la dernière erreur">
                            {Array.from({ length: REUSSITES_POUR_SORTIR }, (_, k) => (
                              <Check key={k} className="size-3.5" data-fait={k < (e?.reussites ?? 0) || undefined} aria-hidden="true" />
                            ))}
                          </span>
                          <button type="button" className="rg-carnet-retirer" aria-label="Retirer du carnet : j'ai compris" title="Retirer du carnet : j'ai compris" onClick={() => retirerErreur(ref)}>
                            <X className="size-4" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="rg-actions">
                    <button type="button" className="bouton" onClick={() => void lancer(g.refs)}>
                      <Play className="size-4" aria-hidden="true" />
                      Réviser cette leçon
                    </button>
                    <button type="button" className="bouton" onClick={() => onLecon(g.cle)}>
                      Revoir la leçon
                    </button>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
