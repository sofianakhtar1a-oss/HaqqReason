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
  const tiptap = flux.querySelector<HTMLElement>(".calame-texte .tiptap");
  if (!tiptap) {
    window.print();
    return;
  }
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
      precedent = mesure.el;
    }
    surface.appendChild(zone);
    fluxCopie.appendChild(page);
  });

  const style = document.createElement("style");
  const sansMarges = "margin: 0 !important; @top-center { content: none !important; } @bottom-center { content: none !important; } @bottom-right { content: none !important; }";
  style.textContent =
    `@page { size: ${papier.largeur + 2 * fond}mm ${papier.hauteur + 2 * fond}mm !important; ${sansMarges} }` +
    (avecAutre ? ` @page calame-autre { size: ${papierAutre.largeur + 2 * fond}mm ${papierAutre.hauteur + 2 * fond}mm !important; ${sansMarges} }` : "");
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
