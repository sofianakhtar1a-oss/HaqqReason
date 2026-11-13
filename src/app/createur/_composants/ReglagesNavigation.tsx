"use client";

import { ArrowUp, Milestone, Network, X } from "lucide-react";
import { useState } from "react";
import { definirCategoriesSecondaires, definirPrerequis } from "../navigation-actions";
import { ChoixArticle } from "./ateliers/ChoixArticle";

type Props = {
  articleId: string;
  categoriePrincipale: string;
  groupes: { bloc: string; categories: { id: string; libelle: string }[] }[];
  secondaires: string[];
  prerequis: { id: string; titre: string }[];
};

/** Multi-classement et prérequis de lecture d'un article. */
export function ReglagesNavigation({ articleId, categoriePrincipale, groupes, secondaires: initiales, prerequis: initiaux }: Props) {
  const [secondaires, setSecondaires] = useState(initiales);
  const [prerequis, setPrerequis] = useState(initiaux);
  const [message, setMessage] = useState("");
  const nomCategorie = (id: string) => groupes.flatMap((g) => g.categories).find((c) => c.id === id)?.libelle.trim() ?? "Catégorie";

  async function majCategories(ids: string[]) {
    setSecondaires(ids);
    const r = await definirCategoriesSecondaires(articleId, ids);
    setMessage(r.ok ? "Enregistré." : r.message);
  }
  async function majPrerequis(liste: { id: string; titre: string }[]) {
    setPrerequis(liste);
    const r = await definirPrerequis(articleId, liste.map((p) => p.id));
    setMessage(r.ok ? "Enregistré." : r.message);
  }

  return (
    <section className="verre panneau space-y-5" aria-labelledby="titre-navigation">
      <h2 id="titre-navigation" className="text-lg font-bold">
        Navigation
      </h2>
      <div>
        <p className="flex items-center gap-2 font-semibold">
          <Network className="size-4 text-accent" aria-hidden="true" />
          Aussi classé dans
        </p>
        <ul className="mt-2 space-y-1.5">
          {secondaires.map((id) => (
            <li key={id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{nomCategorie(id)}</span>
              <button type="button" className="bouton-icone !size-8" aria-label={`Retirer de ${nomCategorie(id)}`} onClick={() => void majCategories(secondaires.filter((x) => x !== id))}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <select
          className="champ mt-2 !min-h-10 !py-2 text-sm"
          aria-label="Ajouter une autre catégorie"
          value=""
          onChange={(e) => e.target.value && void majCategories([...secondaires, e.target.value])}
        >
          <option value="">Ajouter une catégorie…</option>
          {groupes.map((g) => (
            <optgroup key={g.bloc} label={g.bloc}>
              {g.categories
                .filter((c) => c.id !== categoriePrincipale && !secondaires.includes(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <p className="aide mt-1 text-sm">L&apos;article apparaît aussi dans ces catégories, sans être dupliqué.</p>
      </div>
      <div>
        <p className="flex items-center gap-2 font-semibold">
          <Milestone className="size-4 text-accent" aria-hidden="true" />
          À lire avant
        </p>
        <ol className="mt-2 space-y-1.5">
          {prerequis.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <span className="w-5 text-encre-douce">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate">{p.titre}</span>
              <button type="button" className="bouton-icone !size-8" aria-label={`Monter ${p.titre}`} disabled={i === 0} onClick={() => void majPrerequis(prerequis.map((x, k) => (k === i ? prerequis[i - 1] : k === i - 1 ? prerequis[i] : x)))}>
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
              <button type="button" className="bouton-icone !size-8" aria-label={`Retirer ${p.titre}`} onClick={() => void majPrerequis(prerequis.filter((x) => x.id !== p.id))}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-2">
          <ChoixArticle libelle="Ajouter un article à lire avant" valeur="" exclure={[articleId, ...prerequis.map((p) => p.id)]} onChange={(id, titre) => id && void majPrerequis([...prerequis, { id, titre }])} />
        </div>
        <p className="aide mt-1 text-sm">Affiché en tête de l&apos;article ; l&apos;article apparaît en retour dans « Pour aller plus loin ».</p>
      </div>
      {message && (
        <p className="text-sm text-encre-douce" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
