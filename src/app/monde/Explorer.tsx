"use client";

import { Crosshair, Flag, Globe2, Home, Layers, LocateFixed, Map as IconePlan, Maximize2, Minimize2, Minus, Plus, Printer, Ruler, Scaling, Search, Timer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PAR_CODE } from "@/lib/monde/atlas";
import { coloriage, type Legende, soleilAuZenith } from "@/lib/monde/calques";
import { coordonnees, JEUX } from "@/lib/monde/carte-outils";
import { PAYS } from "@/lib/monde/donnees";
import { distanceKm, type LatLng } from "@/lib/monde/geo";
import { useMonde } from "@/lib/monde/progression";
import { normaliser } from "@/lib/monde/texte";
import type { ContinentId } from "@/lib/monde/types";
import { useTextes } from "@/lib/modules/textes-client";
import { LegendeCarte, PanneauCalques, REGLAGES_PAR_DEFAUT, type ReglagesCarte } from "./CalquesCarte";
import { CarteMuette } from "./CarteMuette";
import { FichePays } from "./FichePays";
import { Drapeau } from "./figures";
import { Globe, type GlobeProps, type GlobeRef, type Mode, type Teinte, type Vue } from "./Globe";
import { type JeuId, useCapitales, useChasse, useVoisins } from "./JeuxCarte";
import { MonPays, useDistance, useVraieTaille } from "./OutilsCarte";

/*
 * La carte du monde, libre : on fait tourner le globe (ou on déplie le planisphère, ou le Mercator),
 * on touche un pays, sa fiche s'ouvre. Une recherche, un saut vers chaque continent, les petits pays
 * en encart. Des calques (les pays coloriés selon un chiffre, leurs noms, les mers et les fleuves, le
 * relief, la nuit), des outils (la distance, la vraie taille, mon pays, la carte muette à imprimer),
 * trois jeux, et le plein écran.
 */

const VUES: { id: ContinentId; nom: string; vue: Vue }[] = [
  { id: "europe", nom: "Europe", vue: { lon: 15, lat: 52, zoom: 2.7 } },
  { id: "afrique", nom: "Afrique", vue: { lon: 19, lat: 2, zoom: 1.55 } },
  { id: "asie", nom: "Asie", vue: { lon: 88, lat: 32, zoom: 1.35 } },
  { id: "amerique-nord", nom: "Amérique du Nord", vue: { lon: -92, lat: 36, zoom: 1.45 } },
  { id: "amerique-sud", nom: "Amérique du Sud", vue: { lon: -60, lat: -20, zoom: 1.65 } },
  { id: "oceanie", nom: "Océanie", vue: { lon: 155, lat: -18, zoom: 1.6 } },
];

/** Les régions de petits pays, vues de près dans un encart. */
const ENCARTS: { id: string; nom: string; vue: Vue }[] = [
  { id: "antilles", nom: "Les Antilles", vue: { lon: -72, lat: 16, zoom: 4.4 } },
  { id: "amerique-centrale", nom: "L'Amérique centrale", vue: { lon: -84.5, lat: 13, zoom: 6.5 } },
  { id: "afrique-ouest", nom: "L'Afrique de l'Ouest", vue: { lon: -16.5, lat: 12.5, zoom: 6.5 } },
  { id: "micro-etats", nom: "Les micro-États d'Europe", vue: { lon: 8.5, lat: 43, zoom: 7 } },
  { id: "balkans", nom: "Les Balkans", vue: { lon: 20, lat: 42.6, zoom: 9 } },
  { id: "caucase", nom: "Le Caucase", vue: { lon: 45, lat: 41.5, zoom: 10 } },
  { id: "levant", nom: "Le Levant", vue: { lon: 35.6, lat: 32.6, zoom: 13 } },
  { id: "golfe", nom: "Le Golfe", vue: { lon: 51.5, lat: 26, zoom: 9 } },
  { id: "ocean-indien", nom: "L'océan Indien", vue: { lon: 58, lat: -8, zoom: 3 } },
  { id: "asie-sud-est", nom: "L'Asie du Sud-Est", vue: { lon: 113, lat: 2, zoom: 3.4 } },
  { id: "pacifique", nom: "Le Pacifique", vue: { lon: 165, lat: -5, zoom: 2 } },
];

const MODES: { id: Mode; nom: string; icone: React.ReactNode; titre: string }[] = [
  { id: "globe", nom: "Globe", icone: <Globe2 className="size-4" aria-hidden="true" />, titre: "Le globe : la Terre telle qu'elle est" },
  { id: "plan", nom: "Planisphère", icone: <IconePlan className="size-4" aria-hidden="true" />, titre: "Equal Earth : le monde à plat, les surfaces respectées" },
  { id: "mercator", nom: "Mercator", icone: <IconePlan className="size-4" aria-hidden="true" />, titre: "Mercator (1569) : les angles respectés, les pays du Nord gonflés" },
];

const INDEX = PAYS.map((p) => ({ code: p.code, formes: p.noms.map(normaliser), capitale: p.capitale ? normaliser(p.capitale) : "" }));

/* ---------- Les réglages de la carte, gardés sur l'appareil ---------- */
const CLE = "haqqreason-portulan-carte";
type Garde = { mode: Mode; reglages: ReglagesCarte };
function lireGarde(): Garde {
  const defaut: Garde = { mode: "globe", reglages: REGLAGES_PAR_DEFAUT };
  if (typeof window === "undefined") return defaut;
  try {
    const brut = JSON.parse(window.localStorage.getItem(CLE) ?? "null") as Partial<Garde> | null;
    if (!brut) return defaut;
    return { mode: brut.mode === "plan" || brut.mode === "mercator" ? brut.mode : "globe", reglages: { ...REGLAGES_PAR_DEFAUT, ...(brut.reglages ?? {}) } };
  } catch {
    return defaut;
  }
}

/** Le pays le plus proche d'un point (à moins de 700 km), pour situer le Soleil au zénith. */
function presDe(ll: LatLng): string | null {
  let meilleur: { nom: string; d: number } | null = null;
  for (const p of PAYS) {
    const d = distanceKm(ll, p.latlng);
    if (d < 700 && (!meilleur || d < meilleur.d)) meilleur = { nom: p.nom, d };
  }
  return meilleur?.nom ?? null;
}

type OutilId = "distance" | "taille" | JeuId;

export function Explorer({ focus, onFocus }: { focus: string | null; onFocus: (code: string | null) => void }) {
  const t = useTextes("monde");
  const monde = useMonde();
  const globe = useRef<GlobeRef>(null);
  const racine = useRef<HTMLDivElement>(null);
  const [garde] = useState(lireGarde);
  const [mode, setMode] = useState<Mode>(garde.mode);
  const [reglages, setReglages] = useState<ReglagesCarte>(garde.reglages);
  const [requete, setRequete] = useState("");
  const [panneau, setPanneau] = useState(false);
  const [outil, setOutil] = useState<OutilId | null>(null);
  const [muette, setMuette] = useState(false);
  const [encart, setEncart] = useState<string | null>(null);
  const [plein, setPlein] = useState<"" | "api" | "css">("");
  const [instant, setInstant] = useState<number | null>(null);
  const choisi = focus && PAR_CODE.has(focus) ? focus : null;
  const monPays = monde.profil.monPays && PAR_CODE.has(monde.profil.monPays) ? monde.profil.monPays : "";
  const changer = (r: Partial<ReglagesCarte>) => setReglages((x) => ({ ...x, ...r }));

  useEffect(() => {
    try {
      window.localStorage.setItem(CLE, JSON.stringify({ mode, reglages } satisfies Garde));
    } catch {
      /* stockage plein ou interdit : les réglages restent pour cette visite */
    }
  }, [mode, reglages]);

  // L'heure du jour et de la nuit (et des fuseaux) avance d'elle-même, minute par minute.
  useEffect(() => {
    if (!reglages.nuit && reglages.calque !== "fuseaux") return;
    const tic = () => setInstant(Date.now());
    const premier = setTimeout(tic, 0);
    const id = setInterval(tic, 60_000);
    return () => {
      clearTimeout(premier);
      clearInterval(id);
    };
  }, [reglages.nuit, reglages.calque]);

  // Le plein écran : celui du navigateur quand il existe, sinon la carte occupe toute la fenêtre.
  useEffect(() => {
    const suivre = () => setPlein((p) => (document.fullscreenElement ? "api" : p === "api" ? "" : p));
    document.addEventListener("fullscreenchange", suivre);
    return () => document.removeEventListener("fullscreenchange", suivre);
  }, []);
  useEffect(() => {
    if (plein !== "css") return;
    const touche = (e: KeyboardEvent) => e.key === "Escape" && setPlein("");
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [plein]);
  const basculerPlein = () => {
    if (plein === "api") return void document.exitFullscreen?.();
    if (plein === "css") return setPlein("");
    const el = racine.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => setPlein("css"));
    else setPlein("css");
  };

  const fermerOutil = () => setOutil(null);
  const distance = useDistance({ globe, monPays, mode, onFermer: fermerOutil });
  const taille = useVraieTaille({ globe, mode, choisirMode: setMode, onFermer: fermerOutil });
  const chasse = useChasse({ actif: outil === "chasse", onFermer: fermerOutil });
  const voisins = useVoisins({ onFermer: fermerOutil });
  const capitales = useCapitales({ globe, onFermer: fermerOutil });
  const courant = outil === "distance" ? distance : outil === "taille" ? taille : outil === "chasse" ? chasse : outil === "voisins" ? voisins : outil === "capitales" ? capitales : null;
  const jeu = outil === "chasse" || outil === "voisins" || outil === "capitales";

  const teintesMaitrise = useMemo(() => {
    const t: Record<string, Teinte> = {};
    for (const [code, m] of Object.entries(monde.pays)) if (Object.entries(m).some(([f, x]) => f !== "fiches" && (x?.[2] ?? 0) >= 3)) t[code] = "or";
    return t;
  }, [monde.pays]);

  const calque = useMemo(() => {
    if (reglages.calque === "fuseaux" && instant === null) return null;
    return coloriage(reglages.calque, { org: reglages.org, langue: reglages.langue, date: new Date(instant ?? 0) });
  }, [reglages.calque, reglages.org, reglages.langue, instant]);

  const legende: Legende | null = jeu
    ? null
    : reglages.calque === "maitrise"
      ? { titre: "Ce que je maîtrise", entrees: [{ couleur: "var(--pt-or)", texte: `doré : un pays dont une famille de questions est maîtrisée (${Object.keys(teintesMaitrise).length})` }] }
      : (calque?.legende ?? null);

  const resultats = useMemo(() => {
    const q = normaliser(requete);
    if (!q) return [];
    const debut = INDEX.filter((x) => x.formes.some((f) => f.startsWith(q)) || x.capitale.startsWith(q));
    const dedans = INDEX.filter((x) => !debut.includes(x) && (x.formes.some((f) => f.includes(q)) || x.capitale.includes(q)));
    return [...debut, ...dedans].slice(0, 8).map((x) => PAR_CODE.get(x.code)!);
  }, [requete]);

  const ouvrir = (code: string | null) => {
    setRequete("");
    // Un outil ouvert reçoit les pays qu'on cherche (la distance, la vraie taille).
    if (code && outil === "distance") return distance.ajouter(code);
    if (code && outil === "taille") return taille.ajouter(code);
    if (code === choisi) return;
    // Remplacer le pays affiché, sans empiler un écran par pays touché.
    if (code && choisi) {
      history.replaceState(null, "", `#carte/${code}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    } else onFocus(code);
  };

  const lancer = (o: OutilId) => {
    setOutil(o);
    setPanneau(false);
    if (choisi) onFocus(null);
  };

  const g = courant?.globe ?? {};
  const modeVu: Mode = (g.mode as Mode | undefined) ?? mode;
  const proprietes: GlobeProps = {
    mode: modeVu,
    interactif: true,
    reperes: "tous",
    teintes: g.teintes ?? (jeu || reglages.calque !== "maitrise" ? undefined : teintesMaitrise),
    couleurs: jeu ? undefined : calque?.couleurs,
    rayes: jeu ? undefined : calque?.rayes,
    etiquettes: reglages.noms && !jeu,
    geographie: reglages.geographie,
    relief: reglages.relief,
    nuit: reglages.nuit ? instant : null,
    cible: jeu ? (g.cible ?? null) : outil ? null : choisi,
    recul: g.recul ?? 1.6,
    contour: jeu ? null : monPays || null,
    onToucher: g.onToucher ?? ((code) => code && ouvrir(code)),
    onPoint: g.onPoint,
    marques: g.marques,
    traits: g.traits,
    silhouettes: g.silhouettes,
    onSilhouette: g.onSilhouette,
    libelle: jeu ? "La carte du jeu" : "La carte du monde : touche un pays pour ouvrir sa fiche",
    vueInitiale: modeVu === "globe" ? { lon: 12, lat: 28, zoom: 1.05 } : { lon: 10, lat: modeVu === "mercator" ? 30 : 15, zoom: 1 },
  };
  const sousSoleil = reglages.nuit && instant !== null ? soleilAuZenith(new Date(instant)) : null;
  const lieuSoleil = sousSoleil ? presDe(sousSoleil) : null;
  const encartVu = ENCARTS.find((e) => e.id === encart);

  let cote: React.ReactNode;
  if (courant) cote = <aside className="pt-explorer-fiche pt-explorer-outil">{courant.panneau}</aside>;
  else if (choisi)
    cote = (
      <aside className="pt-explorer-fiche">
        <FichePays code={choisi} onChoisir={(c) => ouvrir(c)} onFermer={() => onFocus(null)} />
      </aside>
    );
  else
    cote = (
      <aside className="pt-explorer-vide">
        <p>Touche un pays sur le globe, ou cherche-le par son nom ou sa capitale.</p>
        <p className="pt-explorer-astuce">Les petits points dorés sont les micro-États et les îles trop petites pour se voir : touche-les aussi.</p>
        <MonPays code={monPays} onVoir={(c) => ouvrir(c)} />
        <section className="pt-explorer-menu" aria-labelledby="pt-menu-outils">
          <h3 id="pt-menu-outils">Les outils</h3>
          <ul>
            <li>
              <button type="button" onClick={() => lancer("distance")}>
                <Ruler className="size-5" aria-hidden="true" />
                <span>
                  <strong>La distance</strong>
                  <small>Entre deux villes ou deux points, et le temps de vol.</small>
                </span>
              </button>
            </li>
            <li>
              <button type="button" onClick={() => lancer("taille")}>
                <Scaling className="size-5" aria-hidden="true" />
                <span>
                  <strong>La vraie taille</strong>
                  <small>Promène la silhouette d&apos;un pays sur le globe pour le comparer.</small>
                </span>
              </button>
            </li>
            <li>
              <button type="button" onClick={() => setMuette(true)}>
                <Printer className="size-5" aria-hidden="true" />
                <span>
                  <strong>La carte muette</strong>
                  <small>Un continent à imprimer, numéroté, avec sa liste et son corrigé.</small>
                </span>
              </button>
            </li>
          </ul>
        </section>
        <section className="pt-explorer-menu" aria-labelledby="pt-menu-jeux">
          <h3 id="pt-menu-jeux">Les jeux de la carte</h3>
          <ul>
            {JEUX.map((j) => {
              const n = monde.records[j.cle] ?? 0;
              return (
                <li key={j.id}>
                  <button type="button" onClick={() => lancer(j.id)}>
                    {j.id === "chasse" ? <Timer className="size-5" aria-hidden="true" /> : j.id === "voisins" ? <Flag className="size-5" aria-hidden="true" /> : <Crosshair className="size-5" aria-hidden="true" />}
                    <span>
                      <strong>{j.nom}</strong>
                      <small>
                        {j.texte}
                        {n ? ` Ton record : ${j.record(n)}.` : ""}
                      </small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>
    );

  return (
    <div ref={racine} className="pt-explorer" data-ouvert={choisi || courant ? "" : undefined} data-plein={plein || undefined}>
      <header className="pt-section-tete">
        <div>
          <h2 className="pt-titre">{t("carte.titre")}</h2>
          <p className="pt-chapo">{t("carte.chapo")}</p>
        </div>
      </header>

      <div className="pt-explorer-outils">
        <div className="pt-recherche" role="search">
          <Search className="size-4" aria-hidden="true" />
          <input
            type="search"
            value={requete}
            onChange={(e) => setRequete(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && resultats[0]) ouvrir(resultats[0].code);
            }}
            placeholder={outil === "distance" ? "Un pays, pour mesurer…" : outil === "taille" ? "Un pays, pour sa silhouette…" : "Un pays, une capitale…"}
            aria-label="Chercher un pays ou une capitale"
            aria-controls="pt-resultats"
            autoComplete="off"
          />
          {resultats.length > 0 && (
            <ul id="pt-resultats" className="pt-resultats" role="listbox">
              {resultats.map((p) => (
                <li key={p.code} role="option" aria-selected={false}>
                  <button type="button" onClick={() => ouvrir(p.code)}>
                    <Drapeau code={p.code} />
                    <span>{p.nom}</span>
                    {p.capitale && <small>{p.capitale}</small>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="pt-segments" role="group" aria-label="Projection">
          {MODES.map((m) => (
            <button key={m.id} type="button" aria-pressed={mode === m.id} title={m.titre} onClick={() => setMode(m.id)}>
              {m.icone}
              {m.nom}
            </button>
          ))}
        </div>
        <label className="pt-interrupteur">
          <input type="checkbox" checked={reglages.calque === "maitrise"} onChange={(e) => changer({ calque: e.target.checked ? "maitrise" : "aucun" })} />
          <span className="pt-interrupteur-piste" aria-hidden="true" />
          <span>Dorer ce que je maîtrise</span>
        </label>
      </div>

      <div className="pt-continents" role="group" aria-label="Aller vers un continent">
        {VUES.map((v) => (
          <button key={v.id} type="button" className="pt-puce" onClick={() => globe.current?.voler(modeVu !== "globe" ? { ...v.vue, zoom: Math.max(1.4, v.vue.zoom * 1.25) } : v.vue)}>
            {v.nom}
          </button>
        ))}
      </div>
      <div className="pt-encarts" role="group" aria-label="Les petits pays, de près">
        <span className="pt-encarts-titre">Les petits pays, de près :</span>
        {ENCARTS.map((e) => (
          <button key={e.id} type="button" className="pt-puce" aria-pressed={encart === e.id} onClick={() => setEncart(encart === e.id ? null : e.id)}>
            {e.nom}
          </button>
        ))}
      </div>

      <div className="pt-explorer-corps">
        <div className="pt-explorer-carte" data-mode={modeVu}>
          <Globe key={modeVu} ref={globe} {...proprietes} />
          <div className="pt-globe-outils">
            <button type="button" className="pt-icone" onClick={() => globe.current?.zoomer(1.6)} aria-label="Zoomer">
              <Plus className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="pt-icone" onClick={() => globe.current?.zoomer(1 / 1.6)} aria-label="Dézoomer">
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="pt-icone" onClick={() => globe.current?.recentrer()} aria-label="Revenir au monde entier">
              <LocateFixed className="size-4" aria-hidden="true" />
            </button>
            {monPays && (
              <button type="button" className="pt-icone" onClick={() => globe.current?.viser(monPays)} aria-label={`Aller vers mon pays : ${PAR_CODE.get(monPays)?.nom}`} title="Mon pays">
                <Home className="size-4" aria-hidden="true" />
              </button>
            )}
            <button type="button" className="pt-icone" onClick={() => setPanneau((x) => !x)} aria-label="Les calques de la carte" aria-expanded={panneau} title="Calques" data-actif={panneau || undefined}>
              <Layers className="size-4" aria-hidden="true" />
            </button>
            <button type="button" className="pt-icone" onClick={basculerPlein} aria-label={plein ? "Quitter le plein écran" : "Plein écran"} title={plein ? "Quitter le plein écran" : "Plein écran"}>
              {plein ? <Minimize2 className="size-4" aria-hidden="true" /> : <Maximize2 className="size-4" aria-hidden="true" />}
            </button>
          </div>
          {panneau && <PanneauCalques reglages={reglages} changer={changer} onFermer={() => setPanneau(false)} jeu={jeu} />}
          {(legende || sousSoleil) && (
            <div className="pt-carte-bas">
              {legende && reglages.calque !== "aucun" && <LegendeCarte key={reglages.calque} legende={legende} ouverte={reglages.calque !== "maitrise"} />}
              {sousSoleil && instant !== null && (
                <p className="pt-carte-soleil">
                  Il est {new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" }).format(instant)} en temps universel.
                  <small>
                    Le Soleil est au zénith en {coordonnees(sousSoleil)}
                    {lieuSoleil ? ` (${lieuSoleil})` : ", au-dessus de la mer"}.
                  </small>
                </p>
              )}
            </div>
          )}
          {encartVu && (
            <div className="pt-encart" role="region" aria-label={`Encart : ${encartVu.nom}`}>
              <div className="pt-encart-tete">
                <p>{encartVu.nom}</p>
                <button type="button" className="pt-icone" onClick={() => setEncart(null)} aria-label="Fermer l'encart">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <Globe
                key={encartVu.id}
                interactif
                reperes="tous"
                etiquettes="petits"
                teintes={proprietes.teintes}
                couleurs={proprietes.couleurs}
                rayes={proprietes.rayes}
                contour={proprietes.contour}
                onToucher={(code) => code && ouvrir(code)}
                vueInitiale={encartVu.vue}
                libelle={`Encart : ${encartVu.nom}. Touche un pays pour ouvrir sa fiche.`}
              />
            </div>
          )}
        </div>
        {cote}
      </div>
      {muette && <CarteMuette onFermer={() => setMuette(false)} />}
    </div>
  );
}
