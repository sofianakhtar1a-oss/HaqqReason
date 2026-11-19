"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Compass, Feather, Pause, Play, Sailboat, ScrollText } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PAR_CODE } from "@/lib/monde/atlas";
import { PAYS } from "@/lib/monde/donnees";
import { formatKm, grandCercle, KAABA, pointCardinal, qibla } from "@/lib/monde/geo";
import { CARTOGRAPHIE, type Embleme, GEOGRAPHES, VOYAGES } from "@/lib/monde/histoire";
import { Globe, type GlobeRef, type Marque, type Trait } from "./Globe";

/*
 * L'histoire de la géographie, dans l'atlas : le cabinet des géographes (des emblèmes, jamais
 * de visages inventés), les grands voyages tracés étape par étape sur le globe, la route de la
 * qibla depuis chaque capitale, et une brève histoire de la cartographie.
 */

export type SujetHistoire = "geographes" | "voyages" | "cartographie";
export const SUJETS_HISTOIRE: SujetHistoire[] = ["geographes", "voyages", "cartographie"];

const mouvementReduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- Les emblèmes : des instruments, gravés à l'or ---------- */

function Motif({ e }: { e: Embleme }) {
  switch (e) {
    case "astrolabe":
      return (
        <>
          <circle r="20" />
          <circle r="13" />
          <path d="M-20 0H20M0 -20V20M-14 -14L14 14" />
          <circle r="2.5" className="pt-embleme-plein" />
        </>
      );
    case "rose":
      return (
        <>
          <path d="M0 -22L5 -5L22 0L5 5L0 22L-5 5L-22 0L-5 -5Z" />
          <path d="M0 -22L0 22M-22 0L22 0" className="pt-embleme-fin" />
          <circle r="3" className="pt-embleme-plein" />
        </>
      );
    case "voile":
      return (
        <>
          <path d="M-18 10H18L13 17H-13Z" />
          <path d="M0 10V-20" />
          <path d="M2 -18Q16 -4 2 8Z" />
          <path d="M-2 -14Q-13 -3 -2 7Z" />
        </>
      );
    case "plume":
      return (
        <>
          <path d="M14 -20Q-10 -10 -12 18" />
          <path d="M14 -20Q12 4 -8 10" />
          <path d="M-12 18L-16 22" />
          <path d="M-3 -6L6 -9M-6 2L4 -1" className="pt-embleme-fin" />
        </>
      );
    case "globe":
      return (
        <>
          <circle r="19" />
          <ellipse rx="8" ry="19" />
          <path d="M-19 0H19M-16 -10H16M-16 10H16" className="pt-embleme-fin" />
        </>
      );
    case "boussole":
      return (
        <>
          <circle r="20" />
          <path d="M0 -15L5 0L0 15L-5 0Z" />
          <path d="M0 -15L5 0L-5 0Z" className="pt-embleme-plein" />
        </>
      );
    case "sextant":
      return (
        <>
          <path d="M-18 14A26 26 0 0 1 18 14" />
          <path d="M0 -16L-18 14M0 -16L18 14M0 -16L6 14" />
          <circle cy="-16" r="3" className="pt-embleme-plein" />
        </>
      );
    case "caravane":
      return (
        <>
          <path d="M-20 14H20" className="pt-embleme-fin" />
          <path d="M-14 14V4Q-12 -4 -6 -2Q-2 -10 4 -3Q10 -4 10 2V14M10 2Q14 -4 18 -2" />
          <circle cx="0" cy="-17" r="3" className="pt-embleme-plein" />
        </>
      );
  }
}

export function EmblemeGeographe({ e, taille = 64 }: { e: Embleme; taille?: number }) {
  return (
    <svg className="pt-embleme-geographe" viewBox="-32 -32 64 64" width={taille} height={taille} aria-hidden="true">
      <circle r="30" className="pt-embleme-fond" />
      <circle r="27" className="pt-embleme-fin" />
      <g className="pt-embleme-trait">
        <Motif e={e} />
      </g>
    </svg>
  );
}

/* ---------- Les portes d'entrée, dans l'atlas ---------- */

export function PortesHistoire({ aller }: { aller: (hash: string) => void }) {
  const portes: { id: SujetHistoire; nom: string; texte: string; Icone: typeof Compass }[] = [
    { id: "geographes", nom: "Le cabinet des géographes", texte: "De Ptolémée à Humboldt, d'al-Idrîsî à Ibn Battûta : seize savants et voyageurs.", Icone: Feather },
    { id: "voyages", nom: "Les grands voyages", texte: "Ibn Battûta, Zheng He, Magellan, Marco Polo, étape par étape sur le globe ; et la route de la qibla.", Icone: Sailboat },
    { id: "cartographie", nom: "Une brève histoire des cartes", texte: "De la tablette de Babylone au GPS, en douze jalons.", Icone: ScrollText },
  ];
  return (
    <section className="pt-histoire-portes" aria-labelledby="pt-histoire">
      <h3 id="pt-histoire" className="pt-sous-titre">
        L&apos;histoire de la géographie
      </h3>
      <div className="pt-rapides">
        {portes.map(({ id, nom, texte, Icone }) => (
          <button key={id} type="button" className="pt-rapide" onClick={() => aller(`atlas/${id}`)}>
            <Icone className="pt-rapide-icone" aria-hidden="true" />
            <span className="pt-rapide-nom">{nom}</span>
            <span className="pt-rapide-texte">{texte}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------- Les écrans ---------- */

export function Histoire({ sujet, onRetour }: { sujet: SujetHistoire; onRetour: () => void }) {
  return (
    <div className="pt-histoire">
      <button type="button" className="pt-retour-lien" onClick={onRetour}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        L&apos;atlas
      </button>
      {sujet === "geographes" && <Geographes />}
      {sujet === "voyages" && <Voyages />}
      {sujet === "cartographie" && <Cartographie />}
    </div>
  );
}

function Geographes() {
  return (
    <>
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">Le cabinet des géographes</h2>
          <p className="pt-chapo">Ceux qui ont mesuré la Terre, l&apos;ont parcourue et l&apos;ont dessinée. Chacun a son emblème : un instrument plutôt qu&apos;un portrait imaginé.</p>
        </div>
      </header>
      <ol className="pt-geographes">
        {GEOGRAPHES.map((g, i) => (
          <li key={g.id} style={{ "--i": Math.min(i, 12) } as React.CSSProperties}>
            <EmblemeGeographe e={g.embleme} />
            <div className="pt-geographe-corps">
              <h3 className="pt-geographe-nom">{g.nom}</h3>
              <p className="pt-geographe-dates">
                {g.dates}, {g.lieu}
              </p>
              <p className="pt-geographe-oeuvre">{g.oeuvre}</p>
              <p>{g.texte}</p>
              <p className="pt-geographe-legs">{g.legs}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function Cartographie() {
  return (
    <>
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">Une brève histoire des cartes</h2>
          <p className="pt-chapo">Douze jalons, de l&apos;argile au satellite.</p>
        </div>
      </header>
      <ol className="pt-jalons">
        {CARTOGRAPHIE.map((j) => (
          <li key={j.titre}>
            <span className="pt-jalon-quand">{j.quand}</span>
            <span className="pt-jalon-corps">
              <strong>{j.titre}</strong>
              <span>{j.texte}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

/* ---------- Les voyages sur le globe ---------- */

const CAPITALES = PAYS.filter((p) => p.quiz && p.capLatLng && p.capitale && p.statut !== "territoire").sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

function Voyages() {
  const [choix, setChoix] = useState<string>(VOYAGES[0].id);
  const voyage = VOYAGES.find((v) => v.id === choix);
  return (
    <>
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">Les grands voyages</h2>
          <p className="pt-chapo">Étape par étape, sur le globe. Les dates sont celles des passages connus ; les tracés relient les étapes au plus court.</p>
        </div>
      </header>
      <div className="pt-continents" role="group" aria-label="Le voyage">
        {VOYAGES.map((v) => (
          <button key={v.id} type="button" className="pt-puce" aria-pressed={choix === v.id} onClick={() => setChoix(v.id)}>
            {v.qui}
          </button>
        ))}
        <button type="button" className="pt-puce" aria-pressed={choix === "qibla"} onClick={() => setChoix("qibla")}>
          Vers La Mecque : la qibla
        </button>
      </div>
      {voyage ? <Voyage key={voyage.id} id={voyage.id} /> : <RouteQibla />}
    </>
  );
}

function Voyage({ id }: { id: string }) {
  const v = VOYAGES.find((x) => x.id === id)!;
  const reduit = mouvementReduit();
  const [etape, setEtape] = useState(reduit ? v.etapes.length - 1 : 0);
  const [lecture, setLecture] = useState(!reduit);
  const globe = useRef<GlobeRef>(null);

  // La lecture : une étape toutes les 1,6 seconde, puis l'arrêt à l'arrivée.
  useEffect(() => {
    if (!lecture) return;
    if (etape >= v.etapes.length - 1) {
      const t = setTimeout(() => setLecture(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setEtape((n) => n + 1), 1600);
    return () => clearTimeout(t);
  }, [lecture, etape, v.etapes.length]);

  // Le globe suit l'étape.
  useEffect(() => {
    const [lat, lon] = v.etapes[etape].latlng;
    globe.current?.voler({ lat, lon, zoom: 1.5 });
  }, [etape, v]);

  const traits = useMemo<Trait[]>(() => [{ points: v.etapes.slice(0, etape + 1).map((e) => e.latlng), teinte: "or", epaisseur: 2.5 }], [v, etape]);
  const marques = useMemo<Marque[]>(() => v.etapes.slice(0, etape + 1).map((e, i) => ({ latlng: e.latlng, teinte: i === etape ? "cible" : "or", taille: i === etape ? 6 : 3.5, libelle: i === etape ? e.lieu : undefined })), [v, etape]);
  const courante = v.etapes[etape];

  return (
    <div className="pt-voyage">
      <div className="pt-voyage-globe">
        <Globe ref={globe} interactif traits={traits} marques={marques} libelle={`Le globe : ${v.nom}, étape ${etape + 1} sur ${v.etapes.length}, ${courante.lieu}.`} vueInitiale={{ lat: v.etapes[0].latlng[0], lon: v.etapes[0].latlng[1], zoom: 1.5 }} />
      </div>
      <div className="pt-voyage-panneau">
        <p className="pt-voyage-dates">
          {v.qui}, {v.dates}
        </p>
        <h3 className="pt-voyage-nom">{v.nom}</h3>
        <p className="pt-voyage-texte">{v.texte}</p>
        <div className="pt-voyage-commandes">
          <button type="button" className="pt-icone" onClick={() => setEtape((n) => Math.max(0, n - 1))} disabled={etape === 0} aria-label="Étape précédente">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="bouton bouton-principal"
            onClick={() => {
              if (etape >= v.etapes.length - 1) setEtape(0);
              setLecture((l) => !l);
            }}
          >
            {lecture ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
            {lecture ? "Pause" : etape >= v.etapes.length - 1 ? "Revoir le voyage" : "Lire le voyage"}
          </button>
          <button type="button" className="pt-icone" onClick={() => setEtape((n) => Math.min(v.etapes.length - 1, n + 1))} disabled={etape >= v.etapes.length - 1} aria-label="Étape suivante">
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ol className="pt-etapes" aria-label="Les étapes">
          {v.etapes.map((e, i) => (
            <li key={`${e.lieu}-${i}`} data-passee={i <= etape || undefined} data-courante={i === etape || undefined}>
              <button
                type="button"
                onClick={() => {
                  setLecture(false);
                  setEtape(i);
                }}
              >
                <span className="pt-etape-lieu">{e.lieu}</span>
                {e.date && <span className="pt-etape-date">{e.date}</span>}
                {e.note && i === etape && <span className="pt-etape-note">{e.note}</span>}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function RouteQibla() {
  const [code, setCode] = useState("fr");
  const p = PAR_CODE.get(code)!;
  const q = qibla(p);
  const globe = useRef<GlobeRef>(null);
  const depart = p.capLatLng ?? p.latlng;
  const traits = useMemo<Trait[]>(() => [{ points: grandCercle(depart, KAABA, 96), teinte: "or", epaisseur: 2.5 }], [depart]);
  const marques = useMemo<Marque[]>(
    () => [
      { latlng: depart, teinte: "cible", taille: 5, libelle: p.capitale ?? p.nom },
      { latlng: KAABA, teinte: "or", taille: 6, libelle: "La Kaaba" },
    ],
    [depart, p],
  );
  useEffect(() => {
    const milieu = grandCercle(depart, KAABA, 2)[1];
    globe.current?.voler({ lat: milieu[0], lon: milieu[1], zoom: q.km > 9000 ? 1 : q.km > 4000 ? 1.4 : 2 });
  }, [depart, q.km]);
  return (
    <div className="pt-voyage">
      <div className="pt-voyage-globe">
        <Globe ref={globe} interactif traits={traits} marques={marques} libelle={`Le globe : la route la plus courte de ${p.capitale} à La Mecque.`} vueInitiale={{ lat: 30, lon: 20, zoom: 1.2 }} />
      </div>
      <div className="pt-voyage-panneau">
        <h3 className="pt-voyage-nom">La qibla, depuis chaque capitale</h3>
        <p className="pt-voyage-texte">La qibla suit le grand cercle : la route la plus courte sur la sphère, qui paraît courbe sur une carte plane. Depuis l&apos;Amérique du Nord, elle part vers le nord-est, et non vers le sud-est.</p>
        <label className="pt-selecteur">
          <span>Depuis</span>
          <select value={code} onChange={(e) => setCode(e.target.value)}>
            {CAPITALES.map((x) => (
              <option key={x.code} value={x.code}>
                {x.capitale} ({x.nom})
              </option>
            ))}
          </select>
        </label>
        <dl className="pt-qibla-chiffres">
          <div>
            <dt>Direction</dt>
            <dd>
              {Math.round(q.cap)}°, vers le {pointCardinal(q.cap)}
            </dd>
          </div>
          <div>
            <dt>Distance</dt>
            <dd>{formatKm(q.km)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
