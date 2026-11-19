"use client";

import { X } from "lucide-react";
import { formatPopulation, formatSuperficie, LIBELLES_STATUT, motCapitale, NOM_CONTINENT, pays as paysDe, PAR_CODE } from "@/lib/monde/atlas";
import { CATEGORIES, IDS_CATEGORIES } from "@/lib/monde/categories";
import { boite, useMonde } from "@/lib/monde/progression";
import { Drapeau } from "./figures";

/* La fiche d'un pays : tout ce qu'il faut savoir, et ce que ta mémoire en a retenu. */

export function FichePays({ code, onChoisir, onFermer, compacte = false }: { code: string; onChoisir?: (code: string) => void; onFermer?: () => void; compacte?: boolean }) {
  const p = paysDe(code);
  const monde = useMonde();
  const souverain = p.souverain ? PAR_CODE.get(p.souverain) : undefined;
  return (
    <article className="pt-fiche" data-compacte={compacte || undefined} aria-label={`Fiche : ${p.nom}`}>
      <header className="pt-fiche-tete">
        <Drapeau code={p.code} grand />
        <div>
          <h3 className="pt-fiche-nom">{p.nom}</h3>
          {p.complet && p.complet !== p.nom && <p className="pt-fiche-complet">{p.complet}</p>}
          <p className="pt-fiche-statut">{p.nature ?? LIBELLES_STATUT[p.statut]}</p>
        </div>
        {onFermer && (
          <button type="button" className="pt-icone pt-fiche-fermer" onClick={onFermer} aria-label="Fermer la fiche">
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
      </header>
      <dl className="pt-fiche-faits">
        <div>
          <dt>{motCapitale(p)}</dt>
          <dd>
            {p.capitale ?? "—"}
            {p.noteCapitale && <small>{p.noteCapitale}</small>}
          </dd>
        </div>
        <div>
          <dt>Continent</dt>
          <dd>
            {NOM_CONTINENT[p.continent]}
            {p.continents?.length ? ` (et ${p.continents.map((c) => NOM_CONTINENT[c]).join(", ")})` : ""}
            <small>{p.sousRegion}</small>
          </dd>
        </div>
        <div>
          <dt>Population</dt>
          <dd>
            {formatPopulation(p.population)}
            {(p.anneePopulation || p.notePopulation) && <small>{[p.anneePopulation ? `en ${p.anneePopulation}` : "", p.notePopulation ?? ""].filter(Boolean).join(" · ")}</small>}
          </dd>
        </div>
        <div>
          <dt>Superficie</dt>
          <dd>{formatSuperficie(p.superficie)}</dd>
        </div>
        <div>
          <dt>Monnaie{p.monnaies.length > 1 ? "s" : ""}</dt>
          <dd>{p.monnaies.length ? p.monnaies.map((m) => `${m.nom}${m.symbole ? ` (${m.symbole})` : ""}`).join(" · ") : "—"}</dd>
        </div>
        {p.langues.length > 0 && (
          <div>
            <dt>Langue{p.langues.length > 1 ? "s" : ""}</dt>
            <dd>{p.langues.join(", ")}</dd>
          </div>
        )}
        {souverain && (
          <div>
            <dt>Dépend de</dt>
            <dd>
              {onChoisir ? (
                <button type="button" className="pt-lien" onClick={() => onChoisir(souverain.code)}>
                  {souverain.nom}
                </button>
              ) : (
                souverain.nom
              )}
              {p.drapeauDe && <small>Il hisse le drapeau de {paysDe(p.drapeauDe).nom}.</small>}
            </dd>
          </div>
        )}
      </dl>
      {(p.voisins.length > 0 || p.enclave) && (
        <div className="pt-fiche-voisins">
          <p>{p.voisins.length ? `Voisins (${p.voisins.length})` : "Voisins"}</p>
          <ul className="pt-puces">
            {p.enclave && <li data-note="">Sans accès à la mer</li>}
            {p.voisins.map((v) => (
              <li key={v}>
                {onChoisir ? (
                  <button type="button" onClick={() => onChoisir(v)}>
                    {paysDe(v).nom}
                  </button>
                ) : (
                  paysDe(v).nom
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {p.quiz && (
        <div className="pt-fiche-memoire" aria-label="Ce que ta mémoire en a retenu">
          {IDS_CATEGORIES.filter((c) => CATEGORIES[c].eligible(p)).map((c) => {
            const b = boite(monde, p.code, c);
            return (
              <span key={c} className="pt-fiche-boite" title={`${CATEGORIES[c].nom} : ${b >= 3 ? "maîtrisé" : b ? "en cours" : "pas encore vu"}`}>
                <span>{CATEGORIES[c].nom}</span>
                <span className="pt-points" data-boite={b} aria-label={`boîte ${b} sur 5`}>
                  {[1, 2, 3, 4, 5].map((k) => (
                    <i key={k} data-plein={k <= b || undefined} />
                  ))}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </article>
  );
}
