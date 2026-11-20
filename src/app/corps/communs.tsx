"use client";

import { Heart, Star, Volume2 } from "lucide-react";
import { NOMS_NATURES, PAR_ID, nomDe } from "@/lib/corps/catalogue";
import { calqueDElement } from "@/lib/corps/modele/modele";
import { nomRegion, nomSorte } from "@/lib/corps/quiz";
import type { Couche, Element } from "@/lib/corps/types";
import type { CalqueOptionnel, EtatStructure } from "./moteur/Corps3D";
import { dire } from "./sons";

/* ---------- Les teintes de la scène ---------- */

export const TEINTE: Record<"laiton" | "juste" | "faux" | "choisi" | "voisin", [number, number, number, number]> = {
  laiton: [236, 182, 92, 175],
  juste: [96, 214, 150, 185],
  faux: [235, 76, 66, 190],
  choisi: [244, 206, 120, 150],
  voisin: [150, 196, 210, 120],
};

/** La couleur de la mémoire d'une structure (boîte 0 à 5) : du rouge de l'oubli au vert du su. */
export function teinteMemoire(boite: number | undefined): [number, number, number, number] {
  if (boite === undefined) return [70, 78, 84, 150];
  const t = Math.min(5, boite) / 5;
  const r = Math.round(232 - t * 150);
  const g = Math.round(84 + t * 130);
  const b = Math.round(70 + t * 60);
  return [r, g, b, 200];
}

export type Couches = Record<Couche, number>;
export type Calques = Partial<Record<CalqueOptionnel, number>>;
const AUCUNE: Couches = { os: 0, muscle: 0, tendon: 0, ligament: 0, artere: 0, veine: 0, nerf: 0, viscere: 0, encephale: 0, lymphe: 0 };
/** Des couches à partir de celles qu'on montre : les autres restent éteintes. */
export const couches = (c: Partial<Couches> = {}): Couches => ({ ...AUCUNE, ...c });
export const COUCHES_DEFAUT: Couches = couches({ os: 1, muscle: 1, tendon: 1 });
const OPTIONNELS: readonly string[] = ["fascia", "gaine", "bourse", "enveloppe"];

/** Ce qu'il faut montrer pour étudier une couche : elle, pleine, et ce qui la situe, en retrait. */
export function couchesPour(couche: Couche): Couches {
  switch (couche) {
    case "os":
      return couches({ os: 1 });
    case "muscle":
      return couches({ os: 1, muscle: 1, tendon: 1 });
    case "tendon":
      return couches({ os: 1, muscle: 0.3, tendon: 1 });
    case "ligament":
      return couches({ os: 1, ligament: 1 });
    case "artere":
      return couches({ os: 0.45, muscle: 0.1, tendon: 0.08, artere: 1 });
    case "veine":
      return couches({ os: 0.45, muscle: 0.1, tendon: 0.08, veine: 1 });
    case "nerf":
      return couches({ os: 0.45, muscle: 0.1, tendon: 0.08, nerf: 1 });
    case "viscere":
      return couches({ os: 0.22, viscere: 1 });
    case "encephale":
      return couches({ os: 0.14, encephale: 1 });
    case "lymphe":
      return couches({ os: 0.4, veine: 0.3, lymphe: 1 });
  }
}

/** Ce qu'il faut montrer pour voir (ou chercher) une structure : sa couche pleine, le reste en retrait. */
export function miseEnScene(e: Element): { couches: Couches; calques: Calques; profondeur: number; decouvrir: string[] | null } {
  const calque = calqueDElement(e.id);
  const calques: Calques = OPTIONNELS.includes(calque) ? { [calque]: 1 } : {};
  // Un fascia couvre les muscles : on les garde pleins dessous.
  if (calque === "fascia") return { couches: couches({ os: 1, muscle: 1, tendon: 1 }), calques, profondeur: 0, decouvrir: null };
  // Un muscle ou un tendon profond : on ôte ce qui le couvre, et rien d'autre.
  return { couches: couchesPour(e.couche), calques, profondeur: 0, decouvrir: e.couche === "muscle" || e.couche === "tendon" ? [e.id] : null };
}

export const enLumiere = (ids: string[], teinte = TEINTE.laiton, pulse = true): Record<string, EtatStructure> => Object.fromEntries(ids.map((id) => [id, { teinte, pulse }]));

/* ---------- Petits objets ---------- */

const ROMAINS: [number, string][] = [
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];
/** Les planches d'un atlas se numérotent en chiffres romains. */
export function romain(n: number): string {
  let s = "";
  for (const [v, l] of ROMAINS)
    while (n >= v) {
      s += l;
      n -= v;
    }
  return s;
}

export function Etoiles({ n, sur = 3, taille = 14 }: { n: number; sur?: number; taille?: number }) {
  return (
    <span className="ec-etoiles" aria-label={`${n} étoile${n > 1 ? "s" : ""} sur ${sur}`}>
      {Array.from({ length: sur }, (_, i) => (
        <Star key={i} size={taille} className={i < n ? "est-pleine" : ""} aria-hidden="true" />
      ))}
    </span>
  );
}

export function Coeurs({ n, sur = 3 }: { n: number; sur?: number }) {
  return (
    <span className="ec-coeurs" aria-label={`${n} vie${n > 1 ? "s" : ""} sur ${sur}`}>
      {Array.from({ length: sur }, (_, i) => (
        <Heart key={i} size={16} className={i < n ? "est-pleine" : ""} aria-hidden="true" />
      ))}
    </span>
  );
}

const NOM_COUCHE: Record<Couche, string> = { os: "Os", muscle: "Muscle", tendon: "Tendon", ligament: "Ligament", artere: "Artère", veine: "Veine", nerf: "Nerf", viscere: "Viscère", encephale: "Encéphale", lymphe: "Système lymphatique" };
const PROFONDEURS = ["Superficiel", "Intermédiaire", "Profond"];
const liste = (ids: string[] | undefined) => (ids ?? []).map((id) => nomDe(id)).join(", ");

/** Le cartel d'une structure : comme l'étiquette d'une pièce de musée, puis tout ce qu'il faut savoir. */
export function Cartel({ e, complet = true, latin = true, actions }: { e: Element; complet?: boolean; latin?: boolean; actions?: React.ReactNode }) {
  const lignes: [string, React.ReactNode][] = [];
  if (e.couche === "muscle") {
    // La fiche rédigée d'abord ; à défaut, ce que l'atlas sait : les os où il s'attache, son nerf.
    if (e.origine) lignes.push(["Origine", e.origine]);
    else if (e.origines?.length) lignes.push(["Origine", liste(e.origines)]);
    if (e.terminaison) lignes.push(["Terminaison", e.terminaison]);
    else if (e.terminaisons?.length) lignes.push(["Terminaison", liste(e.terminaisons)]);
    if (e.action) lignes.push(["Action", e.action]);
    if (e.innervation) lignes.push(["Innervation", e.innervation]);
    else if (e.nerf) lignes.push(["Innervation", nomDe(e.nerf)]);
    if (e.loge) lignes.push(["Groupe", e.loge]);
    if (e.profondeur !== undefined) lignes.push(["Plan", PROFONDEURS[e.profondeur] ?? ""]);
    if (e.chefs) lignes.push(["Chefs", String(e.chefs)]);
  }
  if (e.couche === "os") {
    if (e.sorte) lignes.push(["Forme", nomSorte(e.sorte)]);
    if (e.articulations?.length) lignes.push(["S'articule avec", e.articulations.map((a) => nomDe(a)).join(", ")]);
  }
  if (e.couche === "tendon") {
    if (e.muscle) lignes.push(["Muscle", nomDe(e.muscle)]);
    if (e.attache) lignes.push(["Attache", e.attache]);
  }
  if (e.couche === "artere") {
    if (e.provenance) lignes.push(["Naît de", nomDe(e.provenance)]);
    if (e.territoire) lignes.push(["Irrigue", e.territoire]);
  }
  if (e.membres?.length) lignes.push(["Réunit", liste(e.membres)]);
  else if (e.ensemble) lignes.push(["Fait partie de", nomDe(e.ensemble)]);
  if (e.officiel && e.officiel !== e.nom && !e.zone) lignes.push(["Nom officiel", e.officiel]);
  if (e.ta2) lignes.push(["Terminologia Anatomica", `TA2 ${e.ta2}`]);
  const nature = e.nature ? NOMS_NATURES[e.nature] : undefined;
  return (
    <article className="ec-cartel" data-couche={e.couche}>
      <header>
        <p className="ec-cartel-sur">
          {nature ?? NOM_COUCHE[e.couche]} · {nomRegion(e.region)}
          {e.nombre ? ` · ${e.nombre} en tout` : e.pair ? " · un de chaque côté" : ""}
          {e.inconstant ? " · inconstant" : ""}
        </p>
        <h3 className="ec-cartel-nom">
          {e.nom}
          <button type="button" className="ec-ecouter" onClick={() => dire(e.nom, true)} aria-label={`Écouter : ${e.nom}`}>
            <Volume2 size={15} aria-hidden="true" />
          </button>
        </h3>
        {latin && (
          <p className="ec-cartel-latin" lang={e.genere ? "en" : "la"}>
            {e.genere ? e.anglais : e.latin}
            {!e.genere && <span lang="en"> · {e.anglais}</span>}
          </p>
        )}
        {e.noms && e.noms.length > 0 && <p className="ec-cartel-aussi">Aussi : {e.noms.slice(0, 4).join(", ")}</p>}
      </header>
      {complet && lignes.length > 0 && (
        <dl className="ec-cartel-lignes">
          {lignes.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {complet && (e.memo || e.anecdote) && (
        <div className="ec-cartel-notes">
          {e.memo && <p className="ec-memo">{e.memo}</p>}
          {e.anecdote && <p className="ec-anecdote">{e.anecdote}</p>}
        </div>
      )}
      {actions && <div className="ec-cartel-actions">{actions}</div>}
    </article>
  );
}

export const elementDe = (id: string | null | undefined): Element | undefined => (id ? PAR_ID.get(id) : undefined);

/** Un anneau de progression (l'objectif du jour). */
export function Anneau({ part, taille = 56, children }: { part: number; taille?: number; children?: React.ReactNode }) {
  const r = taille / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <span className="ec-anneau" style={{ width: taille, height: taille }}>
      <svg viewBox={`0 0 ${taille} ${taille}`} aria-hidden="true">
        <circle cx={taille / 2} cy={taille / 2} r={r} className="ec-anneau-fond" />
        <circle cx={taille / 2} cy={taille / 2} r={r} className="ec-anneau-plein" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, part)))} />
      </svg>
      <span className="ec-anneau-texte">{children}</span>
    </span>
  );
}
