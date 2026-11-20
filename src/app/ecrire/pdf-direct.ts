"use client";

import { PDFDocument, PDFHexString, PDFName, PDFNumber, PDFString, type PDFDict, type PDFRef } from "pdf-lib";
import type { ReglagesPage } from "@/lib/atelier/modele";
import { composerPages } from "./impression";
import { rasteriser } from "./rasteriser";

/*
 * Le Calame — le PDF téléchargé directement, sans passer par la fenêtre d'impression.
 *
 * Chaque page composée (la même que celle de l'impression, donc la même qu'à l'écran) est
 * peinte en image fine, puis rangée dans un vrai PDF avec :
 *   • des signets — le plan du document, cliquable dans le panneau du lecteur PDF ;
 *   • des liens cliquables — vers le web, vers une partie du document, et depuis la table
 *     des matières vers chaque titre ;
 *   • les propriétés du document (titre, auteur, sujet, mots-clés).
 * Le texte, peint, ne se sélectionne pas : pour un PDF au texte sélectionnable, l'impression
 * (« Enregistrer au format PDF ») reste là.
 */

const PT_PAR_MM = 72 / 25.4;
/** Ce que l'impression cache et que l'image ne doit pas montrer non plus. */
const EXCLUS_PAGE = ".sans-impression, .calame-bloc-reglages, .calame-carte-reglages, .calame-lien-ouvrir, .calame-coupure-numero, .calame-marges, .bloc-atelier-entete, .ProseMirror-gapcursor";

export type ProprietesPdf = { titre: string; auteur?: string; sujet?: string; motsCles?: string };

type Titre = { niveau: number; texte: string; page: number; y: number };
type Lien = { page: number; rect: [number, number, number, number]; url?: string; ancre?: string; ordinal?: number };

/** Les rectangles d'un élément (un lien sur deux lignes en a deux), en points PDF, origine en bas à gauche. */
function rectangles(el: Element, page: DOMRect, ptParPx: number, hauteurPt: number): [number, number, number, number][] {
  return Array.from(el.getClientRects())
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => [(r.left - page.left) * ptParPx, hauteurPt - (r.bottom - page.top) * ptParPx, (r.right - page.left) * ptParPx, hauteurPt - (r.top - page.top) * ptParPx]);
}

function ajouterSignets(pdf: PDFDocument, titres: Titre[], pages: PDFRef[], hauteurs: number[]): void {
  type Item = Titre & { enfants: Item[]; ref: PDFRef };
  const racine: Item[] = [];
  const pile: Item[] = [];
  for (const t of titres) {
    const item: Item = { ...t, enfants: [], ref: pdf.context.nextRef() };
    while (pile.length && pile[pile.length - 1].niveau >= t.niveau) pile.pop();
    if (pile.length) pile[pile.length - 1].enfants.push(item);
    else racine.push(item);
    pile.push(item);
  }
  if (racine.length === 0) return;
  const compter = (items: Item[]): number => items.reduce((n, it) => n + 1 + compter(it.enfants), 0);
  const plan = pdf.context.nextRef();
  const ecrire = (items: Item[], parent: PDFRef) => {
    items.forEach((it, i) => {
      const dict = pdf.context.obj({
        Title: PDFHexString.fromText(it.texte || "…"),
        Parent: parent,
        Dest: [pages[it.page], "XYZ", null, Math.max(0, hauteurs[it.page] - it.y + 6), null],
      }) as PDFDict;
      if (i > 0) dict.set(PDFName.of("Prev"), items[i - 1].ref);
      if (i < items.length - 1) dict.set(PDFName.of("Next"), items[i + 1].ref);
      if (it.enfants.length) {
        dict.set(PDFName.of("First"), it.enfants[0].ref);
        dict.set(PDFName.of("Last"), it.enfants[it.enfants.length - 1].ref);
        dict.set(PDFName.of("Count"), PDFNumber.of(compter(it.enfants)));
      }
      pdf.context.assign(it.ref, dict);
      ecrire(it.enfants, it.ref);
    });
  };
  ecrire(racine, plan);
  pdf.context.assign(plan, pdf.context.obj({ Type: "Outlines", First: racine[0].ref, Last: racine[racine.length - 1].ref, Count: compter(racine) }));
  pdf.catalog.set(PDFName.of("Outlines"), plan);
  pdf.catalog.set(PDFName.of("PageMode"), PDFName.of("UseOutlines"));
}

/**
 * Le PDF du document, page par page. `surAvancement` est appelé après chaque page (pour une barre
 * de progression). Rend null si l'atelier n'est pas affiché.
 */
export async function construirePdfDirect(flux: HTMLElement, reglages: ReglagesPage, proprietes: ProprietesPdf, surAvancement?: (fait: number, total: number) => void): Promise<Uint8Array | null> {
  const composition = composerPages(flux, reglages);
  if (!composition) return null;
  const { conteneur, pages } = composition;
  document.body.appendChild(conteneur);
  document.documentElement.classList.add("calame-capture-pdf");
  try {
    const images = Array.from(conteneur.querySelectorAll("img"));
    await Promise.race([Promise.all(images.map((img) => img.decode().catch(() => undefined))), new Promise((r) => setTimeout(r, 3000))]);
    await document.fonts?.ready;

    const pdf = await PDFDocument.create();
    pdf.setTitle(proprietes.titre || "Document", { showInWindowTitleBar: true });
    if (proprietes.auteur) pdf.setAuthor(proprietes.auteur);
    if (proprietes.sujet) pdf.setSubject(proprietes.sujet);
    if (proprietes.motsCles) pdf.setKeywords(proprietes.motsCles.split(/[,;]/).map((m) => m.trim()).filter(Boolean));
    pdf.setLanguage("fr-FR");
    pdf.setCreator("HaqqReason — Le Calame");
    pdf.setProducer("HaqqReason — Le Calame");

    const titres: Titre[] = [];
    const liens: Lien[] = [];
    const ancres = new Map<string, { page: number; y: number }>();
    const refs: PDFRef[] = [];
    const hauteurs: number[] = [];

    for (const [i, page] of pages.entries()) {
      const cadre = page.el.getBoundingClientRect();
      const largeurPt = page.largeurMm * PT_PAR_MM;
      const hauteurPt = page.hauteurMm * PT_PAR_MM;
      const ptParPx = largeurPt / Math.max(1, cadre.width);
      const yDe = (el: Element) => (el.getBoundingClientRect().top - cadre.top) * ptParPx;

      // Les titres qui commencent sur cette page (signets) et les ancres (cibles des liens internes).
      for (const bloc of page.debuts) {
        const titresDuBloc = bloc.matches("h2, h3, h4") ? [bloc] : Array.from(bloc.querySelectorAll("h2, h3, h4"));
        for (const t of titresDuBloc) {
          const numero = t.getAttribute("data-numero");
          // Le texte du titre seul : sans la flèche de repli ni ce qui ne s'imprime pas.
          const copie = t.cloneNode(true) as HTMLElement;
          copie.querySelectorAll('.sans-impression, [contenteditable="false"], .calame-repli-fleche, button').forEach((x) => x.remove());
          titres.push({ niveau: Number(t.tagName.slice(1)), texte: `${numero ? `${numero} ` : ""}${(copie.textContent ?? "").replace(/[▾▸▴▶▼]/g, "").replace(/\s+/g, " ").trim()}`, page: i, y: yDe(t) });
        }
        const avecAncre = bloc.hasAttribute("data-ancre") ? [bloc, ...Array.from(bloc.querySelectorAll("[data-ancre]"))] : Array.from(bloc.querySelectorAll("[data-ancre]"));
        for (const el of avecAncre) {
          const ancre = el.getAttribute("data-ancre");
          if (ancre && !ancres.has(ancre)) ancres.set(ancre, { page: i, y: yDe(el) });
        }
      }
      // Les liens : vers le web, vers une ancre, et les lignes de la table des matières.
      for (const a of Array.from(page.el.querySelectorAll<HTMLAnchorElement>("a[href]"))) {
        const url = a.getAttribute("href") ?? "";
        if (/^(https?:|mailto:)/i.test(url)) for (const rect of rectangles(a, cadre, ptParPx, hauteurPt)) liens.push({ page: i, rect, url });
      }
      for (const el of Array.from(page.el.querySelectorAll("[data-ancre-cible]"))) {
        for (const rect of rectangles(el, cadre, ptParPx, hauteurPt)) liens.push({ page: i, rect, ancre: el.getAttribute("data-ancre-cible") ?? "" });
      }
      for (const li of Array.from(page.el.querySelectorAll(".calame-sommaire li[data-ordinal]"))) {
        for (const rect of rectangles(li, cadre, ptParPx, hauteurPt)) liens.push({ page: i, rect, ordinal: Number(li.getAttribute("data-ordinal")) });
      }

      const image = await rasteriser(page.el, { echelle: 2, largeur: cadre.width, hauteur: cadre.height, fond: "#ffffff", exclure: EXCLUS_PAGE });
      const feuille = pdf.addPage([largeurPt, hauteurPt]);
      if (image) {
        const png = await pdf.embedPng(image.octets);
        feuille.drawImage(png, { x: 0, y: 0, width: largeurPt, height: hauteurPt });
      }
      refs.push(feuille.ref);
      hauteurs.push(hauteurPt);
      surAvancement?.(i + 1, pages.length);
      // Laisse respirer la page entre deux feuilles (barre de progression, saisie).
      await new Promise((r) => setTimeout(r, 0));
    }

    // Les liens, une fois toutes les pages connues (une cible peut être plus loin).
    for (const [i, feuille] of pdf.getPages().entries()) {
      const annotations = liens
        .filter((l) => l.page === i)
        .flatMap((l) => {
          const cible = l.ancre ? ancres.get(l.ancre) : l.ordinal ? titres[l.ordinal - 1] : undefined;
          if (!l.url && !cible) return [];
          const action = l.url
            ? { A: { Type: "Action", S: "URI", URI: PDFString.of(l.url) } }
            : { Dest: [refs[cible!.page], "XYZ", null, Math.max(0, hauteurs[cible!.page] - cible!.y + 6), null] };
          return [pdf.context.register(pdf.context.obj({ Type: "Annot", Subtype: "Link", Rect: l.rect, Border: [0, 0, 0], ...action }))];
        });
      if (annotations.length) feuille.node.set(PDFName.of("Annots"), pdf.context.obj(annotations));
    }
    ajouterSignets(pdf, titres, refs, hauteurs);
    return await pdf.save();
  } finally {
    conteneur.remove();
    document.documentElement.classList.remove("calame-capture-pdf");
  }
}
