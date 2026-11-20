"use client";

import { Extension, type Editor } from "@tiptap/core";
import type { Node as NoeudPM } from "@tiptap/pm/model";
import { Plugin, PluginKey, TextSelection, type EditorState, type Transaction } from "@tiptap/pm/state";
import { Mapping } from "@tiptap/pm/transform";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/*
 * Le Calame — la relecture grammaticale. Le texte part chez LanguageTool (par /api/calame/relecture)
 * seulement quand l'auteur le demande ; les remarques reviennent soulignées dans le texte : orthographe,
 * grammaire et accords, typographie, style. Les mots du dictionnaire personnel et les mots translittérés
 * de l'arabe ne sont jamais signalés ; le texte arabe n'est pas envoyé.
 */

export type GenreRemarque = "orthographe" | "grammaire" | "typographie" | "style";
export const GENRES_REMARQUE: { cle: GenreRemarque; libelle: string }[] = [
  { cle: "orthographe", libelle: "Orthographe" },
  { cle: "grammaire", libelle: "Grammaire et accords" },
  { cle: "typographie", libelle: "Typographie" },
  { cle: "style", libelle: "Style" },
];

export type RemarqueLT = { id: string; de: number; a: number; message: string; court: string; suggestions: string[]; genre: GenreRemarque; categorie: string; regle: string; mot: string };

type Meta = { remarques: RemarqueLT[] } | { retirer: string[] } | { caches: GenreRemarque[] };

/** Toutes les remarques, les genres que l'auteur a masqués, et ce qui reste souligné. */
type EtatGrammaire = { toutes: DecorationSet; caches: GenreRemarque[]; vues: DecorationSet };

export const CLE_GRAMMAIRE = new PluginKey<EtatGrammaire>("grammaireCalame");

const decoration = (r: RemarqueLT) =>
  Decoration.inline(r.de, r.a, { class: `calame-lt calame-lt-${r.genre}`, "data-remarque": r.id }, { remarque: r, inclusiveStart: false, inclusiveEnd: false });

const remarqueDe = (d: Decoration) => (d.spec as { remarque: RemarqueLT }).remarque;

function visibles(toutes: DecorationSet, caches: GenreRemarque[], doc: NoeudPM): DecorationSet {
  if (caches.length === 0) return toutes;
  return DecorationSet.create(doc, toutes.find().filter((d) => !caches.includes(remarqueDe(d).genre)));
}

export const Grammaire = Extension.create({
  name: "grammaireCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin<EtatGrammaire>({
        key: CLE_GRAMMAIRE,
        state: {
          init: () => ({ toutes: DecorationSet.empty, caches: [], vues: DecorationSet.empty }),
          apply: (tr, avant) => {
            const meta = tr.getMeta(CLE_GRAMMAIRE) as Meta | undefined;
            if (!meta && (!tr.docChanged || avant.toutes === DecorationSet.empty)) return avant;
            let caches = avant.caches;
            let set = avant.toutes;
            if (meta && "remarques" in meta) {
              set = DecorationSet.create(tr.doc, meta.remarques.filter((r) => r.a > r.de && r.a <= tr.doc.content.size).map(decoration));
            } else if (tr.docChanged) {
              set = set.map(tr.mapping, tr.doc);
              // Une remarque dont l'auteur retouche le mot disparaît : il l'a corrigée lui-même.
              tr.mapping.maps.forEach((carte, i) => {
                const suite = tr.mapping.slice(i + 1);
                carte.forEach((_ad, _aa, nd, na) => {
                  const de = suite.map(nd, -1);
                  const a = suite.map(na, 1);
                  const touchees = set.find(Math.max(0, de - 1), a + 1).filter((d) => (de === a ? d.from < de && d.to > de : d.from < a && d.to > de));
                  if (touchees.length) set = set.remove(touchees);
                });
              });
            }
            if (meta && "retirer" in meta) {
              const ids = new Set(meta.retirer);
              set = set.remove(set.find().filter((d) => ids.has(remarqueDe(d).id)));
            }
            if (meta && "caches" in meta) caches = meta.caches;
            return { toutes: set, caches, vues: visibles(set, caches, tr.doc) };
          },
        },
        props: { decorations: (state) => CLE_GRAMMAIRE.getState(state)?.vues },
      }),
    ];
  },
});

// ---------------------------------------------------------------- le texte envoyé

const NON_RELUS = new Set(["versetArabe", "hadithArabe", "codeBlock"]);
const CITATIONS = new Set(["blockquote", "verset", "hadith", "citationOuvrage"]);
const ARABE = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const TRANSLITTERATION = /[āīūḥṣḍṭẓʿʾĀĪŪḤṢḌṬẒġḡẖ]/;

/** Le texte du document, bloc par bloc, et la position de chaque caractère dans l'éditeur (-1 : séparateur). */
export function texteAvecPositions(doc: NoeudPM, options: { sansCitations?: boolean } = {}): { texte: string; positions: number[] } {
  let texte = "";
  const positions: number[] = [];
  doc.descendants((n, pos) => {
    if (NON_RELUS.has(n.type.name)) return false;
    if (options.sansCitations && CITATIONS.has(n.type.name)) return false;
    if (!n.isTextblock) return true;
    if (texte) {
      texte += "\n\n";
      positions.push(-1, -1);
    }
    n.forEach((enfant, decalage) => {
      if (enfant.isText) {
        const t = enfant.text ?? "";
        for (let i = 0; i < t.length; i++) positions.push(pos + 1 + decalage + i);
        texte += t;
      } else if (enfant.type.name === "hardBreak") {
        texte += "\n";
        positions.push(-1);
      }
      // Une note, un renvoi, une image : hors de la phrase relue.
    });
    return false;
  });
  return { texte, positions };
}

/** Coupe un long texte en morceaux d'au plus `max` signes, de préférence entre deux paragraphes. */
export function decouper(texte: string, max = 10_000): [number, number][] {
  const morceaux: [number, number][] = [];
  let debut = 0;
  while (debut < texte.length) {
    let fin = Math.min(texte.length, debut + max);
    if (fin < texte.length) {
      const zone = texte.slice(debut, fin);
      // Après la ligne vide entre deux paragraphes, sinon après une fin de phrase, sinon après un espace.
      const paragraphe = zone.lastIndexOf("\n\n");
      const phrase = Math.max(zone.lastIndexOf(". "), zone.lastIndexOf("! "), zone.lastIndexOf("? "), zone.lastIndexOf("\n") - 1);
      const espace = zone.lastIndexOf(" ");
      if (paragraphe >= max / 3) fin = debut + paragraphe + 2;
      else if (phrase >= max / 3) fin = debut + phrase + 2;
      else if (espace > 0) fin = debut + espace + 1;
    }
    morceaux.push([debut, fin]);
    debut = fin;
  }
  return morceaux;
}

export const normaliserMot = (mot: string) => mot.normalize("NFC").toLowerCase().replace(/[’']/g, "'").trim();

/** Faut-il taire cette remarque ? (dictionnaire personnel, arabe, translittération) */
export function remarqueTue(genre: GenreRemarque, mot: string, connus: Set<string>): boolean {
  if (ARABE.test(mot)) return true;
  if (genre !== "orthographe") return false;
  return TRANSLITTERATION.test(mot) || connus.has(normaliserMot(mot));
}

type Reponse = { remarques?: { message: string; court: string; debut: number; longueur: number; suggestions: string[]; genre: GenreRemarque; categorie: string; regle?: string }[]; erreur?: string };

export type Avancement = { fait: number; total: number; attente?: number };

type OptionsRelecture = { plage?: { de: number; a: number } | null; dictionnaire: string[]; sansCitations?: boolean; surAvancement?: (a: Avancement) => void; arret?: AbortSignal };

const ARRETEE = { erreur: "Relecture arrêtée." };

/** Envoie les morceaux un à un ; le service public limite le débit : quand il demande d'attendre, on attend une minute. */
async function envoyerMorceaux(texte: string, positions: number[], morceaux: [number, number][], connus: Set<string>, options: OptionsRelecture): Promise<RemarqueLT[] | { erreur: string }> {
  const remarques: RemarqueLT[] = [];
  // Des identifiants propres à cette relecture : une bulle ouverte sur l'ancienne ne se rouvre pas sur la nouvelle.
  const tampon = Date.now().toString(36);
  options.surAvancement?.({ fait: 0, total: morceaux.length });
  for (const [k, [de, a]] of morceaux.entries()) {
    const extrait = texte.slice(de, a);
    if (!extrait.trim()) continue;
    let d: Reponse = {};
    for (let essai = 0; ; essai++) {
      if (options.arret?.aborted) return ARRETEE;
      const r = await fetch("/api/calame/relecture", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texte: extrait }), signal: options.arret }).catch(() => null);
      if (!r) return options.arret?.aborted ? ARRETEE : { erreur: "Pas de connexion : la relecture a besoin d'Internet." };
      d = (await r.json().catch(() => ({}))) as Reponse;
      if (r.status === 429 && essai < 4) {
        // Environ 75 000 signes par minute sur le service public : on patiente, puis on reprend.
        for (let s = 60; s > 0; s--) {
          if (options.arret?.aborted) return ARRETEE;
          options.surAvancement?.({ fait: k, total: morceaux.length, attente: s });
          await new Promise((suite) => setTimeout(suite, 1000));
        }
        continue;
      }
      if (!r.ok || !d.remarques) return { erreur: d.erreur ?? "La relecture n'a pas abouti." };
      break;
    }
    for (const m of d.remarques ?? []) {
      const i = de + m.debut;
      const j = i + m.longueur - 1;
      const pDe = positions[i];
      const pA = positions[j];
      if (pDe === undefined || pA === undefined || pDe < 0 || pA < 0 || pA < pDe) continue;
      const mot = texte.slice(i, j + 1);
      if (remarqueTue(m.genre, mot, connus)) continue;
      remarques.push({ id: `r${tampon}-${k}-${remarques.length}`, de: pDe, a: pA + 1, message: m.message, court: m.court, suggestions: m.suggestions, genre: m.genre, categorie: m.categorie, regle: m.regle ?? "", mot });
    }
    options.surAvancement?.({ fait: k + 1, total: morceaux.length });
  }
  return remarques;
}

/** Relit le document (ou la plage donnée) et souligne les remarques dans le texte. */
export async function relireDocument(editor: Editor, options: OptionsRelecture): Promise<{ remarques: RemarqueLT[] } | { erreur: string }> {
  const { texte, positions } = texteAvecPositions(editor.state.doc, { sansCitations: options.sansCitations });
  let debutTexte = 0;
  let finTexte = texte.length;
  if (options.plage) {
    const { de, a } = options.plage;
    debutTexte = positions.findIndex((p) => p >= de);
    if (debutTexte < 0) return { remarques: [] };
    let j = positions.length - 1;
    while (j >= debutTexte && !(positions[j] >= 0 && positions[j] < a)) j--;
    finTexte = j + 1;
  }
  const connus = new Set(options.dictionnaire.map(normaliserMot));
  const morceaux = decouper(texte.slice(debutTexte, finTexte)).map(([de, a]) => [de + debutTexte, a + debutTexte] as [number, number]);
  // L'auteur peut continuer d'écrire pendant la relecture : on garde la trace de ses retouches.
  const retouches = new Mapping();
  const suivre = ({ transaction }: { transaction: Transaction }) => {
    if (transaction.docChanged) retouches.appendMapping(transaction.mapping);
  };
  editor.on("transaction", suivre);
  let resultat: RemarqueLT[] | { erreur: string };
  try {
    resultat = await envoyerMorceaux(texte, positions, morceaux, connus, options);
  } finally {
    editor.off("transaction", suivre);
  }
  if (!Array.isArray(resultat)) return resultat;
  if (editor.isDestroyed) return { erreur: "Le document a été fermé." };
  // Les positions suivent ces retouches ; un mot retouché entre-temps n'est plus signalé.
  const taille = editor.state.doc.content.size;
  const suivies = resultat
    .map((r) => ({ ...r, de: retouches.map(r.de, 1), a: retouches.map(r.a, -1) }))
    .filter((r) => r.a > r.de && r.a <= taille && editor.state.doc.textBetween(r.de, r.a, "", "") === r.mot);
  // Relire une sélection garde les remarques déjà soulignées ailleurs.
  let gardees: RemarqueLT[] = [];
  if (options.plage) {
    const de = retouches.map(options.plage.de, -1);
    const a = retouches.map(options.plage.a, 1);
    gardees = listerRemarques(editor.state).filter((r) => r.a <= de || r.de >= a);
  }
  const tr = editor.state.tr;
  tr.setMeta(CLE_GRAMMAIRE, { remarques: [...gardees, ...suivies] } satisfies Meta);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
  return { remarques: suivies };
}

// ---------------------------------------------------------------- les gestes sur les remarques

/** Les remarques encore présentes, à leur place actuelle, dans l'ordre du texte. */
export function listerRemarques(state: EditorState, seulementVisibles = false): RemarqueLT[] {
  const etat = CLE_GRAMMAIRE.getState(state);
  if (!etat) return [];
  return (seulementVisibles ? etat.vues : etat.toutes)
    .find()
    .map((d) => ({ ...remarqueDe(d), de: d.from, a: d.to }))
    .sort((x, y) => x.de - y.de);
}

export const genresCaches = (state: EditorState): GenreRemarque[] => CLE_GRAMMAIRE.getState(state)?.caches ?? [];

/** Masque (ou remontre) les soulignés d'un genre de remarques. */
export function masquerGenres(editor: Editor, caches: GenreRemarque[]) {
  const tr = editor.state.tr.setMeta(CLE_GRAMMAIRE, { caches } satisfies Meta);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

export const remarqueParId = (state: EditorState, id: string) => listerRemarques(state).find((r) => r.id === id) ?? null;

/** La remarque sous le curseur (ou la plus proche après lui). */
export function remarqueSuivante(state: EditorState, apres = state.selection.from): RemarqueLT | null {
  const toutes = listerRemarques(state, true);
  return toutes.find((r) => r.a > apres) ?? toutes[0] ?? null;
}

function retirer(editor: Editor, ids: string[]) {
  const tr = editor.state.tr.setMeta(CLE_GRAMMAIRE, { retirer: ids } satisfies Meta);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

export function appliquerSuggestion(editor: Editor, id: string, remplacement: string): boolean {
  const r = remarqueParId(editor.state, id);
  if (!r) return false;
  const tr = editor.state.tr.insertText(remplacement, r.de, r.a);
  tr.setMeta(CLE_GRAMMAIRE, { retirer: [id] } satisfies Meta);
  editor.view.dispatch(tr);
  return true;
}

export const ignorerRemarque = (editor: Editor, id: string) => retirer(editor, [id]);

/** Après l'ajout d'un mot au dictionnaire : toutes ses remarques d'orthographe disparaissent. */
export function ignorerMot(editor: Editor, mot: string) {
  const cle = normaliserMot(mot);
  retirer(
    editor,
    listerRemarques(editor.state)
      .filter((r) => r.genre === "orthographe" && normaliserMot(r.mot) === cle)
      .map((r) => r.id),
  );
}

export function effacerRemarques(editor: Editor) {
  const tr = editor.state.tr.setMeta(CLE_GRAMMAIRE, { remarques: [] } satisfies Meta);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
}

/** Sélectionne le passage de la remarque et le fait venir à l'écran. */
export function allerALaRemarque(editor: Editor, r: RemarqueLT) {
  const tr = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, r.de, r.a)).scrollIntoView();
  editor.view.dispatch(tr);
  editor.view.focus();
  requestAnimationFrame(() => editor.view.dom.querySelector(`[data-remarque="${r.id}"]`)?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
}

/** Un peu du texte autour de la remarque, pour la reconnaître dans la liste. */
export function contexteDe(state: EditorState, r: RemarqueLT): { avant: string; mot: string; apres: string } {
  const $de = state.doc.resolve(r.de);
  const debutBloc = $de.start();
  const finBloc = $de.end();
  const avant = state.doc.textBetween(Math.max(debutBloc, r.de - 40), r.de, " ", " ");
  const apres = state.doc.textBetween(r.a, Math.min(finBloc, r.a + 40), " ", " ");
  return { avant: (r.de - 40 > debutBloc ? "…" : "") + avant, mot: state.doc.textBetween(r.de, r.a, " ", " "), apres: apres + (r.a + 40 < finBloc ? "…" : "") };
}
