"use client";

/* Le texte d'un PDF, page par page, lu dans le navigateur avec pdf.js (rien n'est envoyé). */
import type { PageTexte } from "./stockage";

export async function lirePdf(f: File, avancer: (x: number) => void): Promise<PageTexte[]> {
  const { chargerPdfjs } = await import("@/lib/client/pdf");
  const pdfjs = await chargerPdfjs();
  const tache = pdfjs.getDocument({
    data: new Uint8Array(await f.arrayBuffer()),
    cMapUrl: "/vendor/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/vendor/pdfjs/standard_fonts/",
    wasmUrl: "/vendor/pdfjs/wasm/",
    iccUrl: "/vendor/pdfjs/iccs/",
    enableXfa: false,
  });
  try {
    const doc = await tache.promise;
    const pages: PageTexte[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const contenu = await page.getTextContent();
      let texte = "";
      let y: number | null = null;
      for (const item of contenu.items) {
        if (!("str" in item)) continue;
        const yi = item.transform[5];
        const h = Math.abs(item.transform[3]) || 10;
        // Grand saut vertical : nouveau paragraphe ; petit : même paragraphe.
        if (y !== null && Math.abs(y - yi) > h * 1.8) texte += "\n\n";
        else if (y !== null && Math.abs(y - yi) > h * 0.5) texte = texte.endsWith("-") ? texte.slice(0, -1) : `${texte} `;
        texte += item.str;
        y = yi;
      }
      pages.push({ page: n, texte: texte.replace(/[ \t]+/g, " ").trim() });
      page.cleanup();
      avancer(n / doc.numPages);
    }
    if (!pages.some((p) => p.texte.length > 20)) throw new Error("Ce PDF ne contient que des images (document scanné) : passe-le d'abord en texte avec un logiciel de reconnaissance de caractères.");
    return pages;
  } catch (e) {
    if ((e as { name?: string }).name === "PasswordException") throw new Error("Ce PDF est protégé par un mot de passe.");
    throw e;
  } finally {
    await tache.destroy();
  }
}
