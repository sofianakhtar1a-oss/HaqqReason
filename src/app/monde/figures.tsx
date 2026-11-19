"use client";

import { geoAzimuthalEqualArea, geoEqualEarth, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useMemo } from "react";
import { pays as paysDe, urlDrapeau } from "@/lib/monde/atlas";
import type { ContinentId } from "@/lib/monde/types";
import { type Carte, useCarte } from "./carte";

/*
 * Les petites figures du Portulan : un drapeau (sans rien qui trahisse la réponse),
 * la silhouette d'un pays, et une mini-carte du monde où un continent s'allume.
 */

/** Un drapeau. Le texte de remplacement ne nomme pas le pays quand il est la question. */
export function Drapeau({ code, nomme = true, className, grand = false }: { code: string; nomme?: boolean; className?: string; grand?: boolean }) {
  const p = paysDe(code);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={urlDrapeau(p)}
      alt={nomme ? `Drapeau : ${p.nom}` : "Drapeau à reconnaître"}
      className={`pt-drapeau ${className ?? ""}`}
      data-grand={grand || undefined}
      draggable={false}
      decoding="async"
      loading={grand ? "eager" : "lazy"}
    />
  );
}

/* ---------- La silhouette d'un pays ---------- */

const silhouettes = new Map<string, string>();

function dessinSilhouette(carte: Carte, code: string): string | null {
  const cle = `${code}`;
  const deja = silhouettes.get(cle);
  if (deja) return deja;
  const forme = carte.parCode.get(code);
  if (!forme) return null;
  // Une projection centrée sur le pays : sa vraie forme, sans l'étirement des cartes du monde.
  const proj = geoAzimuthalEqualArea()
    .rotate([-forme.centre[0], -forme.centre[1]])
    .fitExtent(
      [
        [8, 8],
        [232, 232],
      ],
      forme.f,
    );
  const d = geoPath(proj)(forme.f) ?? "";
  silhouettes.set(cle, d);
  return d;
}

export function Silhouette({ code, className }: { code: string; className?: string }) {
  const { detail, leger, ultra } = useCarte();
  const carte = detail ?? leger ?? ultra;
  const d = useMemo(() => (carte ? dessinSilhouette(carte, code) : null), [carte, code]);
  return (
    <svg viewBox="0 0 240 240" className={`pt-silhouette ${className ?? ""}`} role="img" aria-label="Silhouette d'un pays à reconnaître">
      <defs>
        <radialGradient id={`pt-sil-${code}`} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="var(--pt-silhouette-haut)" />
          <stop offset="100%" stopColor="var(--pt-silhouette-bas)" />
        </radialGradient>
      </defs>
      {d ? <path d={d} fill={`url(#pt-sil-${code})`} className="pt-silhouette-forme" /> : <circle cx="120" cy="120" r="40" className="pt-silhouette-attente" />}
    </svg>
  );
}

/* ---------- Une mini-carte du monde, un continent allumé ---------- */

const minis = new Map<string, { terre: string; continents: Map<string, string> }>();

function dessinsMonde(carte: Carte) {
  const cle = String(carte.formes.length);
  const deja = minis.get(cle);
  if (deja) return deja;
  const proj = geoEqualEarth().fitExtent(
    [
      [2, 2],
      [198, 98],
    ],
    { type: "Sphere" },
  );
  const chemin = geoPath(proj);
  const tout: FeatureCollection<Geometry> = { type: "FeatureCollection", features: carte.formes.filter((f) => f.code !== "aq").map((f) => f.f) };
  const parContinent = new Map<string, Feature<Geometry>[]>();
  for (const f of carte.formes) {
    if (f.code === "aq") continue;
    const c = paysDe(f.code).continent;
    const liste = parContinent.get(c) ?? [];
    liste.push(f.f);
    parContinent.set(c, liste);
  }
  const continents = new Map<string, string>();
  for (const [c, fs] of parContinent) continents.set(c, chemin({ type: "FeatureCollection", features: fs }) ?? "");
  const r = { terre: chemin(tout) ?? "", continents };
  minis.set(cle, r);
  return r;
}

export function MiniContinent({ continent, className }: { continent: ContinentId; className?: string }) {
  const { ultra, leger } = useCarte();
  const carte = ultra ?? leger;
  const d = useMemo(() => (carte ? dessinsMonde(carte) : null), [carte]);
  return (
    <svg viewBox="0 0 200 100" className={`pt-mini ${className ?? ""}`} aria-hidden="true">
      {d && (
        <>
          <path d={d.terre} className="pt-mini-terre" />
          <path d={d.continents.get(continent) ?? ""} className="pt-mini-continent" />
        </>
      )}
    </svg>
  );
}
