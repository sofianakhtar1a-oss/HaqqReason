/*
 * L'Écorché — de la liste des pièces aux tampons du moteur : une couche = un tampon, chaque sommet
 * portant le numéro de sa structure. Module pur (fonctionne aussi dans un Worker).
 */

import { centre, etendue } from "./geometrie";
import type { Couche, Piece, StructureScene } from "./types";

export type Tampon = { positions: Float32Array; normales: Float32Array; uv: Float32Array; ids: Float32Array; indices: Uint32Array };
export type Scene = { couches: Partial<Record<Couche, Tampon>>; structures: StructureScene[]; triangles: number };

export function construireScene(pieces: Piece[]): Scene {
  const structures: StructureScene[] = [];
  const parCouche = new Map<Couche, Piece[]>();
  for (const p of pieces) {
    const liste = parCouche.get(p.couche) ?? [];
    liste.push(p);
    parCouche.set(p.couche, liste);
  }
  const couches: Partial<Record<Couche, Tampon>> = {};
  let triangles = 0;
  for (const [couche, liste] of parCouche) {
    let nbSommets = 0;
    let nbIndices = 0;
    for (const p of liste) {
      nbSommets += p.maillage.p.length / 3;
      nbIndices += p.maillage.i.length;
    }
    const t: Tampon = {
      positions: new Float32Array(nbSommets * 3),
      normales: new Float32Array(nbSommets * 3),
      uv: new Float32Array(nbSommets * 2),
      ids: new Float32Array(nbSommets),
      indices: new Uint32Array(nbIndices),
    };
    let s = 0;
    let k = 0;
    for (const p of liste) {
      const id = structures.length;
      const c = centre(p.maillage);
      structures.push({ id, cle: p.cle, element: p.element, couche, profondeur: p.profondeur, cote: p.cote, centre: c, rayon: etendue(p.maillage, c), teinte: p.teinte });
      const m = p.maillage;
      t.positions.set(m.p, s * 3);
      t.normales.set(m.n, s * 3);
      t.uv.set(m.uv.slice(0, (m.p.length / 3) * 2), s * 2);
      t.ids.fill(id, s, s + m.p.length / 3);
      for (let j = 0; j < m.i.length; j++) t.indices[k + j] = m.i[j] + s;
      s += m.p.length / 3;
      k += m.i.length;
    }
    triangles += nbIndices / 3;
    couches[couche] = t;
  }
  return { couches, structures, triangles };
}
