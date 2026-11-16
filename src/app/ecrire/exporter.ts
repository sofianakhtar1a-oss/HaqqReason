"use client";

import { gzipSync, gunzipSync, strToU8, strFromU8 } from "fflate";
import { construireDocx, type ImageDecodee } from "@/lib/atelier/docx";
import { enMarkdown } from "@/lib/atelier/markdown";
import { fichiersCites, lireFichier } from "@/lib/atelier/depot";
import { nettoyerReglages, VERSION_FORMAT, type DocumentAtelier } from "@/lib/atelier/modele";

/**
 * Le Calame — sortir du logiciel.
 *
 * Quatre routes : le PDF (par l'impression du navigateur, qui applique la même
 * géométrie que l'écran), le .docx (écrit ici, ouvert tel quel par Word et
 * LibreOffice), le Markdown, et le format natif — un JSON compressé qui
 * contient le texte, les réglages ET les images, pour remettre un document
 * entier sur un autre appareil.
 */

export function telecharger(nom: string, octets: string | Uint8Array, type: string): void {
  // Une copie dans un tampon ordinaire : certains types de tableaux ne sont pas acceptés tels quels par Blob.
  const morceau: BlobPart = typeof octets === "string" ? octets : new Uint8Array(octets).slice().buffer;
  const url = URL.createObjectURL(new Blob([morceau], { type }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Un nom de fichier sûr, tiré du titre. */
export function nomDeFichier(titre: string, extension: string): string {
  const base =
    titre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "document";
  return `${base}.${extension}`;
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

export function exporterMarkdown(doc: DocumentAtelier): void {
  telecharger(nomDeFichier(doc.titre, "md"), enMarkdown(doc.contenu, doc.titre), "text/markdown;charset=utf-8");
}

// ---------------------------------------------------------------------------
// Word
// ---------------------------------------------------------------------------

const EXTENSIONS: Record<string, ImageDecodee["extension"]> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** Lit les images citées par le document et mesure chacune : le .docx a besoin de leurs dimensions. */
async function imagesDuDocument(doc: DocumentAtelier): Promise<ImageDecodee[]> {
  const images: ImageDecodee[] = [];
  for (const id of fichiersCites(doc.contenu)) {
    const fichier = await lireFichier(id);
    const extension = fichier ? EXTENSIONS[fichier.type] : undefined;
    if (!fichier || !extension) continue;
    const octets = new Uint8Array(await fichier.blob.arrayBuffer());
    let largeur = 600;
    let hauteur = 400;
    try {
      const image = await createImageBitmap(fichier.blob);
      largeur = image.width;
      hauteur = image.height;
      image.close();
    } catch {
      // Dimensions inconnues : on garde la taille par défaut plutôt que de perdre l'image.
    }
    images.push({ id, octets, extension, largeur, hauteur });
  }
  return images;
}

export async function exporterDocx(doc: DocumentAtelier): Promise<void> {
  const images = await imagesDuDocument(doc);
  const octets = construireDocx({ titre: doc.titre, contenu: doc.contenu, reglages: doc.reglages, images });
  telecharger(nomDeFichier(doc.titre, "docx"), octets, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

// ---------------------------------------------------------------------------
// Format natif : JSON compressé, images comprises
// ---------------------------------------------------------------------------

export type Paquet = {
  format: "calame";
  version: number;
  document: DocumentAtelier;
  /** Images et documents joints, en base64, pour que rien ne manque à l'arrivée. */
  fichiers: { id: string; nom: string; type: string; donnees: string }[];
};

function enBase64(octets: Uint8Array): string {
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

function depuisBase64(texte: string): Uint8Array {
  const binaire = atob(texte);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
  return octets;
}

export async function construirePaquet(doc: DocumentAtelier): Promise<Uint8Array> {
  const fichiers: Paquet["fichiers"] = [];
  for (const id of fichiersCites(doc.contenu)) {
    const fichier = await lireFichier(id);
    if (!fichier) continue;
    fichiers.push({ id, nom: fichier.nom, type: fichier.type, donnees: enBase64(new Uint8Array(await fichier.blob.arrayBuffer())) });
  }
  const paquet: Paquet = { format: "calame", version: VERSION_FORMAT, document: doc, fichiers };
  return gzipSync(strToU8(JSON.stringify(paquet)), { level: 6 });
}

export async function exporterPaquet(doc: DocumentAtelier): Promise<void> {
  telecharger(nomDeFichier(doc.titre, "calame"), await construirePaquet(doc), "application/gzip");
}

/** Relit un paquet. Tout est revérifié : un fichier abîmé ne doit jamais casser l'atelier. */
export function lirePaquet(octets: Uint8Array): Paquet {
  const texte = strFromU8(gunzipSync(octets));
  const brut = JSON.parse(texte) as Partial<Paquet>;
  if (brut.format !== "calame" || !brut.document) throw new Error("Ce fichier n'est pas un document du Calame.");
  const doc = brut.document as DocumentAtelier;
  return {
    format: "calame",
    version: Number(brut.version ?? 1),
    document: { ...doc, reglages: nettoyerReglages(doc.reglages) },
    fichiers: Array.isArray(brut.fichiers) ? brut.fichiers : [],
  };
}

export function blobDuFichierPaquet(fichier: Paquet["fichiers"][number]): Blob {
  return new Blob([depuisBase64(fichier.donnees).slice().buffer], { type: fichier.type || "application/octet-stream" });
}

// ---------------------------------------------------------------------------
// PDF : on confie la pagination à l'imprimante du navigateur, qui applique la
// feuille de style d'impression — donc exactement la géométrie de l'écran.
// ---------------------------------------------------------------------------

export function exporterPdf(): void {
  window.print();
}
