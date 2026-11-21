"use client";

import { Dumbbell, Flame, GraduationCap, LoaderCircle, Play, Shuffle, Trophy, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { chargerEntrainement } from "@/lib/regles/entrainement/index";
import { enregistrerSerie, noterReponses, refExercice, serieLecon, useSuivi } from "@/lib/regles/suivi";
import type { Exercice, Lecon, Section } from "@/lib/regles/types";
import { BilanSerie, type Item, melanger, type Mode, type Reponse, SerieVue } from "./Exercices";

/*
 * L'entraînement d'une leçon : vingt exercices corrigés (ou plus) en plus du défi, du plus facile au plus
 * difficile. On choisit sa série (tout, dix au hasard, échauffement, expert) et sa façon de jouer (guidée ou
 * examen), puis le bilan montre la correction complète ; les erreurs vont dans le carnet.
 */

type Etat = { cle: string; exercices?: Exercice[]; erreur?: boolean };

export function useEntrainement(section: Section["id"], lecon: Pick<Lecon, "id" | "niveau">) {
  const cle = `${section}/${lecon.id}`;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [essai, setEssai] = useState(0);
  const { id, niveau } = lecon;
  useEffect(() => {
    let vivant = true;
    chargerEntrainement(section, { id, niveau }).then(
      (exercices) => vivant && setEtat({ cle, exercices }),
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
    exercices: courant?.exercices ?? [],
    reessayer: () => {
      setEtat(null);
      setEssai((e) => e + 1);
    },
  };
}

type Choix = "tout" | "rapide" | "echauffement" | "expert";
const SERIES: { id: Choix; nom: string; aide: string; Icone: typeof Play }[] = [
  { id: "tout", nom: "Toute la série", aide: "Du plus facile au plus difficile", Icone: Play },
  { id: "rapide", nom: "Série rapide", aide: "Dix exercices au hasard", Icone: Shuffle },
  { id: "echauffement", nom: "Échauffement", aide: "Les plus simples, pour démarrer", Icone: Flame },
  { id: "expert", nom: "Expert", aide: "Les plus difficiles, pour viser juste", Icone: Zap },
];

const parDifficulte = (a: Item, b: Item) => (a.exercice.d ?? 2) - (b.exercice.d ?? 2);

export function EntrainementVue({ section, lecon, etat }: { section: Section; lecon: Lecon; etat: ReturnType<typeof useEntrainement> }) {
  const [mode, setMode] = useState<Mode>("guide");
  const [serie, setSerie] = useState<{ items: Item[]; tour: number } | null>(null);
  const [fin, setFin] = useState<{ items: Item[]; reponses: Reponse[] } | null>(null);
  const { series } = useSuivi();
  const meilleur = series[serieLecon(section.id, lecon.id)];
  const tous = useMemo<Item[]>(() => etat.exercices.map((exercice, k) => ({ ref: refExercice(section.id, lecon.id, "e", k), exercice })), [etat.exercices, section.id, lecon.id]);
  const nombre = (d: number) => tous.filter((it) => (it.exercice.d ?? 2) === d).length;

  if (etat.charge)
    return (
      <p className="rg-charge" role="status">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        L&apos;entraînement se prépare…
      </p>
    );
  if (etat.erreur)
    return (
      <div className="rg-charge" role="alert">
        <p>L&apos;entraînement n&apos;a pas pu se charger. Vérifie ta connexion.</p>
        <button type="button" className="bouton" onClick={etat.reessayer}>
          Réessayer
        </button>
      </div>
    );

  const lancer = (c: Choix) => {
    const choisis = c === "tout" ? tous : c === "rapide" ? melanger(tous).slice(0, 10).sort(parDifficulte) : tous.filter((it) => (it.exercice.d ?? 2) === (c === "echauffement" ? 1 : 3));
    setFin(null);
    setSerie((s) => ({ items: choisis, tour: (s?.tour ?? 0) + 1 }));
  };

  if (serie && !fin)
    return (
      <SerieVue
        key={serie.tour}
        items={serie.items}
        mode={mode}
        onFini={(reponses) => {
          const juste = reponses.filter((r) => r.juste).length;
          // Le meilleur score ne compte que les séries complètes de la leçon.
          if (serie.items.length === tous.length) enregistrerSerie(serieLecon(section.id, lecon.id), { juste, total: reponses.length });
          noterReponses(reponses.map((r) => ({ ref: r.ref, juste: r.juste, premierCoup: r.juste && r.essais <= 1 })));
          setFin({ items: serie.items, reponses });
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    );

  if (fin)
    return (
      <BilanSerie
        items={fin.items}
        reponses={fin.reponses}
        mode={mode}
        titre={`Entraînement : ${lecon.titre}`}
        onRefaireErreurs={(items) => {
          setFin(null);
          setSerie((s) => ({ items, tour: (s?.tour ?? 0) + 1 }));
        }}
        onRecommencer={() => {
          setFin(null);
          setSerie(null);
        }}
      />
    );

  if (!tous.length)
    return (
      <div className="rg-charge">
        <p>L&apos;entraînement de cette leçon arrive bientôt. En attendant, refais le défi : la deuxième fois, tout paraît plus simple.</p>
      </div>
    );

  return (
    <section className="rg-entrainement" aria-labelledby="titre-entrainement">
      <div className="rg-entrainement-tete">
        <Dumbbell className="size-7" aria-hidden="true" />
        <div>
          <h3 id="titre-entrainement" className="rg-entrainement-titre">
            L&apos;entraînement
          </h3>
          <p className="rg-entrainement-chapo">
            {tous.length} exercices corrigés pour ancrer la règle : {nombre(1)} d&apos;échauffement, {nombre(2)} d&apos;entraînement, {nombre(3)} d&apos;expert. Après chaque réponse, la correction t&apos;explique pourquoi ; à la fin, tu retrouves tout.
          </p>
        </div>
      </div>
      {meilleur && (
        <p className="rg-entrainement-record">
          <Trophy className="size-4" aria-hidden="true" />
          Ton meilleur score : {meilleur.meilleur} / {meilleur.total} · {meilleur.series} série{meilleur.series > 1 ? "s" : ""} faite{meilleur.series > 1 ? "s" : ""}
        </p>
      )}

      <fieldset className="rg-mode">
        <legend>Ta façon de jouer</legend>
        <label data-choisi={mode === "guide" || undefined}>
          <input type="radio" name="mode-entrainement" checked={mode === "guide"} onChange={() => setMode("guide")} />
          <span>
            <strong>Guidée</strong> Une erreur allume un indice, la correction suit chaque réponse.
          </span>
        </label>
        <label data-choisi={mode === "examen" || undefined}>
          <input type="radio" name="mode-entrainement" checked={mode === "examen"} onChange={() => setMode("examen")} />
          <span>
            <strong>
              <GraduationCap className="inline size-4 align-[-0.15em]" aria-hidden="true" /> Examen
            </strong>{" "}
            Une seule réponse, sans indice : la correction complète arrive à la fin.
          </span>
        </label>
      </fieldset>

      <div className="rg-series">
        {SERIES.map(({ id, nom, aide, Icone }) => {
          const n = id === "tout" ? tous.length : id === "rapide" ? Math.min(10, tous.length) : nombre(id === "echauffement" ? 1 : 3);
          return (
            <button key={id} type="button" className="rg-serie-choix" data-principal={id === "tout" || undefined} disabled={!n} onClick={() => lancer(id)}>
              <Icone className="size-5" aria-hidden="true" />
              <span className="rg-serie-nom">{nom}</span>
              <span className="rg-serie-aide">
                {aide} · {n} exercice{n > 1 ? "s" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
