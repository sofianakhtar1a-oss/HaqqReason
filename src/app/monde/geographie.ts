"use client";

import { geoCentroid, geoDistance } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { useEffect, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { GEOGRAPHIE_URL } from "@/lib/monde/geographie-donnees";

/*
 * La géographie physique de la carte (mers, lacs, fleuves, monts, sommets, déserts) et le point où
 * écrire le nom de chaque pays : un seul fichier, chargé la première fois qu'un calque en a besoin,
 * puis gardé pour tous les globes (scripts/monde/geographie.mjs).
 */

/** [nom, longitude, latitude, rang] : le rang dit à partir de quel zoom le nom s'écrit (0 : toujours). */
export type Nom = [string, number, number, number];
/** [nom, lon, lat, lon, lat, rang] : deux points du fleuve, pour écrire son nom dans son sens. */
export type NomFleuve = [string, number, number, number, number, number];
/** [lon, lat, niveau, taille] : un mont du relief ; le niveau dit à partir de quel zoom il paraît. */
export type Mont = [number, number, number, number];
/** [nom, lon, lat, altitude, rang]. */
export type Sommet = [string, number, number, number, number];

type Brut = {
  v: number;
  topo: Topology;
  mers: Nom[];
  lacs: Nom[];
  fleuves: NomFleuve[];
  chaines: Nom[];
  deserts: Nom[];
  monts: Mont[];
  sommets: Sommet[];
  pays: Record<string, [number, number, number]>;
};

/** Un tracé (un lac, un tronçon de fleuve), avec son centre et son rayon (en radians) : ce qui ne se voit pas ne se dessine pas. */
export type Trace = { f: Feature<Geometry>; centre: [number, number]; rayon: number; rang: number };

export type Geographie = {
  lacs: Trace[];
  /** Les tronçons de fleuves, des plus petits aux plus grands (rang 6 à 1) : les grands se dessinent par-dessus. */
  fleuves: Trace[];
  mers: Nom[];
  nomsLacs: Nom[];
  nomsFleuves: NomFleuve[];
  chaines: Nom[];
  deserts: Nom[];
  monts: Mont[];
  sommets: Sommet[];
  /** Où écrire le nom de chaque pays : [lon, lat, rayon du plus grand cercle intérieur en km]. */
  pays: Map<string, [number, number, number]>;
};

let promesse: Promise<Geographie> | null = null;
let prete: Geographie | null = null;

function rayonDe(f: Feature<Geometry>, centre: [number, number]): number {
  let r = 0;
  const parcourir = (c: unknown): void => {
    if (!Array.isArray(c)) return;
    if (typeof c[0] === "number") {
      const d = geoDistance(centre, c as [number, number]);
      if (d > r) r = d;
      return;
    }
    for (const x of c) parcourir(x);
  };
  const g = f.geometry;
  if (g && "coordinates" in g) parcourir(g.coordinates);
  return r;
}

function traces(b: Brut, objet: "lacs" | "fleuves"): Trace[] {
  const fc = feature(b.topo, b.topo.objects[objet] as GeometryCollection) as unknown as { features: Feature<Geometry, { r?: number } | null>[] };
  return fc.features
    .filter((f) => f.geometry)
    .map((f) => {
      const centre = geoCentroid(f) as [number, number];
      return { f, centre, rayon: rayonDe(f, centre), rang: f.properties?.r ?? 1 };
    });
}

function lire(b: Brut): Geographie {
  const fleuves = traces(b, "fleuves").sort((a, b) => b.rang - a.rang);
  return { lacs: traces(b, "lacs"), fleuves, mers: b.mers, nomsLacs: b.lacs, nomsFleuves: b.fleuves, chaines: b.chaines, deserts: b.deserts, monts: b.monts, sommets: b.sommets, pays: new Map(Object.entries(b.pays)) };
}

export function chargerGeographie(): Promise<Geographie> {
  promesse ??= fetch(GEOGRAPHIE_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Géographie indisponible (${r.status})`);
      return r.json() as Promise<Brut>;
    })
    .then((b) => (prete = lire(b)));
  promesse.catch(() => (promesse = null));
  return promesse;
}

/** La géographie, dès qu'elle est là (et seulement si on la demande). */
export function useGeographie(voulue: boolean): Geographie | null {
  const [g, setG] = useState<Geographie | null>(() => prete);
  useEffect(() => {
    if (!voulue || g) return;
    let vivant = true;
    chargerGeographie().then(
      (x) => vivant && setG(x),
      () => undefined,
    );
    return () => {
      vivant = false;
    };
  }, [voulue, g]);
  return voulue ? g : null;
}
