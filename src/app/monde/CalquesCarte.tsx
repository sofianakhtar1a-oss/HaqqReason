"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { CALQUES, type CalqueId, type Legende, languesRepandues } from "@/lib/monde/calques";
import { ORGANISATIONS } from "@/lib/monde/organisations";
import type { OrganisationId } from "@/lib/monde/types";

/*
 * Les calques de la carte : la couleur des pays (un seul calque à la fois) et ce qu'on pose
 * par-dessus (les noms, les mers et les fleuves, le relief, la nuit), avec la légende de ce qu'on voit.
 */

export type ReglagesCarte = {
  calque: CalqueId;
  org: OrganisationId;
  langue: string;
  noms: boolean;
  geographie: boolean;
  relief: boolean;
  nuit: boolean;
};

export const REGLAGES_PAR_DEFAUT: ReglagesCarte = { calque: "maitrise", org: "ue", langue: "arabe", noms: false, geographie: false, relief: false, nuit: false };

const SUPERPOSITIONS: { cle: "noms" | "geographie" | "relief" | "nuit"; nom: string; texte: string }[] = [
  { cle: "noms", nom: "Noms et capitales", texte: "Ils paraissent à mesure qu'on s'approche." },
  { cle: "geographie", nom: "Mers, lacs et fleuves", texte: "Les océans, les grandes mers, les golfes et les cours d'eau." },
  { cle: "relief", nom: "Relief, déserts et sommets", texte: "Les chaînes de montagnes dessinées comme sur les cartes anciennes." },
  { cle: "nuit", nom: "Le jour et la nuit", texte: "L'ombre de la Terre en ce moment, et le Soleil au zénith." },
];

export function PanneauCalques({ reglages, changer, onFermer, jeu = false }: { reglages: ReglagesCarte; changer: (r: Partial<ReglagesCarte>) => void; onFermer: () => void; jeu?: boolean }) {
  const langues = useMemo(() => languesRepandues().slice(0, 18), []);
  return (
    <div className="pt-calques" role="dialog" aria-label="Les calques de la carte">
      <div className="pt-calques-tete">
        <p className="pt-calques-titre">Calques</p>
        <button type="button" className="pt-icone" onClick={onFermer} aria-label="Fermer les calques">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      {jeu && <p className="pt-calques-note">Pendant un jeu, les couleurs et les noms se cachent : ils donneraient les réponses.</p>}
      <fieldset className="pt-calques-groupe" disabled={jeu}>
        <legend>La couleur des pays</legend>
        {CALQUES.map((c) => (
          <label key={c.id} className="pt-calques-choix">
            <input type="radio" name="pt-calque" value={c.id} checked={reglages.calque === c.id} onChange={() => changer({ calque: c.id })} />
            <span>{c.nom}</span>
          </label>
        ))}
      </fieldset>
      {reglages.calque === "organisations" && !jeu && (
        <div className="pt-calques-sous" role="group" aria-label="L'organisation">
          {(Object.keys(ORGANISATIONS) as OrganisationId[]).map((o) => (
            <button key={o} type="button" className="pt-puce" aria-pressed={reglages.org === o} onClick={() => changer({ org: o })}>
              {ORGANISATIONS[o].court}
            </button>
          ))}
        </div>
      )}
      {reglages.calque === "langues" && !jeu && (
        <label className="pt-calques-langue">
          <span>La langue</span>
          <select value={reglages.langue} onChange={(e) => changer({ langue: e.target.value })}>
            {langues.map((l) => (
              <option key={l.langue} value={l.langue}>
                {l.langue} ({l.n})
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset className="pt-calques-groupe">
        <legend>Sur la carte</legend>
        {SUPERPOSITIONS.map((s) => (
          <label key={s.cle} className="pt-calques-case">
            <input type="checkbox" checked={reglages[s.cle]} disabled={jeu && s.cle === "noms"} onChange={(e) => changer({ [s.cle]: e.target.checked } as Partial<ReglagesCarte>)} />
            <span>
              {s.nom}
              <small>{s.texte}</small>
            </span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

/** La légende de la couleur des pays, repliable. */
export function LegendeCarte({ legende, ouverte = true }: { legende: Legende; ouverte?: boolean }) {
  // Sur un petit écran, la légende commence repliée : elle cacherait le globe.
  const [large] = useState(() => typeof window === "undefined" || window.matchMedia("(min-width: 48rem)").matches);
  return (
    <details className="pt-legende" open={ouverte && large}>
      <summary>{legende.titre}</summary>
      {legende.degrade && (
        <div className="pt-legende-echelle">
          <span className="pt-legende-degrade" style={{ background: `linear-gradient(90deg, ${legende.degrade.couleurs.join(", ")})` }} aria-hidden="true" />
          <span className="pt-legende-bornes">
            <span>{legende.degrade.debut}</span>
            <span>{legende.degrade.fin}</span>
          </span>
        </div>
      )}
      <ul>
        {legende.entrees.map((e) => (
          <li key={e.texte}>
            <span className="pt-legende-pastille" data-raye={e.raye || undefined} style={{ background: e.raye ? undefined : e.couleur }} aria-hidden="true" />
            {e.texte}
          </li>
        ))}
      </ul>
      {legende.note && <p className="pt-legende-note">{legende.note}</p>}
    </details>
  );
}
