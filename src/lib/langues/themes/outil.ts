/*
 * Format compact des thèmes : une ligne par mot, champs séparés par « | » :
 *   anglais | français | nature | niveau | prononciation (API) | exemple anglais | exemple français
 * Natures : n (nom), v (verbe), adj, adv, expr, prep, pron, conj, det (déterminant).
 */
import { type Entree, type Nature, type Niveau, NIVEAUX, type Theme } from "../types";

const NATURES: Record<string, Nature> = { n: "nom", v: "verbe", adj: "adjectif", adv: "adverbe", expr: "expression", prep: "préposition", pron: "pronom", conj: "conjonction", det: "déterminant" };

export function theme(id: string, nom: string, description: string, icone: string, lignes: string): Theme {
  const entrees: Entree[] = lignes
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l, i) => {
      const [en, fr, nature, niveau, api, exEn, exFr] = l.split("|").map((x) => x.trim());
      if (!exFr || !NATURES[nature] || !NIVEAUX.includes(niveau as Niveau)) throw new Error(`Thème ${id}, ligne ${i + 1} mal formée : ${l}`);
      return { id: `${id}:${en.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, en, fr, nature: NATURES[nature], niveau: niveau as Niveau, api, exEn, exFr };
    });
  // Garde-fou : un mot ne figure qu'une fois dans un même thème.
  const vus = new Set<string>();
  for (const e of entrees) {
    if (vus.has(e.id)) throw new Error(`Thème ${id} : « ${e.en} » figure deux fois.`);
    vus.add(e.id);
  }
  return { id, nom, description, icone, entrees };
}
