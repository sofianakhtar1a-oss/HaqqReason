"use client";

import { ArrowLeft, BookOpen, Compass, LoaderCircle, Play, Sparkles } from "lucide-react";
import { useState } from "react";
import { utiliser } from "@/lib/client/premium";
import { HISTOIRES } from "@/lib/langues/histoires/catalogue";
import { exercicesDuNiveau, type ExerciceRange, melangerAvec } from "@/lib/regles/banque";
import { NOMS_NIVEAUX, SECTIONS } from "@/lib/regles/index";
import { enregistrerSerie, SERIE_POSITIONNEMENT, useSuivi } from "@/lib/regles/suivi";
import { NIVEAUX, type Niveau, typeExercice } from "@/lib/regles/types";
import { BilanSerie, type Item, type Reponse, SerieVue } from "./Exercices";

/*
 * Le test de positionnement : quatre questions par niveau (deux de conjugaison, deux de grammaire), sans
 * indice. On commence au niveau A2 ; trois bonnes réponses sur quatre ouvrent le niveau suivant, sinon le test
 * s'arrête. Le niveau estimé oriente vers les bonnes leçons et les bonnes histoires.
 */

const PAR_SECTION = 2;
const POUR_VALIDER = 3;
const DEPART: Niveau = "A2";

type Bloc = { niveau: Niveau; ranges: ExerciceRange[]; reponses?: Reponse[] };

async function composerBloc(niveau: Niveau, dejaVues: Set<string>): Promise<ExerciceRange[]> {
  const parSection = await Promise.all(SECTIONS.map((s) => exercicesDuNiveau(s.id, niveau)));
  return parSection.flatMap((tous) => {
    const choix = tous.filter((x) => typeExercice(x.exercice) === "choix" && !dejaVues.has(x.ref));
    const preferes = choix.filter((x) => (x.exercice.d ?? 2) >= 2);
    const lecons = new Set<string>();
    const sortie: ExerciceRange[] = [];
    for (const x of melangerAvec(preferes.length >= PAR_SECTION ? preferes : choix)) {
      if (sortie.length >= PAR_SECTION) break;
      if (lecons.has(x.lecon.id)) continue;
      lecons.add(x.lecon.id);
      sortie.push(x);
    }
    return sortie;
  });
}

/** Le niveau atteint : le plus haut niveau validé (trois réponses justes sur quatre). */
export function niveauEstime(blocs: { niveau: Niveau; justes: number }[]): Niveau | null {
  const valides = blocs.filter((b) => b.justes >= POUR_VALIDER).map((b) => NIVEAUX.indexOf(b.niveau));
  return valides.length ? NIVEAUX[Math.max(...valides)] : null;
}

/** Le niveau à tester ensuite, ou null si le test est fini. */
export function niveauSuivant(blocs: { niveau: Niveau; justes: number }[]): Niveau | null {
  const dernier = blocs[blocs.length - 1];
  if (!dernier) return DEPART;
  const i = NIVEAUX.indexOf(dernier.niveau);
  const teste = (n: Niveau) => blocs.some((b) => b.niveau === n);
  if (dernier.justes >= POUR_VALIDER) return i < NIVEAUX.length - 1 && !teste(NIVEAUX[i + 1]) ? NIVEAUX[i + 1] : null;
  return i > 0 && !teste(NIVEAUX[i - 1]) && blocs.length === 1 ? NIVEAUX[i - 1] : null;
}

export function Positionnement({ onRetour, onOuvrir, onHistoires }: { onRetour: () => void; onOuvrir: (chemin: string) => void; onHistoires: () => void }) {
  const { series } = useSuivi();
  const precedent = series[SERIE_POSITIONNEMENT];
  const [blocs, setBlocs] = useState<Bloc[]>([]);
  const [charge, setCharge] = useState(false);
  const [fini, setFini] = useState(false);

  const ajouterBloc = async (niveau: Niveau, avant: Bloc[]) => {
    setCharge(true);
    const vues = new Set(avant.flatMap((b) => b.ranges.map((x) => x.ref)));
    const ranges = await composerBloc(niveau, vues).catch(() => []);
    setCharge(false);
    setBlocs([...avant, { niveau, ranges }]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const courant = blocs.find((b) => !b.reponses);
  const resultats = blocs.filter((b) => b.reponses).map((b) => ({ niveau: b.niveau, justes: b.reponses!.filter((r) => r.juste).length }));
  const estime = niveauEstime(resultats);

  if (!blocs.length)
    return (
      <section className="rg rg-positionnement" aria-labelledby="titre-positionnement">
        <button type="button" className="rg-retour" onClick={onRetour}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Les règles
        </button>
        <div className="rg-position-accueil">
          <Compass className="size-10" aria-hidden="true" />
          <h2 id="titre-positionnement" className="lg-titre">
            Quel est ton niveau d&apos;anglais ?
          </h2>
          <p className="lg-chapo">
            Quelques minutes, quatre questions par niveau, de la conjugaison et de la grammaire. Le test commence au niveau A2 et monte tant que tu réussis : à la fin, tu sais par quelles leçons commencer et quelles histoires lire.
          </p>
          {precedent?.niveau && (
            <p className="rg-position-precedent">
              Ton dernier résultat : niveau <strong>{precedent.niveau}</strong>
              {precedent.dernier ? ` (le ${new Date(precedent.dernier).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })})` : ""}.
            </p>
          )}
          <button type="button" className="bouton bouton-principal" disabled={charge} onClick={() =>
              void utiliser("truchement.positionnement").then((ok) => {
                if (ok) void ajouterBloc(DEPART, []);
              })
            }>
            {charge ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" fill="currentColor" aria-hidden="true" />}
            Commencer le test
          </button>
        </div>
      </section>
    );

  if (courant && !fini)
    return (
      <section className="rg-lecon" aria-label="Test de positionnement">
        <button type="button" className="rg-retour" onClick={() => (setBlocs([]), setFini(false))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Arrêter le test
        </button>
        <div className="rg-examen-tete">
          <Compass className="size-6" aria-hidden="true" />
          <div>
            <p className="rg-lecon-niveau">Étape {blocs.length}</p>
            <h2 className="rg-lecon-nom">Niveau {courant.niveau} : {NOMS_NIVEAUX[courant.niveau].toLowerCase()}</h2>
            <p className="rg-lecon-notion">Réponds sans te presser ; si tu ne sais pas, choisis ce qui te semble le plus naturel.</p>
          </div>
        </div>
        {charge || !courant.ranges.length ? (
          <p className="rg-charge" role="status">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            Les questions se préparent…
          </p>
        ) : (
          <SerieVue
            key={`${blocs.length}-${courant.niveau}`}
            items={courant.ranges.map((x) => ({ ref: x.ref, exercice: x.exercice }))}
            mode="examen"
            libelleFin="Continuer"
            onFini={(reponses) => {
              const maj = blocs.map((b) => (b === courant ? { ...b, reponses } : b));
              const res = maj.filter((b) => b.reponses).map((b) => ({ niveau: b.niveau, justes: b.reponses!.filter((r) => r.juste).length }));
              const suivant = niveauSuivant(res);
              if (suivant) void ajouterBloc(suivant, maj);
              else {
                setBlocs(maj);
                setFini(true);
                const toutes = maj.flatMap((b) => b.reponses ?? []);
                enregistrerSerie(SERIE_POSITIONNEMENT, { juste: toutes.filter((r) => r.juste).length, total: toutes.length, niveau: niveauEstime(res) ?? "A1" });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          />
        )}
      </section>
    );

  // Le résultat.
  const niveau = estime ?? "A1";
  const aTravailler = estime ? NIVEAUX[Math.min(NIVEAUX.length - 1, NIVEAUX.indexOf(estime) + 1)] : "A1";
  const items: Item[] = blocs.flatMap((b) => b.ranges.map((x) => ({ ref: x.ref, exercice: x.exercice, origine: `${b.niveau} · ${x.lecon.titre}` })));
  const reponses = blocs.flatMap((b) => b.reponses ?? []);
  const histoires = HISTOIRES.filter((h) => h.niveau === niveau || h.niveau === aTravailler).slice(0, 4);
  return (
    <section className="rg-lecon" aria-label="Ton niveau">
      <button type="button" className="rg-retour" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Les règles
      </button>
      <div className="rg-position-resultat">
        <p className="rg-position-etiquette">Ton niveau estimé</p>
        <p className="rg-position-niveau">{estime ?? "A1"}</p>
        <p className="rg-position-nom">{estime ? NOMS_NIVEAUX[estime] : "Tes premiers pas commencent ici"}</p>
        <p className="rg-position-texte">
          {estime
            ? `Le niveau ${estime} est acquis${estime !== "C2" ? ` ; ton prochain palier est le ${aTravailler}` : " : bravo, c'est le sommet"}. Le chemin le plus efficace : les leçons de ton prochain palier pour progresser, et les histoires de ton niveau pour lire avec plaisir.`
            : "Commence par le niveau A1 : chaque leçon est courte, et chaque erreur t'apprend quelque chose."}
        </p>
        <div className="rg-actions">
          {SECTIONS.map((s) => {
            const lecon = s.lecons.find((l) => l.niveau === aTravailler);
            return (
              lecon && (
                <button key={s.id} type="button" className="bouton bouton-principal" onClick={() => onOuvrir(`${s.id}/${lecon.id}`)}>
                  <Sparkles className="size-4" aria-hidden="true" />
                  {s.nom} {aTravailler}
                </button>
              )
            );
          })}
          <button type="button" className="bouton" onClick={onHistoires}>
            <BookOpen className="size-4" aria-hidden="true" />
            Les histoires {niveau}
          </button>
        </div>
        {histoires.length > 0 && (
          <p className="rg-position-histoires">
            À lire : {histoires.map((h) => h.titreFr).join(", ")}.
          </p>
        )}
      </div>
      <BilanSerie items={items} reponses={reponses} mode="examen" titre="Tes réponses au test" phrase="Voici la correction de chaque question du test." onRecommencer={() => (setBlocs([]), setFini(false))} />
    </section>
  );
}
