"use client";

import { Flag, Timer, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ELEMENTS, PAR_ID } from "@/lib/corps/catalogue";
import { CATEGORIES } from "@/lib/corps/niveaux";
import { battreRecord, noterErreur, noterJournal, noterReponse, useEcorche } from "@/lib/corps/progression";
import { jugerNom } from "@/lib/corps/texte";
import { GRANDES_REGIONS, REGIONS } from "@/lib/corps/types";
import { hasard } from "@/lib/corps/vec";
import { TEINTE, miseEnScene } from "./communs";
import type { Jeu, Stage } from "./Ecorche";
import type { EtatStructure } from "./moteur/Corps3D";
import { ressentir } from "./sons";

type Cat = "os" | "muscles" | "tendons" | "arteres";
const CATS: Cat[] = ["os", "muscles", "tendons", "arteres"];
const GRISE: [number, number, number, number] = [60, 70, 76, 170];

function structuresDu(c: Cat, grande: string): string[] {
  const couches = CATEGORIES[c].couches;
  return ELEMENTS.filter((e) => couches.includes(e.couche) && REGIONS.find((r) => r.id === e.region)?.grande === grande).map((e) => e.id);
}

/** Le choix de la couche et de la grande région, en tête de chaque jeu. */
function Cadre({ titre, jeu, changer, fermer, children, droite }: { titre: string; jeu: Jeu; changer: (j: Jeu) => void; fermer: () => void; children: React.ReactNode; droite?: React.ReactNode }) {
  return (
    <div className="ec-partie ec-jeu">
      <header className="ec-partie-tete">
        <button type="button" className="ec-icone" onClick={fermer} aria-label="Quitter le jeu">
          <X size={18} aria-hidden="true" />
        </button>
        <span className="ec-partie-titre">{titre}</span>
        {droite}
      </header>
      <div className="ec-jeu-choix">
        <select value={jeu.categorie} onChange={(ev) => changer({ ...jeu, categorie: ev.target.value as Cat })} aria-label="La couche">
          {CATS.map((c) => (
            <option key={c} value={c}>
              {CATEGORIES[c].nom}
            </option>
          ))}
        </select>
        <select value={jeu.grande} onChange={(ev) => changer({ ...jeu, grande: ev.target.value })} aria-label="La région">
          {GRANDES_REGIONS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nom}
            </option>
          ))}
        </select>
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- Nomme-les tous */

export function NommeLesTous({ jeu: depart, stage, fermer }: { jeu: Jeu; stage: Stage; fermer: () => void }) {
  const [jeu, setJeu] = useState(depart);
  const ids = useMemo(() => structuresDu(jeu.categorie, jeu.grande), [jeu]);
  const [trouves, setTrouves] = useState<string[]>([]);
  const [saisie, setSaisie] = useState("");
  const [fini, setFini] = useState(false);
  const duree = Math.max(120, Math.min(480, ids.length * 18));
  const [reste, setReste] = useState(duree);
  const [eclat, setEclat] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const e = useEcorche();
  const cle = `nomme:${jeu.categorie}:${jeu.grande}`;

  const changer = (j: Jeu) => {
    setJeu(j);
    setTrouves([]);
    setFini(false);
    setSaisie("");
    setReste(Math.max(120, Math.min(480, structuresDu(j.categorie, j.grande).length * 18)));
  };


  const terminer = useCallback(
    (n: number) => {
      if (fini) return;
      setFini(true);
      const record = battreRecord(cle, n);
      ressentir(record ? "record" : "niveau");
      noterJournal({ s: "nomme", n: `Nomme-les tous · ${CATEGORIES[jeu.categorie].nom}`, b: n, q: ids.length, x: n * 5 });
    },
    [fini, cle, jeu.categorie, ids.length],
  );
  const terminerRef = useRef(terminer);
  const trouvesRef = useRef(0);
  useEffect(() => {
    terminerRef.current = terminer;
    trouvesRef.current = trouves.length;
  });
  useEffect(() => {
    if (fini) return;
    const limite = Date.now() + reste * 1000;
    const id = setInterval(() => {
      const r = Math.ceil((limite - Date.now()) / 1000);
      setReste(r);
      if (r <= 0) {
        clearInterval(id);
        terminerRef.current(trouvesRef.current);
      }
    }, 250);
    return () => clearInterval(id);
    // Le minuteur repart quand une partie (re)commence, pas à chaque seconde.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fini, jeu]);

  // Le corps : la région en gris, ce qui est trouvé s'allume ; à la fin, l'oublié en rouge.
  useEffect(() => {
    const premier = PAR_ID.get(ids[0]);
    if (!premier) return;
    const { couches } = miseEnScene(premier);
    const etats: Record<string, EtatStructure> = {};
    for (const id of ids) etats[id] = { teinte: trouves.includes(id) ? TEINTE.juste : fini ? TEINTE.faux : GRISE, pulse: id === eclat };
    stage.regler({ couches, profondeur: 0, etats, isoler: ids, rotation: false, etiquette: eclat ? { id: eclat, texte: PAR_ID.get(eclat)?.nom ?? "" } : null, retrait: false });
  }, [ids, trouves, fini, eclat, stage]);
  useEffect(() => {
    stage.poignee.current?.viser(ids, { marge: 1.05, cote: "g" });
    stage.surChoix(null);
  }, [ids, stage]);

  const essayer = (texte: string) => {
    setSaisie(texte);
    if (fini) return;
    for (const id of ids) {
      if (trouves.includes(id)) continue;
      const el = PAR_ID.get(id)!;
      if (jugerNom(el, texte) !== "faux") {
        const n = trouves.length + 1;
        setTrouves((t) => [...t, id]);
        if (n === ids.length) terminer(n);
        setSaisie("");
        setEclat(id);
        noterReponse(id, true, 5);
        ressentir("trouve");
        stage.poignee.current?.viser([id], { marge: 2.6 });
        return;
      }
    }
  };

  const m = Math.floor(Math.max(0, reste) / 60);
  const s = Math.max(0, reste) % 60;
  return (
    <Cadre
      titre="Nomme-les tous"
      jeu={jeu}
      changer={changer}
      fermer={fermer}
      droite={
        <span className="ec-chrono">
          <Timer size={15} aria-hidden="true" /> {m}:{String(s).padStart(2, "0")}
        </span>
      }
    >
      <p className="ec-consigne">
        {trouves.length} / {ids.length}
      </p>
      <p className="ec-note">Écris un nom : s’il est dans la région, il s’allume sur le corps. Les anciens noms comptent aussi. Record : {e.records[cle] ?? 0}.</p>
      {!fini ? (
        <div className="ec-ecrire">
          <input ref={champ} value={saisie} onChange={(ev) => essayer(ev.target.value)} placeholder="Un nom…" aria-label="Un nom de structure" autoFocus autoComplete="off" spellCheck={false} />
          <button type="button" className="ec-bouton est-discret" onClick={() => terminer(trouves.length)}>
            <Flag size={14} aria-hidden="true" /> J’abandonne
          </button>
        </div>
      ) : (
        <p className="ec-verdict-titre">{trouves.length === ids.length ? "Toute la région, sans en oublier une." : `${ids.length - trouves.length} en rouge sur le corps : celles qui manquaient.`}</p>
      )}
      <ul className="ec-trouves">
        {(fini ? ids : trouves).map((id) => (
          <li key={id} data-trouve={trouves.includes(id)}>
            <button type="button" className="ec-lien" onClick={() => stage.poignee.current?.viser([id], { marge: 2.2 })}>
              {PAR_ID.get(id)?.nom}
            </button>
          </li>
        ))}
      </ul>
      {fini && (
        <button type="button" className="ec-bouton est-plein" onClick={() => changer(jeu)}>
          Rejouer
        </button>
      )}
    </Cadre>
  );
}

/* ---------------------------------------------------------------- Le corps muet */

export function CorpsMuet({ jeu: depart, stage, fermer }: { jeu: Jeu; stage: Stage; fermer: () => void }) {
  const [jeu, setJeu] = useState(depart);
  const ordre = useMemo(() => {
    const l = structuresDu(jeu.categorie, jeu.grande);
    const r = hasard(jeu.graine ?? 1);
    return l
      .map((id) => [r(), id] as const)
      .sort((a, b) => a[0] - b[0])
      .map(([, id]) => id);
  }, [jeu]);
  const [i, setI] = useState(0);
  const [essais, setEssais] = useState(0);
  const [justes, setJustes] = useState<string[]>([]);
  const [ratees, setRatees] = useState<string[]>([]);
  const [faux, setFaux] = useState<string | null>(null);
  const e = useEcorche();
  const cible = ordre[i];
  const fini = i >= ordre.length;
  const cle = `muet:${jeu.categorie}:${jeu.grande}`;

  const changer = (j: Jeu) => {
    setJeu({ ...j, graine: (j.graine ?? 1) + 7919 });
    setI(0);
    setEssais(0);
    setJustes([]);
    setRatees([]);
  };

  useEffect(() => {
    const premier = PAR_ID.get(ordre[0]);
    if (!premier) return;
    const { couches } = miseEnScene(premier);
    const etats: Record<string, EtatStructure> = {};
    for (const id of justes) etats[id] = { teinte: TEINTE.juste };
    for (const id of ratees) etats[id] = { teinte: TEINTE.faux };
    if (faux) etats[faux] = { teinte: TEINTE.faux, pulse: true };
    if (essais >= 2 && cible) etats[cible] = { teinte: TEINTE.laiton, pulse: true };
    stage.regler({ couches, profondeur: 0, etats, isoler: ordre, rotation: false, etiquette: null, retrait: false });
  }, [ordre, justes, ratees, faux, essais, cible, stage]);
  useEffect(() => {
    stage.poignee.current?.viser(ordre, { marge: 1.05, cote: "g" });
  }, [ordre, stage]);

  useEffect(() => {
    if (!fini || !ordre.length) return;
    const record = battreRecord(cle, justes.length);
    ressentir(record ? "record" : "niveau");
    noterJournal({ s: "muet", n: `Le corps muet · ${CATEGORIES[jeu.categorie].nom}`, b: justes.length, q: ordre.length, x: justes.length * 6 });
    // La fin d'une partie se note une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fini]);

  useEffect(() => {
    stage.surChoix((s) => {
      if (!s || !cible || fini) return;
      if (s.element === cible) {
        if (essais === 0) {
          setJustes((l) => [...l, cible]);
          noterReponse(cible, true, 6);
          ressentir("juste");
        } else {
          setRatees((l) => [...l, cible]);
          noterReponse(cible, false, 0);
          ressentir("trouve");
        }
        setFaux(null);
        setEssais(0);
        setI((x) => x + 1);
      } else {
        setFaux(s.element);
        setEssais((n) => n + 1);
        noterErreur("muet", cible, PAR_ID.get(s.element)?.nom ?? "", s.element);
        ressentir("faux");
      }
    });
    return () => stage.surChoix(null);
  }, [stage, cible, fini, essais]);

  return (
    <Cadre titre="Le corps muet" jeu={jeu} changer={changer} fermer={fermer} droite={<span className="ec-score">{justes.length} du premier coup</span>}>
      {!fini && cible ? (
        <>
          <p className="ec-methode">
            {i + 1} sur {ordre.length}
          </p>
          <h2 className="ec-consigne">Touche : {PAR_ID.get(cible)?.nom}</h2>
          <p className="ec-note">{essais >= 2 ? "Elle s'est allumée : touche-la pour continuer." : faux ? `Non, c'est ${PAR_ID.get(faux)?.nom}.` : "Fais tourner le corps et rapproche-toi au besoin."}</p>
          <button
            type="button"
            className="ec-bouton est-discret"
            onClick={() => {
              setEssais(2);
              setFaux(null);
            }}
          >
            Montre-la-moi
          </button>
        </>
      ) : (
        <>
          <h2 className="ec-consigne">
            {justes.length} / {ordre.length} du premier coup
          </h2>
          <p className="ec-note">Record de cette région : {e.records[cle] ?? 0}.</p>
          <button type="button" className="ec-bouton est-plein" onClick={() => changer(jeu)}>
            Rejouer
          </button>
        </>
      )}
    </Cadre>
  );
}
