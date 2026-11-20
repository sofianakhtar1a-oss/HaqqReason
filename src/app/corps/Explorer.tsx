"use client";

import { Dumbbell, Eye, Focus, Minus, Plus, Scan, Search, Star, X } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ELEMENTS, PAR_ID } from "@/lib/corps/catalogue";
import { basculerFavori, boite, estFavori, useEcorche } from "@/lib/corps/progression";
import { nomRegion } from "@/lib/corps/quiz";
import { normaliser } from "@/lib/corps/texte";
import { type Couche, type Element, GRANDES_REGIONS, REGIONS, type StructureScene } from "@/lib/corps/types";
import { Cartel, type Couches, TEINTE, teinteMemoire } from "./communs";
import type { Navigation, Stage } from "./Ecorche";
import type { EtatStructure, NomVue } from "./moteur/Corps3D";

const NOMS_COUCHES: { id: Couche; nom: string }[] = [
  { id: "os", nom: "Os" },
  { id: "muscle", nom: "Muscles" },
  { id: "tendon", nom: "Tendons" },
  { id: "artere", nom: "Artères" },
];
const PROFONDEURS = ["Tous les muscles", "Sans les superficiels", "Les profonds seuls"];
const VUES: { id: NomVue; nom: string }[] = [
  { id: "face", nom: "Face" },
  { id: "dos", nom: "Dos" },
  { id: "gauche", nom: "Gauche" },
  { id: "droite", nom: "Droite" },
];

/** Les structures liées : tendons d'un muscle, branches d'une artère, os voisins… */
function liees(e: Element): Element[] {
  const l: Element[] = [];
  if (e.couche === "muscle") l.push(...ELEMENTS.filter((x) => x.muscle === e.id));
  if (e.couche === "tendon" && e.muscle && PAR_ID.get(e.muscle)) l.push(PAR_ID.get(e.muscle)!);
  if (e.couche === "artere") {
    if (e.provenance && PAR_ID.get(e.provenance)) l.push(PAR_ID.get(e.provenance)!);
    l.push(...ELEMENTS.filter((x) => x.provenance === e.id));
  }
  if (e.couche === "os") l.push(...(e.articulations ?? []).map((a) => PAR_ID.get(a)).filter((x): x is Element => Boolean(x)));
  return l;
}

export function Explorer({ stage, detail, nav }: { stage: Stage; detail: string | null; nav: Navigation }) {
  const e = useEcorche();
  const [couches, setCouches] = useState<Couches>({ os: 1, muscle: 1, tendon: 1, artere: 0 });
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
  const etats = useMemo(() => {
    const sortie: Record<string, EtatStructure> = {};
    if (memoire) for (const x of ELEMENTS) sortie[x.id] = { teinte: teinteMemoire(e.elements[x.id] ? boite(e, x.id) : undefined) };
    if (choisi) sortie[choisi.id] = { teinte: TEINTE.choisi, choisi: true, visible: 1 };
    return sortie;
  }, [memoire, choisi, e]);
  // La structure choisie se voit toujours : sa couche s'allume, la dissection descend jusqu'à elle.
  const profChoisi = choisi ? (stage.scene?.structures.find((s) => s.element === choisi.id)?.profondeur ?? 0) : 0;
  const profondeurVue = choisi?.couche === "muscle" ? Math.min(profondeur, profChoisi) : profondeur;
  const vraiesCouches = useMemo<Couches>(() => {
    const c = choisi && !couches[choisi.couche] ? { ...couches, [choisi.couche]: 1 } : couches;
    return rayonsX ? { ...c, muscle: c.muscle ? 0.28 : 0, tendon: c.tendon ? 0.4 : 0 } : c;
  }, [couches, rayonsX, choisi]);

  useEffect(() => {
    stage.regler({
      couches: vraiesCouches,
      profondeur: profondeurVue,
      etats,
      isoler: isole && choisi ? [choisi.id, ...liees(choisi).map((x) => x.id)] : null,
      rotation: !choisi,
      etiquette: survole ? { id: survole.element, texte: PAR_ID.get(survole.element)?.nom ?? "" } : choisi ? { id: choisi.id, texte: choisi.nom } : null,
      retrait: false,
    });
  }, [stage, vraiesCouches, profondeurVue, etats, isole, choisi, survole]);

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

  const trouves = useMemo(() => {
    const r = normaliser(differee);
    if (r.length < 2) return [];
    return ELEMENTS.filter((x) => [x.nom, x.latin, x.anglais, ...(x.noms ?? [])].some((n) => normaliser(n).includes(r))).slice(0, 8);
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
        <>
          <Cartel
            e={choisi}
            latin={e.profil.latin}
            actions={
              <>
                <button type="button" className="ec-bouton" aria-pressed={isole} onClick={() => setIsole((v) => !v)}>
                  <Focus size={15} aria-hidden="true" /> {isole ? "Tout montrer" : "Isoler"}
                </button>
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
              <h3 className="ec-section-titre">{choisi.couche === "os" ? "S'articule avec" : choisi.couche === "artere" ? "Son arbre" : "Liée à"}</h3>
              <div className="ec-boutons">
                {liees(choisi).map((x) => (
                  <button key={x.id} type="button" className="ec-puce" onClick={() => choisir(x.id)}>
                    {x.nom}
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <Parcourir couches={couches} choisir={choisir} />
      )}
    </div>
  );
}

/** Toutes les structures, rangées par grande région puis par région. */
function Parcourir({ couches, choisir }: { couches: Couches; choisir: (id: string) => void }) {
  const [ouverte, setOuverte] = useState<string>("membre-sup");
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
            {regions.map((r) => {
              const l = liste.filter((x) => x.region === r.id);
              if (!l.length) return null;
              return (
                <div key={r.id} className="ec-parcourir-region">
                  <h4>{nomRegion(r.id)}</h4>
                  <div className="ec-boutons">
                    {l.map((x) => (
                      <button key={x.id} type="button" className="ec-puce" data-couche={x.couche} onClick={() => choisir(x.id)}>
                        {x.nom}
                      </button>
                    ))}
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
