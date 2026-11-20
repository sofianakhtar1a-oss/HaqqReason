"use client";

import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

/**
 * Le Calame — aides à la frappe.
 *
 * 1. Le correcteur typographique français : espace fine insécable avant ; ! ?,
 *    insécable avant : et dans les guillemets « », apostrophe typographique,
 *    points de suspension, tirets. Il se tait dans l'arabe, les adresses web et
 *    les nombres (12:30).
 * 2. Les formules de respect : « saws » devient ﷺ, « swt » devient ﷻ, et des codes
 *    entre deux-points (:as:, :ra:…) donnent les formules arabes ou françaises.
 * 3. La translittération rapide (à activer) : _a → ā, .h → ḥ, ` → ʿ…
 */

export const FINE = " ";
export const INSECABLE = " ";

/** Réglages lus à chaque frappe (mis à jour par l'atelier quand les préférences changent). */
export const reglagesSaisie = { typographie: true, translit: false };

export const FORMULES: { code: string; texte: string; libelle: string }[] = [
  { code: "saws", texte: "ﷺ", libelle: "Sur lui la prière et le salut (ﷺ)" },
  { code: "swt", texte: "ﷻ", libelle: "Exalté soit-Il (ﷻ)" },
  { code: ":as:", texte: "عليه السلام", libelle: "Sur lui la paix" },
  { code: ":ra:", texte: "رضي الله عنه", libelle: "Qu'Allah l'agrée (lui)" },
  { code: ":raa:", texte: "رضي الله عنها", libelle: "Qu'Allah l'agrée (elle)" },
  { code: ":ram:", texte: "رضي الله عنهم", libelle: "Qu'Allah les agrée" },
  { code: ":rah:", texte: "رحمه الله", libelle: "Qu'Allah lui fasse miséricorde" },
  { code: ":st:", texte: "سبحانه وتعالى", libelle: "Gloire à Lui, l'Exalté" },
  { code: ":bism:", texte: "بسم الله الرحمن الرحيم", libelle: "Au nom d'Allah, le Tout Miséricordieux" },
  { code: ":psl:", texte: "(paix et salut sur lui)", libelle: "Forme française de ﷺ" },
  { code: ":qdsl:", texte: "(que la paix soit sur lui)", libelle: "Forme française de عليه السلام" },
  { code: ":qdla:", texte: "(qu'Allah l'agrée)", libelle: "Forme française de رضي الله عنه" },
  { code: ":qdlfm:", texte: "(qu'Allah lui fasse miséricorde)", libelle: "Forme française de رحمه الله" },
];

export const TRANSLITERATION: { code: string; lettre: string }[] = [
  { code: "_a", lettre: "ā" },
  { code: "_i", lettre: "ī" },
  { code: "_u", lettre: "ū" },
  { code: "_A", lettre: "Ā" },
  { code: "_I", lettre: "Ī" },
  { code: "_U", lettre: "Ū" },
  { code: ".h", lettre: "ḥ" },
  { code: ".s", lettre: "ṣ" },
  { code: ".d", lettre: "ḍ" },
  { code: ".t", lettre: "ṭ" },
  { code: ".z", lettre: "ẓ" },
  { code: ".H", lettre: "Ḥ" },
  { code: ".S", lettre: "Ṣ" },
  { code: ".D", lettre: "Ḍ" },
  { code: ".T", lettre: "Ṭ" },
  { code: ".Z", lettre: "Ẓ" },
  { code: "_d", lettre: "ḏ" },
  { code: "_t", lettre: "ṯ" },
  { code: "_h", lettre: "ḫ" },
  { code: ".g", lettre: "ġ" },
  { code: "^g", lettre: "ǧ" },
  { code: "^s", lettre: "š" },
  { code: "`", lettre: "ʿ" },
  { code: "^'", lettre: "ʾ" },
];

const ARABE = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
const LETTRE = /[\p{L}]/u;
const BLOCS_SANS_AIDE = new Set(["versetArabe", "hadithArabe", "codeBlock"]);

/** Le mot en cours de frappe ressemble-t-il à une adresse (web, courriel) ? */
function adresse(avant: string): boolean {
  const mot = avant.split(/\s/).pop() ?? "";
  return /(https?|ftp|mailto|www\.|@|\/\/)/i.test(mot) || /\.[a-z]{2,4}$/i.test(mot);
}

function remplacerAvant(view: EditorView, from: number, to: number, nbAvant: number, texte: string): boolean {
  const tr = view.state.tr.insertText(texte, from - nbAvant, to);
  view.dispatch(tr);
  return true;
}

/** Que faire de ce caractère tapé ? (null : laisser faire le navigateur). Exporté pour les essais. */
export function transformer(avant: string, tape: string, options: { typographie: boolean; translit: boolean }): { retirer: number; inserer: string } | null {
  const precedent = avant.slice(-1);

  // Translittération (prioritaire : ses codes utilisent . _ ^ `).
  if (options.translit) {
    const sequence = precedent + tape;
    const t = TRANSLITERATION.find((x) => x.code === sequence) ?? (tape === "`" ? TRANSLITERATION.find((x) => x.code === "`") : undefined);
    if (t && !adresse(avant)) return { retirer: t.code.length - 1, inserer: t.lettre };
  }

  // Formules de respect : « saws » + espace, ou un code entre deux-points.
  if (tape === ":" ) {
    for (const f of FORMULES) {
      if (f.code.startsWith(":") && (avant + tape).endsWith(f.code)) {
        const debutCode = avant.length - (f.code.length - 1);
        const avantCode = avant.slice(0, debutCode);
        if (debutCode >= 0 && (!avantCode || !LETTRE.test(avantCode.slice(-1)))) return { retirer: f.code.length - 1, inserer: f.texte };
      }
    }
  }
  if (/[\s.,;!?)»]/.test(tape)) {
    for (const f of FORMULES) {
      if (f.code.startsWith(":")) continue;
      if (avant.toLowerCase().endsWith(f.code)) {
        const avantCode = avant.slice(0, avant.length - f.code.length);
        if (!avantCode || !LETTRE.test(avantCode.slice(-1))) return { retirer: f.code.length, inserer: f.texte + tape };
      }
    }
  }

  if (!options.typographie) return null;
  if (ARABE.test(precedent)) return null;

  if (tape === "'") {
    if (precedent === "^") return null;
    return { retirer: 0, inserer: "’" };
  }
  if (tape === '"') {
    const ouvrant = !precedent || /[\s([{—–/]/.test(precedent) || precedent === INSECABLE || precedent === FINE;
    if (ouvrant) return { retirer: 0, inserer: `«${INSECABLE}` };
    if (precedent === " ") return { retirer: 1, inserer: `${INSECABLE}»` };
    return { retirer: 0, inserer: `${INSECABLE}»` };
  }
  if (tape === "." && avant.endsWith("..")) return { retirer: 2, inserer: "…" };
  if (tape === "-" && precedent === "-") return { retirer: 1, inserer: "–" };
  if (tape === "-" && precedent === "–") return { retirer: 1, inserer: "—" };
  if (tape === ";" || tape === "!" || tape === "?") {
    if (adresse(avant)) return null;
    if (/[;!?:]/.test(precedent) || precedent === FINE) return null;
    if (precedent === " " || precedent === INSECABLE) return { retirer: 1, inserer: FINE + tape };
    if (LETTRE.test(precedent) || /[»)\]'’"]/.test(precedent)) return { retirer: 0, inserer: FINE + tape };
    return null;
  }
  if (tape === ":") {
    if (adresse(avant)) return null;
    if (precedent === " ") return { retirer: 1, inserer: INSECABLE + ":" };
    if (LETTRE.test(precedent) || /[»)]/.test(precedent)) return { retirer: 0, inserer: INSECABLE + ":" };
    return null;
  }
  return null;
}

export const AidesSaisie = Extension.create({
  name: "aidesSaisieCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("aidesSaisieCalame"),
        props: {
          handleTextInput(view, from, to, text) {
            if (text.length !== 1) return false;
            const $from = view.state.doc.resolve(from);
            if (BLOCS_SANS_AIDE.has($from.parent.type.name)) return false;
            if ($from.marks().some((m) => m.type.name === "code")) return false;
            const avant = $from.parent.textBetween(Math.max(0, $from.parentOffset - 40), $from.parentOffset, undefined, "￼");
            const r = transformer(avant, text, reglagesSaisie);
            if (!r) return false;
            return remplacerAvant(view, from, to, r.retirer, r.inserer);
          },
        },
      }),
    ];
  },
});

/** Applique la typographie française à tout le texte déjà écrit. Rend le nombre de passages corrigés. */
export function corrigerTypographie(editor: Editor): number {
  const { state } = editor;
  const tr = state.tr;
  let corrections = 0;
  const regles: [RegExp, string][] = [
    [/\.\.\./g, "…"],
    [/'/g, "’"],
    [/ ([;!?])/g, `${FINE}$1`],
    [/([\p{L}»)])([;!?])/gu, `$1${FINE}$2`],
    [/ :/g, `${INSECABLE}:`],
    [/«\s?/g, `«${INSECABLE}`],
    [/\s?»/g, `${INSECABLE}»`],
    [/"([^"\n]{1,400})"/g, `«${INSECABLE}$1${INSECABLE}»`],
    [/ - /g, " – "],
  ];
  state.doc.descendants((noeud, pos, parent) => {
    if (!noeud.isText || !noeud.text) return true;
    if (parent && BLOCS_SANS_AIDE.has(parent.type.name)) return false;
    if (noeud.marks.some((m) => m.type.name === "link" || m.type.name === "code")) return false;
    if (ARABE.test(noeud.text)) return false;
    let texte = noeud.text;
    for (const [re, par] of regles) texte = texte.replace(re, par);
    // Pas d'espace en trop dans une adresse ou une heure.
    texte = texte.replace(/(https?|ftp|mailto) :/gi, "$1:").replace(/(\d) :(\d)/g, "$1:$2");
    if (texte !== noeud.text) {
      corrections++;
      const debut = tr.mapping.map(pos);
      const fin = tr.mapping.map(pos + noeud.nodeSize);
      tr.replaceWith(debut, fin, state.schema.text(texte, noeud.marks));
    }
    return false;
  });
  if (corrections > 0) editor.view.dispatch(tr);
  return corrections;
}
