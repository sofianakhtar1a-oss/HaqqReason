/*
 * L'Écorché — le modèle : la table des structures (connue d'emblée, sans rien télécharger) et le chargement des
 * paquets, calque par calque et niveau de détail par niveau de détail.
 *
 * Chaque structure a un numéro fixe, le même à tous les niveaux de détail : on peut afficher tout de suite le
 * niveau léger, puis le remplacer par un plus fin sans rien changer d'autre. Après les pièces viennent les zones :
 * le tendon d'un muscle est une partie de son maillage, mais une structure à part entière (on la touche, on la nomme).
 */

import { PAR_ID } from "../catalogue";
import { NB_AXIAUX, NB_LATERAUX } from "../mouvement/squelette";
import type { Calque, Couche, StructureScene } from "../types";
import type { V3 } from "../vec";
import insertionsJson from "./insertions.json";
import manifesteJson from "./manifeste.json";
import { lirePaquet, type Paquet } from "./paquet";
import piecesJson from "./pieces.json";

type DefZone = [element: string, x: number, y: number, z: number, rayon: number];
type DefPiece = {
  cle: string;
  paquet: string;
  paire: boolean;
  element: string;
  cote?: "g" | "d";
  prof?: number;
  nom?: string;
  couleur?: string;
  c?: V3;
  r?: number;
  z?: Record<string, DefZone>;
  /** Les pièces qui la couvrent (« calque/clé », le côté gauche étant celui de la pièce elle-même). */
  couv?: string[];
  /** Sa profondeur sous la peau, en millimètres : au plus près, et la médiane. */
  peau?: [number, number];
  /** Le segment du squelette qu'elle suit le plus (numéro du côté gauche ou du milieu). */
  sg?: number;
  /** Pour un muscle : son point d'origine et son point de terminaison. */
  o?: V3;
  i?: V3;
};
type DefLod = { lod: number; fichier: string; octets: number; sommets: number; triangles: number };
type DefGroupe = { pieces: string[]; lods: DefLod[] };
export type DefInsertion = { cle: string; sorte: "origine" | "terminaison"; muscles: string[]; os: string | null };
/** Où sont rangées les zones d'un groupe : la première, le nombre par code, et le décalage du côté droit. */
export type ZonesGroupe = { base: number; nb: number; droite: number };

const manifeste = manifesteJson as unknown as { version: number; haute?: boolean; paquets: Record<string, { paire?: DefGroupe; impaire?: DefGroupe }> };
/** Le niveau le plus fin (haute définition) est-il en ligne ? */
export const HAUTE_DEFINITION = manifeste.haute === true;
// La clé d'une pièce n'est unique que dans son paquet (un « canal central » dans l'encéphale, un autre dans la moelle).
const defs = new Map((piecesJson as unknown as DefPiece[]).map((p) => [`${p.paquet}/${p.cle}`, p]));
const insertions = new Map((insertionsJson as unknown as DefInsertion[]).map((i) => [i.cle, i]));

const COUCHE_DE_CALQUE: Record<string, Couche> = { fascia: "tendon", gaine: "tendon", bourse: "ligament", enveloppe: "viscere", insertion: "muscle" };
/** Le nombre de codes de zone par pièce (1 : côté de l'origine, 2 : côté de la terminaison, 3 : zone particulière). */
export const CODES_ZONE = 3;

export const CALQUES = Object.keys(manifeste.paquets).sort() as Calque[];

/** Le calque où vit un élément : sa couche, ou une enveloppe qu'on ne montre pas d'office (fascia, gaine, bourse, séreuse). */
const calques = new Map<string, Calque>();
for (const p of defs.values()) if (!calques.has(p.element)) calques.set(p.element, p.paquet as Calque);
export function calqueDElement(id: string): Calque {
  const e = PAR_ID.get(id);
  const membre = e?.membres?.[0];
  return calques.get(id) ?? (membre ? calques.get(membre) : undefined) ?? e?.couche ?? "os";
}

/** Le poids à télécharger d'un calque à un niveau de détail (en octets). */
export function poidsDe(calque: string, lod: number): number {
  const p = manifeste.paquets[calque];
  let n = 0;
  for (const g of [p?.paire, p?.impaire]) n += g?.lods.find((l) => l.lod === lod)?.octets ?? 0;
  return n;
}

function construire() {
  const structures: StructureScene[] = [];
  const bases = new Map<string, number>();
  const zones = new Map<string, ZonesGroupe>();
  const insertionDe = new Map<number, DefInsertion>();
  const groupes: { cle: string; calque: Calque; paire: boolean; pieces: string[]; base: number }[] = [];
  for (const calque of CALQUES) {
    const p = manifeste.paquets[calque];
    for (const [paire, g] of [
      [true, p.paire],
      [false, p.impaire],
    ] as const) {
      if (!g) continue;
      const cleGroupe = `${calque}/${paire ? "p" : "i"}`;
      bases.set(cleGroupe, structures.length);
      groupes.push({ cle: cleGroupe, calque, paire, pieces: g.pieces, base: structures.length });
      const pousser = (cle: string, droite: boolean) => {
        const d = defs.get(`${calque}/${cle}`);
        const ins = calque === "insertion" ? insertions.get(cle) : undefined;
        const el = d ? PAR_ID.get(d.element) : undefined;
        const c: V3 = d?.c ?? [0, 1, 0];
        const id = structures.length;
        structures.push({
          id,
          cle: paire ? `${cle}:${droite ? "d" : "g"}` : cle,
          element: d?.element ?? "",
          couche: el?.couche ?? COUCHE_DE_CALQUE[calque] ?? (calque as Couche),
          calque,
          profondeur: (d?.prof ?? 0) as 0 | 1 | 2,
          cote: paire ? (droite ? "d" : "g") : (d?.cote ?? null),
          centre: droite ? [-c[0], c[1], c[2]] : c,
          rayon: d?.r ?? 0.05,
          nom: d?.nom,
          couleur: d?.couleur,
          // (une pièce dessinée en miroir suit les segments du côté droit ; ses bouts restent dans le repère rangé)
          segment: d?.sg === undefined ? undefined : droite && d.sg >= NB_AXIAUX ? d.sg + NB_LATERAUX : d.sg,
          origine: d?.o,
          terminaison: d?.i,
        });
        if (ins) insertionDe.set(id, ins);
      };
      for (const cle of g.pieces) pousser(cle, false);
      if (paire) for (const cle of g.pieces) pousser(cle, true);
    }
  }
  // Les zones, après toutes les pièces : pour chaque groupe qui en porte, un bloc par code.
  for (const g of groupes) {
    if (!g.pieces.some((cle) => defs.get(`${g.calque}/${cle}`)?.z)) continue;
    const n = g.pieces.length;
    const nb = g.paire ? 2 * n : n;
    zones.set(g.cle, { base: structures.length, nb, droite: g.paire ? n : 0 });
    for (let code = 1; code <= CODES_ZONE; code++)
      for (let k = 0; k < nb; k++) {
        const droite = g.paire && k >= n;
        const piece = structures[g.base + k];
        const z = defs.get(`${g.calque}/${g.pieces[k % n]}`)?.z?.[String(code)];
        const el = z ? PAR_ID.get(z[0]) : undefined;
        structures.push({
          ...piece,
          id: structures.length,
          cle: `${piece.cle}~z${code}`,
          element: el ? el.id : piece.element,
          couche: el ? el.couche : piece.couche,
          centre: z ? [droite ? -z[1] : z[1], z[2], z[3]] : piece.centre,
          rayon: z ? z[4] : piece.rayon,
          nom: undefined,
          couleur: undefined,
          zone: code,
          de: piece.id,
        });
      }
  }
  // Élément → ses structures ; un ensemble désigne celles de ses membres.
  const parElement = new Map<string, number[]>();
  for (const s of structures) {
    if (!s.element) continue;
    // Une zone sans tendon propre suit son muscle sans compter parmi ses pièces.
    if (s.zone && s.de !== undefined && structures[s.de].element === s.element) continue;
    const l = parElement.get(s.element) ?? [];
    l.push(s.id);
    parElement.set(s.element, l);
  }
  for (const e of PAR_ID.values()) {
    if (!e.membres?.length) continue;
    parElement.set(
      e.id,
      e.membres.flatMap((m) => parElement.get(m) ?? []),
    );
  }
  // Pièce → celles qui la couvrent (pour l'autre côté du corps, le miroir).
  const rang = new Map<string, number>();
  for (const s of structures) if (!s.zone) rang.set(`${s.calque}/${s.cle}`, s.id);
  const couvrants = new Map<number, number[]>();
  const miroir = (k: string) => (k.endsWith(":g") ? `${k.slice(0, -2)}:d` : k.endsWith(":d") ? `${k.slice(0, -2)}:g` : k);
  for (const g of groupes) {
    const n = g.pieces.length;
    g.pieces.forEach((cle, k) => {
      const couv = defs.get(`${g.calque}/${cle}`)?.couv;
      if (!couv) return;
      const ids = (droite: boolean) => couv.map((c) => rang.get(droite ? miroir(c) : c)).filter((i): i is number => i !== undefined);
      couvrants.set(g.base + k, ids(false));
      if (g.paire) couvrants.set(g.base + n + k, ids(true));
    });
  }
  // Pièce → ses zones (pour qu'elles suivent son état quand elles n'ont pas de tendon propre).
  const suiveuses = new Map<number, number[]>();
  for (const s of structures) {
    if (!s.zone || s.de === undefined || structures[s.de].element !== s.element) continue;
    const l = suiveuses.get(s.de) ?? [];
    l.push(s.id);
    suiveuses.set(s.de, l);
  }
  return { structures, bases, zones, parElement, insertionDe, suiveuses, couvrants };
}

type Ecouteur = (p: Paquet, base: number, zones: ZonesGroupe | undefined) => void;

export class Modele {
  readonly structures: StructureScene[];
  readonly parElement: Map<string, number[]>;
  readonly insertionDe: Map<number, DefInsertion>;
  /** Les zones qui suivent leur pièce (pas de tendon propre) : pièce → zones. */
  readonly suiveuses: Map<number, number[]>;
  /** Ce qui couvre chaque pièce : pour la voir, c'est cela qu'il faut ôter. */
  readonly couvrants: Map<number, number[]>;
  private bases: Map<string, number>;
  private zones: Map<string, ZonesGroupe>;
  private charges = new Map<string, Paquet>();
  private enCours = new Map<string, Promise<void>>();
  private ecouteurs = new Set<Ecouteur>();
  /** Les octets reçus (pour la barre de chargement). */
  octets = 0;

  constructor() {
    const t = construire();
    this.structures = t.structures;
    this.parElement = t.parElement;
    this.insertionDe = t.insertionDe;
    this.suiveuses = t.suiveuses;
    this.couvrants = t.couvrants;
    this.bases = t.bases;
    this.zones = t.zones;
  }

  /** Le niveau de détail chargé pour un calque (le moins fin de ses deux groupes), ou null si rien n'est là. */
  niveau(calque: string): number | null {
    const p = manifeste.paquets[calque];
    if (!p) return null;
    let pire: number | null = null;
    for (const suffixe of ["p", "i"] as const) {
      if (!(suffixe === "p" ? p.paire : p.impaire)) continue;
      const l = this.charges.get(`${calque}/${suffixe}`)?.lod;
      if (l === undefined) return null;
      pire = Math.max(pire ?? 0, l);
    }
    return pire;
  }

  existe(calque: string): boolean {
    return Boolean(manifeste.paquets[calque]);
  }

  /** Demande un calque à un niveau de détail (0 : le plus fin). Ne recharge rien si un niveau au moins aussi fin est là. */
  demander(calque: string, lod: number): Promise<void> {
    const p = manifeste.paquets[calque];
    if (!p) return Promise.resolve();
    const taches: Promise<void>[] = [];
    for (const [suffixe, g] of [
      ["p", p.paire],
      ["i", p.impaire],
    ] as const) {
      if (!g) continue;
      const cle = `${calque}/${suffixe}`;
      // Le niveau demandé, ou à défaut le plus proche qui existe (et qui est publié).
      const voulu = HAUTE_DEFINITION ? lod : Math.max(1, lod);
      const dispo = g.lods
        .filter((l) => HAUTE_DEFINITION || l.lod >= 1)
        .slice()
        .sort((a, b) => Math.abs(a.lod - voulu) - Math.abs(b.lod - voulu))[0];
      if (!dispo) continue;
      const actuel = this.charges.get(cle);
      if (actuel && actuel.lod <= dispo.lod) continue;
      const tache = `${cle}/${dispo.lod}`;
      let promesse = this.enCours.get(tache);
      if (!promesse) {
        promesse = (async () => {
          const r = await fetch(`/corps/${dispo.fichier}`);
          if (!r.ok) throw new Error(`paquet ${dispo.fichier} : ${r.status}`);
          const donnees = await r.arrayBuffer();
          this.octets += donnees.byteLength;
          const paquet = await lirePaquet(donnees);
          const deja = this.charges.get(cle);
          if (deja && deja.lod <= paquet.lod) return;
          this.charges.set(cle, paquet);
          for (const f of this.ecouteurs) f(paquet, this.bases.get(cle) ?? 0, this.zones.get(cle));
        })().finally(() => this.enCours.delete(tache));
        this.enCours.set(tache, promesse);
      }
      taches.push(promesse);
    }
    return Promise.all(taches).then(() => undefined);
  }

  /** S'abonner aux paquets : ceux déjà chargés arrivent tout de suite. Rend de quoi se désabonner. */
  abonner(f: Ecouteur): () => void {
    this.ecouteurs.add(f);
    for (const [cle, p] of this.charges) f(p, this.bases.get(cle) ?? 0, this.zones.get(cle));
    return () => {
      this.ecouteurs.delete(f);
    };
  }
}
