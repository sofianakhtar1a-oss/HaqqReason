"use client";

import { Heart, Star, Volume2 } from "lucide-react";
import { PAR_ID, nomDe } from "@/lib/corps/catalogue";
import { nomRegion, nomSorte } from "@/lib/corps/quiz";
import type { Couche, Element, StructureScene } from "@/lib/corps/types";
import type { EtatStructure } from "./moteur/Corps3D";
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
export const COUCHES_DEFAUT: Couches = { os: 1, muscle: 1, tendon: 1, artere: 0 };

/** Ce qu'il faut montrer pour voir (ou chercher) une structure : sa couche pleine, le reste en retrait. */
export function miseEnScene(e: Element, structures: StructureScene[] = []): { couches: Couches; profondeur: number } {
  const prof = structures.length ? Math.min(...structures.map((s) => s.profondeur)) : 0;
  switch (e.couche) {
    case "os":
      return { couches: { os: 1, muscle: 0, tendon: 0, artere: 0 }, profondeur: 0 };
    case "muscle":
      return { couches: { os: 1, muscle: 1, tendon: 1, artere: 0 }, profondeur: prof };
    case "tendon":
      return { couches: { os: 1, muscle: 0.3, tendon: 1, artere: 0 }, profondeur: 0 };
    case "artere":
      return { couches: { os: 0.45, muscle: 0.1, tendon: 0.08, artere: 1 }, profondeur: 0 };
  }
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

const NOM_COUCHE: Record<Couche, string> = { os: "Os", muscle: "Muscle", tendon: "Tendon", artere: "Artère" };

/** Le cartel d'une structure : comme l'étiquette d'une pièce de musée, puis tout ce qu'il faut savoir. */
export function Cartel({ e, complet = true, latin = true, actions }: { e: Element; complet?: boolean; latin?: boolean; actions?: React.ReactNode }) {
  const lignes: [string, React.ReactNode][] = [];
  if (e.couche === "muscle") {
    if (e.origine) lignes.push(["Origine", e.origine]);
    if (e.terminaison) lignes.push(["Terminaison", e.terminaison]);
    if (e.action) lignes.push(["Action", e.action]);
    if (e.innervation) lignes.push(["Innervation", e.innervation]);
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
  return (
    <article className="ec-cartel" data-couche={e.couche}>
      <header>
        <p className="ec-cartel-sur">
          {NOM_COUCHE[e.couche]} · {nomRegion(e.region)}
          {e.nombre ? ` · ${e.nombre} en tout` : e.pair ? " · un de chaque côté" : ""}
        </p>
        <h3 className="ec-cartel-nom">
          {e.nom}
          <button type="button" className="ec-ecouter" onClick={() => dire(e.nom, true)} aria-label={`Écouter : ${e.nom}`}>
            <Volume2 size={15} aria-hidden="true" />
          </button>
        </h3>
        {latin && (
          <p className="ec-cartel-latin" lang="la">
            {e.latin}
            <span lang="en"> · {e.anglais}</span>
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
