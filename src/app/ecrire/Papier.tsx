"use client";

import type { Editor } from "@tiptap/core";
import { EditorContent } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cssStylesNommes, geometrie, margesDeLaPage, MM, variablesDeStyle, zonesDeLaPage, type ReglagesPage, type ZonesLigne } from "@/lib/atelier/modele";
import { composer, numeroAffiche, partieDeLaPage, remplirGabarit, type LigneMesuree, type UniteMesuree } from "@/lib/atelier/composition";
import { appliquerCoupures, type Coupure, type NotesFin } from "./pages-extension";
import { notesDuDocument, reglerNumeros, titresNumerotes } from "./extensions/numeros";
import { publierMiseEnPage } from "./pages-store";
import type { ApercuPage, BlocApercu } from "./Miniatures";

/** Blanc laissé entre deux feuilles, à l'écran. */
export const ECART = 30;
/** Blanc et filet au-dessus des notes de bas de page. */
const FILET_NOTES = 16;
/** Écart entre deux notes de bas de page. */
const ECART_NOTES = 3;
/** Au-delà, on cesse de reposer des blancs tant que le texte n'a pas changé (garde-fou contre une mise en page qui oscille). */
const MAX_POSES = 6;

/*
 * Un seul texte, coupé en pages par des blancs calculés (pages-extension.ts) :
 *   • un paragraphe se coupe entre deux lignes, sans ligne seule en bas ou en haut ;
 *   • un tableau se coupe entre deux rangées, sa ligne d'en-tête recopiée en haut de la suite ;
 *   • les notes s'impriment en bas de la page où elles sont appelées ;
 *   • en-têtes, pieds, numéros, filigrane et bordure sont dessinés sur chaque feuille.
 * L'impression recopie ces feuilles telles quelles (impression.ts) : l'écran et le papier
 * tombent exactement au même endroit.
 */

type Props = {
  editor: Editor | null;
  reglages: ReglagesPage;
  titre: string;
  /** Auteur (propriétés du document), pour le jeton {auteur}. */
  auteur?: string;
  /** Prévenu quand le nombre de pages change, pour l'afficher ailleurs. */
  surPages?: (nombre: number) => void;
  /** Agrandissement à l'écran (1 = 100 %) : la mise en page, elle, ne change pas. */
  zoom?: number;
  /** La silhouette de chaque page, pour les miniatures. */
  surApercu?: (pages: ApercuPage[]) => void;
  /** Le conteneur qui défile (pour aller à une page, garder la ligne au milieu…). */
  refScene?: React.Ref<HTMLDivElement>;
};

/** Ce que chaque feuille affiche autour du texte. */
export type InfosPage = {
  numero: number;
  etiquette: string;
  partie: string;
  notes: { numero: string; texte: string }[];
  hauteurNotes: number;
  /** Numéros de ligne : hauteur depuis le haut de la feuille. */
  lignes: { y: number; n: number }[];
};

type Unite = {
  el: HTMLElement;
  pos: number;
  genre: "p" | "li" | "titre" | "tableau" | "notes" | "autre";
  tableau?: { colonnes: number; entete: boolean; rangees: { pos: number; el: HTMLElement }[] };
};

type LigneDom = LigneMesuree & { noeud: Text | null; fragment: number; ecranHaut: number };

const LISTES = ["bulletList", "orderedList", "taskList"];

/** Les enfants qui sont du texte (ni blanc de page, ni petit widget de l'atelier). */
function enfantsDuTexte(el: Element): HTMLElement[] {
  return (Array.from(el.children) as HTMLElement[]).filter((e) => !e.hasAttribute("data-blanc") && !e.hasAttribute("data-widget"));
}

/** Première position (caractère) d'un nœud texte qui tombe sur la ligne commençant à `haut` (coordonnées de l'écran). */
function debutDeFragment(noeud: Text, haut: number): number {
  const r = document.createRange();
  let bas = 0;
  let fin = noeud.length;
  while (bas < fin) {
    const milieu = (bas + fin) >> 1;
    r.setStart(noeud, milieu);
    r.setEnd(noeud, Math.min(noeud.length, milieu + 1));
    const rect = r.getBoundingClientRect();
    if (rect.top + rect.height / 2 >= haut) fin = milieu;
    else bas = milieu + 1;
  }
  return bas;
}

export function Papier({ editor, reglages, titre, auteur = "", surPages, zoom = 1, surApercu, refScene }: Props) {
  const flux = useRef<HTMLDivElement>(null);
  const mesureNotes = useRef<HTMLDivElement>(null);
  const attente = useRef<number | null>(null);
  const relance = useRef<number | null>(null);
  const poses = useRef(0);
  const zoomRef = useRef(zoom);
  const surApercuRef = useRef(surApercu);
  const surPagesRef = useRef(surPages);
  const reglagesRef = useRef(reglages);
  useEffect(() => {
    zoomRef.current = zoom;
    surApercuRef.current = surApercu;
    surPagesRef.current = surPages;
    reglagesRef.current = reglages;
  });
  const [infos, setInfos] = useState<InfosPage[]>([{ numero: 1, etiquette: "1", partie: "", notes: [], hauteurNotes: 0, lignes: [] }]);
  const g = geometrie(reglages);

  const mesurer = useCallback(
    (complet: boolean) => {
      const zone = flux.current?.querySelector<HTMLElement>(".tiptap");
      if (!zone || !editor || editor.isDestroyed) return;
      const r = reglagesRef.current;
      const geo = geometrie(r);
      const z = zoomRef.current || 1;
      const origine = zone.getBoundingClientRect().top;
      const ecran = (y: number) => (y - origine) / z;
      const view = editor.view;

      /*
       * Les blancs déjà posés faussent les positions : on les retranche pour raisonner
       * toujours dans le texte « à plat », ce qui rend le calcul stable d'une mesure à l'autre.
       */
      const blancs = (Array.from(zone.querySelectorAll<HTMLElement>("[data-blanc]")) as HTMLElement[])
        .map((b) => ({ haut: ecran(b.getBoundingClientRect().top), hauteur: Number(b.dataset.blancHauteur) || b.offsetHeight }))
        .sort((a, b) => a.haut - b.haut);
      const cumuls: number[] = [];
      let somme = 0;
      for (const b of blancs) cumuls.push((somme += b.hauteur));
      const aPlat = (y: number) => {
        let bas = 0;
        let fin = blancs.length;
        while (bas < fin) {
          const m = (bas + fin) >> 1;
          if (blancs[m].haut < y - 0.5) bas = m + 1;
          else fin = m;
        }
        return y - (bas > 0 ? cumuls[bas - 1] : 0);
      };

      // ---------------------------------------------------------------- les unités
      const unitesDom: Unite[] = [];
      const domBlocs = enfantsDuTexte(zone);
      editor.state.doc.forEach((noeud, offset, i) => {
        const el = domBlocs[i];
        if (!el) return;
        const nom = noeud.type.name;
        if (LISTES.includes(nom)) {
          const puces = enfantsDuTexte(el);
          if (puces.length === noeud.childCount && puces.length > 1) {
            noeud.forEach((item, o, j) => {
              const simple = item.childCount > 0 && item.content.content.every((c) => c.type.name === "paragraph");
              unitesDom.push({ el: puces[j], pos: offset + 1 + o, genre: simple ? "li" : "autre" });
            });
            return;
          }
        }
        if (nom === "paragraph") unitesDom.push({ el, pos: offset, genre: "p" });
        else if (nom === "heading") unitesDom.push({ el, pos: offset, genre: "titre" });
        else if (nom === "table") {
          const corps = el.querySelector(":scope table > tbody") ?? el.querySelector("tbody");
          const rangeesDom = corps ? enfantsDuTexte(corps) : [];
          const rangees: { pos: number; el: HTMLElement }[] = [];
          noeud.forEach((_, o, j) => {
            if (rangeesDom[j]) rangees.push({ pos: offset + 1 + o, el: rangeesDom[j] });
          });
          const premiere = noeud.firstChild;
          const entete = !!premiere && premiere.childCount > 0 && premiere.content.content.every((c) => c.type.name === "tableHeader");
          let colonnes = 0;
          premiere?.forEach((c) => (colonnes += Number(c.attrs.colspan) || 1));
          unitesDom.push({ el, pos: offset, genre: rangees.length === noeud.childCount && rangees.length > 1 ? "tableau" : "autre", tableau: { colonnes: Math.max(1, colonnes), entete, rangees } });
        } else unitesDom.push({ el, pos: offset, genre: "autre" });
      });
      for (const bloc of Array.from(zone.querySelectorAll<HTMLElement>(":scope > [data-notes-fin]"))) {
        unitesDom.push({ el: bloc, pos: Number(bloc.dataset.pos ?? 0), genre: "notes" });
      }
      // Les notes de fin sont des décorations : on les remet à leur place, dans l'ordre de l'écran.
      const hauts = new Map(unitesDom.map((u) => [u, u.el.getBoundingClientRect().top] as const));
      unitesDom.sort((a, b) => (hauts.get(a) ?? 0) - (hauts.get(b) ?? 0));

      /** Les lignes d'un paragraphe : fragments de texte regroupés par ligne, bornes à plat. */
      const lignesDuTexte = (el: HTMLElement): LigneDom[] => {
        const fragments: { haut: number; bas: number; noeud: Text; fragment: number }[] = [];
        const parcours = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) => (n.parentElement?.closest("[data-blanc]") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        const plage = document.createRange();
        for (let n = parcours.nextNode() as Text | null; n; n = parcours.nextNode() as Text | null) {
          if (!n.length) continue;
          plage.selectNodeContents(n);
          Array.from(plage.getClientRects()).forEach((rect, k) => {
            if (rect.height === 0) return;
            fragments.push({ haut: rect.top, bas: rect.bottom, noeud: n, fragment: k });
          });
        }
        fragments.sort((a, b) => a.haut - b.haut);
        const groupes: { haut: number; bas: number; noeud: Text; fragment: number; ordre: number }[] = [];
        fragments.forEach((f, ordre) => {
          const der = groupes[groupes.length - 1];
          const recouvre = der ? Math.min(der.bas, f.bas) - Math.max(der.haut, f.haut) : -1;
          if (der && recouvre > 0.5 * Math.min(der.bas - der.haut, f.bas - f.haut)) {
            der.haut = Math.min(der.haut, f.haut);
            der.bas = Math.max(der.bas, f.bas);
          } else groupes.push({ ...f, ordre });
        });
        // Le premier fragment d'une ligne, dans l'ordre du texte (pas forcément le plus haut).
        for (const gr of groupes) {
          let meilleur: { noeud: Text; fragment: number } | null = null;
          for (const f of fragments) {
            if (f.haut + (f.bas - f.haut) / 2 < gr.haut || f.haut + (f.bas - f.haut) / 2 > gr.bas) continue;
            if (!meilleur) meilleur = f;
            else {
              const ordre = meilleur.noeud.compareDocumentPosition(f.noeud);
              if (ordre & Node.DOCUMENT_POSITION_PRECEDING || (meilleur.noeud === f.noeud && f.fragment < meilleur.fragment)) meilleur = f;
            }
          }
          if (meilleur) {
            gr.noeud = meilleur.noeud;
            gr.fragment = meilleur.fragment;
          }
        }
        const rect = el.getBoundingClientRect();
        const plats = groupes.map((l) => ({ haut: aPlat(ecran(l.haut)), bas: aPlat(ecran(l.bas)) }));
        return groupes.map((l, i) => ({
          haut: i === 0 ? aPlat(ecran(rect.top)) : (plats[i - 1].bas + plats[i].haut) / 2,
          bas: i === groupes.length - 1 ? aPlat(ecran(rect.bottom)) : (plats[i].bas + plats[i + 1].haut) / 2,
          noeud: l.noeud,
          fragment: l.fragment,
          ecranHaut: l.haut,
        }));
      };

      const memoLignes = new Map<number, LigneDom[]>();
      const lignesDe = (index: number): LigneDom[] => {
        let l = memoLignes.get(index);
        if (!l) {
          const u = unitesDom[index];
          if (u.genre === "tableau" && u.tableau) {
            l = u.tableau.rangees.map((rg) => {
              const rr = rg.el.getBoundingClientRect();
              return { haut: aPlat(ecran(rr.top)), bas: aPlat(ecran(rr.bottom)), noeud: null, fragment: 0, ecranHaut: rr.top };
            });
          } else if (u.genre === "notes") {
            const items = Array.from(u.el.querySelectorAll<HTMLElement>(":scope > [data-note-fin]"));
            const rect = u.el.getBoundingClientRect();
            const plats = items.map((it) => {
              const rr = it.getBoundingClientRect();
              return { haut: aPlat(ecran(rr.top)), bas: aPlat(ecran(rr.bottom)) };
            });
            l = plats.map((p, i) => ({
              haut: i === 0 ? aPlat(ecran(rect.top)) : (plats[i - 1].bas + p.haut) / 2,
              bas: i === plats.length - 1 ? aPlat(ecran(rect.bottom)) : (p.bas + plats[i + 1].haut) / 2,
              noeud: null,
              fragment: 0,
              ecranHaut: 0,
            }));
          } else l = lignesDuTexte(u.el);
          memoLignes.set(index, l);
        }
        return l;
      };

      // ---------------------------------------------------------------- notes de bas de page
      const notes = notesDuDocument(editor.state.doc);
      const notesEnBas = r.notes === "bas";
      const hauteursNotes = new Map<string, number>();
      const mesureur = mesureNotes.current;
      if (notesEnBas && mesureur && notes.length > 0) {
        while (mesureur.children.length < notes.length) {
          const p = document.createElement("p");
          p.className = "calame-note";
          p.append(Object.assign(document.createElement("span"), { className: "calame-note-numero" }), document.createTextNode(""));
          mesureur.appendChild(p);
        }
        while (mesureur.children.length > notes.length) mesureur.lastElementChild?.remove();
        notes.forEach((n, i) => {
          const p = mesureur.children[i] as HTMLElement;
          (p.firstChild as HTMLElement).textContent = n.numero;
          (p.lastChild as Text).textContent = ` ${n.texte || "Note vide"}`;
        });
        notes.forEach((n, i) => hauteursNotes.set(n.numero, (mesureur.children[i] as HTMLElement).offsetHeight + ECART_NOTES));
      } else if (mesureur) mesureur.replaceChildren();

      // ---------------------------------------------------------------- composition
      const unites: UniteMesuree[] = unitesDom.map((u, index) => {
        const rect = u.el.getBoundingClientRect();
        const haut = aPlat(ecran(rect.top));
        const bas = aPlat(ecran(rect.bottom));
        const unite: UniteMesuree = { id: String(index), haut, hauteur: Math.max(0, bas - haut), insecable: true, sautAvant: u.el.classList.contains("saut-page") };
        const avant = index > 0 ? unitesDom[index - 1].el : null;
        if (avant && (avant.hasAttribute("data-saut-apres") || avant.querySelector(":scope > [data-saut-apres]"))) unite.sautAvant = true;
        if (u.genre === "p" || u.genre === "li") {
          unite.insecable = false;
          unite.lignes = () => lignesDe(index);
        } else if (u.genre === "titre") unite.avecSuivant = true;
        else if (u.genre === "tableau" && u.tableau) {
          unite.insecable = false;
          unite.lignes = () => lignesDe(index);
          unite.minAvant = u.tableau.entete ? 2 : 1;
          unite.minApres = 1;
          unite.repete = u.tableau.entete ? u.tableau.rangees[0].el.getBoundingClientRect().height / z : 0;
        } else if (u.genre === "notes") {
          unite.insecable = false;
          unite.lignes = () => lignesDe(index);
          unite.minAvant = 1;
          unite.minApres = 1;
        }
        if (notesEnBas) {
          const appels = Array.from(u.el.querySelectorAll<HTMLElement>(".note-marqueur[data-numero]"));
          if (appels.length > 0)
            unite.notes = appels.map((a) => {
              const ra = a.getBoundingClientRect();
              return { id: a.dataset.numero ?? "", y: aPlat(ecran((ra.top + ra.bottom) / 2)) };
            });
        }
        return unite;
      });

      const composition = composer(unites, {
        hauteurUtile: () => geo.zone.hauteur,
        hauteurNote: (id) => hauteursNotes.get(id) ?? 0,
        filetNotes: FILET_NOTES,
        veuves: r.veuves,
      });
      const pages = composition.pages;

      // ---------------------------------------------------------------- les blancs à poser
      const coupures: Coupure[] = [];
      const coupuresNotesFin = new Map<number, NotesFin["coupures"]>();
      let cumul = 0;
      pages.forEach((page, i) => {
        if (i === 0 || !page.ouverture) return;
        const o = page.ouverture;
        const u = unitesDom[Number(o.unite)];
        if (!u) return;
        const cible = i * (geo.page.hauteur + ECART);
        const hauteur = Math.max(0, Math.round(cible - (o.y + cumul)));
        if (o.ligne === 0) {
          coupures.push({ pos: u.pos, hauteur, numero: i + 1, avantNotes: u.genre === "notes" });
          cumul += hauteur;
        } else if (u.genre === "tableau" && u.tableau) {
          const rg = u.tableau.rangees[o.ligne];
          if (!rg) return;
          coupures.push({ pos: rg.pos, hauteur, numero: i + 1, genre: "rangee", colonnes: u.tableau.colonnes, tableau: u.tableau.entete ? u.pos : undefined });
          cumul += hauteur + (u.tableau.entete ? o.repete : 0);
        } else if (u.genre === "notes") {
          const liste = coupuresNotesFin.get(u.pos) ?? [];
          liste.push({ avant: o.ligne, hauteur, numero: i + 1 });
          coupuresNotesFin.set(u.pos, liste);
          cumul += hauteur;
        } else {
          const ligne = lignesDe(Number(o.unite))[o.ligne];
          let pos: number | null = null;
          if (ligne?.noeud) {
            try {
              const offset = ligne.fragment === 0 ? 0 : debutDeFragment(ligne.noeud, ligne.ecranHaut + 1);
              pos = view.posAtDOM(ligne.noeud, offset);
            } catch {
              pos = null;
            }
          }
          if (pos === null) {
            // Ligne introuvable (texte en train de changer) : le bloc entier ouvre la page.
            coupures.push({ pos: u.pos, hauteur: Math.max(0, Math.round(cible - (unites[Number(o.unite)].haut + cumul))), numero: i + 1 });
            cumul += coupures[coupures.length - 1].hauteur;
            return;
          }
          const interligne = parseFloat(getComputedStyle(u.el).lineHeight) || 0;
          const effective = Math.max(hauteur, interligne);
          coupures.push({ pos, hauteur, numero: i + 1, genre: "ligne", effective });
          cumul += effective;
        }
      });

      // ---------------------------------------------------------------- notes de fin
      let notesFin: NotesFin[] = [];
      if (!notesEnBas && notes.length > 0) {
        const doc = editor.state.doc;
        if (r.notes === "fin-document") {
          notesFin = [{ pos: doc.content.size, titre: "Notes", notes: notes.map((n) => ({ numero: n.numero, texte: n.texte })), coupures: [] }];
        } else {
          // Une partie s'arrête au titre de niveau 1 suivant : ses notes se rangent juste avant lui.
          const parties: number[] = [];
          doc.forEach((n, offset) => {
            if (n.type.name === "heading" && Number(n.attrs.level) === 2) parties.push(offset);
          });
          const bornes = [...parties.filter((p) => p > 0), doc.content.size];
          let debut = 0;
          for (const fin of bornes) {
            const dedans = notes.filter((n) => n.pos >= debut && n.pos < fin);
            if (dedans.length > 0) {
              const titrePartie = parties.filter((p) => p < fin && p >= debut).map((p) => doc.nodeAt(p)?.textContent.trim() ?? "")[0];
              notesFin.push({ pos: fin, titre: titrePartie ? `Notes — ${titrePartie}` : "Notes", notes: dedans.map((n) => ({ numero: n.numero, texte: n.texte })), coupures: [] });
            }
            debut = fin;
          }
        }
        notesFin = notesFin.map((n) => ({ ...n, coupures: coupuresNotesFin.get(n.pos) ?? [] }));
      }

      if (poses.current < MAX_POSES) {
        if (appliquerCoupures(editor, coupures, notesFin)) poses.current++;
      }

      // ---------------------------------------------------------------- ce que dessine chaque feuille
      const debuts = pages.map((p, i) => (i === 0 ? 0 : (p.ouverture?.y ?? p.debut)));
      const pageDe = (y: number) => {
        let k = 0;
        while (k + 1 < debuts.length && debuts[k + 1] <= y + 0.5) k++;
        return k;
      };
      const titres = titresNumerotes(editor.state.doc, false).map((t) => {
        const dom = view.nodeDOM(t.pos) as HTMLElement | null;
        return { ...t, y: dom?.getBoundingClientRect ? aPlat(ecran(dom.getBoundingClientRect().top)) : 0 };
      });
      const parties = titres.filter((t) => t.niveau === 2).map((t) => ({ y: t.y, texte: t.texte }));
      const etiquette = (i: number) => numeroAffiche(i + 1, { style: r.numeroStyle, premier: r.premierNumero, liminaires: r.pagesLiminaires });

      // Numéros de ligne (seulement s'ils sont demandés, et pas à chaque frappe).
      const lignesParPage = new Map<number, { y: number; n: number }[]>();
      if (r.numerosLignes && complet) {
        const compte = new Map<number, number>();
        unitesDom.forEach((u, index) => {
          if (u.genre !== "p" && u.genre !== "li" && u.genre !== "titre") return;
          for (const l of lignesDe(index)) {
            const y = ecran(l.ecranHaut);
            const p = Math.max(0, Math.floor(y / (geo.page.hauteur + ECART)));
            const n = (compte.get(p) ?? 0) + 1;
            compte.set(p, n);
            if (n % 5 !== 0) continue;
            const liste = lignesParPage.get(p) ?? [];
            liste.push({ y: y - p * (geo.page.hauteur + ECART) + r.marges.haut * MM, n });
            lignesParPage.set(p, liste);
          }
        });
      }

      const parNumero = new Map(notes.map((n) => [n.numero, n.texte] as const));
      const nouvelles: InfosPage[] = pages.map((p, i) => ({
        numero: i + 1,
        etiquette: etiquette(i),
        partie: partieDeLaPage(parties, debuts[i], debuts[i + 1] ?? Number.POSITIVE_INFINITY),
        notes: notesEnBas ? p.notes.map((id) => ({ numero: id, texte: parNumero.get(id) ?? "" })) : [],
        hauteurNotes: notesEnBas ? p.hauteurNotes : 0,
        lignes: r.numerosLignes ? (complet ? (lignesParPage.get(i) ?? []) : []) : [],
      }));
      setInfos((anciennes) => {
        if (r.numerosLignes && !complet) nouvelles.forEach((n, i) => (n.lignes = anciennes[i]?.lignes ?? []));
        return JSON.stringify(anciennes) === JSON.stringify(nouvelles) ? anciennes : nouvelles;
      });
      surPagesRef.current?.(pages.length);

      // La table des matières, les renvois et la table des figures lisent ces numéros de page.
      const figures = new Map<number, string>();
      const tableaux = new Map<number, string>();
      let nf = 0;
      let nt = 0;
      editor.state.doc.descendants((n, pos) => {
        if (n.type.name !== "image" && n.type.name !== "table") return true;
        const dom = view.nodeDOM(pos) as HTMLElement | null;
        const y = dom?.getBoundingClientRect ? aPlat(ecran(dom.getBoundingClientRect().top)) : 0;
        if (n.type.name === "image") figures.set(++nf, etiquette(pageDe(y)));
        else tableaux.set(++nt, etiquette(pageDe(y)));
        return false;
      });
      const pageDeLElement = (el: Element) => etiquette(pageDe(aPlat(ecran(el.getBoundingClientRect().top))));
      const ancres = new Map<string, string>();
      for (const el of Array.from(zone.querySelectorAll<HTMLElement>("[data-ancre]"))) if (el.dataset.ancre) ancres.set(el.dataset.ancre, pageDeLElement(el));
      const legendes = new Map<string, string>();
      for (const el of Array.from(zone.querySelectorAll<HTMLElement>("[data-legende-cle]"))) if (el.dataset.legendeCle) legendes.set(el.dataset.legendeCle, pageDeLElement(el));
      const index = new Map<string, string[]>();
      for (const el of Array.from(zone.querySelectorAll<HTMLElement>("[data-index]"))) {
        const terme = (el.dataset.index || el.textContent || "").trim();
        if (!terme) continue;
        const liste = index.get(terme) ?? [];
        const p = pageDeLElement(el);
        if (!liste.includes(p)) liste.push(p);
        index.set(terme, liste);
      }
      publierMiseEnPage(editor, {
        pages: pages.length,
        titres: new Map(titres.map((t) => [t.ordinal, etiquette(pageDe(t.y))])),
        figures,
        tableaux,
        ancres,
        legendes,
        index,
      });

      // La silhouette des pages (pour les miniatures), positions rapportées à la feuille.
      if (surApercuRef.current) {
        const margeHaut = r.marges.haut * MM;
        const apercu: ApercuPage[] = pages.map((page, i) => ({
          numero: page.numero,
          ratio: geo.page.largeur / geo.page.hauteur,
          blocs: page.unites.slice(0, 80).map((id) => {
            const bloc = unites[Number(id)];
            const el = unitesDom[Number(id)]?.el;
            const balise = el?.tagName ?? "";
            const genre: BlocApercu["genre"] = /^H[2-6]$/.test(balise)
              ? "titre"
              : el?.querySelector("img") || balise === "FIGURE"
                ? "image"
                : el?.querySelector("table") || balise === "TABLE"
                  ? "tableau"
                  : balise === "P" || balise === "LI" || balise === "BLOCKQUOTE"
                    ? "texte"
                    : "autre";
            const haut = Math.max(0, bloc.haut - debuts[i]) + margeHaut;
            const bas = Math.min(bloc.haut + bloc.hauteur, debuts[i + 1] ?? Number.POSITIVE_INFINITY) - debuts[i] + margeHaut;
            return {
              genre,
              haut: Math.min(1, haut / geo.page.hauteur),
              hauteur: Math.max(0, Math.min(1 - Math.min(1, haut / geo.page.hauteur), (bas - haut) / geo.page.hauteur)),
              texte: genre === "titre" ? (el?.textContent ?? "").trim().slice(0, 48) : undefined,
            };
          }),
        }));
        surApercuRef.current(apercu);
      }
    },
    [editor],
  );

  /*
   * Deux mesures : une tout de suite après le prochain rendu, une autre juste
   * derrière. La seconde rattrape ce qui n'était pas encore en place à la
   * première — une image qui vient d'arriver, un bloc inséré à l'instant — et
   * calcule ce qui coûte (numéros de ligne).
   */
  const demanderMesure = useCallback(() => {
    if (attente.current !== null) return;
    attente.current = requestAnimationFrame(() => {
      attente.current = null;
      mesurer(false);
      if (relance.current !== null) clearTimeout(relance.current);
      relance.current = window.setTimeout(() => {
        relance.current = null;
        mesurer(true);
      }, 180);
    });
  }, [mesurer]);

  const nouvelleDonne = useCallback(() => {
    poses.current = 0;
    demanderMesure();
  }, [demanderMesure]);

  useEffect(() => {
    if (!editor) return;
    const zone = flux.current?.querySelector<HTMLElement>(".tiptap");
    editor.on("update", nouvelleDonne);
    const observateur = zone ? new ResizeObserver(demanderMesure) : null;
    if (zone && observateur) observateur.observe(zone);
    window.addEventListener("resize", nouvelleDonne);
    // Les polices arrivent après le premier rendu : elles changent la hauteur des lignes.
    void document.fonts?.ready.then(() => nouvelleDonne());
    nouvelleDonne();
    return () => {
      editor.off("update", nouvelleDonne);
      observateur?.disconnect();
      window.removeEventListener("resize", nouvelleDonne);
      if (attente.current !== null) cancelAnimationFrame(attente.current);
      if (relance.current !== null) clearTimeout(relance.current);
    };
  }, [editor, demanderMesure, nouvelleDonne]);

  // Changer de format, de marges, de police ou de numérotation refait tomber le texte ailleurs.
  useEffect(() => {
    if (editor && !editor.isDestroyed) reglerNumeros(editor, { titres: reglages.numeroterTitres });
    nouvelleDonne();
  }, [editor, nouvelleDonne, reglages, zoom]);

  const hauteurTotale = infos.length * (g.page.hauteur + ECART) - ECART;
  // Les marges de gauche et de droite en proportion de la page : identiques sur une page entière,
  // et resserrées avec elle quand l'écran est plus étroit que le papier (téléphone).
  const enPourcent = (px: number) => `${(px / g.page.largeur) * 100}%`;
  const margeX = (mm: number) => enPourcent(mm * MM);
  const nombrePages = infos.length;

  return (
    <div className="calame-scene" ref={refScene}>
      <div className="calame-zoom" data-zoom={zoom !== 1 ? "" : undefined} style={zoom !== 1 ? { width: g.page.largeur * zoom, height: hauteurTotale * zoom } : undefined}>
        <div
          ref={flux}
          className="calame-flux"
          lang="fr"
          data-sombre={reglages.papierSombre ? "" : undefined}
          data-reperes={reglages.reperes ? "" : undefined}
          data-cesure={reglages.cesure ? "" : undefined}
          data-lettrine={reglages.lettrine ? "" : undefined}
          data-alinea={reglages.alinea > 0 ? "" : undefined}
          data-titres-numerotes={reglages.numeroterTitres ? "" : undefined}
          data-notes={reglages.notes}
          data-justifier={reglages.justifier ? "" : undefined}
          style={{ ...(variablesDeStyle(reglages) as React.CSSProperties), width: g.page.largeur, height: hauteurTotale, ...(zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: "0 0" } : {}) }}
        >
          <div className="calame-feuilles" aria-hidden="true">
            {infos.map((page) => (
              <Feuille key={page.numero} page={page} reglages={reglages} titre={titre} auteur={auteur} pages={nombrePages} hauteur={g.page.hauteur} largeur={g.page.largeur} margeX={margeX} enPourcent={enPourcent} />
            ))}
          </div>

          <div
            className="calame-texte"
            style={{
              paddingTop: reglages.marges.haut * MM,
              paddingBottom: reglages.marges.bas * MM,
              paddingLeft: margeX(reglages.marges.gauche),
              paddingRight: margeX(reglages.marges.droite),
            }}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Les styles nommés du document : une règle par style, que l'impression (qui recopie les pages) suit aussi. */}
          <style>{cssStylesNommes(reglages.stylesNommes)}</style>

          {/* Les notes y sont composées une à une, hors de la vue, pour mesurer la place qu'elles prendront en bas de page. */}
          <div ref={mesureNotes} className="calame-notes-bas calame-notes-mesure" aria-hidden="true" style={{ left: margeX(reglages.marges.gauche), right: margeX(reglages.marges.droite) }} />
        </div>
      </div>
    </div>
  );
}

type PropsFeuille = {
  page: InfosPage;
  reglages: ReglagesPage;
  titre: string;
  auteur: string;
  pages: number;
  hauteur: number;
  largeur: number;
  margeX: (mm: number) => string;
  enPourcent: (px: number) => string;
};

/** Une feuille : le papier, et tout ce qui s'y imprime autour du texte. */
function Feuille({ page, reglages, titre, auteur, pages, hauteur, largeur, margeX, enPourcent }: PropsFeuille) {
  const haut = (page.numero - 1) * (hauteur + ECART);
  const nue = reglages.premierePageNue && page.numero === 1;
  const m = margesDeLaPage(reglages, page.numero);
  // En miroir, une page paire (verso) se décale : sa marge de gauche devient l'extérieure.
  const decalage = reglages.miroir && page.numero % 2 === 0 ? ((reglages.marges.gauche - reglages.marges.droite) * MM) : 0;
  const contexte = { titre, page: page.etiquette, pages, partie: page.partie, auteur };
  const zones = zonesDeLaPage(reglages, page.numero);
  const paire = page.numero % 2 === 0;
  const position = reglages.numeroPosition;
  const enHaut = position.startsWith("haut");
  const cote: keyof ZonesLigne = position.endsWith("centre") ? "centre" : position.endsWith("exterieur") ? (paire ? "gauche" : "droite") : "droite";
  const numero = reglages.numeroter && !nue ? page.etiquette : "";

  const ligne = (z: ZonesLigne, avecNumero: boolean) => {
    const remplie = { gauche: remplirGabarit(z.gauche, contexte), centre: remplirGabarit(z.centre, contexte), droite: remplirGabarit(z.droite, contexte) };
    if (!avecNumero && !remplie.gauche && !remplie.centre && !remplie.droite) return null;
    return (["gauche", "centre", "droite"] as const).map((c) => (
      <span key={c} className="calame-zone" data-cote={c}>
        {remplie[c] && <span>{remplie[c]}</span>}
        {avecNumero && c === cote && <span className={remplie[c] ? "calame-numero calame-numero-apres" : "calame-numero"}>{numero}</span>}
      </span>
    ));
  };
  const entete = nue ? null : ligne(zones.entete, enHaut && numero !== "");
  const pied = nue ? null : ligne(zones.pied, !enHaut && numero !== "");

  return (
    <div className="calame-feuille" data-numero={page.numero} style={{ top: haut, height: hauteur, left: enPourcent(decalage), right: enPourcent(-decalage) }}>
      <span className="calame-marges" style={{ inset: `${m.haut * MM}px ${margeX(m.droite)} ${m.bas * MM}px ${margeX(m.gauche)}` }} />
      {reglages.bordure !== "aucune" && <span className="calame-bordure" data-genre={reglages.bordure} style={{ inset: `${Math.max(4, Math.min(m.haut, m.bas) / 2) * MM}px ${margeX(Math.max(4, Math.min(m.gauche, m.droite) / 2))}` }} />}
      {reglages.filigrane.trim() !== "" && (
        <span className="calame-filigrane" style={{ fontSize: Math.round(Math.min(largeur, hauteur) / Math.max(4, reglages.filigrane.trim().length * 0.62)) }}>
          {reglages.filigrane.trim()}
        </span>
      )}
      {entete && (
        <span className="calame-entete calame-lignes-zones" style={{ top: Math.max(6, m.haut * MM - 24), left: margeX(m.gauche), right: margeX(m.droite) }}>
          {entete}
        </span>
      )}
      {pied && (
        <span className="calame-pied calame-lignes-zones" style={{ bottom: Math.max(6, m.bas * MM - 26), left: margeX(m.gauche), right: margeX(m.droite) }}>
          {pied}
        </span>
      )}
      {page.notes.length > 0 && (
        <div className="calame-notes-bas" style={{ bottom: m.bas * MM, left: margeX(m.gauche), right: margeX(m.droite) }}>
          {page.notes.map((n) => (
            <p key={n.numero} className="calame-note">
              <span className="calame-note-numero">{n.numero}</span> {n.texte || "Note vide"}
            </p>
          ))}
        </div>
      )}
      {page.lignes.map((l) => (
        <span key={l.n} className="calame-numero-ligne" style={{ top: l.y, right: `calc(100% - ${margeX(m.gauche)} + 6mm)` }}>
          {l.n}
        </span>
      ))}
    </div>
  );
}
