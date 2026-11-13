/*
 * Chargement de pdf.js dans le navigateur (uniquement à la demande : la bibliothèque est lourde).
 * Toutes ses ressources sont servies par l'application (public/vendor/pdfjs).
 */
import type { PDFDocumentProxy } from "pdfjs-dist";

type Pdfjs = typeof import("pdfjs-dist");
let chargement: Promise<Pdfjs> | null = null;

export function chargerPdfjs(): Promise<Pdfjs> {
  chargement ??= import("pdfjs-dist").then((m) => {
    m.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";
    return m;
  });
  return chargement;
}

/** Lien temporaire de lecture d'un fichier (vérifié par le serveur). */
export async function lienDuFichier(id: string): Promise<string> {
  const reponse = await fetch(`/fichiers/${id}?lien`, { cache: "no-store" });
  if (!reponse.ok) throw new Error("Fichier introuvable ou inaccessible.");
  const { url } = (await reponse.json()) as { url: string };
  return url;
}

/** Ouvre un PDF. « fermer » libère la mémoire et le worker (à appeler quand on a fini). */
export async function ouvrirPdf(id: string): Promise<{ document: PDFDocumentProxy; fermer: () => Promise<void> }> {
  const [pdfjs, url] = await Promise.all([chargerPdfjs(), lienDuFichier(id)]);
  const tache = pdfjs.getDocument({
    url,
    cMapUrl: "/vendor/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/vendor/pdfjs/standard_fonts/",
    wasmUrl: "/vendor/pdfjs/wasm/",
    iccUrl: "/vendor/pdfjs/iccs/",
    enableXfa: false,
  });
  const document = await tache.promise;
  return { document, fermer: () => tache.destroy() };
}
