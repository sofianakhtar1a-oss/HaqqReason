"use client";

import { Dumbbell, Eye, Focus, Minus, Pin, Play, Plus, Scan, Search, Square, Star, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ELEMENTS, PAR_ID } from "@/lib/corps/catalogue";
import { chargerFiches, useFiche } from "@/lib/corps/fiches";
import type { FicheMuscle } from "@/lib/corps/fiches/types";
import { NOMS_ARTICULATIONS, NOMS_MOUVEMENTS } from "@/lib/corps/mouvement/articulations";
import { type Action, gesteDe, programmeDe } from "@/lib/corps/mouvement/gestes";
import { ATELIER_DEFAUT, Atelier, type EtatAtelier } from "./Atelier";
import { calqueDElement } from "@/lib/corps/modele/modele";
import { basculerFavori, boite, estFavori, useEcorche } from "@/lib/corps/progression";
import { nomRegion } from "@/lib/corps/quiz";
import { chercherReperes, useReperes } from "@/lib/corps/reperes";
import { normaliser } from "@/lib/corps/texte";
import { type Couche, type Element, GRANDES_REGIONS, REGIONS, type StructureScene } from "@/lib/corps/types";
import { type Calques, Cartel, COUCHES_DEFAUT, type Couches, TEINTE, teinteMemoire, useCalme } from "./communs";
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
  // Les structures construites : ce sur quoi elles s'appuient, et celles qui s'appuient sur elle (ses branches,
  // ses affluents, les noyaux qu'elle porte).
  pousser([e.appui]);
  pousser(ELEMENTS.filter((x) => x.appui === e.id).map((x) => x.id));
  return l;
}

const LOBES = ["lobe-superieur-du-poumon-droit", "lobe-moyen-du-poumon-droit", "lobe-inferieur-du-poumon-droit", "lobe-superieur-du-poumon-gauche", "lobe-inferieur-du-poumon-gauche"];

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
  // « explorer/<structure> » ou « explorer/<structure>/<repère> » : un repère se montre sur sa structure.
  const [idDetail, cleRepere] = (detail ?? "").split("/");
  const choisi = idDetail && PAR_ID.has(idDetail) ? PAR_ID.get(idDetail)! : null;
  const reperes = useReperes(Boolean(choisi) || recherche.length >= 3);
  const sesReperes = (choisi && reperes?.parStructure.get(choisi.id)) || [];
  const repere = cleRepere && reperes ? reperes.parCle.get(cleRepere) : undefined;
  const repereChoisi = repere && choisi && repere.sur === choisi.id ? repere : undefined;
  const [tousReperes, setTousReperes] = useState(false);
  /** Le repère d'un relief cité par la fiche : même nom, ou un nom qui le précise (« Tête » → « Tête de l'humérus »). */
  const trouverRepere = (nom: string) => {
    const n = normaliser(nom);
    const r = sesReperes.find((x) => normaliser(x.nom) === n) ?? sesReperes.find((x) => normaliser(x.nom).startsWith(`${n} `)) ?? sesReperes.find((x) => n.startsWith(`${normaliser(x.nom)} `));
    return r?.cle;
  };
  // Le geste en train de se jouer (l'action d'un muscle), pour la légende sous le nom.
  const [geste, setGeste] = useState<Action | null>(null);
  const { fiche: ficheChoisie } = useFiche(choisi?.id);
  const actionsDuMuscle = ficheChoisie?.couche === "muscle" ? (ficheChoisie.fiche as FicheMuscle).actions : null;
  // L'atelier : la pose du squelette, la coupe, la vue éclatée, le scalpel, le cœur et le souffle.
  const [atelier, setAtelier] = useState<EtatAtelier>(ATELIER_DEFAUT);
  const reglerAtelier = (x: Partial<EtatAtelier>) => {
    setAtelier((a) => ({ ...a, ...x }));
    // Le cœur ou le souffle qu'on allume : la caméra vient sur la poitrine.
    if ((x.coeur && !atelier.coeur) || (x.souffle && !atelier.souffle)) stage.poignee.current?.viser(x.coeur ? ["atrium-droit", "atrium-gauche", "ventricule-droit", "ventricule-gauche"] : ["lobe-superieur-du-poumon-droit", "lobe-superieur-du-poumon-gauche", "lobe-inferieur-du-poumon-droit", "lobe-inferieur-du-poumon-gauche"], { marge: x.coeur ? 3.4 : 1.6 });
  };
  const poseAtelier = useRef(atelier.pose);
  // « Surprends-moi » : le muscle tiré au sort, dont on joue l'action dès que sa fiche est là.
  const [aJouer, setAJouer] = useState<string | null>(null);
  const calme = useCalme();

  const choisir = (id: string | null) => nav.aller(id ? `explorer/${id}` : "explorer");

  /** Montre sur le corps ce que fait le muscle choisi : une action, ou toutes ses actions principales à la suite. */
  const jouer = (actions: Action[]) => {
    if (!choisi || !actions.length) return;
    const programme = programmeDe(choisi.id, actions, "g", { toutes: actions.length === 1 });
    if (Object.keys(atelier.pose).length) setAtelier((a) => ({ ...a, pose: {} }));
    stage.poignee.current?.viser([choisi.id], { marge: 3.2, cote: "g" });
    stage.poignee.current?.jouer(programme, {
      etape: (rang) => {
        const l = programme[rang]?.legende;
        setGeste(l ? { articulation: l.articulation, mouvement: l.mouvement, role: "principal", precision: l.precision } : null);
      },
      fin: () => setGeste(null),
    });
  };
  const arreter = () => {
    stage.poignee.current?.arreter();
    stage.poignee.current?.poser(atelier.pose);
    setGeste(null);
  };
  // On change de structure : le geste s'arrête et le corps reprend la pose de l'atelier.
  const idChoisi = choisi?.id;
  useEffect(
    () => () => {
      stage.poignee.current?.arreter();
      stage.poignee.current?.poser(poseAtelier.current);
      setGeste(null);
    },
    [idChoisi, stage],
  );
  // La pose de l'atelier ; en quittant l'explorateur, le corps reprend la position anatomique.
  useEffect(() => {
    poseAtelier.current = atelier.pose;
    stage.poignee.current?.poser(atelier.pose);
  }, [atelier.pose, stage]);
  useEffect(() => () => stage.poignee.current?.poser({}), [stage]);
  // Le scalpel ôte une structure : elle s'en va (son élément entier, d'un seul côté si elle est paire).
  useEffect(() => {
    stage.surOter((s) => setAtelier((a) => (a.otees.includes(s.element) ? a : { ...a, otees: [...a.otees, s.element] })));
    return () => stage.surOter(null);
  }, [stage]);
  const surprendre = () => {
    chargerFiches("muscle").then((r) => {
      const jouables = Object.entries(r.fiches)
        .filter(([, f]) => f.actions.some((a) => a.role === "principal" && gesteDe(a.articulation, a.mouvement, "g")))
        .map(([id]) => id)
        .filter((id) => id !== choisi?.id && PAR_ID.has(id));
      if (!jouables.length) return;
      const id = jouables[Math.floor(Math.random() * jouables.length)];
      setAJouer(id);
      choisir(id);
    }, () => undefined);
  };
  useEffect(() => {
    if (!aJouer || choisi?.id !== aJouer || !actionsDuMuscle) return;
    // (le temps que la caméra arrive sur le muscle)
    const minuterie = setTimeout(() => {
      setAJouer(null);
      jouer(actionsDuMuscle);
    }, 500);
    return () => clearTimeout(minuterie);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aJouer, choisi?.id, actionsDuMuscle]);

  // Le corps : les couches, les rayons X, la dissection, la carte de ce qu'on sait, la structure choisie.
  // Les surfaces d'insertion du muscle choisi : origines en rouge, terminaisons en bleu.
  const aDesAttaches = choisi?.couche === "muscle" && Boolean(choisi.origines?.length || choisi.terminaisons?.length);
  const voirAttaches = aDesAttaches && attaches;
  const etats = useMemo(() => {
    const sortie: Record<string, EtatStructure> = {};
    if (memoire) for (const x of ELEMENTS) sortie[x.id] = { teinte: teinteMemoire(e.elements[x.id] ? boite(e, x.id) : undefined) };
    // Avec ses attaches, le muscle choisi devient translucide : on voit sur l'os d'où il part et où il se termine.
    if (choisi) sortie[choisi.id] = { teinte: TEINTE.choisi, choisi: true, visible: voirAttaches ? 0.3 : 1 };
    for (const id of atelier.otees) if (id !== choisi?.id) sortie[id] = { ...sortie[id], visible: 0 };
    // Pour voir battre le cœur, les poumons qui le couvrent s'effacent à demi (sauf si l'on regarde respirer).
    if (atelier.coeur && !atelier.souffle) for (const id of LOBES) if (id !== choisi?.id) sortie[id] = { ...sortie[id], visible: 0.18 };
    return sortie;
  }, [memoire, choisi, e, voirAttaches, atelier.otees, atelier.coeur, atelier.souffle]);
  // La structure choisie se voit toujours : sa couche s'allume (et son enveloppe), la dissection descend jusqu'à elle.
  const profChoisi = choisi ? (stage.scene?.structures.find((s) => s.element === choisi.id)?.profondeur ?? choisi.profondeur ?? 0) : 0;
  const profondeurVue = choisi?.couche === "muscle" || choisi?.couche === "tendon" ? Math.min(profondeur, profChoisi) : profondeur;
  const vraiesCouches = useMemo<Couches>(() => {
    let c = choisi && !couches[choisi.couche] ? { ...couches, [choisi.couche]: 1 } : couches;
    // Le cœur qui bat se voit avec ses artères ; le souffle, avec les poumons et les côtes : la chair devient
    // translucide pour les laisser voir.
    if (atelier.coeur) c = { ...c, artere: c.artere || 1, viscere: c.viscere || 1 };
    if (atelier.souffle) c = { ...c, viscere: c.viscere || 1 };
    if (atelier.coeur || atelier.souffle) c = { ...c, muscle: c.muscle ? 0.16 : 0, tendon: c.tendon ? 0.2 : 0 };
    // Une structure profonde (os, vaisseau, nerf, viscère, ligament…) se voit à travers la chair, qui devient
    // translucide ; l'encéphale, à travers le crâne.
    if (choisi && !["muscle", "tendon"].includes(choisi.couche)) {
      c = { ...c, muscle: c.muscle ? Math.min(c.muscle, 0.24) : 0, tendon: c.tendon ? Math.min(c.tendon, 0.36) : 0 };
      if (choisi.couche === "encephale") c = { ...c, os: c.os ? Math.min(c.os, 0.26) : 0 };
    }
    return rayonsX ? { ...c, muscle: c.muscle ? Math.min(c.muscle, 0.28) : 0, tendon: c.tendon ? Math.min(c.tendon, 0.4) : 0 } : c;
  }, [couches, rayonsX, choisi, atelier.coeur, atelier.souffle]);
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
      // La structure choisie ressort : le reste du corps passe en demi-transparence (sauf quand un outil, la mémoire,
      // les attaches ou l'isolement règlent déjà ce qu'on voit).
      voiler: choisi && !isole && !memoire && !voirAttaches && !atelier.coupe && !atelier.scalpel && !atelier.eclate && !atelier.coeur && !atelier.souffle ? { ids: [choisi.id], reste: 0.35 } : null,
      rotation: !choisi,
      etiquette: survole
        ? { id: survole.element, texte: PAR_ID.get(survole.element)?.nom ?? "" }
        : choisi && repereChoisi
          ? { id: choisi.id, texte: repereChoisi.nom, sous: `Repère : ${choisi.nom}`, point: repereChoisi.p }
          : choisi
            ? { id: choisi.id, texte: choisi.nom, sous: geste ? `${NOMS_ARTICULATIONS[geste.articulation] ?? geste.articulation} : ${(NOMS_MOUVEMENTS[geste.mouvement] ?? geste.mouvement).toLowerCase()}` : undefined }
            : null,
      retrait: false,
      coupe: atelier.coupe,
      eclate: atelier.eclate,
      scalpel: atelier.scalpel,
      vivant: atelier.coeur || atelier.souffle ? { coeur: atelier.coeur, souffle: atelier.souffle } : null,
    });
  }, [stage, vraiesCouches, vraisCalques, voirAttaches, profondeurVue, etats, isole, memoire, choisi, survole, geste, repereChoisi, atelier.coupe, atelier.eclate, atelier.scalpel, atelier.coeur, atelier.souffle]);

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

  // Échap referme : le repère montré, puis la structure choisie (sauf quand on écrit, ou qu'un dialogue est ouvert).
  useEffect(() => {
    const touche = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape" || !choisi) return;
      const cible = ev.target as HTMLElement | null;
      if (cible?.closest("input, textarea, select, dialog, [contenteditable='true']")) return;
      nav.aller(repereChoisi ? `explorer/${choisi.id}` : "explorer");
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [choisi, repereChoisi, nav]);

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
  // Les repères (reliefs des os, parties nommées) qui répondent aussi : après les structures.
  const reperesTrouves = useMemo(() => (reperes ? chercherReperes(reperes, differee, Math.max(3, 12 - trouves.length)) : []), [reperes, differee, trouves.length]);

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

      <Atelier etat={atelier} regler={reglerAtelier} calme={calme} surprendre={surprendre} />

      <div className="ec-recherche">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={recherche}
          onChange={(ev) => setRecherche(ev.target.value)}
          onKeyDown={(ev) => {
            // Entrée : la première réponse.
            if (ev.key !== "Enter") return;
            const x = trouves[0];
            const r = reperesTrouves[0];
            if (!x && !r) return;
            ev.preventDefault();
            setRecherche("");
            if (x) choisir(x.id);
            else if (r) nav.aller(`explorer/${r.sur}/${r.cle}`);
          }}
          placeholder="Chercher : deltoïde, fémur, aorte, tubercule majeur…"
          aria-label="Chercher une structure ou un repère"
        />
        {trouves.length + reperesTrouves.length > 0 && (
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
                  <i lang="la">{x.membres?.length ? `Ensemble de ${x.membres.length} structures` : x.latin}</i>
                </button>
              </li>
            ))}
            {reperesTrouves.map((r) => (
              <li key={r.cle}>
                <button
                  type="button"
                  className="est-repere"
                  onClick={() => {
                    setRecherche("");
                    nav.aller(`explorer/${r.sur}/${r.cle}`);
                  }}
                >
                  <b>{r.nom}</b>
                  <i>Repère sur {PAR_ID.get(r.sur ?? "")?.nom ?? "le corps"}</i>
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
            aller={choisir}
            jouer={(a) => jouer([a])}
            reperes={sesReperes.length ? { trouver: trouverRepere, montrer: (cle) => nav.aller(repereChoisi?.cle === cle ? `explorer/${choisi.id}` : `explorer/${choisi.id}/${cle}`), actif: repereChoisi?.cle } : undefined}
            actions={
              <>
                {actionsDuMuscle &&
                  (geste ? (
                    <button type="button" className="ec-bouton est-plein" onClick={arreter}>
                      <Square size={14} aria-hidden="true" /> Arrêter
                    </button>
                  ) : (
                    <button type="button" className="ec-bouton est-plein" onClick={() => jouer(actionsDuMuscle)} title="Le squelette fait le mouvement, le muscle se contracte.">
                      <Play size={15} aria-hidden="true" /> Voir l’action
                    </button>
                  ))}
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
          {sesReperes.length > 0 && (
            <section className="ec-liees ec-reperes">
              <h3 className="ec-section-titre">
                Ses repères <span>{sesReperes.length}</span>
              </h3>
              <div className="ec-boutons">
                {(tousReperes ? sesReperes : sesReperes.slice(0, 18)).map((r) => (
                  <button key={r.cle} type="button" className="ec-puce est-repere" aria-pressed={repereChoisi?.cle === r.cle} title={r.latin} onClick={() => nav.aller(repereChoisi?.cle === r.cle ? `explorer/${choisi.id}` : `explorer/${choisi.id}/${r.cle}`)}>
                    {r.nom}
                  </button>
                ))}
                {!tousReperes && sesReperes.length > 18 && (
                  <button type="button" className="ec-puce est-suite" onClick={() => setTousReperes(true)}>
                    Les {sesReperes.length - 18} autres…
                  </button>
                )}
              </div>
            </section>
          )}
          {liees(choisi).length > 0 && (
            <section className="ec-liees">
              <h3 className="ec-section-titre">{choisi.membres?.length ? "Réunit" : choisi.couche === "os" ? "S'articule avec" : choisi.couche === "artere" ? "Son arbre" : "Liée à"}</h3>
              <div className="ec-boutons">
                {liees(choisi).filter((x, i, l) => l.findIndex((y) => y.nom === x.nom) === i).map((x) => (
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
