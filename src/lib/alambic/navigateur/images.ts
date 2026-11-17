"use client";

/*
 * Images, dans le navigateur : décoder n'importe quel format en pixels, puis les encoder.
 * PNG, JPEG et WebP sont encodés par le navigateur lui-même ; GIF, BMP, TIFF et ICO par ce module.
 */

export type Pixels = { largeur: number; hauteur: number; donnees: Uint8ClampedArray };

function toile(l: number, h: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(l, h);
  const c = document.createElement("canvas");
  c.width = l;
  c.height = h;
  return c;
}
function contexte(c: OffscreenCanvas | HTMLCanvasElement) {
  const ctx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new Error("Ton navigateur refuse de dessiner l'image (mémoire insuffisante ?).");
  return ctx;
}

async function svgEnImage(blob: Blob): Promise<HTMLImageElement> {
  // Le navigateur ne dessine un SVG que s'il est annoncé comme tel : un fichier sans type (glissé depuis
  // certains dossiers, renommé, reçu d'une autre application) échouait. On le réétiquette, et on ajoute
  // l'espace de noms SVG s'il manque.
  let texte = await blob.text();
  if (!/<svg[^>]*\sxmlns=/i.test(texte)) texte = texte.replace(/<svg\b/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  const url = URL.createObjectURL(new Blob([texte], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    try {
      await img.decode();
    } catch {
      throw new Error("Ce SVG ne peut pas être dessiné : il est peut-être abîmé, ou s'appuie sur des fichiers externes.");
    }
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function decoder(blob: Blob, format: string): Promise<Pixels> {
  if (format === "tiff") {
    const UTIF = (await import("utif2")).default;
    const tampon = await blob.arrayBuffer();
    const ifds = UTIF.decode(tampon);
    if (!ifds.length) throw new Error("Ce TIFF ne contient aucune image lisible.");
    UTIF.decodeImage(tampon, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);
    return { largeur: ifds[0].width, hauteur: ifds[0].height, donnees: new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength) };
  }
  let source: ImageBitmap | HTMLImageElement;
  let l: number;
  let h: number;
  if (format === "svg") {
    const img = await svgEnImage(blob);
    // Un SVG sans taille propre est rendu à 1024 px de large.
    l = img.naturalWidth || 1024;
    h = img.naturalHeight || Math.round(1024 * 0.75);
    source = img;
  } else {
    try {
      source = await createImageBitmap(blob);
    } catch {
      throw new Error("Ton navigateur n'arrive pas à lire cette image : elle est peut-être abîmée.");
    }
    l = source.width;
    h = source.height;
  }
  const c = toile(l, h);
  const ctx = contexte(c);
  ctx.drawImage(source, 0, 0, l, h);
  if ("close" in source) source.close();
  return { largeur: l, hauteur: h, donnees: ctx.getImageData(0, 0, l, h).data };
}

function versToile(p: Pixels, fondBlanc = false) {
  const c = toile(p.largeur, p.hauteur);
  const ctx = contexte(c);
  const img = new ImageData(new Uint8ClampedArray(p.donnees), p.largeur, p.hauteur);
  if (fondBlanc) {
    // JPEG n'a pas de transparence : on pose l'image sur du blanc plutôt que sur du noir.
    const tmp = toile(p.largeur, p.hauteur);
    contexte(tmp).putImageData(img, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, p.largeur, p.hauteur);
    ctx.drawImage(tmp as CanvasImageSource, 0, 0);
  } else ctx.putImageData(img, 0, 0);
  return c;
}

async function versBlob(c: OffscreenCanvas | HTMLCanvasElement, type: string, qualite?: number): Promise<Blob> {
  if ("convertToBlob" in c) return c.convertToBlob({ type, quality: qualite });
  return new Promise((ok, ko) => (c as HTMLCanvasElement).toBlob((b) => (b ? ok(b) : ko(new Error("Encodage impossible."))), type, qualite));
}

function bmp(p: Pixels): Uint8Array {
  // BMP 24 bits, lignes de bas en haut, alignées sur 4 octets : lu par tous les logiciels.
  const ligne = Math.ceil((p.largeur * 3) / 4) * 4;
  const taille = 54 + ligne * p.hauteur;
  const o = new Uint8Array(taille);
  const v = new DataView(o.buffer);
  o[0] = 0x42;
  o[1] = 0x4d;
  v.setUint32(2, taille, true);
  v.setUint32(10, 54, true);
  v.setUint32(14, 40, true);
  v.setInt32(18, p.largeur, true);
  v.setInt32(22, p.hauteur, true);
  v.setUint16(26, 1, true);
  v.setUint16(28, 24, true);
  v.setUint32(34, ligne * p.hauteur, true);
  v.setInt32(38, 2835, true);
  v.setInt32(42, 2835, true);
  for (let y = 0; y < p.hauteur; y++) {
    const dest = 54 + (p.hauteur - 1 - y) * ligne;
    for (let x = 0; x < p.largeur; x++) {
      const s = (y * p.largeur + x) * 4;
      const a = p.donnees[s + 3] / 255;
      // La transparence est posée sur du blanc.
      o[dest + x * 3] = Math.round(p.donnees[s + 2] * a + 255 * (1 - a));
      o[dest + x * 3 + 1] = Math.round(p.donnees[s + 1] * a + 255 * (1 - a));
      o[dest + x * 3 + 2] = Math.round(p.donnees[s] * a + 255 * (1 - a));
    }
  }
  return o;
}

async function ico(p: Pixels): Promise<Uint8Array> {
  // Une icône carrée de 256 px au plus, l'image centrée sans être déformée, au format PNG.
  const cote = Math.min(256, Math.max(p.largeur, p.hauteur));
  const echelle = cote / Math.max(p.largeur, p.hauteur);
  const c = toile(cote, cote);
  const ctx = contexte(c);
  ctx.imageSmoothingQuality = "high";
  const l = Math.round(p.largeur * echelle);
  const h = Math.round(p.hauteur * echelle);
  ctx.drawImage(versToile(p) as CanvasImageSource, Math.round((cote - l) / 2), Math.round((cote - h) / 2), l, h);
  const png = new Uint8Array(await (await versBlob(c, "image/png")).arrayBuffer());
  const o = new Uint8Array(22 + png.length);
  const v = new DataView(o.buffer);
  v.setUint16(2, 1, true);
  v.setUint16(4, 1, true);
  o[6] = cote >= 256 ? 0 : cote;
  o[7] = cote >= 256 ? 0 : cote;
  v.setUint16(10, 1, true);
  v.setUint16(12, 32, true);
  v.setUint32(14, png.length, true);
  v.setUint32(18, 22, true);
  o.set(png, 22);
  return o;
}

export async function gif(images: { pixels: Pixels; delai?: number }[]): Promise<Uint8Array> {
  const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
  const g = GIFEncoder();
  for (const { pixels, delai } of images) {
    const palette = quantize(pixels.donnees, 256, { format: "rgba4444", oneBitAlpha: true });
    const index = applyPalette(pixels.donnees, palette, "rgba4444");
    const transparentIndex = palette.findIndex((c) => c[3] === 0);
    g.writeFrame(index, pixels.largeur, pixels.hauteur, { palette, delay: delai ?? 0, transparent: transparentIndex >= 0, transparentIndex: Math.max(0, transparentIndex), repeat: 0 });
  }
  g.finish();
  return g.bytes();
}

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif", bmp: "image/bmp", tiff: "image/tiff", ico: "image/x-icon" };

export async function encoder(p: Pixels, format: string, qualite = 0.9): Promise<Blob> {
  const b = (o: Uint8Array) => new Blob([o.slice().buffer], { type: TYPES[format] });
  switch (format) {
    case "png":
      return versBlob(versToile(p), "image/png");
    case "jpg":
      return versBlob(versToile(p, true), "image/jpeg", qualite);
    case "webp": {
      const sortie = await versBlob(versToile(p), "image/webp", qualite);
      // Safari ancien : il rend du PNG au lieu de WebP sans le dire.
      if (sortie.type !== "image/webp") throw new Error("Ton navigateur ne sait pas produire de WebP. Chrome, Edge et Firefox le font.");
      return sortie;
    }
    case "gif":
      return b(await gif([{ pixels: p }]));
    case "bmp":
      return b(bmp(p));
    case "ico":
      return b(await ico(p));
    case "tiff": {
      const UTIF = (await import("utif2")).default;
      return b(new Uint8Array(UTIF.encodeImage(new Uint8Array(p.donnees.buffer, p.donnees.byteOffset, p.donnees.byteLength), p.largeur, p.hauteur)));
    }
    default:
      throw new Error("Ce format n'est pas une image.");
  }
}

/** Une image prête à placer dans un PDF : JPEG tel quel, tout le reste en PNG. */
export async function pourPdf(blob: Blob, format: string): Promise<{ octets: Uint8Array; type: "jpg" | "png"; largeur: number; hauteur: number }> {
  if (format === "jpg" || format === "png") {
    const bm = await createImageBitmap(blob);
    const r = { octets: new Uint8Array(await blob.arrayBuffer()), type: format as "jpg" | "png", largeur: bm.width, hauteur: bm.height };
    bm.close();
    return r;
  }
  const p = await decoder(blob, format);
  return { octets: new Uint8Array(await (await encoder(p, "png")).arrayBuffer()), type: "png", largeur: p.largeur, hauteur: p.hauteur };
}

/** Vignette (pour la liste de fusion). */
export async function vignette(blob: Blob, format: string, cote = 160): Promise<string> {
  const p = await decoder(blob, format);
  const echelle = Math.min(1, cote / Math.max(p.largeur, p.hauteur));
  const c = toile(Math.max(1, Math.round(p.largeur * echelle)), Math.max(1, Math.round(p.hauteur * echelle)));
  contexte(c).drawImage(versToile(p) as CanvasImageSource, 0, 0, c.width, c.height);
  return URL.createObjectURL(await versBlob(c, "image/png"));
}
