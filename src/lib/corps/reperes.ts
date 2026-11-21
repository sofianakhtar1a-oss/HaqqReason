"use client";

/*
 * L'Écorché — les repères : les points nommés que l'atlas pose sur ses structures (les reliefs d'un os, le
 * tubercule majeur de l'humérus, une partie d'organe). Chacun a sa place dans le corps et sa structure porteuse ;
 * on les cherche par leur nom et on les montre d'un point sur le corps. Le fichier ne se télécharge qu'au
 * premier besoin (une recherche, une structure choisie qui en porte).
 */
import { useEffect, useState } from "react";
import { normaliser } from "./texte";
import type { V3 } from "./vec";

export type Repere = {
  /** Identifiant stable, unique. */
  cle: string;
  nom: string;
  latin: string;
  anglais: string;
  /** La place dans le corps (mètres ; x vers la gauche du sujet, y vers le haut, z vers l'avant). */
  p: V3;
  /** La structure qui le porte. */
  sur: string | null;
  /** Un relief (une saillie qu'on sent ou qu'on voit) plutôt qu'une simple partie nommée. */
  relief: boolean;
  ta2?: string;
};

export type Reperes = { liste: Repere[]; parCle: Map<string, Repere>; parStructure: Map<string, Repere[]> };

let pret: Reperes | null = null;
let enCours: Promise<Reperes> | null = null;

export function chargerReperes(): Promise<Reperes> {
  if (pret) return Promise.resolve(pret);
  if (!enCours) {
    enCours = import("./modele/reperes.json").then((m) => {
      // Un relief nommé des deux côtés (le tubercule majeur gauche et le droit) : un seul repère par structure.
      const vus = new Set<string>();
      const liste = (m.default as unknown as Repere[]).filter((r) => {
        const k = `${r.sur}|${r.nom}`;
        if (!r.sur || vus.has(k)) return false;
        vus.add(k);
        return true;
      });
      const parStructure = new Map<string, Repere[]>();
      for (const r of liste) {
        const l = parStructure.get(r.sur!) ?? [];
        l.push(r);
        parStructure.set(r.sur!, l);
      }
      for (const l of parStructure.values()) l.sort((a, b) => Number(b.relief) - Number(a.relief) || a.nom.localeCompare(b.nom, "fr"));
      pret = { liste, parCle: new Map(liste.map((r) => [r.cle, r])), parStructure };
      return pret;
    });
    // Un réseau qui manque : on réessaiera à la prochaine demande.
    enCours.catch(() => {
      enCours = null;
    });
  }
  return enCours;
}

/** Les repères, une fois chargés (null avant) ; `demander` lance le téléchargement. */
export function useReperes(demander: boolean): Reperes | null {
  const [r, setR] = useState<Reperes | null>(pret);
  useEffect(() => {
    if (!demander || r) return;
    let vivant = true;
    chargerReperes().then(
      (x) => vivant && setR(x),
      () => undefined,
    );
    return () => {
      vivant = false;
    };
  }, [demander, r]);
  return r;
}

/** Les repères dont le nom (français, latin ou anglais) répond à une recherche, les mieux notés d'abord. */
export function chercherReperes(r: Reperes, recherche: string, max = 6): Repere[] {
  const q = normaliser(recherche);
  if (q.length < 3) return [];
  const notes: [number, Repere][] = [];
  for (const x of r.liste) {
    let note = 0;
    for (const n of [x.nom, x.latin, x.anglais]) {
      const v = normaliser(n);
      if (v.startsWith(q)) note = Math.max(note, 3);
      else if (v.includes(` ${q}`)) note = Math.max(note, 2);
      else if (v.includes(q)) note = Math.max(note, 1);
    }
    if (note) notes.push([note * 10 + (x.relief ? 1 : 0), x]);
  }
  return notes
    .sort((a, b) => b[0] - a[0] || a[1].nom.localeCompare(b[1].nom, "fr"))
    .slice(0, max)
    .map(([, x]) => x);
}
