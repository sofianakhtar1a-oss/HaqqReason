"use client";

import { Award, CalendarDays, Flame, Timer, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { derniersJours, serieEnCours } from "@/lib/atelier/journal-ecriture";
import { modifierPreferences } from "@/lib/atelier/preferences";
import { useJournal, usePreferences } from "../crochets";
import { JALONS } from "../jalons";

type Props = {
  /** Démarre une séance chronométrée (minutes). */
  surSeance: (minutes: number) => void;
  seanceEnCours: boolean;
};

function duree(secondes: number): string {
  const h = Math.floor(secondes / 3600);
  const m = Math.round((secondes % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

const NIVEAUX = [0, 1, 250, 500, 1000];
function niveau(mots: number): number {
  let n = 0;
  for (let i = 0; i < NIVEAUX.length; i++) if (mots >= NIVEAUX[i]) n = i;
  return n;
}

/** L'onglet « Bilan » : objectif du jour, série, calendrier, semaine, jalons. */
export function PanneauBilan({ surSeance, seanceEnCours }: Props) {
  const prefs = usePreferences();
  const revision = useJournal();

  const donnees = useMemo(() => {
    const jours = derniersJours(26 * 7);
    const aujourdhui = jours[jours.length - 1].total;
    const semaine = jours.slice(-7);
    const semaineMots = semaine.reduce((s, j) => s + j.total.mots, 0);
    const semaineSecondes = semaine.reduce((s, j) => s + j.total.secondes, 0);
    const semaineDocs = new Set(semaine.flatMap((j) => j.total.documents)).size;
    const total = jours.reduce((s, j) => s + j.total.mots, 0);
    return { jours, aujourdhui, semaineMots, semaineSecondes, semaineDocs, total };
  }, [revision]); // eslint-disable-line react-hooks/exhaustive-deps

  const serie = useMemo(() => serieEnCours(prefs.objectifQuotidien || 1), [prefs.objectifQuotidien, revision]); // eslint-disable-line react-hooks/exhaustive-deps
  const objectif = prefs.objectifQuotidien;
  const part = objectif > 0 ? Math.min(1, donnees.aujourdhui.mots / objectif) : 0;

  // Le calendrier commence un lundi.
  const premier = new Date(donnees.jours[0].jour + "T12:00:00");
  const decalage = (premier.getDay() + 6) % 7;
  const cases = [...Array(decalage).fill(null), ...donnees.jours];

  return (
    <>
      <section className="calame-section">
        <h3 className="calame-section-titre">
          <TrendingUp className="size-4" aria-hidden="true" /> Aujourd&apos;hui
        </h3>
        <p className="calame-chiffre-cle">
          {donnees.aujourdhui.mots.toLocaleString("fr-FR")} <span>mots écrits</span>
        </p>
        <p className="inspecteur-aide">
          {donnees.aujourdhui.retires > 0 && `${donnees.aujourdhui.retires.toLocaleString("fr-FR")} retirés · `}
          {duree(donnees.aujourdhui.secondes)} d&apos;écriture
        </p>
        <label className="inspecteur-reglage">
          <span className="inspecteur-libelle">Objectif quotidien (mots)</span>
          <input type="number" min={0} step={100} className="champ" value={objectif || ""} placeholder="Aucun" onChange={(e) => modifierPreferences({ objectifQuotidien: Math.max(0, Number(e.target.value) || 0) })} />
        </label>
        {objectif > 0 && (
          <div className="calame-progression" role="progressbar" aria-valuemin={0} aria-valuemax={objectif} aria-valuenow={donnees.aujourdhui.mots} aria-label="Objectif du jour">
            <span style={{ width: `${part * 100}%` }} />
            <p>{part >= 1 ? "Objectif du jour atteint." : `Encore ${(objectif - donnees.aujourdhui.mots).toLocaleString("fr-FR")} mots.`}</p>
          </div>
        )}
        <p className="calame-serie">
          <Flame className="size-5" aria-hidden="true" />
          <strong>{serie}</strong> jour{serie > 1 ? "s" : ""} de suite {objectif > 0 ? "avec l'objectif tenu" : "d'écriture"}
        </p>
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <Timer className="size-4" aria-hidden="true" /> Séance chronométrée
        </h3>
        <div className="flex flex-wrap gap-2">
          {[15, 25, 45, 60].map((m) => (
            <button key={m} type="button" className="bouton bouton-discret bouton-petit" disabled={seanceEnCours} onClick={() => surSeance(m)}>
              {m} min
            </button>
          ))}
        </div>
        <p className="inspecteur-aide">Le compte à rebours s&apos;affiche en haut ; à la fin, le nombre de mots écrits pendant la séance.</p>
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <CalendarDays className="size-4" aria-hidden="true" /> Calendrier de l&apos;écriture
        </h3>
        <div className="calame-calendrier" role="img" aria-label={`Mots écrits chaque jour depuis 26 semaines : ${donnees.total.toLocaleString("fr-FR")} au total`}>
          {cases.map((c, i) =>
            c ? (
              <span key={c.jour} data-niveau={niveau(c.total.mots)} title={`${new Date(c.jour + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} : ${c.total.mots.toLocaleString("fr-FR")} mots`} />
            ) : (
              <span key={`vide-${i}`} data-vide="" />
            ),
          )}
        </div>
        <p className="calame-legende-calendrier" aria-hidden="true">
          Moins <span data-niveau="0" /> <span data-niveau="1" /> <span data-niveau="2" /> <span data-niveau="3" /> <span data-niveau="4" /> Plus
        </p>
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">Bilan des 7 derniers jours</h3>
        <dl className="inspecteur-stats">
          <div>
            <dt>Mots ajoutés</dt>
            <dd>{donnees.semaineMots.toLocaleString("fr-FR")}</dd>
          </div>
          <div>
            <dt>Temps</dt>
            <dd>{duree(donnees.semaineSecondes)}</dd>
          </div>
          <div>
            <dt>Documents</dt>
            <dd>{donnees.semaineDocs}</dd>
          </div>
          <div>
            <dt>Par jour</dt>
            <dd>{Math.round(donnees.semaineMots / 7).toLocaleString("fr-FR")}</dd>
          </div>
        </dl>
      </section>

      <section className="calame-section">
        <h3 className="calame-section-titre">
          <Award className="size-4" aria-hidden="true" /> Jalons
        </h3>
        <ul className="calame-jalons">
          {JALONS.map((j) => (
            <li key={j.cle} data-atteint={prefs.jalons.includes(j.cle) ? "" : undefined}>
              <span aria-hidden="true">{prefs.jalons.includes(j.cle) ? "★" : "☆"}</span>
              {j.libelle}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
