"use client";

import type { Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";

/**
 * Le Calame — le plan, vivant : chaque titre de premier niveau du texte, la longueur
 * de sa partie, et les gestes pour réorganiser (déplacer une partie entière, monter
 * ou descendre d'un niveau de titre).
 */

export type EntreePlan = { pos: number; niveau: number; texte: string; mots: number; fin: number };

const NIVEAU_MIN = 2;
const NIVEAU_MAX = 4;

function compterMots(texte: string): number {
  return (texte.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? []).length;
}

/** Les titres du texte (au premier niveau du document), avec la fin et la longueur de leur partie. */
export function planDuDocument(doc: NoeudPM): EntreePlan[] {
  const blocs: { pos: number; noeud: NoeudPM }[] = [];
  doc.forEach((noeud, pos) => blocs.push({ pos, noeud }));
  const entrees: EntreePlan[] = [];
  blocs.forEach((b, i) => {
    if (b.noeud.type.name !== "heading") return;
    const niveau = Number(b.noeud.attrs.level) || NIVEAU_MIN;
    let fin = doc.content.size;
    let mots = 0;
    for (let j = i + 1; j < blocs.length; j++) {
      const autre = blocs[j];
      if (autre.noeud.type.name === "heading" && (Number(autre.noeud.attrs.level) || NIVEAU_MIN) <= niveau) {
        fin = autre.pos;
        break;
      }
      mots += compterMots(autre.noeud.textContent);
    }
    entrees.push({ pos: b.pos, niveau, texte: b.noeud.textContent.trim(), mots, fin });
  });
  return entrees;
}

/** Place le curseur au début d'un titre et le montre. */
export function allerAuTitre(editor: Editor, pos: number): void {
  const noeud = editor.state.doc.nodeAt(pos);
  if (!noeud) return;
  editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos + 1)).scrollIntoView());
  const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
  dom?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  editor.view.focus();
}

/**
 * Déplace une partie entière (son titre et tout ce qui la suit) avant un autre titre,
 * ou à la fin du document (cible = null). Une seule étape à annuler.
 */
export function deplacerPartie(editor: Editor, posSource: number, posCible: number | null): boolean {
  const { doc } = editor.state;
  const source = planDuDocument(doc).find((e) => e.pos === posSource);
  if (!source) return false;
  const cible = posCible ?? doc.content.size;
  if (cible >= source.pos && cible <= source.fin) return false;
  const tranche = doc.slice(source.pos, source.fin);
  const tr = editor.state.tr;
  if (cible > source.fin) {
    tr.insert(cible, tranche.content);
    tr.delete(source.pos, source.fin);
  } else {
    tr.delete(source.pos, source.fin);
    tr.insert(cible, tranche.content);
  }
  editor.view.dispatch(tr.scrollIntoView());
  return true;
}

/** Monte (delta = -1) ou descend (+1) une partie d'un niveau, sous-titres compris. */
export function changerNiveau(editor: Editor, pos: number, delta: 1 | -1): boolean {
  const { doc } = editor.state;
  const entree = planDuDocument(doc).find((e) => e.pos === pos);
  if (!entree) return false;
  const titres: { pos: number; niveau: number }[] = [];
  doc.nodesBetween(entree.pos, entree.fin, (noeud, p) => {
    if (noeud.type.name === "heading") titres.push({ pos: p, niveau: Number(noeud.attrs.level) || NIVEAU_MIN });
    return false;
  });
  if (titres.some((t) => t.niveau + delta < NIVEAU_MIN || t.niveau + delta > NIVEAU_MAX)) return false;
  const tr = editor.state.tr;
  for (const t of titres) {
    const noeud = doc.nodeAt(t.pos);
    if (noeud) tr.setNodeMarkup(t.pos, undefined, { ...noeud.attrs, level: t.niveau + delta });
  }
  editor.view.dispatch(tr);
  return true;
}

// ---------------------------------------------------------------------------
// Carte mentale → plan
// ---------------------------------------------------------------------------

type NoeudCarte = { id: string; texte: string; x: number; y: number; forme?: string };
type LienCarte = { de: string; vers: string };

/**
 * Les branches d'une carte mentale, en plan : le sujet central au milieu, ses branches
 * (dans le sens des aiguilles d'une montre, depuis midi) deviennent des titres de partie,
 * leurs sous-branches des titres de section, et ainsi de suite.
 */
export function planDeLaCarte(noeuds: NoeudCarte[], liens: LienCarte[]): { niveau: 2 | 3 | 4; texte: string }[] {
  if (noeuds.length === 0) return [];
  const voisins = new Map<string, string[]>();
  for (const l of liens) {
    voisins.set(l.de, [...(voisins.get(l.de) ?? []), l.vers]);
    voisins.set(l.vers, [...(voisins.get(l.vers) ?? []), l.de]);
  }
  const parId = new Map(noeuds.map((n) => [n.id, n]));
  const racine = noeuds.find((n) => n.forme === "ellipse") ?? [...noeuds].sort((a, b) => (voisins.get(b.id)?.length ?? 0) - (voisins.get(a.id)?.length ?? 0))[0];
  const plan: { niveau: 2 | 3 | 4; texte: string }[] = [];
  const vus = new Set<string>([racine.id]);
  const angle = (n: NoeudCarte) => {
    // 0 à midi, croissant dans le sens des aiguilles d'une montre.
    const a = Math.atan2(n.x - racine.x, -(n.y - racine.y));
    return a < 0 ? a + 2 * Math.PI : a;
  };
  const descendre = (id: string, profondeur: number) => {
    const enfants = (voisins.get(id) ?? []).filter((v) => !vus.has(v)).map((v) => parId.get(v)).filter((n): n is NoeudCarte => !!n);
    enfants.sort(profondeur === 1 ? (a, b) => angle(a) - angle(b) : (a, b) => a.y - b.y || a.x - b.x);
    for (const e of enfants) vus.add(e.id);
    for (const e of enfants) {
      const texte = e.texte.replace(/\s+/g, " ").trim();
      if (texte) plan.push({ niveau: (Math.min(4, profondeur + 1) as 2 | 3 | 4), texte });
      descendre(e.id, profondeur + 1);
    }
  };
  descendre(racine.id, 1);
  return plan;
}

/** Insère, juste après la carte mentale choisie (ou la première du document), le plan qu'elle dessine. */
export function carteMentaleEnPlan(editor: Editor): number {
  const { state } = editor;
  let cible: { pos: number; noeud: import("@tiptap/pm/model").Node } | null = null;
  const sel = state.selection as { node?: import("@tiptap/pm/model").Node; from: number };
  if (sel.node?.type.name === "schema") cible = { pos: sel.from, noeud: sel.node };
  else
    state.doc.descendants((n, pos) => {
      if (cible) return false;
      if (n.type.name === "schema") cible = { pos, noeud: n };
      return true;
    });
  if (!cible) return 0;
  const { pos, noeud } = cible as { pos: number; noeud: import("@tiptap/pm/model").Node };
  let donnees = noeud.attrs.donnees as unknown;
  if (typeof donnees === "string") {
    try {
      donnees = JSON.parse(donnees);
    } catch {
      donnees = null;
    }
  }
  const d = (donnees ?? {}) as { noeuds?: NoeudCarte[]; liens?: LienCarte[] };
  const plan = planDeLaCarte(Array.isArray(d.noeuds) ? d.noeuds : [], Array.isArray(d.liens) ? d.liens : []);
  if (plan.length === 0) return 0;
  const titres = plan.map((p) => state.schema.nodes.heading.create({ level: p.niveau }, state.schema.text(p.texte.slice(0, 200))));
  editor.view.dispatch(state.tr.insert(pos + noeud.nodeSize, titres).scrollIntoView());
  return plan.length;
}
