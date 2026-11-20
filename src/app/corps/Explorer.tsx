"use client";

import { Dumbbell, Eye, Focus, Minus, Pin, Plus, Scan, Search, Star, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ELEMENTS, PAR_ID } from "@/lib/corps/catalogue";
import { calqueDElement } from "@/lib/corps/modele/modele";
import { basculerFavori, boite, estFavori, useEcorche } from "@/lib/corps/progression";
import { nomRegion } from "@/lib/corps/quiz";
import { normaliser } from "@/lib/corps/texte";
import { type Couche, type Element, GRANDES_REGIONS, REGIONS, type StructureScene } from "@/lib/corps/types";
import { type Calques, Cartel, COUCHES_DEFAUT, type Couches, TEINTE, teinteMemoire } from "./communs";
import type { Navigation, Stage } from "./Ecorche";
import type { CalqueOptionnel, EtatStructure, NomVue } from "./moteur/Corps3D";

const NOMS_COUCHES: { id: Couche; nom: string }[] = [
  { id: "os", nom: "Os" },
  { id: "muscle", nom: "Muscles" },
  { id: "tendon", nom: "Tendons" },
  { id: "ligament", nom: "Ligaments" },
  { id: "artere", nom: "Artères" },
  { id: "veine", nom: "Veines" },
  { id: "nerf", nom: "Nerfs" },
  { id: "viscere", nom: "Viscères" },
  { id: "encephale", nom: "Encéphale" },
  { id: "lymphe", nom: "Lymphe" },
];
/** Les enveloppes : elles couvrent ce qu'on vient voir, on ne les montre que sur demande. */
const NOMS_CALQUES: { id: CalqueOptionnel; nom: string; aide: string }[] = [
  { id: "fascia", nom: "Fascias", aide: "Les enveloppes fibreuses des muscles : elles couvrent les loges." },
  { id: "gaine", nom: "Gaines", aide: "Les gaines synoviales où glissent les tendons." },
  { id: "bourse", nom: "Bourses", aide: "Les bourses synoviales, entre un tendon et un os." },
  { id: "enveloppe", nom: "Séreuses", aide: "La plèvre, le péricarde, la dure-mère : ce qui enveloppe les organes." },
];
const OPTIONNELS: readonly string[] = NOMS_CALQUES.map((c) => c.id);
const PROFONDEURS = ["Tous les muscles", "Sans les superficiels", "Les profonds seuls"];
const VUES: { id: NomVue; nom: string }[] = [
  { id: "face", nom: "Face" },
  { id: "dos", nom: "Dos" },
  { id: "gauche", nom: "Gauche" },
  { id: "droite", nom: "Droite" },
];

/** Les structures liées : tendons d'un muscle, son nerf et ses os, branches d'une artère, os voisins, membres d'un ensemble… */
function liees(e: Element): Element[] {
  const l: Element[] = [];
  const pousser = (ids: (string | undefined)[]) => {
    for (const id of ids) {
      const x = id ? PAR_ID.get(id) : undefined;
      if (x && x.id !== e.id && !l.includes(x)) l.push(x);
    }
  };
  if (e.couche === "muscle") {
    l.push(...ELEMENTS.filter((x) => x.muscle === e.id));
    pousser([e.nerf, ...(e.origines ?? []), ...(e.terminaisons ?? [])]);
  }
  pousser(e.membres ?? []);
  pousser([e.ensemble]);
  if (e.couche === "tendon" && e.muscle && PAR_ID.get(e.muscle)) l.push(PAR_ID.get(e.muscle)!);
  if (e.couche === "artere") {
    if (e.provenance && PAR_ID.get(e.provenance)) l.push(PAR_ID.get(e.provenance)!);
    l.push(...ELEMENTS.filter((x) => x.provenance === e.id));
  }
  if (e.couche === "os") pousser(e.articulations ?? []);
  return l;
}

export function Explorer({ stage, detail, nav }: { stage: Stage; detail: string | null; nav: Navigation }) {
  const e = useEcorche();
  const [couches, setCouches] = useState<Couches>(COUCHES_DEFAUT);
  const [calques, setCalques] = useState<Calques>({});
  const [attaches, setAttaches] = useState(false);
  const [rayonsX, setRayonsX] = useState(false);
  const [profondeur, setProfondeur] = useState(0);
  const [memoire, setMemoire] = useState(false);
  const [isole, setIsole] = useState(false);
  const [survole, setSurvole] = useState<StructureScene | null>(null);
  const [recherche, setRecherche] = useState("");
  const differee = useDeferredValue(recherche);
  const choisi = detail && PAR_ID.has(detail) ? PAR_ID.get(detail)! : null;

  const choisir = (id: string | null) => nav.aller(id ? `explorer/${id}` : "explorer");

  // Le corps : les couches, les rayons X, la dissection, la carte de ce qu'on sait, la structure choisie.
  // Les surfaces d'insertion du muscle choisi : origines en rouge, terminaisons en bleu.
  const aDesAttaches = choisi?.couche === "muscle" && Boolean(choisi.origines?.length || choisi.terminaisons?.length);
  const voirAttaches = aDesAttaches && attaches;
  const etats = useMemo(() => {
    const sortie: Record<string, EtatStructure> = {};
    if (memoire) for (const x of ELEMENTS) sortie[x.id] = { teinte: teinteMemoire(e.elements[x.id] ? boite(e, x.id) : undefined) };
    // Avec ses attaches, le muscle choisi devient translucide : on voit sur l'os d'où il part et où il se termine.
    if (choisi) sortie[choisi.id] = { teinte: TEINTE.choisi, choisi: true, visible: voirAttaches ? 0.3 : 1 };
    return sortie;
  }, [memoire, choisi, e, voirAttaches]);
  // La structure choisie se voit toujours : sa couche s'allume (et son enveloppe), la dissection descend jusqu'à elle.
  const profChoisi = choisi ? (stage.scene?.structures.find((s) => s.element === choisi.id)?.profondeur ?? choisi.profondeur ?? 0) : 0;
  const profondeurVue = choisi?.couche === "muscle" || choisi?.couche === "tendon" ? Math.min(profondeur, profChoisi) : profondeur;
  const vraiesCouches = useMemo<Couches>(() => {
    const c = choisi && !couches[choisi.couche] ? { ...couches, [choisi.couche]: 1 } : couches;
    return rayonsX ? { ...c, muscle: c.muscle ? 0.28 : 0, tendon: c.tendon ? 0.4 : 0 } : c;
  }, [couches, rayonsX, choisi]);
  const vraisCalques = useMemo<Calques>(() => {
    const calque = choisi ? calqueDElement(choisi.id) : null;
    return calque && OPTIONNELS.includes(calque) && !calques[calque as CalqueOptionnel] ? { ...calques, [calque]: 1 } : calques;
  }, [calques, choisi]);

  useEffect(() => {
    stage.regler({
      couches: vraiesCouches,
      calques: vraisCalques,
      attaches: voirAttaches && choisi ? [choisi.id] : null,
      decouvrir: choisi && (choisi.couche === "muscle" || choisi.couche === "tendon") ? [choisi.id] : null,
      profondeur: profondeurVue,
      etats,
      isoler: isole && choisi ? [choisi.id, ...liees(choisi).map((x) => x.id)] : null,
      rotation: !choisi,
      etiquette: survole ? { id: survole.element, texte: PAR_ID.get(survole.element)?.nom ?? "" } : choisi ? { id: choisi.id, texte: choisi.nom } : null,
      retrait: false,
    });
  }, [stage, vraiesCouches, vraisCalques, voirAttaches, profondeurVue, etats, isole, choisi, survole]);

  useEffect(() => {
    stage.surChoix((s) => {
      if (s) nav.aller(`explorer/${s.element}`);
    });
    stage.surSurvol((s) => setSurvole(s));
    return () => {
      stage.surChoix(null);
      stage.surSurvol(null);
    };
  }, [stage, nav]);

  // La structure choisie : la caméra s'en approche ; sinon, le corps en entier.
  useEffect(() => {
    if (choisi) stage.poignee.current?.viser([choisi.id], { marge: 1.7 });
    else stage.poignee.current?.vue("ensemble");
  }, [choisi, stage]);

  // Et sa fiche vient sous les yeux (sur téléphone, elle est plus bas dans le panneau).
  const fiche = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!choisi) return;
    const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    fiche.current?.scrollIntoView({ block: "nearest", behavior: calme ? "auto" : "smooth" });
  }, [choisi]);

  const trouves = useMemo(() => {
    const r = normaliser(differee);
    if (r.length < 2) return [];
    // D'abord les noms qui commencent par ce qu'on a écrit, puis ceux qui le contiennent ; les plus connus en tête.
    const notes: [number, Element][] = [];
    for (const x of ELEMENTS) {
      let note = 0;
      for (const n of [x.nom, x.officiel ?? "", x.latin, x.anglais, ...(x.noms ?? [])]) {
        const v = normaliser(n);
        if (v.startsWith(r)) note = Math.max(note, 3);
        else if (v.includes(` ${r}`)) note = Math.max(note, 2);
        else if (v.includes(r)) note = Math.max(note, 1);
      }
      if (note) notes.push([note * 10 - x.rang, x]);
    }
    return notes
      .sort((a, b) => b[0] - a[0])
      .slice(0, 10)
      .map(([, x]) => x);
  }, [differee]);

  return (
    <div className="ec-explorer">
      <div className="ec-explorer-outils" role="toolbar" aria-label="Ce que montre le corps">
        <div className="ec-couches">
          {NOMS_COUCHES.map((c) => (
            <button key={c.id} type="button" className="ec-couche" data-couche={c.id} aria-pressed={couches[c.id] > 0} onClick={() => setCouches((x) => ({ ...x, [c.id]: x[c.id] ? 0 : 1 }))}>
              <span className="ec-couche-pastille" aria-hidden="true" />
              {c.nom}
            </button>
          ))}
        </div>
        <div className="ec-bascules" aria-label="Les enveloppes">
          {NOMS_CALQUES.map((c) => (
            <button key={c.id} type="button" className="ec-bascule" aria-pressed={(calques[c.id] ?? 0) > 0} title={c.aide} onClick={() => setCalques((x) => ({ ...x, [c.id]: x[c.id] ? 0 : 1 }))}>
              {c.nom}
            </button>
          ))}
        </div>
        <div className="ec-segment" role="radiogroup" aria-label="La dissection">
          {PROFONDEURS.map((nom, k) => (
            <button key={nom} type="button" role="radio" aria-checked={profondeur === k} onClick={() => setProfondeur(k)}>
              {nom}
            </button>
          ))}
        </div>
        <div className="ec-bascules">
          <button type="button" className="ec-bascule" aria-pressed={rayonsX} onClick={() => setRayonsX((v) => !v)}>
            <Scan size={15} aria-hidden="true" /> Rayons X
          </button>
          <button type="button" className="ec-bascule" aria-pressed={memoire} onClick={() => setMemoire((v) => !v)} title="Chaque structure prend la couleur de ce que tu en sais : rouge, oubliée ; vert, sue.">
            <Eye size={15} aria-hidden="true" /> Ce que je sais
          </button>
        </div>
        <div className="ec-vues">
          {VUES.map((v) => (
            <button key={v.id} type="button" className="ec-bouton est-petit" onClick={() => stage.poignee.current?.vue(v.id)}>
              {v.nom}
            </button>
          ))}
          <button type="button" className="ec-icone" onClick={() => stage.poignee.current?.zoomer(0.8)} aria-label="Rapprocher">
            <Plus size={16} aria-hidden="true" />
          </button>
          <button type="button" className="ec-icone" onClick={() => stage.poignee.current?.zoomer(1.25)} aria-label="Éloigner">
            <Minus size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="ec-recherche">
        <Search size={16} aria-hidden="true" />
        <input type="search" value={recherche} onChange={(ev) => setRecherche(ev.target.value)} placeholder="Chercher : deltoïde, fémur, aorte, rotule…" aria-label="Chercher une structure" />
        {trouves.length > 0 && (
          <ul className="ec-suggestions" role="listbox">
            {trouves.map((x) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => {
                    setRecherche("");
                    choisir(x.id);
                  }}
                >
                  <b>{x.nom}</b>
                  <i lang="la">{x.latin}</i>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {choisi ? (
        <div ref={fiche} className="ec-fiche-choisie">
          <Cartel
            e={choisi}
            latin={e.profil.latin}
            actions={
              <>
                <button type="button" className="ec-bouton" aria-pressed={isole} onClick={() => setIsole((v) => !v)}>
                  <Focus size={15} aria-hidden="true" /> {isole ? "Tout montrer" : "Isoler"}
                </button>
                {aDesAttaches && (
                  <button type="button" className="ec-bouton" aria-pressed={voirAttaches} onClick={() => setAttaches((v) => !v)} title="Les surfaces où le muscle s'attache à l'os : l'origine en rouge, la terminaison en bleu.">
                    <Pin size={15} aria-hidden="true" /> Attaches
                  </button>
                )}
                <button type="button" className="ec-bouton" onClick={() => nav.jouer({ sorte: "entrainement", ids: [choisi.id], titre: `S'entraîner : ${choisi.nom}` })}>
                  <Dumbbell size={15} aria-hidden="true" /> S’entraîner
                </button>
                <button type="button" className="ec-bouton" aria-pressed={estFavori(e, choisi.id)} onClick={() => basculerFavori(choisi.id)}>
                  <Star size={15} aria-hidden="true" /> {estFavori(e, choisi.id) ? "Dans mes fiches" : "Garder"}
                </button>
                <button type="button" className="ec-icone" onClick={() => choisir(null)} aria-label="Fermer la fiche">
                  <X size={16} aria-hidden="true" />
                </button>
              </>
            }
          />
          {liees(choisi).length > 0 && (
            <section className="ec-liees">
              <h3 className="ec-section-titre">{choisi.membres?.length ? "Réunit" : choisi.couche === "os" ? "S'articule avec" : choisi.couche === "artere" ? "Son arbre" : "Liée à"}</h3>
              <div className="ec-boutons">
                {liees(choisi).map((x) => (
                  <button key={x.id} type="button" className="ec-puce" data-couche={x.couche} onClick={() => choisir(x.id)}>
                    {x.nom}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <Parcourir couches={couches} choisir={choisir} />
      )}
    </div>
  );
}

/** Toutes les structures des couches montrées, rangées par grande région puis par région (les plus connues d'abord). */
function Parcourir({ couches, choisir }: { couches: Couches; choisir: (id: string) => void }) {
  const [ouverte, setOuverte] = useState<string>("membre-sup");
  const [tout, setTout] = useState<string | null>(null);
  return (
    <section className="ec-parcourir">
      <p className="ec-note">Touche une structure sur le corps, ou choisis-la ici.</p>
      {GRANDES_REGIONS.map((g) => {
        const regions = REGIONS.filter((r) => r.grande === g.id);
        const liste = ELEMENTS.filter((x) => regions.some((r) => r.id === x.region) && couches[x.couche] > 0);
        return (
          <details key={g.id} open={ouverte === g.id} onToggle={(ev) => (ev.currentTarget.open ? setOuverte(g.id) : undefined)}>
            <summary>
              {g.nom} <span>{liste.length}</span>
            </summary>
            {ouverte === g.id &&
              regions.map((r) => {
                const l = liste.filter((x) => x.region === r.id).sort((a, b) => a.rang - b.rang || a.nom.localeCompare(b.nom, "fr"));
                if (!l.length) return null;
                const coupe = tout === r.id ? l : l.slice(0, 40);
                return (
                  <div key={r.id} className="ec-parcourir-region">
                    <h4>
                      {nomRegion(r.id)} <span>{l.length}</span>
                    </h4>
                    <div className="ec-boutons">
                      {coupe.map((x) => (
                        <button key={x.id} type="button" className="ec-puce" data-couche={x.couche} onClick={() => choisir(x.id)}>
                          {x.nom}
                        </button>
                      ))}
                      {coupe.length < l.length && (
                        <button type="button" className="ec-puce est-suite" onClick={() => setTout(r.id)}>
                          Les {l.length - coupe.length} autres…
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </details>
        );
      })}
    </section>
  );
}
