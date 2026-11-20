"use client";

import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

/**
 * Le Calame — les coupures de page, posées dans le texte.
 *
 * On ne découpe pas le document en plusieurs zones éditables : on garde un seul
 * texte, et on y insère des blancs calculés, juste avant ce qui ouvre chaque
 * nouvelle page. Le texte retombe donc exactement en haut de la feuille
 * suivante, tout en restant un seul document : curseur, sélection, annulation
 * et glisser-déposer traversent les pages sans s'en apercevoir.
 *
 * Trois sortes de blancs :
 *   • entre deux blocs (un bloc qui ouvre la page) ;
 *   • au milieu d'un paragraphe, au début de la ligne qui passe à la page suivante
 *     (un élément aussi large que la ligne : la ligne d'avant reste justifiée) ;
 *   • entre deux rangées d'un tableau, suivi de la ligne d'en-tête recopiée.
 *
 * Les blancs sont des décorations : ils n'entrent jamais dans le document
 * enregistré. On y pose aussi les notes de fin (de partie ou de document), qui se
 * recomposent à chaque frappe.
 */

/** pos : position dans le document, juste avant le bloc, la ligne ou la rangée qui ouvre la page. */
export type Coupure = {
  pos: number;
  hauteur: number;
  numero: number;
  /** « bloc » (par défaut), « ligne » au milieu d'un paragraphe, « rangee » dans un tableau. */
  genre?: "bloc" | "ligne" | "rangee";
  /** Hauteur réellement prise par un blanc de ligne (jamais moins d'une ligne de texte). */
  effective?: number;
  /** Rangée : nombre de colonnes du tableau. */
  colonnes?: number;
  /** Rangée : position du tableau, dont on recopie la ligne d'en-tête en haut de la page. */
  tableau?: number;
  /** Le blanc passe avant les notes de fin posées au même endroit. */
  avantNotes?: boolean;
};

/** Notes rassemblées à la fin d'une partie ou du document. */
export type NotesFin = {
  pos: number;
  /** Titre du bloc (« Notes », « Notes de la partie 2 »). */
  titre: string;
  notes: { numero: string; texte: string }[];
  /** Blancs de page à l'intérieur du bloc, avant la note d'indice `avant`. */
  coupures: { avant: number; hauteur: number; numero: number }[];
};

type Etat = { coupures: Coupure[]; notesFin: NotesFin[] };

const CLE = new PluginKey<Etat>("coupuresCalame");

function etiquette(numero: number): HTMLSpanElement {
  const e = document.createElement("span");
  e.className = "calame-coupure-numero";
  e.textContent = `Page ${numero}`;
  return e;
}

function blancDeBloc(c: Coupure): HTMLElement {
  const blanc = document.createElement("div");
  blanc.className = "calame-coupure";
  blanc.setAttribute("contenteditable", "false");
  blanc.setAttribute("data-blanc", "page");
  blanc.setAttribute("aria-hidden", "true");
  blanc.style.height = `${Math.max(0, c.hauteur)}px`;
  blanc.appendChild(etiquette(c.numero));
  return blanc;
}

function blancDeLigne(c: Coupure): HTMLElement {
  const blanc = document.createElement("span");
  blanc.className = "calame-coupure calame-coupure-ligne";
  blanc.setAttribute("contenteditable", "false");
  blanc.setAttribute("data-blanc", "ligne");
  blanc.setAttribute("aria-hidden", "true");
  blanc.dataset.blancHauteur = String(Math.max(c.hauteur, c.effective ?? c.hauteur));
  blanc.style.height = `${Math.max(0, c.hauteur)}px`;
  blanc.appendChild(etiquette(c.numero));
  return blanc;
}

function blancDeRangee(c: Coupure): HTMLElement {
  const rangee = document.createElement("tr");
  rangee.className = "calame-coupure-rangee";
  rangee.setAttribute("contenteditable", "false");
  rangee.setAttribute("data-blanc", "rangee");
  rangee.setAttribute("aria-hidden", "true");
  const cellule = document.createElement("td");
  cellule.colSpan = Math.max(1, c.colonnes ?? 1);
  cellule.style.height = `${Math.max(0, c.hauteur)}px`;
  cellule.appendChild(etiquette(c.numero));
  rangee.appendChild(cellule);
  return rangee;
}

/** La ligne d'en-tête d'un tableau, recopiée en haut de la page où il se poursuit. */
function enteteRecopiee(view: EditorView, c: Coupure): HTMLElement {
  const rangee = document.createElement("tr");
  rangee.className = "calame-entete-repetee";
  rangee.setAttribute("contenteditable", "false");
  rangee.setAttribute("data-blanc", "rangee");
  rangee.setAttribute("aria-hidden", "true");
  try {
    const dom = c.tableau !== undefined ? (view.nodeDOM(c.tableau) as HTMLElement | null) : null;
    const premiere = dom?.querySelector("tbody > tr:not([data-blanc])");
    if (premiere) for (const cellule of Array.from(premiere.children)) rangee.appendChild(cellule.cloneNode(true));
  } catch {
    // Le tableau a bougé entre deux mesures : la prochaine pose recopiera la bonne ligne.
  }
  return rangee;
}

function blocNotesFin(n: NotesFin): HTMLElement {
  const bloc = document.createElement("section");
  bloc.className = "calame-notes-fin";
  bloc.setAttribute("contenteditable", "false");
  bloc.setAttribute("data-widget", "");
  bloc.setAttribute("data-notes-fin", "");
  bloc.dataset.pos = String(n.pos);
  const titre = document.createElement("p");
  titre.className = "calame-notes-fin-titre";
  titre.textContent = n.titre;
  bloc.appendChild(titre);
  n.notes.forEach((note, i) => {
    const coupure = n.coupures.find((c) => c.avant === i);
    if (coupure) {
      const blanc = document.createElement("div");
      blanc.className = "calame-coupure";
      blanc.setAttribute("data-blanc", "page");
      blanc.setAttribute("aria-hidden", "true");
      blanc.style.height = `${Math.max(0, coupure.hauteur)}px`;
      blanc.appendChild(etiquette(coupure.numero));
      bloc.appendChild(blanc);
    }
    const p = document.createElement("p");
    p.className = "calame-note";
    p.setAttribute("data-note-fin", "");
    const numero = document.createElement("span");
    numero.className = "calame-note-numero";
    numero.textContent = note.numero;
    p.append(numero, document.createTextNode(` ${note.texte || "Note vide"}`));
    bloc.appendChild(p);
  });
  return bloc;
}

export const CoupuresDePage = Extension.create({
  name: "coupuresCalame",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: CLE,
        state: {
          init: (): Etat => ({ coupures: [], notesFin: [] }),
          apply: (tr, valeur): Etat => {
            const meta = tr.getMeta(CLE) as Partial<Etat> | undefined;
            if (meta) return { coupures: meta.coupures ?? valeur.coupures, notesFin: meta.notesFin ?? valeur.notesFin };
            if (!tr.docChanged) return valeur;
            // Le texte a bougé avant la prochaine mesure : les blancs suivent leur place.
            return {
              coupures: valeur.coupures.map((c) => ({ ...c, pos: tr.mapping.map(c.pos, -1), tableau: c.tableau === undefined ? undefined : tr.mapping.map(c.tableau, 1) })),
              notesFin: valeur.notesFin.map((n) => ({ ...n, pos: tr.mapping.map(n.pos, -1) })),
            };
          },
        },
        props: {
          decorations(etat) {
            const { coupures, notesFin } = CLE.getState(etat) ?? { coupures: [], notesFin: [] };
            if (coupures.length === 0 && notesFin.length === 0) return DecorationSet.empty;
            const decorations: Decoration[] = [];
            const max = etat.doc.content.size;
            for (const n of notesFin) {
              if (n.pos < 0 || n.pos > max || n.notes.length === 0) continue;
              const cle = `notes-${n.pos}-${n.notes.map((x) => `${x.numero}:${x.texte}`).join("|")}-${n.coupures.map((c) => `${c.avant}:${Math.round(c.hauteur)}`).join(",")}`;
              decorations.push(Decoration.widget(n.pos, () => blocNotesFin(n), { side: -2, key: cle, ignoreSelection: true }));
            }
            for (const c of coupures) {
              if (c.pos < 0 || c.pos > max) continue;
              const h = Math.round(c.hauteur);
              if (c.genre === "ligne") {
                decorations.push(Decoration.widget(c.pos, () => blancDeLigne(c), { side: -1, key: `ligne-${c.pos}-${h}-${c.numero}`, ignoreSelection: true }));
              } else if (c.genre === "rangee") {
                decorations.push(Decoration.widget(c.pos, () => blancDeRangee(c), { side: -2, key: `rangee-${c.pos}-${h}-${c.numero}`, ignoreSelection: true }));
                if (c.tableau !== undefined) {
                  const entete = etat.doc.nodeAt(c.tableau)?.firstChild?.textContent ?? "";
                  decorations.push(Decoration.widget(c.pos, (view) => enteteRecopiee(view, c), { side: -1, key: `entete-${c.pos}-${c.tableau}-${entete}`, ignoreSelection: true }));
                }
              } else {
                decorations.push(Decoration.widget(c.pos, () => blancDeBloc(c), { side: c.avantNotes ? -3 : -1, key: `coupure-${c.pos}-${h}-${c.numero}`, ignoreSelection: true }));
              }
            }
            return DecorationSet.create(etat.doc, decorations);
          },
        },
      }),
    ];
  },
});

function memesCoupures(a: Coupure[], b: Coupure[]): boolean {
  return (
    a.length === b.length &&
    a.every((c, i) => {
      const d = b[i];
      return c.pos === d.pos && Math.abs(c.hauteur - d.hauteur) < 0.5 && c.genre === d.genre && c.numero === d.numero && c.tableau === d.tableau && c.avantNotes === d.avantNotes;
    })
  );
}

function memesNotes(a: NotesFin[], b: NotesFin[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Pose (ou remplace) les blancs de coupure et les notes de fin. Ne modifie pas le document. */
export function appliquerCoupures(editor: Editor, coupures: Coupure[], notesFin?: NotesFin[]): boolean {
  const actuel = CLE.getState(editor.state) ?? { coupures: [], notesFin: [] };
  const notes = notesFin ?? actuel.notesFin;
  if (memesCoupures(actuel.coupures, coupures) && memesNotes(actuel.notesFin, notes)) return false;
  const tr = editor.state.tr.setMeta(CLE, { coupures, notesFin: notes });
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
  return true;
}
