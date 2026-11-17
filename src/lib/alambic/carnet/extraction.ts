"use client";

/*
 * Extraction, dans le navigateur : chaque source devient du texte repéré (page, instant ou ligne),
 * puis des morceaux indexés. Les documents ne quittent pas l'appareil ; seuls les sons et vidéos
 * passent par la transcription (Whisper), comme dans l'outil « Transcrire ».
 */
import { lireCsv } from "../donnees";
import { transcrireFichier, transcrireYoutube } from "../transcription/client";
import { texteDe, type Transcription } from "../transcription/types";
import { decouperLignes, decouperTemps, decouperTexte, pagesEstimees } from "./decoupage";
import type { Morceau, Segment, Source, TypeSource } from "./types";

export function typeDe(f: File): TypeSource | null {
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" || f.type === "application/pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "word";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "csv" || ext === "tsv") return "csv";
  if (ext === "txt" || f.type.startsWith("text/")) return "texte";
  if (f.type.startsWith("audio/") || ["mp3", "m4a", "wav", "ogg", "opus", "flac", "aac"].includes(ext)) return "audio";
  if (f.type.startsWith("video/") || ["mp4", "mov", "mkv", "webm"].includes(ext)) return "video";
  return null;
}

export type Extraction = { morceaux: Morceau[]; complement: Partial<Source> };

export async function lirePdf(f: File, avancer: (x: number) => void): Promise<Segment[]> {
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
    const pages: Segment[] = [];
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

async function lireTexte(f: File): Promise<string> {
  const octets = new Uint8Array(await f.arrayBuffer());
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(octets);
  } catch {
    return new TextDecoder("windows-1252").decode(octets);
  }
}

function depuisTranscription(id: string, t: Transcription): Extraction {
  const phrases = t.phrases.map((p) => ({ texte: texteDe(p), t: p.debut }));
  return { morceaux: decouperTemps(id, phrases), complement: { duree: t.duree, langue: t.langue } };
}

export async function extraireFichier(id: string, f: File, type: TypeSource, avancer: (x: number) => void, signal?: AbortSignal): Promise<Extraction> {
  if (type === "pdf") {
    const pages = await lirePdf(f, avancer);
    return { morceaux: decouperTexte(id, pages), complement: { pages: pages.length } };
  }
  if (type === "word") {
    if (f.name.toLowerCase().endsWith(".doc")) throw new Error("L'ancien format .doc n'est pas lisible : enregistre-le en .docx (ou convertis-le dans « Convertir »).");
    const mammoth = await import("mammoth");
    const r = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() });
    const pages = pagesEstimees(r.value);
    avancer(1);
    return { morceaux: decouperTexte(id, pages), complement: { pages: pages.length, pagesEstimees: true } };
  }
  if (type === "texte" || type === "markdown") {
    const pages = pagesEstimees(await lireTexte(f));
    avancer(1);
    return { morceaux: decouperTexte(id, pages), complement: { pages: pages.length, pagesEstimees: true } };
  }
  if (type === "csv") {
    const lignes = lireCsv(await lireTexte(f), f.name.toLowerCase().endsWith(".tsv") ? "\t" : undefined);
    avancer(1);
    return { morceaux: decouperLignes(id, lignes.map((l, i) => ({ texte: l.join(" | "), ligne: i + 1 }))), complement: {} };
  }
  // Son ou vidéo : transcription Whisper, avec les minutages.
  const t = await transcrireFichier(f, null, { etape: () => undefined, progression: (x) => avancer(x), distillat: () => undefined }, signal);
  return depuisTranscription(id, t);
}

export async function extraireYoutube(id: string, video: string, avancer: (x: number) => void, signal?: AbortSignal): Promise<Extraction & { titre: string }> {
  const t = await transcrireYoutube(video, null, { etape: () => undefined, progression: (x) => avancer(x), distillat: () => undefined }, signal);
  return { ...depuisTranscription(id, t), titre: t.titre };
}
