"use client";

import { lireDocument as lireAvecAlambic } from "@/lib/alambic/navigateur/documents";
import { documentVide, type DocumentAtelier } from "@/lib/atelier/modele";
import { nouvelIdentifiant } from "@/lib/atelier/depot";

/**
 * Le Calame — ouvrir un fichier venu d'ailleurs (Word, OpenDocument, Markdown, texte,
 * HTML, RTF, EPUB, PDF) comme nouveau document. La lecture est celle de L'Alambic :
 * le même moteur, dans le navigateur, sans rien envoyer au serveur.
 */

const FORMATS: Record<string, string> = {
  docx: "docx",
  odt: "odt",
  md: "md",
  markdown: "md",
  txt: "txt",
  text: "txt",
  html: "html",
  htm: "html",
  rtf: "rtf",
  epub: "epub",
  pdf: "pdf",
};

export function formatDuFichier(nom: string): string | null {
  const extension = nom.toLowerCase().split(".").pop() ?? "";
  return FORMATS[extension] ?? null;
}

export async function importerFichier(fichier: File, avancer: (f: number) => void = () => undefined): Promise<DocumentAtelier> {
  const format = formatDuFichier(fichier.name);
  if (!format) throw new Error("Format inconnu");
  const lu = await lireAvecAlambic(fichier.name, format, fichier, avancer);
  const titre = (lu.titre || fichier.name.replace(/\.[^.]+$/, "")).slice(0, 200);
  const doc = documentVide(nouvelIdentifiant(), titre);
  return { ...doc, contenu: lu.doc };
}
