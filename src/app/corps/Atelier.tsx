"use client";

import { Activity, Blend, HeartPulse, Move3d, RotateCcw, Scissors, Shuffle, Slice, Wind } from "lucide-react";
import { useMemo, useState } from "react";
import { DDL, type Ddl, NOMS_ARTICULATIONS, NOMS_MOUVEMENTS } from "@/lib/corps/mouvement/articulations";
import { type Pose, pointMesure } from "@/lib/corps/mouvement/squelette";
import type { Coupe } from "./moteur/Corps3D";

/*
 * L'atelier : ce qu'on fait au corps plutôt qu'à une structure. Le faire bouger articulation par articulation,
 * le couper par un plan, l'éclater, en ôter des pièces au scalpel, faire battre son cœur et respirer sa poitrine.
 */

export type Outil = "bouger" | "couper" | "eclater";
export type EtatAtelier = {
  outil: Outil | null;
  pose: Pose;
  coupe: Coupe | null;
  eclate: number;
  scalpel: boolean;
  /** Les structures ôtées au scalpel (identifiants d'éléments). */
  otees: string[];
  coeur: boolean;
  souffle: boolean;
};
export const ATELIER_DEFAUT: EtatAtelier = { outil: null, pose: {}, coupe: null, eclate: 0, scalpel: false, otees: [], coeur: false, souffle: false };

/** Les articulations qu'on peut manier, par région, dans l'ordre où on les cherche. */
const REGIONS: [string, string[]][] = [
  ["Tête et cou", ["temporo-mandibulaire", "tete", "rachis-cervical", "os-hyoide", "oeil"]],
  ["Tronc", ["rachis-thoracique", "rachis-lombaire", "respiration"]],
  ["Membre supérieur", ["scapula", "epaule", "coude", "radio-ulnaire", "poignet", "pouce-cmc", "pouce-mcp", "pouce-ip", "doigts-mcp", "doigts-ipp", "doigts-ipd"]],
  ["Membre inférieur", ["hanche", "genou", "cheville", "subtalaire", "hallux-mtp", "hallux-ip", "orteils-mtp", "orteils-ip"]],
];

/** Quelques poses toutes faites (les angles sont ceux des degrés de liberté, en degrés). */
const des2 = (o: Record<string, number>): Pose => Object.fromEntries(Object.entries(o).flatMap(([k, v]) => [[`${k}:g`, v], [`${k}:d`, v]]));
const doigts = (mcp: number, ipp: number, ipd: number) => Object.fromEntries(["index", "majeur", "annulaire", "auriculaire"].flatMap((d) => [[`${d}.mcp`, mcp], [`${d}.ipp`, ipp], [`${d}.ipd`, ipd]]));
export const POSES: { nom: string; pose: Pose }[] = [
  { nom: "Position anatomique", pose: {} },
  { nom: "Bras levés", pose: des2({ "epaule.flexion": 165, "coude.flexion": 10 }) },
  { nom: "Poings fermés", pose: des2({ ...doigts(85, 100, 60), "pouce.mcp": 45, "pouce.ip": 60, "pouce.cmc-flexion": 20, "avant-bras.pronation": 70 }) },
  { nom: "Pas de marche", pose: { "hanche.flexion:g": 28, "genou.flexion:g": 12, "cheville.flexion:g": 8, "hanche.flexion:d": -12, "genou.flexion:d": 20, "cheville.flexion:d": -15, "epaule.flexion:d": 22, "epaule.flexion:g": -18, "coude.flexion:d": 25, "coude.flexion:g": 10, "avant-bras.pronation:g": 80, "avant-bras.pronation:d": 80, "thoracique.rotation": 6 } },
  { nom: "Accroupi", pose: { ...des2({ "hanche.flexion": 115, "genou.flexion": 135, "cheville.flexion": 18, "epaule.flexion": 70, "coude.flexion": 30, "avant-bras.pronation": 90 }), "lombaire.flexion": 30, "thoracique.flexion": 15, "cervical.flexion": -15 } },
  { nom: "Le penseur", pose: { ...des2({ "hanche.flexion": 90, "genou.flexion": 95 }), "epaule.flexion:d": 35, "coude.flexion:d": 140, "avant-bras.pronation:d": 60, "poignet.flexion:d": 40, ...Object.fromEntries(Object.entries(doigts(60, 70, 30)).map(([k, v]) => [`${k}:d`, v])), "lombaire.flexion": 35, "thoracique.flexion": 30, "cervical.flexion": 25, "tete.flexion": 10, "epaule.flexion:g": 25, "coude.flexion:g": 60 } },
];

/** Les curseurs d'une articulation : un par degré de liberté ; les doigts (ou les orteils) d'une même articulation bougent ensemble. */
function curseurs(articulation: string): { cle: string; ddl: Ddl[] }[] {
  const groupes = new Map<string, Ddl[]>();
  for (const d of DDL) {
    if (d.articulation !== articulation) continue;
    const doigt = /^(index|majeur|annulaire|auriculaire|orteil\d)\.(.+)$/.exec(d.id);
    const k = doigt ? `doigts.${doigt[2]}` : d.id;
    groupes.set(k, [...(groupes.get(k) ?? []), d]);
  }
  return [...groupes.entries()].map(([cle, ddl]) => ({ cle, ddl }));
}

const nomMvt = (m: string) => (NOMS_MOUVEMENTS[m] ?? m).toLowerCase();

/** Où passe une coupe horizontale : le niveau vertébral le plus proche, ou la région du membre. */
const NIVEAUX = ["c3", "c4", "c5", "c6", "c7", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8", "t9", "t10", "t11", "t12", "l1", "l2", "l3", "l4", "l5"].map((s) => [s.toUpperCase(), pointMesure(s)[1]] as const);
function niveauAxial(y: number): string {
  const tete = pointMesure("tete")[1];
  const hanche = pointMesure("femur")[1];
  const genou = pointMesure("jambe")[1];
  const cheville = pointMesure("talus")[1];
  if (y > tete + 0.02) return "la tête";
  if (y > NIVEAUX[0][1] + 0.02) return "le haut du cou";
  if (y < hanche - 0.04) return y > genou + 0.04 ? "la cuisse" : y > genou - 0.04 ? "le genou" : y > cheville + 0.03 ? "la jambe" : "la cheville et le pied";
  if (y < NIVEAUX[NIVEAUX.length - 1][1] - 0.03) return "le bassin";
  let meilleur = NIVEAUX[0];
  for (const n of NIVEAUX) if (Math.abs(n[1] - y) < Math.abs(meilleur[1] - y)) meilleur = n;
  return `la vertèbre ${meilleur[0]}`;
}
const BORNES: Record<Coupe["plan"], [number, number, number]> = { axial: [0.03, 1.74, 1.22], sagittal: [-0.3, 0.3, 0], frontal: [-0.16, 0.18, 0.02] };

export function Atelier({ etat, regler, calme, surprendre }: { etat: EtatAtelier; regler: (e: Partial<EtatAtelier>) => void; calme: boolean; surprendre: () => void }) {
  const [articulation, setArticulation] = useState("coude");
  const [cote, setCote] = useState<"g" | "d" | "deux">("g");
  const liste = useMemo(() => curseurs(articulation), [articulation]);
  const lateral = liste.some((c) => c.ddl[0].lateral);
  const basculer = (o: Outil) => regler({ outil: etat.outil === o ? null : o });

  const valeur = (ddl: Ddl[]) => {
    const d = ddl[0];
    const cle = d.lateral ? `${d.id}:${cote === "d" ? "d" : "g"}` : d.id;
    return etat.pose[cle] ?? 0;
  };
  const changer = (ddl: Ddl[], v: number) => {
    const pose = { ...etat.pose };
    for (const d of ddl) {
      const x = Math.min(d.max, Math.max(d.min, v));
      const cles = d.lateral ? (cote === "deux" ? [`${d.id}:g`, `${d.id}:d`] : [`${d.id}:${cote}`]) : [d.id];
      for (const k of cles) {
        if (x) pose[k] = x;
        else delete pose[k];
      }
    }
    regler({ pose });
  };

  const c = etat.coupe;
  return (
    <section className="ec-atelier" aria-label="L'atelier">
      <div className="ec-atelier-outils">
        <button type="button" className="ec-bascule" aria-pressed={etat.outil === "bouger"} aria-expanded={etat.outil === "bouger"} onClick={() => basculer("bouger")}>
          <Move3d size={15} aria-hidden="true" /> Bouger
        </button>
        <button type="button" className="ec-bascule" aria-pressed={etat.outil === "couper" || Boolean(c)} aria-expanded={etat.outil === "couper"} onClick={() => basculer("couper")}>
          <Slice size={15} aria-hidden="true" /> Couper
        </button>
        <button type="button" className="ec-bascule" aria-pressed={etat.outil === "eclater" || etat.eclate > 0} aria-expanded={etat.outil === "eclater"} onClick={() => basculer("eclater")}>
          <Blend size={15} aria-hidden="true" /> Éclater
        </button>
        <button type="button" className="ec-bascule" aria-pressed={etat.scalpel} onClick={() => regler({ scalpel: !etat.scalpel })} title="Saisis une structure et tire-la hors du corps pour l'ôter.">
          <Scissors size={15} aria-hidden="true" /> Scalpel
        </button>
        <button type="button" className="ec-bascule" aria-pressed={etat.coeur} onClick={() => regler({ coeur: !etat.coeur })} title="Le cœur bat et l'onde du pouls court dans les artères.">
          <HeartPulse size={15} aria-hidden="true" /> Cœur
        </button>
        <button type="button" className="ec-bascule" aria-pressed={etat.souffle} onClick={() => regler({ souffle: !etat.souffle })} title="La poitrine se soulève : les côtes tournent autour de leur col, les poumons se gonflent.">
          <Wind size={15} aria-hidden="true" /> Souffle
        </button>
        <button type="button" className="ec-bascule" onClick={surprendre} title="Un muscle au hasard, et ce qu'il fait.">
          <Shuffle size={15} aria-hidden="true" /> Surprends-moi
        </button>
      </div>

      {(etat.coeur || etat.souffle) && calme && <p className="ec-note">Ton appareil demande moins d’animations : le cœur et la poitrine restent immobiles, à mi-course.</p>}
      {etat.coeur && !calme && <p className="ec-note">Soixante battements par minute : les oreillettes, puis les ventricules. L’onde du pouls file à six mètres par seconde : elle touche le poignet un dixième de seconde après le cou.</p>}
      {etat.scalpel && (
        <p className="ec-note">
          Saisis une structure et tire-la hors du corps : elle s’en va. {etat.otees.length > 0 && `${etat.otees.length} ôtée${etat.otees.length > 1 ? "s" : ""}. `}
          {etat.otees.length > 0 && (
            <button type="button" className="ec-lien" onClick={() => regler({ otees: [] })}>
              Tout remettre
            </button>
          )}
        </p>
      )}

      {etat.outil === "bouger" && (
        <div className="ec-atelier-panneau">
          <div className="ec-atelier-ligne">
            <label className="ec-champ">
              <span>Articulation</span>
              <select value={articulation} onChange={(ev) => setArticulation(ev.target.value)}>
                {REGIONS.map(([r, l]) => (
                  <optgroup key={r} label={r}>
                    {l.map((a) => (
                      <option key={a} value={a}>
                        {NOMS_ARTICULATIONS[a] ?? a}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            {lateral && (
              <div className="ec-segment" role="radiogroup" aria-label="Le côté">
                {(
                  [
                    ["g", "Gauche"],
                    ["d", "Droite"],
                    ["deux", "Les deux"],
                  ] as const
                ).map(([v, n]) => (
                  <button key={v} type="button" role="radio" aria-checked={cote === v} onClick={() => setCote(v)}>
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
          {liste.map(({ cle, ddl }) => {
            const d = ddl[0];
            const v = valeur(ddl);
            const sens = v < 0 ? d.moins : v > 0 ? d.plus : null;
            // Un mouvement qui porte le même nom dans les deux sens (l'inclinaison, la rotation) : on dit de quel côté.
            const deuxCotes = d.moins === d.plus && d.min < 0;
            const N = (m: string) => NOMS_MOUVEMENTS[m] ?? m;
            const aGauche = deuxCotes ? `${N(d.moins)} à droite` : d.moins === d.plus ? "Repos" : N(d.moins);
            const aDroite = deuxCotes ? `${N(d.plus)} à gauche` : N(d.plus);
            const mesure = d.unite === "" ? `${Math.round(Math.abs(v) * 100)} %` : `${Math.round(Math.abs(v))}${d.unite === "mm" ? " mm" : "°"}`;
            const texte = sens ? `${mesure} de ${nomMvt(sens)}${deuxCotes ? (v > 0 ? " vers la gauche" : " vers la droite") : ""}` : "au repos";
            return (
              <label key={cle} className="ec-curseur">
                <span className="ec-curseur-noms">
                  <span>{aGauche}</span>
                  <output>{texte}</output>
                  <span>{aDroite}</span>
                </span>
                <input
                  type="range"
                  style={{ "--zero": `${(100 * (0 - d.min)) / (d.max - d.min)}%` } as React.CSSProperties}
                  min={d.min}
                  max={d.max}
                  step={d.unite === "" ? 0.02 : 1}
                  value={v}
                  aria-valuetext={texte}
                  aria-label={`${NOMS_ARTICULATIONS[articulation] ?? articulation} : ${nomMvt(d.moins)} ou ${nomMvt(d.plus)}`}
                  onChange={(ev) => changer(ddl, Number(ev.target.value))}
                />
              </label>
            );
          })}
          <div className="ec-boutons">
            {POSES.map((p) => (
              <button key={p.nom} type="button" className="ec-puce" onClick={() => regler({ pose: p.pose })}>
                {p.nom === "Position anatomique" && <RotateCcw size={12} aria-hidden="true" />} {p.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      {etat.outil === "couper" && (
        <div className="ec-atelier-panneau">
          <div className="ec-segment" role="radiogroup" aria-label="Le plan de coupe">
            {(
              [
                [null, "Aucun"],
                ["axial", "Axial"],
                ["sagittal", "Sagittal"],
                ["frontal", "Frontal"],
              ] as const
            ).map(([plan, n]) => (
              <button key={n} type="button" role="radio" aria-checked={(c?.plan ?? null) === plan} onClick={() => regler({ coupe: plan ? { plan, position: c?.plan === plan ? c.position : BORNES[plan][2], inverse: c?.inverse } : null })}>
                {n}
              </button>
            ))}
          </div>
          {c && (
            <>
              <label className="ec-curseur">
                <span className="ec-curseur-noms">
                  <span>{c.plan === "axial" ? "Bas" : c.plan === "sagittal" ? "Droite" : "Arrière"}</span>
                  <output>{c.plan === "axial" ? `À hauteur de ${niveauAxial(c.position)}` : c.plan === "sagittal" ? (Math.abs(c.position) < 0.008 ? "Sur la ligne médiane" : `À ${Math.round(Math.abs(c.position) * 100)} cm ${c.position > 0 ? "à gauche" : "à droite"}`) : `${Math.round(Math.abs(c.position) * 100)} cm ${c.position >= 0 ? "en avant" : "en arrière"}`}</output>
                  <span>{c.plan === "axial" ? "Haut" : c.plan === "sagittal" ? "Gauche" : "Avant"}</span>
                </span>
                <input type="range" min={BORNES[c.plan][0]} max={BORNES[c.plan][1]} step={0.002} value={c.position} aria-label="La position du plan de coupe" onChange={(ev) => regler({ coupe: { ...c, position: Number(ev.target.value) } })} />
              </label>
              <button type="button" className="ec-bascule" aria-pressed={Boolean(c.inverse)} onClick={() => regler({ coupe: { ...c, inverse: !c.inverse } })}>
                <Activity size={15} aria-hidden="true" /> Garder l’autre moitié
              </button>
            </>
          )}
        </div>
      )}

      {etat.outil === "eclater" && (
        <div className="ec-atelier-panneau">
          <label className="ec-curseur">
            <span className="ec-curseur-noms">
              <span>Assemblé</span>
              <output>{etat.eclate > 0 ? `${Math.round(etat.eclate * 100)} %` : "Assemblé"}</output>
              <span>Éclaté</span>
            </span>
            <input type="range" min={0} max={1} step={0.01} value={etat.eclate} aria-label="Écarter les pièces les unes des autres" onChange={(ev) => regler({ eclate: Number(ev.target.value) })} />
          </label>
          <p className="ec-note">Chaque pièce s’écarte du centre de ce que tu regardes : isole une structure pour éclater sa seule région.</p>
        </div>
      )}
    </section>
  );
}
