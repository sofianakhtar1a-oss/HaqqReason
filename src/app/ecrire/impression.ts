"use client";

import { geometrie, margesDeLaPage, MM, tailleDuPapier, type ReglagesPage } from "@/lib/atelier/modele";

/**
 * Le Calame — l'impression (et l'enregistrement en PDF), page par page, recopiée de l'écran.
 *
 * On ne laisse plus le navigateur paginer le texte à sa façon : il couperait ailleurs que
 * l'écran, sans notes en bas de page ni en-têtes. On recopie plutôt chaque feuille telle
 * qu'elle est composée à l'écran — en-tête, pied, numéro, notes, filigrane — et, dans sa
 * zone de texte, les blocs qui y tombent, chacun à sa hauteur exacte. Un paragraphe coupé
 * entre deux pages est recopié sur les deux : la zone de chaque page n'en laisse voir que
 * sa part. Ce que l'on voit est donc, au pixel près, ce qui sort.
 */

/** Blanc entre deux feuilles à l'écran (le même que Papier.tsx). */
const ECART = 30;

export type OptionsImpression = {
  /** Numéros des pages à imprimer (toutes si absent). */
  pages?: number[];
};

/** Une page composée pour l'impression (ou pour le PDF). */
export type PageComposee = {
  el: HTMLElement;
  numero: number;
  largeurMm: number;
  hauteurMm: number;
  /** Les blocs (recopiés) qui commencent sur cette page : titres pour les signets, ancres pour les liens. */
  debuts: HTMLElement[];
};

/** Lit « 1-3, 5, 8-10 » : les numéros de page voulus (dans l'ordre, sans doublon). */
export function lirePlagesDePages(texte: string, total: number): number[] {
  const pages: number[] = [];
  for (const morceau of texte.split(/[,;\s]+/).filter(Boolean)) {
    const m = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(morceau.trim());
    if (!m) continue;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    for (let p = Math.max(1, Math.min(a, b)); p <= Math.min(total, Math.max(a, b)); p++) if (!pages.includes(p)) pages.push(p);
  }
  return pages;
}

/** Les variables de style (polices, tailles, couleurs) portées par la feuille à l'écran. */
function variablesDe(flux: HTMLElement): string {
  const lignes: string[] = [];
  for (let i = 0; i < flux.style.length; i++) {
    const nom = flux.style[i];
    if (nom.startsWith("--")) lignes.push(`${nom}: ${flux.style.getPropertyValue(nom)};`);
  }
  return lignes.join(" ");
}

/** Une image recopiée : on ne la laisse pas « paresseuse », elle doit être là au moment d'imprimer. */
function preparerClone(original: HTMLElement, clone: HTMLElement): void {
  for (const img of Array.from(clone.querySelectorAll("img"))) img.loading = "eager";
  // Ce qui n'existe qu'à l'écran (soulignés de la relecture, passages trouvés) ne passe pas sur la page.
  for (const el of Array.from(clone.querySelectorAll<HTMLElement>(".calame-lt, .calame-analyse, .calame-trouve, .calame-trouve-actif, .calame-lu"))) {
    for (const c of Array.from(el.classList)) if (/^calame-(lt|analyse|trouve|lu)\b/.test(c)) el.classList.remove(c);
    el.removeAttribute("data-remarque");
  }
  // Les curseurs des autres auteurs (écriture à plusieurs) non plus.
  for (const el of Array.from(clone.querySelectorAll<HTMLElement>(".calame-curseur"))) el.remove();
  for (const el of Array.from(clone.querySelectorAll<HTMLElement>(".calame-curseur-selection"))) el.classList.remove("calame-curseur-selection");
  // Un canevas recopié est vide : on y remet son dessin, en image.
  const sources = Array.from(original.querySelectorAll("canvas"));
  const cibles = Array.from(clone.querySelectorAll("canvas"));
  sources.forEach((c, i) => {
    const cible = cibles[i];
    if (!cible) return;
    try {
      const img = document.createElement("img");
      img.src = c.toDataURL("image/png");
      img.style.cssText = `width:${c.offsetWidth}px;height:${c.offsetHeight}px;display:block`;
      cible.replaceWith(img);
    } catch {
      // Un canevas « sali » par une image d'ailleurs ne se lit pas : il reste vide.
    }
  });
}

/**
 * Compose les pages à imprimer à partir de la feuille affichée, imprime, puis range tout.
 * `flux` : l'élément .calame-flux de l'atelier.
 */
export async function imprimerPages(flux: HTMLElement, reglages: ReglagesPage, options: OptionsImpression = {}): Promise<void> {
  const composition = composerPages(flux, reglages, options);
  if (!composition) {
    window.print();
    return;
  }
  await lancerImpression(composition.conteneur, composition.style);
}

/** Pose la composition dans la page, attend images et polices, imprime, puis range tout. */
async function lancerImpression(conteneur: HTMLElement, style: HTMLStyleElement): Promise<void> {
  document.body.append(conteneur, style);
  document.documentElement.classList.add("calame-impression-en-cours");

  // Les images doivent être prêtes avant que l'imprimante ne passe.
  const images = Array.from(conteneur.querySelectorAll("img"));
  await Promise.race([Promise.all(images.map((img) => img.decode().catch(() => undefined))), new Promise((r) => setTimeout(r, 2500))]);
  await document.fonts?.ready;

  const ranger = () => {
    conteneur.remove();
    style.remove();
    document.documentElement.classList.remove("calame-impression-en-cours");
    window.removeEventListener("afterprint", ranger);
  };
  window.addEventListener("afterprint", ranger);
  try {
    window.print();
  } finally {
    // Certains navigateurs n'envoient jamais « afterprint » : on range quand même, un peu plus tard.
    setTimeout(ranger, 1500);
  }
}

/**
 * Compose les pages (sans les poser dans la page) : le conteneur, la feuille de style @page,
 * et chaque page avec ses dimensions. null : rien à composer (pas d'éditeur).
 */
export function composerPages(flux: HTMLElement, reglages: ReglagesPage, options: OptionsImpression = {}): { conteneur: HTMLElement; style: HTMLStyleElement; pages: PageComposee[] } | null {
  const tiptap = flux.querySelector<HTMLElement>(".calame-texte .tiptap");
  if (!tiptap) return null;
  const pagesComposees: PageComposee[] = [];
  const g = geometrie(reglages);
  const papier = tailleDuPapier(reglages.format, reglages.orientation);
  const fond = reglages.fondPerdu || 0;
  const feuilles = Array.from(flux.querySelectorAll<HTMLElement>(".calame-feuilles > .calame-feuille"));
  const enfants = (Array.from(tiptap.children) as HTMLElement[]).filter((e) => !e.hasAttribute("data-blanc"));
  const mesures = enfants.map((e) => ({ el: e, haut: e.offsetTop, bas: e.offsetTop + e.offsetHeight, gauche: e.offsetLeft, largeur: e.offsetWidth }));

  const conteneur = document.createElement("div");
  conteneur.className = "calame-impression";
  conteneur.setAttribute("aria-hidden", "true");
  conteneur.lang = "fr";
  const fluxCopie = document.createElement("div");
  fluxCopie.className = "calame-flux calame-flux-imprime";
  for (const attribut of ["data-cesure", "data-lettrine", "data-alinea", "data-titres-numerotes", "data-notes"]) {
    const v = flux.getAttribute(attribut);
    if (v !== null) fluxCopie.setAttribute(attribut, v);
  }
  fluxCopie.style.cssText = variablesDe(flux);
  conteneur.appendChild(fluxCopie);

  const voulues = options.pages && options.pages.length > 0 ? new Set(options.pages) : null;
  // Une section en paysage au milieu d'un document en portrait (ou l'inverse) : ses pages ont leur format.
  const autre = reglages.orientation === "paysage" ? "portrait" : "paysage";
  const papierAutre = tailleDuPapier(reglages.format, autre);
  const gAutre = geometrie({ ...reglages, orientation: autre });
  let avecAutre = false;
  let haut = 0;
  feuilles.forEach((feuille, i) => {
    const numero = i + 1;
    const differente = (feuille.dataset.orientation ?? reglages.orientation) !== reglages.orientation;
    const pp = differente ? papierAutre : papier;
    const gp = differente ? gAutre : g;
    const hautPage = haut;
    haut += gp.page.hauteur + ECART;
    if (voulues && !voulues.has(numero)) return;
    const m = margesDeLaPage(reglages, numero);
    const page = document.createElement("section");
    page.className = "calame-page-imprimee";
    const debuts: HTMLElement[] = [];
    page.style.width = `${pp.largeur + 2 * fond}mm`;
    page.style.height = `${pp.hauteur + 2 * fond}mm`;
    if (differente) {
      page.style.setProperty("page", "calame-autre");
      avecAutre = true;
    }

    const surface = document.createElement("div");
    surface.className = "calame-page-papier";
    surface.style.cssText = `left:${fond}mm;top:${fond}mm;width:${pp.largeur}mm;height:${pp.hauteur}mm`;
    page.appendChild(surface);

    // Ce qui entoure le texte : la feuille de l'écran, recopiée.
    const decor = feuille.cloneNode(true) as HTMLElement;
    decor.style.cssText = "position:absolute;inset:0;";
    surface.appendChild(decor);

    // La zone de texte : seuls les blocs qui tombent sur cette page, chacun à sa hauteur.
    const zone = document.createElement("div");
    zone.className = "calame-texte calame-zone-imprimee";
    zone.style.cssText = `position:absolute;overflow:hidden;top:${m.haut * MM}px;left:${m.gauche * MM}px;width:${gp.zone.largeur}px;height:${gp.zone.hauteur}px`;
    const corps = document.createElement("div");
    corps.className = tiptap.className;
    corps.style.cssText = "position:relative;height:100%;";
    zone.appendChild(corps);
    const bas = hautPage + gp.zone.hauteur;
    // Les blocs d'une section plus large débordent du flux à l'écran : on les recale dans leur page.
    const recalage = (gp.page.largeur - g.page.largeur) / 2;
    let precedent: HTMLElement | null = null;
    for (const mesure of mesures) {
      if (mesure.bas <= hautPage || mesure.haut >= bas) continue;
      // Les règles « titre suivi d'un paragraphe » (lettrine) ont besoin du voisin d'avant.
      const voisin = mesure.el.previousElementSibling as HTMLElement | null;
      if (voisin && voisin !== precedent && !voisin.hasAttribute("data-blanc")) {
        const ombre = voisin.cloneNode(false) as HTMLElement;
        ombre.style.display = "none";
        corps.appendChild(ombre);
      }
      const clone = mesure.el.cloneNode(true) as HTMLElement;
      preparerClone(mesure.el, clone);
      clone.style.position = "absolute";
      clone.style.top = `${mesure.haut - hautPage}px`;
      clone.style.left = `${mesure.gauche + recalage}px`;
      clone.style.width = `${mesure.largeur}px`;
      clone.style.margin = "0";
      corps.appendChild(clone);
      if (mesure.haut >= hautPage - 1) debuts.push(clone);
      precedent = mesure.el;
    }
    surface.appendChild(zone);
    fluxCopie.appendChild(page);
    pagesComposees.push({ el: page, numero, largeurMm: pp.largeur + 2 * fond, hauteurMm: pp.hauteur + 2 * fond, debuts });
  });

  const style = document.createElement("style");
  const sansMarges = "margin: 0 !important; @top-center { content: none !important; } @bottom-center { content: none !important; } @bottom-right { content: none !important; }";
  style.textContent =
    `@page { size: ${papier.largeur + 2 * fond}mm ${papier.hauteur + 2 * fond}mm !important; ${sansMarges} }` +
    (avecAutre ? ` @page calame-autre { size: ${papierAutre.largeur + 2 * fond}mm ${papierAutre.hauteur + 2 * fond}mm !important; ${sansMarges} }` : "");
  return { conteneur, style, pages: pagesComposees };
}

// ---------------------------------------------------------------------------
// La sélection seule
// ---------------------------------------------------------------------------

/**
 * Imprime le passage sélectionné, avec la typographie du document : le navigateur le met en pages
 * lui-même (sans en-têtes ni notes en bas de page, qui appartiennent au document entier).
 */
export async function imprimerSelection(flux: HTMLElement, reglages: ReglagesPage, plage: Range): Promise<boolean> {
  const tiptap = flux.querySelector<HTMLElement>(".calame-texte .tiptap");
  if (!tiptap || plage.collapsed || !tiptap.contains(plage.commonAncestorContainer)) return false;
  const papier = tailleDuPapier(reglages.format, reglages.orientation);
  const m = reglages.marges;
  const conteneur = document.createElement("div");
  conteneur.className = "calame-impression calame-impression-selection";
  conteneur.setAttribute("aria-hidden", "true");
  conteneur.lang = "fr";
  const fluxCopie = document.createElement("div");
  fluxCopie.className = "calame-flux calame-flux-imprime";
  fluxCopie.style.cssText = variablesDe(flux);
  const texte = document.createElement("div");
  texte.className = "calame-texte";
  const corps = document.createElement("div");
  corps.className = tiptap.className;
  corps.appendChild(plage.cloneContents());
  // Les blancs de mise en page n'ont rien à faire dans un passage imprimé seul.
  corps.querySelectorAll("[data-blanc], .calame-coupure").forEach((x) => x.remove());
  texte.appendChild(corps);
  fluxCopie.appendChild(texte);
  conteneur.appendChild(fluxCopie);
  const style = document.createElement("style");
  style.textContent = `@page { size: ${papier.largeur}mm ${papier.hauteur}mm !important; margin: ${m.haut}mm ${m.droite}mm ${m.bas}mm ${m.gauche}mm !important; }`;
  await lancerImpression(conteneur, style);
  return true;
}

// ---------------------------------------------------------------------------
// Livret : pages remises dans l'ordre pour être pliées et agrafées
// ---------------------------------------------------------------------------

/** L'ordre des pages d'un livret de `total` pages (complété par des pages blanches) : deux par face, recto puis verso. */
export function ordreDuLivret(total: number): [number | null, number | null][] {
  const n = Math.max(4, Math.ceil(total / 4) * 4);
  const p = (i: number) => (i <= total ? i : null);
  const faces: [number | null, number | null][] = [];
  for (let k = 0; k < n / 4; k++) {
    faces.push([p(n - 2 * k), p(2 * k + 1)]);
    faces.push([p(2 * k + 2), p(n - 2 * k - 1)]);
  }
  return faces;
}

/**
 * Imprime le document en livret : chaque feuille A4 (paysage) porte deux pages côte à côte,
 * dans l'ordre qui, une fois les feuilles pliées en deux et emboîtées, redonne le document.
 * Impression recto verso, retournement sur le petit côté.
 */
export async function imprimerLivret(flux: HTMLElement, reglages: ReglagesPage): Promise<boolean> {
  const composition = composerPages(flux, reglages);
  if (!composition) return false;
  const { conteneur, pages } = composition;
  const fluxCopie = conteneur.querySelector<HTMLElement>(".calame-flux-imprime");
  if (!fluxCopie) return false;
  const demiLargeur = 297 / 2;
  const hauteur = 210;
  for (const page of pages) page.el.remove();
  for (const [gauche, droite] of ordreDuLivret(pages.length)) {
    const face = document.createElement("section");
    face.className = "calame-page-imprimee calame-livret-face";
    face.style.width = "297mm";
    face.style.height = "210mm";
    [gauche, droite].forEach((numero, cote) => {
      const emplacement = document.createElement("div");
      emplacement.className = "calame-livret-moitie";
      emplacement.style.cssText = `position:absolute;top:0;left:${cote * demiLargeur}mm;width:${demiLargeur}mm;height:${hauteur}mm;overflow:hidden;`;
      const page = numero ? pages[numero - 1] : null;
      if (page) {
        // Une page A5 remplit exactement la moitié ; un autre format est réduit pour y tenir, centré.
        const echelle = Math.min(demiLargeur / page.largeurMm, hauteur / page.hauteurMm, 1);
        const dx = (demiLargeur - page.largeurMm * echelle) / 2;
        const dy = (hauteur - page.hauteurMm * echelle) / 2;
        page.el.style.position = "absolute";
        page.el.style.left = `${dx}mm`;
        page.el.style.top = `${dy}mm`;
        page.el.style.transformOrigin = "0 0";
        page.el.style.transform = `scale(${echelle})`;
        page.el.style.breakAfter = "auto";
        emplacement.appendChild(page.el);
      }
      face.appendChild(emplacement);
    });
    fluxCopie.appendChild(face);
  }
  const style = document.createElement("style");
  style.textContent = "@page { size: 297mm 210mm !important; margin: 0 !important; }";
  composition.style.remove();
  await lancerImpression(conteneur, style);
  return true;
}
