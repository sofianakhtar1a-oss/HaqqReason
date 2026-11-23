"use client";

import { ArrowLeft, Award, GraduationCap, LoaderCircle, Play } from "lucide-react";
import { useState } from "react";
import { MarquePremium } from "@/components/premium/MarquePremium";
import { utiliser } from "@/lib/client/premium";
import { composerExamen, exercicesDuNiveau, type ExerciceRange } from "@/lib/regles/banque";
import { NOMS_NIVEAUX, SECTIONS } from "@/lib/regles/index";
import { enregistrerSerie, noterReponses, type ResultatSerie, serieExamen, useSuivi } from "@/lib/regles/suivi";
import { NIVEAUX, type Niveau, type Section } from "@/lib/regles/types";
import { BilanSerie, type Item, type Reponse, SerieVue } from "./Exercices";

/*
 * Les examens de niveau : trente questions tirées de toutes les leçons d'un niveau (défi et entraînement),
 * sans indice, la correction à la fin. À 80 % et plus, le diplôme du niveau est gagné.
 */

export const SEUIL_DIPLOME = 0.8;
const NOMBRE = 30;

export const diplome = (r: ResultatSerie | undefined) => Boolean(r && r.total && r.meilleur / r.total >= SEUIL_DIPLOME);

type Examen = { section: Section; niveau: Niveau; items: Item[]; ranges: ExerciceRange[]; tour: number };

export function Examens({ onRetour, onLecon }: { onRetour: () => void; onLecon: (chemin: string) => void }) {
  const { series } = useSuivi();
  const [examen, setExamen] = useState<Examen | null>(null);
  const [fin, setFin] = useState<Reponse[] | null>(null);
  const [charge, setCharge] = useState<string | null>(null);

  const lancer = async (section: Section, niveau: Niveau) => {
    // L'offre Premium : un examen lancé compte (les examens et diplômes peuvent être réservés).
    if (!(await utiliser("truchement.examens"))) return;
    setCharge(`${section.id}/${niveau}`);
    try {
      const ranges = composerExamen(await exercicesDuNiveau(section.id, niveau), NOMBRE);
      setFin(null);
      setExamen((e) => ({ section, niveau, ranges, items: ranges.map((x) => ({ ref: x.ref, exercice: x.exercice, origine: x.lecon.titre })), tour: (e?.tour ?? 0) + 1 }));
      window.scrollTo({ top: 0 });
    } finally {
      setCharge(null);
    }
  };

  if (examen && !fin)
    return (
      <section className="rg-lecon" data-section={examen.section.id} aria-label="Examen">
        <button type="button" className="rg-retour" onClick={() => setExamen(null)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Quitter l&apos;examen
        </button>
        <div className="rg-examen-tete">
          <GraduationCap className="size-6" aria-hidden="true" />
          <div>
            <p className="rg-lecon-niveau">
              {examen.niveau} · {examen.section.nom}
            </p>
            <h2 className="rg-lecon-nom">Examen de niveau {examen.niveau}</h2>
            <p className="rg-lecon-notion">{examen.items.length} questions de toutes les leçons du niveau. Une seule réponse, sans indice : la correction complète t&apos;attend à la fin.</p>
          </div>
        </div>
        <SerieVue
          key={examen.tour}
          items={examen.items}
          mode="examen"
          libelleFin="Voir mon résultat"
          onFini={(reponses) => {
            const juste = reponses.filter((r) => r.juste).length;
            enregistrerSerie(serieExamen(examen.section.id, examen.niveau), { juste, total: reponses.length });
            noterReponses(reponses.map((r) => ({ ref: r.ref, juste: r.juste, premierCoup: r.juste })));
            setFin(reponses);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </section>
    );

  if (examen && fin) {
    const juste = fin.filter((r) => r.juste).length;
    const reussi = juste / Math.max(1, fin.length) >= SEUIL_DIPLOME;
    const parRef = new Map(fin.map((r) => [r.ref, r]));
    const aRevoir = new Map<string, { titre: string; id: string; fautes: number }>();
    for (const x of examen.ranges)
      if (!parRef.get(x.ref)?.juste) {
        const a = aRevoir.get(x.lecon.id) ?? { titre: x.lecon.titre, id: x.lecon.id, fautes: 0 };
        a.fautes++;
        aRevoir.set(x.lecon.id, a);
      }
    return (
      <section className="rg-lecon" data-section={examen.section.id} aria-label="Résultat de l'examen">
        <button type="button" className="rg-retour" onClick={() => (setExamen(null), setFin(null))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Les examens
        </button>
        {reussi && <Diplome section={examen.section} niveau={examen.niveau} juste={juste} total={fin.length} />}
        <BilanSerie
          items={examen.items}
          reponses={fin}
          mode="examen"
          titre={`Examen ${examen.section.nom} ${examen.niveau}`}
          phrase={
            reussi
              ? `Diplôme gagné : tu maîtrises le niveau ${examen.niveau}. Lis la correction de tes erreurs, elles sont gardées dans ton carnet.`
              : `Il faut ${Math.ceil(SEUIL_DIPLOME * fin.length)} bonnes réponses pour le diplôme. Revois les leçons ci-dessous, puis retente ta chance : tes erreurs t'attendent dans ton carnet.`
          }
          onRecommencer={() => void lancer(examen.section, examen.niveau)}
          complement={
            aRevoir.size > 0 ? (
              <div className="rg-a-revoir">
                <p>Les leçons à revoir :</p>
                <ul>
                  {[...aRevoir.values()]
                    .sort((a, b) => b.fautes - a.fautes)
                    .map((l) => (
                      <li key={l.id}>
                        <button type="button" className="rg-lien-lecon" onClick={() => onLecon(`${examen.section.id}/${l.id}`)}>
                          {l.titre}
                          <span>
                            {l.fautes} erreur{l.fautes > 1 ? "s" : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ) : undefined
          }
        />
      </section>
    );
  }

  return (
    <section className="rg rg-examens" aria-labelledby="titre-examens">
      <button type="button" className="rg-retour" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Les règles
      </button>
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-examens" className="lg-titre">
            Les examens de niveau <MarquePremium fonction="truchement.examens" />
          </h2>
          <p className="lg-chapo">
            Trente questions tirées de toutes les leçons d&apos;un niveau, sans indice, comme le jour d&apos;un vrai examen. La correction complète arrive à la fin, et à {Math.round(SEUIL_DIPLOME * 100)} % de bonnes réponses, le diplôme du niveau est à toi.
          </p>
        </div>
      </div>
      {SECTIONS.map((s) => (
        <div key={s.id} className="rg-examens-section" data-section={s.id}>
          <h3 className="rg-examens-titre">
            {s.nom} <span>{s.univers}</span>
          </h3>
          <ul className="rg-examens-grille">
            {NIVEAUX.map((n) => {
              const r = series[serieExamen(s.id, n)];
              const lecons = s.lecons.filter((l) => l.niveau === n).length;
              const ok = diplome(r);
              return (
                <li key={n} className="rg-examen" data-diplome={ok || undefined}>
                  <span className="rg-examen-niveau">{n}</span>
                  <span className="rg-examen-nom">{NOMS_NIVEAUX[n]}</span>
                  <span className="rg-examen-infos">
                    {lecons} leçons · {s.grades[n]}
                  </span>
                  <span className="rg-examen-score">
                    {ok ? <Award className="size-4" aria-hidden="true" /> : null}
                    {r ? `${ok ? "Diplôme · " : "Meilleur : "}${r.meilleur}/${r.total}` : "Pas encore passé"}
                  </span>
                  <button type="button" className="bouton" disabled={Boolean(charge)} onClick={() => void lancer(s, n)}>
                    {charge === `${s.id}/${n}` ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                    {r ? "Repasser" : "Passer l'examen"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}

/** Le diplôme d'un niveau, comme une carte qu'on garde. */
function Diplome({ section, niveau, juste, total }: { section: Section; niveau: Niveau; juste: number; total: number }) {
  return (
    <div className="rg-diplome" role="img" aria-label={`Diplôme ${section.nom} ${niveau}`}>
      <Award className="rg-diplome-sceau" aria-hidden="true" />
      <p className="rg-diplome-etiquette">Le Truchement · Diplôme</p>
      <p className="rg-diplome-niveau">
        {section.nom} {niveau}
      </p>
      <p className="rg-diplome-grade" lang="en">
        {section.grades[niveau]}
      </p>
      <p className="rg-diplome-detail">
        {juste} bonnes réponses sur {total} · {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </div>
  );
}
