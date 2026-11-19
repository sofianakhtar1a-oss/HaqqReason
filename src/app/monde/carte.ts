"use client";

import { geoArea, geoCentroid, geoDistance } from "d3-geo";
import type { Feature, FeatureCollection, Geometry, MultiLineString, MultiPolygon } from "geojson";
import { useEffect, useState } from "react";
import { feature, merge, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { CARTE_LEGERE_URL, CARTE_ULTRA_URL, CARTE_URL } from "@/lib/monde/donnees";

/*
 * La carte du monde, chargée une fois puis gardée : trois versions du même TopoJSON (Natural Earth).
 * L'« ultra » fait tourner le globe entier, la légère sert dès qu'on s'en approche un peu, la
 * détaillée au repos et de près. Pour chaque pays, on retient son centre et son « rayon » (en
 * radians) : de quoi viser un pays, et ne dessiner que ce qui se voit.
 * Pour le globe vu en entier, les terres sont dessinées d'un seul tenant (toutes fusionnées) et les
 * frontières d'un seul trait : deux à quatre fois moins de travail qu'un dessin pays par pays.
 */

export type Forme = { code: string; f: Feature<Geometry>; centre: [number, number]; rayon: number; aire: number };
export type Carte = {
  formes: Forme[];
  parCode: Map<string, Forme>;
  /** Les terres sans pays (le glacier de Siachen) : dessinées, jamais désignées. */
  neutres: Feature<Geometry>[];
  frontieres: MultiLineString;
  /** Toutes les terres, d'un seul tenant. */
  terre: MultiPolygon;
  /** Un groupe de pays fusionné (les pays dorés, par exemple), gardé tant que le groupe ne change pas. */
  fusion: (codes: string[]) => MultiPolygon;
};

const promesses = new Map<string, Promise<Carte>>();
const pretes = new Map<string, Carte>();

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

function lire(topo: Topology): Carte {
  const objet = topo.objects.pays as GeometryCollection;
  const fc = feature(topo, objet) as FeatureCollection<Geometry>;
  const formes: Forme[] = [];
  const neutres: Feature<Geometry>[] = [];
  for (const f of fc.features) {
    if (!f.id) {
      neutres.push(f);
      continue;
    }
    const centre = geoCentroid(f) as [number, number];
    formes.push({ code: String(f.id), f, centre, rayon: rayonDe(f, centre), aire: geoArea(f) });
  }
  // Les grands d'abord : les petits se dessinent par-dessus et restent visibles.
  formes.sort((a, b) => b.aire - a.aire);
  const fusions = new Map<string, MultiPolygon>();
  const fusion = (codes: string[]) => {
    const cle = codes.slice().sort().join(",");
    let m = fusions.get(cle);
    if (!m) {
      const voulus = new Set(codes);
      m = merge(topo, objet.geometries.filter((g) => g.id !== undefined && voulus.has(String(g.id))) as Parameters<typeof merge>[1]);
      if (fusions.size > 12) fusions.clear();
      fusions.set(cle, m);
    }
    return m;
  };
  return {
    formes,
    parCode: new Map(formes.map((x) => [x.code, x])),
    neutres,
    frontieres: mesh(topo, objet, (a, b) => a !== b),
    terre: merge(topo, objet.geometries as Parameters<typeof merge>[1]),
    fusion,
  };
}

export type Version = "detail" | "leger" | "ultra";
const URLS: Record<Version, string> = { detail: CARTE_URL, leger: CARTE_LEGERE_URL, ultra: CARTE_ULTRA_URL };

export function chargerCarte(version: Version): Promise<Carte> {
  const url = URLS[version];
  let p = promesses.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`Carte indisponible (${r.status})`);
        return r.json() as Promise<Topology>;
      })
      .then((topo) => {
        const c = lire(topo);
        pretes.set(url, c);
        return c;
      });
    p.catch(() => promesses.delete(url));
    promesses.set(url, p);
  }
  return p;
}

export const carteSiPrete = (version: Version) => pretes.get(URLS[version]) ?? null;

/** L'ultra d'abord (elle arrive vite et fait tourner le globe), puis la légère, puis la détaillée. */
export function useCarte(): { ultra: Carte | null; leger: Carte | null; detail: Carte | null; erreur: boolean } {
  const [etat, setEtat] = useState(() => ({ ultra: carteSiPrete("ultra"), leger: carteSiPrete("leger"), detail: carteSiPrete("detail"), erreur: false }));
  useEffect(() => {
    let vivant = true;
    const prendre = (v: Version) => (c: Carte) => vivant && setEtat((e) => ({ ...e, [v]: c }));
    const echec = () => vivant && setEtat((e) => ({ ...e, erreur: true }));
    void (async () => {
      // L'une après l'autre : la première image arrive plus tôt, et le travail est étalé.
      if (!etat.ultra) await chargerCarte("ultra").then(prendre("ultra"), echec);
      if (!etat.leger) await chargerCarte("leger").then(prendre("leger"), () => undefined);
      if (!etat.detail) await chargerCarte("detail").then(prendre("detail"), () => undefined);
    })();
    return () => {
      vivant = false;
    };
    // Une seule fois par composant : les cartes chargées restent en mémoire pour tous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return etat;
}
