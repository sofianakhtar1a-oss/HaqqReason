/*
 * ChatPDF : la lecture des PDF, entièrement dans le navigateur.
 *   1. l'empreinte SHA-256 du fichier (pour ne pas importer deux fois le même) ;
 *   2. le texte de chaque page avec pdf.js (les ressources sont servies par le site) ;
 *   3. pour un document scanné (pages sans texte), la reconnaissance de caractères (OCR) en
 *      français, arabe et anglais, page par page ;
 *   4. le tout sous la forme « [Page N] … », pour que l'IA puisse citer ses pages.
 * Le fichier ne quitte jamais l'appareil : seul son texte est envoyé au serveur.
 */
import { texteDesPages } from "@/lib/assistant/contexte";
import { LIMITES, formaterCaracteres } from "@/lib/assistant/limites";

export type Avancement = { etape: "lecture" | "ocr"; fait: number; total: number };
export type PdfLu = { nom: string; pages: number; pagesVides: number; ocr: number; texte: string; empreinte: string; ocrLimite: boolean };

/** Une page avec moins de caractères que cela est considérée comme sans texte (image, scan). */
const SEUIL_TEXTE = 20;

export async function empreinteDe(octets: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", octets);
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("");
}

function verifierAbandon(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Lecture annulée.", "AbortError");
}

export function estPdf(f: File): boolean {
  return f.type === "application/pdf" || /\.pdf$/i.test(f.name);
}

export async function lirePdfPourAssistant(fichier: File, avancer: (a: Avancement) => void, signal: AbortSignal): Promise<PdfLu> {
  if (fichier.size > LIMITES.fichierMaxOctets) throw new Error(`Ce fichier pèse plus de ${Math.round(LIMITES.fichierMaxOctets / 1024 / 1024)} Mo : découpe-le d'abord (L'Alambic › Découper).`);
  const octets = await fichier.arrayBuffer();
  const tete = new TextDecoder().decode(new Uint8Array(octets, 0, Math.min(1024, octets.byteLength)));
  if (!tete.includes("%PDF")) throw new Error("Ce fichier n'est pas un PDF.");
  // L'empreinte AVANT pdf.js : il transfère les octets à son « worker », qui les rend illisibles ici.
  const empreinte = await empreinteDe(octets);

  const { chargerPdfjs } = await import("@/lib/client/pdf");
  const pdfjs = await chargerPdfjs();
  const tache = pdfjs.getDocument({
    data: new Uint8Array(octets),
    cMapUrl: "/vendor/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/vendor/pdfjs/standard_fonts/",
    wasmUrl: "/vendor/pdfjs/wasm/",
    iccUrl: "/vendor/pdfjs/iccs/",
    enableXfa: false,
  });
  try {
    let doc;
    try {
      doc = await tache.promise;
    } catch (e) {
      if ((e as { name?: string }).name === "PasswordException") throw new Error("Ce PDF est protégé par un mot de passe : retire-le d'abord (L'Alambic › Protéger).");
      throw new Error("Ce PDF est abîmé ou illisible.");
    }
    const total = doc.numPages;
    if (total > 5000) throw new Error("Ce PDF dépasse 5 000 pages : découpe-le d'abord.");
    const pages: { n: number; texte: string }[] = [];
    let caracteres = 0;
    for (let n = 1; n <= total; n++) {
      verifierAbandon(signal);
      const page = await doc.getPage(n);
      const contenu = await page.getTextContent();
      let texte = "";
      let y: number | null = null;
      for (const item of contenu.items) {
        if (!("str" in item)) continue;
        const yi = item.transform[5];
        const h = Math.abs(item.transform[3]) || 10;
        // Grand saut vertical : nouveau paragraphe ; petit : même paragraphe (on recolle les mots coupés).
        if (y !== null && Math.abs(y - yi) > h * 1.8) texte += "\n\n";
        else if (y !== null && Math.abs(y - yi) > h * 0.5) texte = texte.endsWith("-") ? texte.slice(0, -1) : `${texte} `;
        texte += item.str;
        if (item.hasEOL && !texte.endsWith(" ")) texte += " ";
        y = yi;
      }
      texte = texte.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").replace(/\u0000/g, "").trim();
      pages.push({ n, texte });
      caracteres += texte.length;
      page.cleanup();
      if (caracteres > LIMITES.texteDocumentMax) throw new Error(`Ce document dépasse ${formaterCaracteres(LIMITES.texteDocumentMax)} de caractères : découpe-le en plusieurs parties.`);
      if (n % 5 === 0 || n === total) avancer({ etape: "lecture", fait: n, total });
    }

    // Document scanné (au moins la moitié des pages sans texte) : reconnaissance de caractères.
    const vides = pages.filter((p) => p.texte.length < SEUIL_TEXTE);
    let ocr = 0;
    let ocrLimite = false;
    if (vides.length && vides.length >= total / 2) {
      const aLire = vides.slice(0, LIMITES.pagesOcrMax);
      ocrLimite = vides.length > aLire.length;
      avancer({ etape: "ocr", fait: 0, total: aLire.length });
      const { createWorker, OEM } = await import("tesseract.js");
      const moteur = await createWorker(["fra", "ara", "eng"], OEM.LSTM_ONLY, {
        workerPath: "/vendor/tesseract/worker.min.js",
        corePath: "/vendor/tesseract/core/",
        langPath: "/vendor/tesseract/lang",
        workerBlobURL: false,
        gzip: true,
      });
      try {
        for (let i = 0; i < aLire.length; i++) {
          verifierAbandon(signal);
          const cible = aLire[i];
          const page = await doc.getPage(cible.n);
          const vue = page.getViewport({ scale: 2 });
          const toile = document.createElement("canvas");
          toile.width = Math.ceil(vue.width);
          toile.height = Math.ceil(vue.height);
          await page.render({ canvas: toile, viewport: vue }).promise;
          const { data } = await moteur.recognize(toile);
          cible.texte = data.text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
          if (cible.texte.length >= SEUIL_TEXTE) ocr++;
          toile.width = 0;
          toile.height = 0;
          page.cleanup();
          avancer({ etape: "ocr", fait: i + 1, total: aLire.length });
        }
      } finally {
        await moteur.terminate();
      }
    }

    const restantes = pages.filter((p) => p.texte.length < SEUIL_TEXTE).length;
    if (restantes === total) throw new Error("Aucun texte n'a pu être lu dans ce PDF, même par reconnaissance de caractères.");
    const texte = texteDesPages(pages);
    if (texte.length > LIMITES.texteDocumentMax || new TextEncoder().encode(texte).length > LIMITES.texteDocumentOctets) {
      throw new Error("Ce document est trop long pour une seule importation : découpe-le en plusieurs parties (L'Alambic › Découper).");
    }
    return { nom: fichier.name, pages: total, pagesVides: restantes, ocr, ocrLimite, texte, empreinte };
  } finally {
    await tache.destroy();
  }
}
