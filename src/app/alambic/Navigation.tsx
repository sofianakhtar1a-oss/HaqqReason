"use client";

/*
 * Le menu des outils, rangés en trois familles, et la recherche « Que veux-tu faire ? ».
 * Sur téléphone, les outils défilent sur une ligne ; sur ordinateur, ils forment une colonne.
 */
import { Search, Sparkles, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { chercherIntentions, intention as intentionDe, POPULAIRES, type Intention } from "@/lib/alambic/intentions";
import { parGroupes, type Outil } from "@/lib/alambic/outils";
import type { FicheOutil } from "./contexte";

export function Navigation({ outils, actif, onChoisir, onIntention }: { outils: FicheOutil[]; actif: Outil; onChoisir: (o: Outil) => void; onIntention: (i: Intention) => void }) {
  const groupes = useMemo(() => parGroupes(outils), [outils]);
  const rail = useRef<HTMLDivElement>(null);
  const prefixe = useId();

  // Sur téléphone, l'outil choisi vient au milieu de la ligne (sans faire défiler la page).
  useEffect(() => {
    const r = rail.current;
    const tuile = r?.querySelector<HTMLElement>(`[data-outil="${actif}"]`);
    if (!r || !tuile || r.scrollWidth <= r.clientWidth + 1) return;
    const cible = tuile.offsetLeft - (r.clientWidth - tuile.offsetWidth) / 2;
    r.scrollTo({ left: Math.max(0, cible), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [actif]);

  return (
    <nav className="alambic-outils" aria-label="Outils">
      <Recherche outils={outils} onIntention={onIntention} />
      <div className="alambic-groupes" ref={rail}>
        {groupes.map(({ groupe, outils: liste }) => (
          <div key={groupe.id} className="alambic-groupe" role="group" aria-labelledby={`${prefixe}-${groupe.id}`}>
            <span id={`${prefixe}-${groupe.id}`} className="alambic-groupe-nom">
              {groupe.nom}
            </span>
            {liste.map(({ id, nom, aide, Icone }) => (
              <button key={id} type="button" className="alambic-tuile" data-outil={id} aria-pressed={actif === id} onClick={() => onChoisir(id)} title={aide || undefined}>
                <Icone className="size-6" strokeWidth={1.5} aria-hidden="true" />
                <span className="alambic-tuile-nom">{nom}</span>
                <span className="alambic-tuile-aide">{aide}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

/** « Que veux-tu faire ? » : une phrase, et l'outil qui y répond, déjà réglé. */
function Recherche({ outils, onIntention }: { outils: FicheOutil[]; onIntention: (i: Intention) => void }) {
  const [q, setQ] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const boite = useRef<HTMLDivElement>(null);
  const champ = useRef<HTMLInputElement>(null);
  const id = useId();
  const presents = useMemo(() => new Set(outils.map((o) => o.id)), [outils]);
  const nomOutil = (o: Outil) => outils.find((x) => x.id === o)?.nom ?? o;

  const propositions = useMemo(() => {
    const liste = q.trim() ? chercherIntentions(q, 8) : POPULAIRES.map((p) => intentionDe(p)).filter((x): x is Intention => Boolean(x));
    return liste.filter((i) => presents.has(i.outil));
  }, [q, presents]);

  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (!boite.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, [ouvert]);

  const choisir = (i: Intention) => {
    onIntention(i);
    setQ("");
    setOuvert(false);
    champ.current?.blur();
  };

  return (
    <div className="alambic-recherche" ref={boite}>
      <label htmlFor={`${id}-champ`} className="sr-only">
        Que veux-tu faire ?
      </label>
      <div className="alambic-recherche-champ">
        <Search className="size-4 shrink-0 text-encre-douce" aria-hidden="true" />
        <input
          ref={champ}
          id={`${id}-champ`}
          role="combobox"
          aria-expanded={ouvert}
          aria-controls={`${id}-liste`}
          aria-autocomplete="list"
          aria-activedescendant={ouvert && propositions[actif] ? `${id}-${propositions[actif].id}` : undefined}
          value={q}
          placeholder="Que veux-tu faire ?"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setQ(e.target.value);
            setActif(0);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOuvert(true);
              setActif((a) => Math.min(propositions.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActif((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && ouvert && propositions[actif]) {
              e.preventDefault();
              choisir(propositions[actif]);
            } else if (e.key === "Escape") {
              setOuvert(false);
            }
          }}
        />
        {q && (
          <button type="button" className="bouton-icone !size-8" aria-label="Effacer la recherche" onClick={() => { setQ(""); champ.current?.focus(); }}>
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {ouvert && (
        <div className="alambic-recherche-liste verre">
          <p className="alambic-recherche-titre">{q.trim() ? (propositions.length ? "Ce qui répond le mieux" : "Rien trouvé") : "Souvent demandé"}</p>
          {propositions.length > 0 ? (
            <ul id={`${id}-liste`} role="listbox" aria-label="Propositions">
              {propositions.map((p, i) => (
                <li
                  key={p.id}
                  id={`${id}-${p.id}`}
                  role="option"
                  aria-selected={i === actif}
                  onMouseEnter={() => setActif(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choisir(p)}
                >
                  <Sparkles className="size-4 shrink-0 text-or" aria-hidden="true" />
                  <span className="min-w-0 flex-1">{p.titre}</span>
                  <span className="alambic-recherche-outil">{nomOutil(p.outil)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p id={`${id}-liste`} className="px-3 pb-3 text-sm text-encre-douce">
              Essaie avec d&apos;autres mots : « réduire », « pivoter », « mot de passe », « signer », « photo »…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
