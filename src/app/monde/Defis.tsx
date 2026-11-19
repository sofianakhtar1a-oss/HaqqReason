"use client";

import { CalendarCheck, CalendarDays, Crown, Gauge, Medal, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { NOM_CONTINENT } from "@/lib/monde/atlas";
import { cleDefi, QUESTIONS_DEFI, type SorteDefi } from "@/lib/monde/defis";
import { useCompteMonde } from "@/lib/monde/compte-client";
import { useMonde } from "@/lib/monde/progression";
import type { TableauRecords } from "@/lib/monde/serveur";
import type { ContinentId } from "@/lib/monde/types";
import type { Lancement } from "./Partie";
import { useLancer } from "./Partie";

/*
 * Revenir chaque jour : le défi du jour et celui de la semaine (les mêmes questions pour
 * tout le monde, une seule tentative, un classement), le marathon et les contre-la-montre
 * par continent.
 */

function useClassementDefi(sorte: SorteDefi, actif: boolean) {
  const [t, setT] = useState<TableauRecords | null>(null);
  useEffect(() => {
    if (!actif) return;
    let vivant = true;
    fetch(`/api/monde/defi?sorte=${sorte}`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<TableauRecords>) : null))
      .then((x) => {
        if (vivant) setT(x);
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [sorte, actif]);
  return t;
}

function CarteDefi({ sorte, lancer }: { sorte: SorteDefi; lancer: (l: Lancement) => void }) {
  const monde = useMonde();
  const compte = useCompteMonde();
  const l = useLancer();
  const cle = cleDefi(sorte);
  const joue = monde.records[`defi:${sorte}:${cle}`];
  const enLigne = compte.connecte === true && compte.enLigne !== false;
  const classement = useClassementDefi(sorte, enLigne && joue !== undefined);
  const Icone = sorte === "jour" ? CalendarCheck : CalendarDays;
  return (
    <div className="pt-defi" data-joue={joue !== undefined || undefined}>
      <p className="pt-defi-tete">
        <Icone className="size-5" aria-hidden="true" />
        {sorte === "jour" ? "Le défi du jour" : "Le défi de la semaine"}
      </p>
      <p className="pt-defi-texte">
        {QUESTIONS_DEFI[sorte]} questions, les mêmes pour tout le monde{sorte === "semaine" ? ", plus difficiles" : ""}. Une seule tentative.
      </p>
      {joue !== undefined ? (
        <>
          <p className="pt-defi-score">
            Ton score : <strong className="tabular-nums">{joue}/{QUESTIONS_DEFI[sorte]}</strong>
            {classement?.moi ? ` (${classement.moi.rang === 1 ? "1re" : `${classement.moi.rang}e`} place sur ${classement.participants})` : ""}
          </p>
          {classement && classement.top.length > 0 && (
            <ol className="pt-defi-top">
              {classement.top.slice(0, 3).map((x) => (
                <li key={x.cle} data-moi={x.moi || undefined}>
                  {x.rang === 1 && <Crown className="size-3.5" aria-hidden="true" />}
                  <span>{x.nom}</span>
                  <span className="tabular-nums">{x.points}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="pt-astuce">{sorte === "jour" ? "Un nouveau défi demain." : "Un nouveau défi lundi."}</p>
        </>
      ) : (
        <button type="button" className="bouton bouton-principal" onClick={() => lancer(l.defi(sorte))}>
          Relever le défi
        </button>
      )}
    </div>
  );
}

const CONTINENTS_CHRONO: ContinentId[] = ["afrique", "europe", "asie", "amerique-nord", "amerique-sud", "oceanie"];

export function Defis({ lancer }: { lancer: (l: Lancement) => void }) {
  const monde = useMonde();
  const l = useLancer();
  return (
    <section aria-labelledby="pt-defis">
      <h3 id="pt-defis" className="pt-sous-titre">
        Chaque jour
      </h3>
      <div className="pt-defis">
        <CarteDefi sorte="jour" lancer={lancer} />
        <CarteDefi sorte="semaine" lancer={lancer} />
        <div className="pt-defi">
          <p className="pt-defi-tete">
            <Gauge className="size-5" aria-hidden="true" />
            Le marathon
          </p>
          <p className="pt-defi-texte">Trois cœurs, et des questions qui durcissent toutes les dix bonnes réponses.</p>
          <p className="pt-defi-score">
            <Medal className="mr-1 inline size-4 align-[-3px]" aria-hidden="true" />
            {monde.records.marathon ? `Record : ${monde.records.marathon}` : "Pas encore de record"}
          </p>
          <button type="button" className="bouton bouton-principal" onClick={() => lancer(l.marathon())}>
            Courir
          </button>
        </div>
      </div>
      <div className="pt-chrono-continents">
        <p className="pt-defi-tete">
          <Timer className="size-5" aria-hidden="true" />
          Contre la montre, continent par continent : 60 secondes.
        </p>
        <div className="pt-continents" role="group" aria-label="Le continent">
          {CONTINENTS_CHRONO.map((c) => (
            <button key={c} type="button" className="pt-puce" onClick={() => lancer(l.chrono(c))}>
              {NOM_CONTINENT[c]}
              {monde.records[`chrono:${c}`] ? <span className="pt-puce-record tabular-nums">{monde.records[`chrono:${c}`]}</span> : null}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
