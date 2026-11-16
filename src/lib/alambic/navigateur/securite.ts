"use client";

/*
 * Protection par mot de passe.
 * - PDF : chiffrement natif AES-256 (norme PDF 2.0). Tout lecteur PDF demande le mot de passe à l'ouverture.
 * - Tout autre fichier : archive ZIP chiffrée en AES-256 (WinZip AES). S'ouvre avec 7-Zip, WinRAR,
 *   Keka ou The Unarchiver (Mac), et les gestionnaires de fichiers d'Android.
 * Le mot de passe ne quitte jamais l'appareil et n'est enregistré nulle part.
 */
import { PDFDocument } from "@cantoo/pdf-lib";

export async function protegerPdf(blob: Blob, motDePasse: string): Promise<Blob> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()), { updateMetadata: false });
  } catch {
    throw new Error("Ce PDF est illisible : il ne peut pas être protégé.");
  }
  if (doc.isEncrypted) throw new Error("Ce PDF est déjà protégé par un mot de passe.");
  doc.encrypt({
    userPassword: motDePasse,
    ownerPassword: motDePasse,
    permissions: { printing: "highResolution", modifying: true, copying: true, annotating: true, fillingForms: true, contentAccessibility: true, documentAssembly: true },
  });
  const octets = await doc.save();
  return new Blob([octets.slice().buffer], { type: "application/pdf" });
}

export async function protegerEnZip(fichiers: { nom: string; blob: Blob }[], motDePasse: string, avancer: (f: number) => void): Promise<Blob> {
  const { BlobReader, BlobWriter, ZipWriter, configure } = await import("@zip.js/zip.js");
  // Tout se fait ici, sans « worker » chargé depuis ailleurs.
  configure({ useWebWorkers: false });
  const ecrivain = new ZipWriter(new BlobWriter("application/zip"), { password: motDePasse, encryptionStrength: 3, zipCrypto: false, level: 6 });
  const total = fichiers.reduce((s, f) => s + f.blob.size, 0) || 1;
  let fait = 0;
  for (const f of fichiers) {
    await ecrivain.add(f.nom, new BlobReader(f.blob), {
      onprogress: async (p) => {
        avancer((fait + p) / total);
      },
    });
    fait += f.blob.size;
  }
  return ecrivain.close();
}
