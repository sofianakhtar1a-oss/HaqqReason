"use client";

import { ArrowRight, Flag, RotateCcw, Timer, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { pluieDeLettres } from "@/lib/langues/feux";
import { NOM_CONTINENT } from "@/lib/monde/atlas";
import { cabinet, estCabinet, formesNom } from "@/lib/monde/cabinets";
import { PAYS } from "@/lib/monde/donnees";
import { battreRecordDe, gagnerDucats, useMonde } from "@/lib/monde/progression";
import { normaliser } from "@/lib/monde/texte";
import type { ContinentId } from "@/lib/monde/types";
import { Globe, type Teinte, type Vue } from "./Globe";
import type { Lancement } from "./Partie";

/*
 * « Nomme-les tous » : tous les pays d'un continent (ou du monde), tous les départements,
 * tous les États… de mémoire, contre la montre. Chaque nom juste trouve sa case tout seul
 * (sans valider) ; sur le globe, le pays nommé se dore.
 */

const mouvementReduit = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Entree = { id: string; nom: string; formes: string[]; indice?: string };
type Liste = { titre: string; entrees: Entree[]; globe: boolean; vue?: Partial<Vue>; mot: string };

export const CONTINENTS_A_NOMMER: { id: ContinentId | "monde"; vue: Partial<Vue> }[] = [
  { id: "afrique", vue: { lon: 18, lat: 3, zoom: 1.55 } },
  { id: "europe", vue: { lon: 16, lat: 52, zoom: 2.4 } },
  { id: "asie", vue: { lon: 88, lat: 30, zoom: 1.35 } },
  { id: "amerique-nord", vue: { lon: -88, lat: 28, zoom: 1.35 } },
  { id: "amerique-sud", vue: { lon: -60, lat: -18, zoom: 1.6 } },
  { id: "oceanie", vue: { lon: 155, lat: -14, zoom: 1.5 } },
  { id: "monde", vue: { lon: 12, lat: 20, zoom: 1 } },
];

/** Les pays à nommer : les États (et Kosovo, Taïwan, la Palestine, le Vatican), pas les territoires. */
export function paysANommer(continent: ContinentId | "monde") {
  return PAYS.filter((p) => p.quiz && p.statut !== "territoire" && (continent === "monde" || p.continent === continent));
}

export const titreContinent = (id: ContinentId | "monde") => (id === "monde" ? "Le monde entier" : NOM_CONTINENT[id]);

function lireListe(cle: string): Liste | null {
  if (cle.startsWith("cabinet:")) {
    const id = cle.slice(8);
    if (!estCabinet(id)) return null;
    const c = cabinet(id);
    const numerotes = c.elements.some((e) => e.num);
    const entrees = [...c.elements]
      .sort((a, b) => (numerotes ? a.rang - b.rang : a.nom.localeCompare(b.nom, "fr")))
      .map((e) => ({ id: e.id, nom: e.nom, formes: formesNom(id, e.id), indice: e.num }));
    return { titre: `Tous les ${c.mots.unites}`, entrees, globe: false, mot: c.mots.unites };
  }
  const continent = (cle.startsWith("continent:") ? cle.slice(10) : cle) as ContinentId | "monde";
  const def = CONTINENTS_A_NOMMER.find((x) => x.id === continent);
  if (!def) return null;
  const entrees = paysANommer(continent)
    .map((p) => ({ id: p.code, nom: p.nom, formes: [...new Set(p.noms.map(normaliser))] }))
    .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  return { titre: continent === "monde" ? "Tous les pays du monde" : `Tous les pays : ${titreContinent(continent)}`, entrees, globe: true, vue: def.vue, mot: "pays" };
}

const formatTemps = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function NommeLesTous({ lancement, onFermer, onRejouer }: { lancement: Lancement; onFermer: () => void; onRejouer: (l: Lancement) => void }) {
  const monde = useMonde();
  const cle = lancement.liste ?? "monde";
  const liste = useMemo(() => lireListe(cle), [cle]);
  const duree = liste ? Math.min(900, Math.max(120, liste.entrees.length * 7)) * 1000 : 0;
  const [phase, setPhase] = useState<"intro" | "jeu" | "fin">("intro");
  const [trouves, setTrouves] = useState<string[]>([]);
  const [saisie, setSaisie] = useState("");
  const [fin, setFin] = useState<number | null>(null);
  const [reste, setReste] = useState(duree);
  const [annonce, setAnnonce] = useState("");
  const [dernier, setDernier] = useState<string | null>(null);
  const [record, setRecord] = useState(false);
  const champ = useRef<HTMLInputElement>(null);
  const ancienRecord = monde.records[`nomme:${cle}`] ?? 0;

  /** Chaque forme acceptée, normalisée, désigne une entrée. */
  const index = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of liste?.entrees ?? []) for (const f of e.formes) if (!m.has(f)) m.set(f, e.id);
    return m;
  }, [liste]);

  const terminer = useCallback(
    (n: number) => {
      setPhase("fin");
      setFin(null);
      const battu = battreRecordDe(`nomme:${cle}`, n);
      setRecord(battu);
      if (n > 0) gagnerDucats(n);
      if (battu && !mouvementReduit()) setTimeout(() => pluieDeLettres(document.querySelector(".pt-fin-titre"), "ambre", "Record"), 300);
    },
    [cle],
  );

  // Le temps qui passe.
  useEffect(() => {
    if (phase !== "jeu" || fin === null) return;
    const t = setInterval(() => {
      const r = fin - Date.now();
      setReste(r);
      if (r <= 0) terminer(trouves.length);
    }, 250);
    return () => clearInterval(t);
  }, [phase, fin, terminer, trouves.length]);

  useEffect(() => {
    if (phase === "jeu") champ.current?.focus();
  }, [phase]);

  useEffect(() => {
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    window.addEventListener("keydown", echap);
    return () => {
      document.body.style.overflow = avant;
      window.removeEventListener("keydown", echap);
    };
  }, [onFermer]);

  const ecrire = (valeur: string) => {
    setSaisie(valeur);
    const id = index.get(normaliser(valeur));
    if (!id || trouves.includes(id)) return;
    const suite = [...trouves, id];
    setTrouves(suite);
    setSaisie("");
    setDernier(id);
    const nom = liste?.entrees.find((e) => e.id === id)?.nom ?? "";
    setAnnonce(`${nom} : trouvé. ${suite.length} sur ${liste?.entrees.length}.`);
    if (liste && suite.length === liste.entrees.length) terminer(suite.length);
  };

  const teintes = useMemo(() => {
    const t: Record<string, Teinte> = {};
    for (const id of trouves) t[id] = "or";
    if (phase === "fin") for (const e of liste?.entrees ?? []) if (!trouves.includes(e.id)) t[e.id] = "faux";
    return t;
  }, [trouves, phase, liste]);

  if (!liste) return null;
  const total = liste.entrees.length;

  const contenu = (
    <div className="pt pt-partie pt-nomme" data-accent="safran" data-globe={monde.profil.globe} data-phase={phase} role="dialog" aria-modal="true" aria-label={liste.titre}>
      <div className="pt-partie-fond" aria-hidden="true" />
      <header className="pt-partie-tete">
        <button type="button" className="pt-icone" onClick={onFermer} aria-label="Quitter">
          <X className="size-5" aria-hidden="true" />
        </button>
        <div className="pt-partie-route" aria-label={`${trouves.length} trouvés sur ${total}`}>
          <span className="pt-route-trait" aria-hidden="true">
            <span className="pt-route-fait" style={{ transform: `scaleX(${trouves.length / total})` }} />
          </span>
          <span className="pt-route-compte tabular-nums">
            {trouves.length}/{total}
          </span>
        </div>
        {phase === "jeu" && (
          <span className="pt-nomme-temps tabular-nums" role="timer" data-presse={reste < 30_000 || undefined}>
            <Timer className="size-4" aria-hidden="true" />
            {formatTemps(reste)}
          </span>
        )}
      </header>

      {phase === "intro" && (
        <div className="pt-intro">
          <p className="pt-intro-grade">Nomme-les tous</p>
          <h2 className="pt-intro-titre">{liste.titre}</h2>
          <p className="pt-intro-regles">
            {total} {liste.mot} à écrire de mémoire en {Math.round(duree / 60000)} minutes. Chaque nom juste trouve sa case tout seul : pas besoin de valider, les accents sont facultatifs.
          </p>
          {ancienRecord > 0 && <p className="pt-intro-regles">Ton record : {ancienRecord} sur {total}.</p>}
          <button
            type="button"
            className="bouton bouton-principal pt-intro-go"
            autoFocus
            onClick={() => {
              setFin(Date.now() + duree);
              setReste(duree);
              setPhase("jeu");
            }}
          >
            C&apos;est parti
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {phase !== "intro" && (
        <div className="pt-nomme-corps">
          {phase === "fin" && (
            <div className="pt-fin pt-nomme-fin">
              <h2 className="pt-fin-titre">{record ? "Nouveau record !" : trouves.length === total ? "Tous trouvés !" : "Le temps est passé"}</h2>
              <p className="pt-fin-sous">
                {trouves.length} {liste.mot} sur {total}
                {trouves.length > 0 ? `, ${trouves.length} ducat${trouves.length > 1 ? "s" : ""} gagné${trouves.length > 1 ? "s" : ""}` : ""}. Ceux qui manquaient sont en rouge.
              </p>
              <div className="pt-fin-actions">
                <button type="button" className="bouton bouton-principal" onClick={() => onRejouer({ ...lancement, cle: `${Date.now()}` })}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Rejouer
                </button>
                <button type="button" className="bouton bouton-discret" onClick={onFermer}>
                  Fermer
                </button>
              </div>
            </div>
          )}

          {phase === "jeu" && (
            <div className="pt-nomme-saisie">
              <input
                ref={champ}
                value={saisie}
                onChange={(e) => ecrire(e.target.value)}
                placeholder="Écris un nom…"
                aria-label={`Écris le nom d'un des ${liste.mot}`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="next"
              />
              <button type="button" className="bouton bouton-discret" onClick={() => terminer(trouves.length)}>
                <Flag className="size-4" aria-hidden="true" />
                J&apos;abandonne
              </button>
              <p className="sr-only" aria-live="polite">
                {annonce}
              </p>
            </div>
          )}

          {liste.globe && (
            <div className="pt-nomme-globe">
              <Globe tourne={phase === "fin"} glissable teintes={teintes} vueInitiale={liste.vue} libelle={`Le globe : ${trouves.length} pays nommés sur ${total}.`} />
            </div>
          )}

          <ol className="pt-nomme-cases" data-numerote={liste.entrees.some((e) => e.indice) || undefined}>
            {liste.entrees.map((e) => {
              const trouve = trouves.includes(e.id);
              const manque = phase === "fin" && !trouve;
              return (
                <li key={e.id} data-trouve={trouve || undefined} data-manque={manque || undefined} data-dernier={dernier === e.id || undefined}>
                  {e.indice && <span className="pt-nomme-indice tabular-nums">{e.indice}</span>}
                  <span className="pt-nomme-nom">{trouve || manque ? e.nom : " "}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
  return createPortal(contenu, document.body);
}
