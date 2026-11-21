/*
 * L'Écorché — le catalogue : chaque structure à apprendre.
 *
 * Les éléments viennent des modèles (scripts/corps/06_catalogue.py) : un élément par structure de Z-Anatomy, avec
 * son nom officiel (Terminologia Anatomica 2 : français, latin, anglais), sa région, son rang (0 : la plus connue),
 * et ce que l'atlas sait de lui (les os où un muscle s'attache, son nerf, sa loge). Les fiches de la première
 * version (origine, terminaison, action, mémo, anecdote…) sont reprises sous les mêmes identifiants.
 * Les ensembles réunissent plusieurs éléments sous un nom courant : les vertèbres lombaires, les vraies côtes.
 */

import elementsJson from "./modele/elements.json";
import ensemblesJson from "./modele/ensembles.json";
import type { Couche, Element } from "./types";

const elements = elementsJson as unknown as Element[];
const ensembles = (ensemblesJson as unknown as Element[]).filter((e) => (e.membres?.length ?? 0) > 0);

export const ELEMENTS: readonly Element[] = [...ensembles, ...elements];
export const PAR_ID: ReadonlyMap<string, Element> = new Map(ELEMENTS.map((e) => [e.id, e]));
export const element = (id: string): Element | undefined => PAR_ID.get(id);
export const elementsDe = (couche: Couche): Element[] => ELEMENTS.filter((e) => e.couche === couche);

/** Le nom d'une référence : un identifiant d'élément devient son nom, un texte reste tel quel. */
export const nomDe = (ref: string | undefined): string => (ref ? (PAR_ID.get(ref)?.nom ?? ref) : "");

/** Les éléments que recouvre un identifiant : lui-même, ou les membres d'un ensemble. */
export function membresDe(id: string): string[] {
  const e = PAR_ID.get(id);
  return e?.membres?.length ? e.membres : [id];
}

/**
 * Toucher une structure vaut-il pour celle qu'on demande ? Elle-même, un membre de l'ensemble demandé,
 * ou, quand on demande un muscle, le tendon qui le prolonge (il en fait partie).
 */
export function vautPour(touche: string, attendu: string): boolean {
  if (touche === attendu) return true;
  if (membresDe(attendu).includes(touche)) return true;
  const t = PAR_ID.get(touche);
  return Boolean(t?.zone && t.muscle === attendu && PAR_ID.get(attendu)?.couche === "muscle");
}

export const NOMS_COUCHES: Record<Couche, { un: string; des: string; le: string }> = {
  os: { un: "un os", des: "Les os", le: "l'os" },
  muscle: { un: "un muscle", des: "Les muscles", le: "le muscle" },
  tendon: { un: "un tendon", des: "Les tendons", le: "le tendon" },
  ligament: { un: "un ligament", des: "Les ligaments", le: "le ligament" },
  artere: { un: "une artère", des: "Les artères", le: "l'artère" },
  veine: { un: "une veine", des: "Les veines", le: "la veine" },
  nerf: { un: "un nerf", des: "Les nerfs", le: "le nerf" },
  viscere: { un: "un viscère", des: "Les viscères", le: "le viscère" },
  encephale: { un: "une structure de l'encéphale", des: "L'encéphale", le: "la structure" },
  lymphe: { un: "un nœud lymphatique", des: "Les nœuds lymphatiques", le: "le nœud" },
};

/** Ce qu'est une structure dans sa couche, quand ce n'est pas l'évidence : un cartilage parmi les os, une bourse… */
export const NOMS_NATURES: Record<string, string> = {
  ensemble: "Ensemble",
  cartilage: "Cartilage",
  dent: "Dent",
  aponevrose: "Aponévrose",
  retinaculum: "Rétinaculum",
  fascia: "Fascia",
  gaine: "Gaine synoviale",
  capsule: "Capsule articulaire",
  menisque: "Ménisque",
  labrum: "Bourrelet",
  disque: "Disque",
  membrane: "Membrane",
  symphyse: "Symphyse",
  bourse: "Bourse synoviale",
  pulmonaire: "Circulation pulmonaire",
  sinus: "Sinus veineux",
  ganglion: "Ganglion",
  coeur: "Cœur",
  sens: "Organe des sens",
  lymphoide: "Organe lymphoïde",
  enveloppe: "Enveloppe",
  noeud: "Nœud lymphatique",
};
