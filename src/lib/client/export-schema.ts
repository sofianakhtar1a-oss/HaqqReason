/**
 * Export d'un schéma affiché à l'écran : SVG (vectoriel, modifiable), PNG (image), PDF (via l'impression).
 * Les couleurs du thème sont recopiées dans le fichier pour qu'il s'affiche partout à l'identique.
 */

const PROPRIETES = ["fill", "stroke", "stroke-width", "stroke-opacity", "fill-opacity", "stroke-dasharray", "font-size", "font-weight", "font-style", "font-family", "opacity", "color"];

function nomFichier(titre: string, extension: string): string {
  const base =
    titre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 60) || "schema";
  return `${base}.${extension}`;
}

/** Copie autonome du SVG : styles calculés écrits dans chaque élément, fond ajouté. */
export function svgAutonome(svg: SVGSVGElement, fondClair = true): string {
  const copie = svg.cloneNode(true) as SVGSVGElement;
  const originaux = [svg, ...svg.querySelectorAll("*")] as Element[];
  const copies = [copie, ...copie.querySelectorAll("*")] as Element[];
  const encre = fondClair ? "#1b1f33" : "#f1ecdf";
  originaux.forEach((el, i) => {
    const style = getComputedStyle(el);
    const cible = copies[i] as SVGElement;
    for (const prop of PROPRIETES) {
      let valeur = style.getPropertyValue(prop);
      if (!valeur) continue;
      if (prop === "fill" || prop === "stroke" || prop === "color") {
        const brute = el.getAttribute(prop);
        if (brute === "currentColor" || brute === "context-stroke") valeur = brute === "currentColor" ? encre : valeur;
      }
      cible.style.setProperty(prop, valeur);
    }
  });
  copie.querySelectorAll(".schema-basculer").forEach((n) => n.remove());
  copie.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  copie.style.color = encre;
  const vb = svg.viewBox.baseVal;
  const fond = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  fond.setAttribute("x", String(vb.x));
  fond.setAttribute("y", String(vb.y));
  fond.setAttribute("width", String(vb.width));
  fond.setAttribute("height", String(vb.height));
  fond.setAttribute("fill", fondClair ? "#ffffff" : "#0b1233");
  copie.insertBefore(fond, copie.firstChild);
  copie.setAttribute("width", String(Math.round(vb.width)));
  copie.setAttribute("height", String(Math.round(vb.height)));
  return new XMLSerializer().serializeToString(copie);
}

function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function exporterSvg(svg: SVGSVGElement, titre: string) {
  telecharger(new Blob([svgAutonome(svg)], { type: "image/svg+xml" }), nomFichier(titre, "svg"));
}

export async function exporterPng(svg: SVGSVGElement, titre: string, echelle = 2) {
  const texte = svgAutonome(svg);
  const vb = svg.viewBox.baseVal;
  const image = new Image();
  const url = URL.createObjectURL(new Blob([texte], { type: "image/svg+xml" }));
  await new Promise<void>((ok, ko) => {
    image.onload = () => ok();
    image.onerror = () => ko(new Error("Image illisible"));
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(vb.width * echelle);
  canvas.height = Math.round(vb.height * echelle);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/png"));
  if (blob) telecharger(blob, nomFichier(titre, "png"));
}

/** PDF : la fenêtre d'impression n'affiche que ce schéma (choisir « Enregistrer au format PDF »). */
export function exporterPdf(conteneur: HTMLElement) {
  conteneur.classList.add("impression-cible");
  document.body.classList.add("impression-schema");
  const nettoyer = () => {
    conteneur.classList.remove("impression-cible");
    document.body.classList.remove("impression-schema");
    window.removeEventListener("afterprint", nettoyer);
  };
  window.addEventListener("afterprint", nettoyer);
  window.print();
  setTimeout(nettoyer, 1500);
}
