"use client";

/*
 * Protection par mot de passe.
 * - PDF : chiffrement natif AES-256 (norme PDF 2.0). Tout lecteur PDF demande le mot de passe à l'ouverture.
 * - Tout autre fichier : archive ZIP chiffrée en AES-256 (WinZip AES). S'ouvre avec 7-Zip, WinRAR,
 *   Keka ou The Unarchiver (Mac), et les gestionnaires de fichiers d'Android.
 * Le mot de passe ne quitte jamais l'appareil et n'est enregistré nulle part.
 */
import { PDFDocument } from "@cantoo/pdf-lib";

/** Ce que le lecteur du PDF a le droit de faire (respecté par les lecteurs PDF courants). */
export type Autorisations = { imprimer: boolean; copier: boolean; modifier: boolean };
export const TOUT_AUTORISE: Autorisations = { imprimer: true, copier: true, modifier: true };

/** Un mot de passe « propriétaire » que personne ne connaît : les restrictions ne se lèvent qu'en repartant de l'original. */
function cleAleatoire(): string {
  const o = new Uint8Array(24);
  crypto.getRandomValues(o);
  return Array.from(o, (x) => x.toString(16).padStart(2, "0")).join("");
}

/**
 * Chiffre un PDF. `motDePasse` vide : le PDF s'ouvre sans mot de passe mais garde ses restrictions
 * (impression, copie, modification), ce qui n'a de sens que si l'une d'elles est retirée.
 */
export async function protegerPdf(blob: Blob, motDePasse: string, autorisations: Autorisations = TOUT_AUTORISE): Promise<Blob> {
  const { charger } = await import("./pdf");
  let doc: PDFDocument;
  try {
    doc = await charger(new Uint8Array(await blob.arrayBuffer()));
  } catch (e) {
    if ((e as Error).name === "PdfProtege") throw new Error("Ce PDF est déjà protégé par un mot de passe : déverrouille-le d'abord (outil « Déverrouiller ») pour en mettre un nouveau.");
    throw new Error("Ce PDF est illisible : il ne peut pas être protégé.");
  }
  const restreint = !autorisations.imprimer || !autorisations.copier || !autorisations.modifier;
  doc.encrypt({
    userPassword: motDePasse,
    // Sans restriction, le même mot de passe ouvre tout ; avec, le mot de passe « propriétaire » reste secret.
    ownerPassword: restreint ? cleAleatoire() : motDePasse,
    permissions: {
      printing: autorisations.imprimer ? "highResolution" : false,
      modifying: autorisations.modifier,
      copying: autorisations.copier,
      annotating: autorisations.modifier,
      fillingForms: true,
      contentAccessibility: true,
      documentAssembly: autorisations.modifier,
    },
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
