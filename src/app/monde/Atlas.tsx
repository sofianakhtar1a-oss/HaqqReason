"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CONTINENTS, formatPopulation, formatSuperficie, motCapitale, PAR_CODE } from "@/lib/monde/atlas";
import { NOMBRE_PAYS } from "@/lib/monde/chiffres";
import { PAYS } from "@/lib/monde/donnees";
import { normaliser } from "@/lib/monde/texte";
import type { ContinentId } from "@/lib/monde/types";
import { useTextes } from "@/lib/modules/textes-client";
import { FichePays } from "./FichePays";
import { Drapeau } from "./figures";

/*
 * L'atlas : tous les pays et territoires, leurs drapeaux, leurs capitales, leurs chiffres.
 * On cherche, on filtre par continent, on trie ; chaque pays ouvre sa fiche.
 */

type Tri = "nom" | "population" | "superficie";
const collation = new Intl.Collator("fr", { sensitivity: "base" });

export function Atlas({ ouvert, onOuvrir, aller }: { ouvert: string | null; onOuvrir: (code: string | null) => void; aller: (hash: string) => void }) {
  const t = useTextes("monde");
  const [requete, setRequete] = useState("");
  const [continent, setContinent] = useState<ContinentId | "tous">("tous");
  const [statut, setStatut] = useState<"tous" | "etats" | "territoires">("tous");
  const [tri, setTri] = useState<Tri>("nom");

  const liste = useMemo(() => {
    const q = normaliser(requete);
    return PAYS.filter((p) => p.quiz && (continent === "tous" || p.continent === continent))
      .filter((p) => statut === "tous" || (statut === "etats" ? p.statut !== "territoire" : p.statut === "territoire"))
      .filter((p) => !q || p.noms.some((n) => normaliser(n).includes(q)) || (p.capitale && normaliser(p.capitale).includes(q)))
      .slice()
      .sort((a, b) => (tri === "nom" ? collation.compare(a.nom, b.nom) : tri === "population" ? (b.population ?? -1) - (a.population ?? -1) : (b.superficie ?? -1) - (a.superficie ?? -1)));
  }, [requete, continent, statut, tri]);

  return (
    <div className="pt-atlas">
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">{t("atlas.titre")}</h2>
          <p className="pt-chapo">{t("atlas.chapo", { pays: NOMBRE_PAYS })}</p>
        </div>
      </header>

      <div className="pt-atlas-outils">
        <div className="pt-recherche" role="search">
          <Search className="size-4" aria-hidden="true" />
          <input type="search" value={requete} onChange={(e) => setRequete(e.target.value)} placeholder="Un pays, une capitale…" aria-label="Chercher dans l'atlas" />
        </div>
        <label className="pt-selecteur">
          <span>Trier</span>
          <select value={tri} onChange={(e) => setTri(e.target.value as Tri)}>
            <option value="nom">de A à Z</option>
            <option value="population">par population</option>
            <option value="superficie">par superficie</option>
          </select>
        </label>
        <div className="pt-segments" role="group" aria-label="États ou territoires">
          {(
            [
              ["tous", "Tous"],
              ["etats", "États"],
              ["territoires", "Territoires"],
            ] as const
          ).map(([v, n]) => (
            <button key={v} type="button" aria-pressed={statut === v} onClick={() => setStatut(v)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-continents" role="group" aria-label="Continent">
        <button type="button" className="pt-puce" aria-pressed={continent === "tous"} onClick={() => setContinent("tous")}>
          Tous les continents
        </button>
        {CONTINENTS.map((c) => (
          <button key={c.id} type="button" className="pt-puce" aria-pressed={continent === c.id} onClick={() => setContinent(c.id)}>
            {c.nom}
          </button>
        ))}
      </div>

      <p className="pt-atlas-compte" role="status">
        {liste.length} {liste.length > 1 ? "résultats" : "résultat"}
      </p>
      <ul className="pt-atlas-grille">
        {liste.map((p) => (
          <li key={p.code}>
            <button type="button" className="pt-atlas-carte" onClick={() => onOuvrir(p.code)}>
              <Drapeau code={p.code} />
              <span className="pt-atlas-nom">{p.nom}</span>
              <span className="pt-atlas-capitale">{p.capitale ? `${motCapitale(p)} : ${p.capitale}` : "—"}</span>
              <span className="pt-atlas-chiffre">{tri === "superficie" ? formatSuperficie(p.superficie) : formatPopulation(p.population)}</span>
            </button>
          </li>
        ))}
      </ul>

      <footer className="pt-credits">
        <h3>Sources</h3>
        <p>
          Pays, capitales et monnaies : <a href="https://github.com/mledoze/countries">world-countries</a> (licence ODbL), revus et traduits à la main. Population : Banque mondiale (CC BY 4.0), estimations récentes pour les territoires qu&apos;elle ne couvre pas. Carte : <a href="https://www.naturalearthdata.com/">Natural Earth</a> (domaine public). Drapeaux :{" "}
          <a href="https://github.com/lipis/flag-icons">flag-icons</a> (licence MIT).
        </p>
        <p>Les frontières suivent le tracé de Natural Earth, corrigé selon les positions de l&apos;ONU pour trois territoires : la Crimée est rattachée à l&apos;Ukraine, le plateau du Golan à la Syrie, et le Sahara occidental est dessiné en entier. Les capitales au statut contesté ne sont pas posées en question ; leur fiche explique pourquoi.</p>
      </footer>

      {ouvert && PAR_CODE.has(ouvert) && <FenetreFiche code={ouvert} onFermer={() => onOuvrir(null)} onChoisir={(c) => {
        history.replaceState(null, "", `#atlas/${c}`);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }} onCarte={(c) => aller(`carte/${c}`)} />}
    </div>
  );
}

function FenetreFiche({ code, onFermer, onChoisir, onCarte }: { code: string; onFermer: () => void; onChoisir: (code: string) => void; onCarte: (code: string) => void }) {
  const boite = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => e.key === "Escape" && onFermer();
    window.addEventListener("keydown", touche);
    boite.current?.focus();
    return () => window.removeEventListener("keydown", touche);
  }, [onFermer]);
  return createPortal(
    <div className="pt pt-fenetre" data-accent="safran" role="dialog" aria-modal="true" aria-label="Fiche du pays" onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div ref={boite} className="pt-fenetre-boite" tabIndex={-1}>
        <FichePays code={code} onChoisir={onChoisir} onFermer={onFermer} />
        <button type="button" className="bouton bouton-discret pt-fenetre-carte" onClick={() => onCarte(code)}>
          Voir sur le globe
        </button>
      </div>
    </div>,
    document.body,
  );
}
