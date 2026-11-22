"use client";

/* Remettre un fichier produit : le télécharger, ou le partager (menu du téléphone ou de l'ordinateur). */

export function telecharger(blob: Blob, nom: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nom;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Le navigateur sait-il partager ce fichier (WhatsApp, Mail, AirDrop…) ? */
export function peutPartager(fichier: File): boolean {
  try {
    return typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [fichier] });
  } catch {
    return false;
  }
}

export async function partager(fichier: File) {
  try {
    await navigator.share({ files: [fichier], title: fichier.name });
  } catch {
    // Partage annulé ou refusé : rien à faire.
  }
}
