"use client";

import { ArrowLeft, Lock, Sailboat } from "lucide-react";
import { useState } from "react";
import { pays } from "@/lib/monde/atlas";
import { CATEGORIES, type CategorieId, TYPES, type TypeQuestion, typesDe } from "@/lib/monde/categories";
import { grade, NB_NIVEAUX, niveauxDe, QUESTIONS_PAR_NIVEAU } from "@/lib/monde/niveaux";
import { etoiles, maitrise, niveauCourant, niveauOuvert, useMonde } from "@/lib/monde/progression";
import { ICONES_CATEGORIES } from "./Accueil";
import { Etoiles } from "./communs";
import { type Lancement, useLancer } from "./Partie";

/*
 * Une catégorie : quinze escales sur une route maritime, du mousse à l'Atlas.
 * Avant de partir, on choisit sa méthode (le mélange, ou une seule façon de poser la question).
 */

export function Categorie({ id, onRetour, lancer }: { id: CategorieId; onRetour: () => void; lancer: (l: Lancement) => void }) {
  const def = CATEGORIES[id];
  const Icone = ICONES_CATEGORIES[id];
  const monde = useMonde();
  const l = useLancer();
  const [methode, setMethode] = useState<TypeQuestion | null>(null);
  const niveaux = niveauxDe(id);
  const courant = niveauCourant(monde, id);
  const m = maitrise(monde, id);

  return (
    <div className="pt-categorie" data-categorie={id}>
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        Toutes les routes
      </button>
      <header className="pt-categorie-tete">
        <Icone className="pt-categorie-icone" strokeWidth={1.3} aria-hidden="true" />
        <div>
          <h2 className="pt-titre">{def.nom}</h2>
          <p className="pt-chapo">{def.texte}</p>
          <p className="pt-maitrise">
            <span className="pt-maitrise-barre" aria-hidden="true">
              <span style={{ transform: `scaleX(${m.total ? m.sus / m.total : 0})` }} />
            </span>
            <span className="tabular-nums">
              {m.sus} sur {m.total} maîtrisés
            </span>
          </p>
        </div>
      </header>

      <fieldset className="pt-methodes">
        <legend>Méthode</legend>
        <button type="button" className="pt-puce" aria-pressed={methode === null} onClick={() => setMethode(null)}>
          Mélange (recommandé)
        </button>
        {typesDe(id).map((t) => (
          <button key={t} type="button" className="pt-puce" aria-pressed={methode === t} onClick={() => setMethode(t)}>
            {TYPES[t].libelle}
          </button>
        ))}
      </fieldset>

      <ol className="pt-route" aria-label={`Les ${NB_NIVEAUX} niveaux`}>
        {niveaux.map((codes, i) => {
          const n = i + 1;
          const ouvert = niveauOuvert(monde, id, n);
          const e = etoiles(monde, id, n);
          const fait = Boolean(monde.niveaux[`${id}:${n}`]?.f);
          const g = grade(n);
          const apercu = codes.slice(0, 3).map((c) => pays(c).nom);
          return (
            <li key={n} className="pt-escale" data-ouvert={ouvert || undefined} data-fait={fait || undefined} data-courant={n === courant || undefined} style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                className="pt-escale-bouton"
                disabled={!ouvert}
                onClick={() => lancer(l.niveau(id, n, methode))}
                aria-label={`Niveau ${n}, ${g.nom}${ouvert ? (fait ? `, ${e} étoile${e > 1 ? "s" : ""}` : ", à jouer") : ", verrouillé"}`}
              >
                <span className="pt-escale-medaille" aria-hidden="true">
                  {n === courant && ouvert ? <Sailboat className="size-5" /> : ouvert ? n : <Lock className="size-4" />}
                </span>
                <span className="pt-escale-corps">
                  <span className="pt-escale-grade">
                    <span className="pt-escale-num">Niveau {n}</span> {g.nom}
                  </span>
                  <span className="pt-escale-pays">
                    {apercu.join(", ")}
                    {codes.length > 3 ? ` et ${codes.length - 3} autres` : ""}
                  </span>
                  <span className="pt-escale-regles">{QUESTIONS_PAR_NIVEAU} questions et 3 cœurs</span>
                </span>
                <Etoiles n={e} />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
