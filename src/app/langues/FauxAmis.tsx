"use client";

import { ArrowLeft, BookmarkCheck, BookmarkPlus, Play, Search, TriangleAlert, Volume2 } from "lucide-react";
import { useMemo, useState } from "react";
import { idMot, nouveauMot } from "@/lib/langues/dictionnaire";
import { composerQuiz, FAUX_AMIS } from "@/lib/langues/faux-amis";
import { NIVEAUX, type Niveau } from "@/lib/langues/types";
import { parler, voixDisponible } from "@/lib/langues/voix";
import { ajouterMot, useDonnees } from "./donnees";
import { BilanSerie, type Item, type Reponse, SerieVue } from "./regles/Exercices";
import "./histoires/histoires.css";
import "./regles/regles.css";

/*
 * Les faux amis : la liste d'étude (le vrai sens, la traduction du mot piège, un exemple, une astuce)
 * et un quiz de douze questions tirées au hasard, corrigées une à une.
 */

const sansAccents = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export function FauxAmis({ onRetour }: { onRetour: () => void }) {
  const { mots } = useDonnees();
  const [recherche, setRecherche] = useState("");
  const [niveau, setNiveau] = useState<Niveau | "tous">("tous");
  const [quiz, setQuiz] = useState<{ items: Item[]; tour: number } | null>(null);
  const [fin, setFin] = useState<Reponse[] | null>(null);

  const liste = useMemo(() => {
    const q = sansAccents(recherche.trim());
    return FAUX_AMIS.filter((f) => (niveau === "tous" || f.niveau === niveau) && (!q || sansAccents(`${f.en} ${f.piege} ${f.sens}`).includes(q)));
  }, [recherche, niveau]);

  const lancer = () => {
    setFin(null);
    setQuiz((x) => ({ items: composerQuiz(liste.length >= 6 ? liste : FAUX_AMIS, 12), tour: (x?.tour ?? 0) + 1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (quiz && !fin)
    return (
      <section className="rg-lecon" aria-label="Quiz des faux amis">
        <button type="button" className="rg-retour" onClick={() => setQuiz(null)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Les faux amis
        </button>
        <SerieVue key={quiz.tour} items={quiz.items} mode="guide" onFini={(r) => (setFin(r), window.scrollTo({ top: 0, behavior: "smooth" }))} />
      </section>
    );
  if (quiz && fin)
    return (
      <section className="rg-lecon" aria-label="Bilan du quiz">
        <button type="button" className="rg-retour" onClick={() => (setQuiz(null), setFin(null))}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Les faux amis
        </button>
        <BilanSerie items={quiz.items} reponses={fin} mode="guide" titre="Quiz des faux amis" onRecommencer={lancer} />
      </section>
    );

  return (
    <section className="fa" aria-labelledby="titre-faux-amis">
      <button type="button" className="rg-retour" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Vocabulaire
      </button>
      <div className="lg-section-tete">
        <div>
          <h2 id="titre-faux-amis" className="lg-titre">
            Les faux amis
          </h2>
          <p className="lg-chapo">
            {FAUX_AMIS.length} mots anglais qui ressemblent à un mot français sans en avoir le sens. « Actually » n&apos;est pas « actuellement », une « library » n&apos;est pas une librairie : les connaître, c&apos;est éviter les erreurs les plus fréquentes des francophones.
          </p>
        </div>
      </div>

      <div className="fa-outils">
        <button type="button" className="bouton bouton-principal" onClick={lancer}>
          <Play className="size-4" fill="currentColor" aria-hidden="true" />
          Quiz : 12 faux amis {niveau !== "tous" || recherche ? "de cette sélection" : "au hasard"}
        </button>
        <label className="fa-recherche">
          <Search className="size-4" aria-hidden="true" />
          <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Chercher un mot" aria-label="Chercher un faux ami" />
        </label>
      </div>
      <div className="hs-niveaux" role="group" aria-label="Niveau">
        <button type="button" aria-pressed={niveau === "tous"} onClick={() => setNiveau("tous")}>
          Tous ({FAUX_AMIS.length})
        </button>
        {NIVEAUX.map((n) => {
          const nombre = FAUX_AMIS.filter((f) => f.niveau === n).length;
          return (
            nombre > 0 && (
              <button key={n} type="button" data-niveau={n} aria-pressed={niveau === n} onClick={() => setNiveau(n)}>
                <strong>{n}</strong> <span>{nombre}</span>
              </button>
            )
          );
        })}
      </div>

      {liste.length === 0 ? (
        <p className="lg-vide">Aucun faux ami ne correspond à ta recherche.</p>
      ) : (
        <ul className="fa-liste">
          {liste.map((f) => {
            const garde = mots.some((m) => m.id === idMot(f.en));
            return (
              <li key={f.en} className="fa-carte" data-niveau={f.niveau}>
                <div className="fa-carte-tete">
                  <p className="fa-paire">
                    <span lang="en" className="fa-en">
                      {f.en}
                    </span>
                    <span className="fa-different" aria-label="n'est pas">
                      ≠
                    </span>
                    <span className="fa-piege">{f.piege}</span>
                  </p>
                  <span className="fa-niveau">{f.niveau}</span>
                </div>
                <p className="fa-sens">
                  <span>Veut dire</span> {f.sens}
                </p>
                <p className="fa-traduire">
                  <TriangleAlert className="size-3.5" aria-hidden="true" />
                  <span>
                    « {f.piege} » se dit <strong lang="en">{f.traduirePiege}</strong>
                  </span>
                </p>
                <figure className="fa-exemple">
                  <blockquote lang="en">{f.exEn}</blockquote>
                  <figcaption>{f.exFr}</figcaption>
                </figure>
                <p className="fa-note">{f.note}</p>
                <div className="fa-actions">
                  {voixDisponible() && (
                    <button type="button" className="hs-garder" aria-label={`Écouter « ${f.en} »`} onClick={() => void parler(f.exEn)}>
                      <Volume2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="hs-garder"
                    disabled={garde}
                    aria-label={garde ? `« ${f.en} » est dans ton dictionnaire` : `Garder « ${f.en} » dans ton dictionnaire`}
                    onClick={() => ajouterMot(nouveauMot({ en: f.en, fr: f.sens, phrase: f.exEn, phraseFr: f.exFr }, { type: "manuel", titre: "Les faux amis" }))}
                  >
                    {garde ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <BookmarkPlus className="size-4" aria-hidden="true" />}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
