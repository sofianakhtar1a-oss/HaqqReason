"use client";

/*
 * Le Calame — une image (PNG) d'un morceau de page, telle qu'on la voit à l'écran.
 *
 * Sert aux sorties qui ne savent pas dessiner un schéma, une frise, une carte mentale, une carte,
 * un dessin ou une formule (Word, Markdown, EPUB, page HTML), et au PDF téléchargé directement.
 *
 * Le principe : l'élément est recopié avec ses styles calculés figés sur chaque nœud (les feuilles
 * de style et les variables CSS ne voyagent pas dans une image), ses images et ses polices mises
 * en ligne, puis dessiné dans un SVG — directement s'il en est un, dans un <foreignObject> sinon —
 * et le SVG est peint sur un canevas. Rien ne quitte l'appareil.
 */

/** Ce qui décide de l'apparence d'un élément. */
const PROPRIETES = [
  "display", "position", "top", "right", "bottom", "left", "z-index", "box-sizing", "float", "clear",
  "width", "height", "min-width", "min-height", "max-width", "max-height",
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "border-top-style", "border-right-style", "border-bottom-style", "border-left-style",
  "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
  "border-top-left-radius", "border-top-right-radius", "border-bottom-left-radius", "border-bottom-right-radius",
  "border-collapse", "border-spacing",
  "background-color", "background-image", "background-size", "background-position", "background-repeat", "background-clip",
  "color", "opacity", "visibility", "overflow-x", "overflow-y", "box-shadow", "outline-style", "outline-width", "outline-color",
  "font-family", "font-size", "font-weight", "font-style", "font-variant", "font-stretch", "font-feature-settings", "line-height",
  "letter-spacing", "word-spacing", "text-align", "text-align-last", "text-indent", "text-transform", "text-decoration-line",
  "text-decoration-color", "text-decoration-style", "text-decoration-thickness", "text-underline-offset", "text-shadow", "text-overflow",
  "white-space", "word-break", "overflow-wrap", "hyphens", "direction", "unicode-bidi", "vertical-align", "writing-mode",
  "list-style-type", "list-style-position", "list-style-image",
  "flex-direction", "flex-wrap", "flex-grow", "flex-shrink", "flex-basis", "align-items", "align-self", "align-content",
  "justify-content", "justify-items", "justify-self", "order", "row-gap", "column-gap",
  "grid-template-columns", "grid-template-rows", "grid-auto-flow", "grid-auto-columns", "grid-auto-rows",
  "grid-column-start", "grid-column-end", "grid-row-start", "grid-row-end",
  "column-count", "column-gap", "column-rule-style", "column-rule-width", "column-rule-color",
  "transform", "transform-origin", "filter", "mix-blend-mode", "object-fit", "object-position", "aspect-ratio",
  "table-layout", "caption-side", "empty-cells",
  // SVG
  "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity", "stroke-dasharray", "stroke-dashoffset",
  "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "marker-start", "marker-mid", "marker-end",
  "text-anchor", "dominant-baseline", "alignment-baseline", "baseline-shift", "paint-order", "shape-rendering", "vector-effect",
  "stop-color", "stop-opacity", "clip-path", "mask",
];

export type ImageRaster = { octets: Uint8Array; largeur: number; hauteur: number };

/** Les éléments qui ne doivent jamais figurer sur l'image (boutons, poignées, réglages). */
const EXCLUS = ".sans-impression, [data-exclure-image], .calame-bloc-reglages, .calame-carte-reglages, .bloc-atelier-entete, button, .ProseMirror-gapcursor, .calame-lien-ouvrir";

function figer(source: Element, clone: Element): void {
  const cs = getComputedStyle(source);
  let style = "";
  for (const p of PROPRIETES) {
    const v = cs.getPropertyValue(p);
    if (v) style += `${p}:${v};`;
  }
  // Les animations et transitions n'ont pas de sens sur une image (et gênent le rendu). Un élément
  // « révélé au défilement » encore invisible (pas encore vu à l'écran) est montré tel qu'il sera.
  const revele = source.hasAttribute("data-revele") ? "opacity:1;" : "";
  clone.setAttribute("style", `${style}animation:none;transition:none;caret-color:transparent;${revele}`);
  if (clone instanceof HTMLInputElement || clone instanceof HTMLTextAreaElement) clone.setAttribute("value", (source as HTMLInputElement).value);
  if (clone instanceof HTMLTextAreaElement) clone.textContent = (source as HTMLTextAreaElement).value;
  const s = source.children;
  const c = clone.children;
  for (let i = 0; i < s.length && i < c.length; i++) figer(s[i], c[i]);
  // Les ::before et ::after (numéros de notes et de titres, filets) n'existent pas dans une copie : on les écrit.
  if (source instanceof HTMLElement) for (const pseudo of ["::before", "::after"] as const) pseudoElement(source, clone, pseudo);
}

/** Le texte d'une propriété « content » : chaînes, attr(…) ; null si on ne sait pas le reproduire. */
function contenuPseudo(content: string, el: Element): string | null {
  if (!content || content === "none" || content === "normal") return null;
  let texte = "";
  let reste = content.trim();
  const jeton = /^\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|attr\(\s*([\w-]+)\s*\)|(counters?\([^)]*\))|(open-quote|close-quote|no-open-quote|no-close-quote))/;
  while (reste) {
    const m = jeton.exec(reste);
    if (!m) return null;
    if (m[1] !== undefined || m[2] !== undefined) texte += (m[1] ?? m[2] ?? "").replace(/\\(.)/g, "$1");
    else if (m[3]) texte += el.getAttribute(m[3]) ?? "";
    else if (m[4]) return null;
    else if (m[5] === "open-quote") texte += "«\u00a0";
    else if (m[5] === "close-quote") texte += "\u00a0»";
    reste = reste.slice(m[0].length).trim();
  }
  return texte;
}

function pseudoElement(source: HTMLElement, clone: Element, pseudo: "::before" | "::after"): void {
  const ps = getComputedStyle(source, pseudo);
  const texte = contenuPseudo(ps.getPropertyValue("content"), source);
  if (texte === null || ps.getPropertyValue("display") === "none") return;
  const span = document.createElement("span");
  let style = "";
  for (const p of PROPRIETES) {
    const v = ps.getPropertyValue(p);
    if (v) style += `${p}:${v};`;
  }
  span.setAttribute("style", `${style}animation:none;transition:none;`);
  span.textContent = texte;
  if (pseudo === "::before") clone.insertBefore(span, clone.firstChild);
  else clone.appendChild(span);
}

/** Une image déjà affichée devient une donnée en ligne (sans requête : la page l'a déjà chargée). */
function imageEnLigne(source: HTMLImageElement): string | null {
  try {
    if (!source.complete || !source.naturalWidth) return null;
    if (source.src.startsWith("data:")) return source.src;
    const c = document.createElement("canvas");
    c.width = source.naturalWidth;
    c.height = source.naturalHeight;
    c.getContext("2d")?.drawImage(source, 0, 0);
    return c.toDataURL("image/png");
  } catch {
    return null;
  }
}

function remplacerMedias(source: Element, clone: Element): void {
  const imagesSource = Array.from(source.querySelectorAll("img"));
  const imagesClone = Array.from(clone.querySelectorAll("img"));
  imagesClone.forEach((img, i) => {
    const donnee = imagesSource[i] ? imageEnLigne(imagesSource[i]) : null;
    if (donnee) img.setAttribute("src", donnee);
    else img.remove();
    img.removeAttribute("srcset");
    img.removeAttribute("loading");
  });
  const toilesSource = Array.from(source.querySelectorAll("canvas"));
  Array.from(clone.querySelectorAll("canvas")).forEach((toile, i) => {
    try {
      const img = document.createElement("img");
      img.setAttribute("src", toilesSource[i]?.toDataURL("image/png") ?? "");
      img.setAttribute("style", toile.getAttribute("style") ?? "");
      toile.replaceWith(img);
    } catch {
      toile.remove();
    }
  });
  // Les <image> d'un SVG (href vers un fichier) : mises en ligne quand c'est possible, retirées sinon.
  Array.from(clone.querySelectorAll("image")).forEach((im) => {
    const href = im.getAttribute("href") ?? im.getAttribute("xlink:href") ?? "";
    if (!href.startsWith("data:")) im.remove();
  });
}

/* ---------- polices : celles de la page, mises en ligne une fois pour toutes ---------- */

const policesEnLigne = new Map<string, Promise<string>>();

function enBase64(octets: ArrayBuffer): string {
  const t = new Uint8Array(octets);
  let binaire = "";
  for (let i = 0; i < t.length; i += 0x8000) binaire += String.fromCharCode(...t.subarray(i, i + 0x8000));
  return btoa(binaire);
}

async function regleEnLigne(regle: CSSFontFaceRule): Promise<string> {
  const texte = regle.cssText;
  const cle = texte;
  const deja = policesEnLigne.get(cle);
  if (deja) return deja;
  const promesse = (async () => {
    const adresses = [...texte.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
    let sortie = texte;
    for (const adresse of adresses) {
      if (adresse.startsWith("data:")) continue;
      try {
        const url = new URL(adresse, regle.parentStyleSheet?.href ?? location.href);
        if (url.origin !== location.origin) continue;
        const r = await fetch(url.href);
        if (!r.ok) continue;
        const type = r.headers.get("content-type") || (url.pathname.endsWith(".woff2") ? "font/woff2" : "font/woff");
        sortie = sortie.split(adresse).join(`data:${type};base64,${enBase64(await r.arrayBuffer())}`);
      } catch {
        // Police introuvable : le navigateur en prendra une proche.
      }
    }
    return sortie;
  })();
  policesEnLigne.set(cle, promesse);
  return promesse;
}

async function policesUtilisees(racine: Element): Promise<string> {
  const familles = new Set<string>();
  const noter = (el: Element) => {
    for (const f of getComputedStyle(el).fontFamily.split(",")) familles.add(f.trim().replace(/^["']|["']$/g, "").toLowerCase());
  };
  noter(racine);
  racine.querySelectorAll("*").forEach(noter);
  const regles: CSSFontFaceRule[] = [];
  for (const feuille of Array.from(document.styleSheets)) {
    let liste: CSSRuleList;
    try {
      liste = feuille.cssRules;
    } catch {
      continue;
    }
    for (const r of Array.from(liste)) {
      if (r instanceof CSSFontFaceRule) {
        const famille = r.style.getPropertyValue("font-family").trim().replace(/^["']|["']$/g, "").toLowerCase();
        if (familles.has(famille)) regles.push(r);
      }
    }
  }
  // Au-delà, l'image deviendrait trop lourde : on garde les premières (les plus courantes).
  return (await Promise.all(regles.slice(0, 24).map(regleEnLigne))).join("\n");
}

/**
 * Une image PNG de l'élément, à l'échelle demandée (2 : deux fois plus fine que l'écran).
 * Rend null quand l'élément n'a pas de surface (caché, vide) ou qu'il ne se laisse pas dessiner.
 */
export async function rasteriser(el: Element, options: { echelle?: number; fond?: string | null; polices?: boolean; largeur?: number; hauteur?: number; exclure?: string } = {}): Promise<ImageRaster | null> {
  const rect = el.getBoundingClientRect();
  const largeur = Math.ceil(options.largeur ?? rect.width);
  const hauteur = Math.ceil(options.hauteur ?? rect.height);
  if (largeur < 2 || hauteur < 2) return null;
  const echelle = options.echelle ?? 2;
  try {
    const clone = el.cloneNode(true) as Element;
    figer(el, clone);
    remplacerMedias(el, clone);
    // Ce qui sert à modifier le bloc n'a rien à faire sur l'image.
    clone.querySelectorAll(options.exclure ?? EXCLUS).forEach((x) => x.remove());
    clone.removeAttribute("id");
    const polices = options.polices === false ? "" : await policesUtilisees(el);
    const serie = new XMLSerializer();
    let svg: string;
    if (el instanceof SVGSVGElement) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", String(largeur));
      clone.setAttribute("height", String(hauteur));
      if (polices) {
        const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = polices;
        clone.insertBefore(style, clone.firstChild);
      }
      svg = serie.serializeToString(clone);
    } else {
      (clone as HTMLElement).style.margin = "0";
      const contenu = serie.serializeToString(clone);
      svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}" viewBox="0 0 ${largeur} ${hauteur}">` +
        `<foreignObject x="0" y="0" width="${largeur}" height="${hauteur}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${largeur}px;height:${hauteur}px;overflow:hidden">` +
        (polices ? `<style>${polices.replace(/</g, "\\3c ")}</style>` : "") +
        `${contenu}</div></foreignObject></svg>`;
    }
    const image = new Image();
    image.decoding = "async";
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    const toile = document.createElement("canvas");
    toile.width = Math.round(largeur * echelle);
    toile.height = Math.round(hauteur * echelle);
    const ctx = toile.getContext("2d");
    if (!ctx) return null;
    if (options.fond !== null) {
      ctx.fillStyle = options.fond ?? "#ffffff";
      ctx.fillRect(0, 0, toile.width, toile.height);
    }
    ctx.drawImage(image, 0, 0, toile.width, toile.height);
    const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, "image/png"));
    if (!blob) return null;
    return { octets: new Uint8Array(await blob.arrayBuffer()), largeur, hauteur };
  } catch {
    return null;
  }
}
