"use client";

/*
 * L'Alambic — chef d'orchestre des conversions, dans le navigateur.
 * Chaque famille est chargée seulement quand on en a besoin : la page s'ouvre vite.
 * Rien ne quitte l'appareil.
 */
import { format, nomConverti } from "../formats";
import { verdict, type Capacites } from "../graphe";
import { documentDeTableaux } from "../pm";

export type Entree = { nom: string; blob: Blob; format: string };
export type Resultat = { nom: string; blob: Blob; format: string; avertissements: string[] };
export type Avancement = (fraction: number | null, etape: string) => void;
export type Reglages = {
  qualite: number;
  /** Son et vidéo : null = automatique (recopie sans perte quand c'est possible). */
  qualiteMedia?: number | null;
  separateur: ";" | ",";
  extrait?: { debut: number; fin: number };
  signal?: AbortSignal;
};

const DOCUMENTS = new Set(["docx", "odt", "rtf", "txt", "md", "html", "epub", "pdf"]);

function sansExtension(nom: string): string {
  return nom.replace(/\.tar\.gz$/i, "").replace(/\.[^.]+$/, "");
}

export async function convertir(entree: Entree, cible: string, reglages: Reglages, capacites: Capacites, avancer: Avancement): Promise<Resultat> {
  const v = verdict(entree.format, cible, capacites);
  if (!v.possible) throw new Error(v.raison);
  const nom = nomConverti(entree.nom, cible);
  const fin = (blob: Blob, avertissements: string[] = [], nomFinal = nom, formatFinal = cible): Resultat => ({ nom: nomFinal, blob, format: formatFinal, avertissements });

  switch (v.moteur) {
    case "document": {
      const { lireDocument, ecrireDocument } = await import("./documents");
      avancer(null, "Lecture du document");
      const lu = await lireDocument(entree.nom, entree.format, entree.blob, (f) => avancer(f * 0.6, "Lecture des pages"));
      avancer(0.7, `Écriture en ${format(cible).nom}`);
      const ecrit = await ecrireDocument(lu.doc, cible, lu.titre);
      return fin(ecrit.blob, [...lu.avertissements, ...ecrit.avertissements]);
    }

    case "pdf-images": {
      const { ouvrir, pageEnImage } = await import("./pdf");
      const octets = new Uint8Array(await entree.blob.arrayBuffer());
      const { doc, fermer } = await ouvrir(octets);
      try {
        const n = doc.numPages;
        if (n === 1) {
          avancer(0.3, "Rendu de la page");
          return fin(await pageEnImage(doc, 1, cible));
        }
        const { ecrireArchive } = await import("./archives");
        const images = [];
        const chiffres = String(n).length;
        for (let p = 1; p <= n; p++) {
          if (reglages.signal?.aborted) throw new DOMException("Annulé", "AbortError");
          avancer((p - 1) / n * 0.9, `Rendu de la page ${p} sur ${n}`);
          images.push({ nom: `${sansExtension(entree.nom)} - page ${String(p).padStart(chiffres, "0")}.${format(cible).extensions[0]}`, blob: await pageEnImage(doc, p, cible) });
        }
        avancer(0.95, "Rangement dans un ZIP");
        return fin(await ecrireArchive(images, "zip", () => {}), [`${n} pages, donc ${n} images, réunies dans un ZIP.`], `${sansExtension(entree.nom)} - pages.zip`, "zip");
      } finally {
        await fermer();
      }
    }

    case "images-pdf": {
      const { PDFDocument } = await import("@cantoo/pdf-lib");
      const { imageEnPage } = await import("./pdf");
      avancer(0.2, "Mise en page");
      const pdf = await PDFDocument.create();
      pdf.setTitle(sansExtension(entree.nom));
      await imageEnPage(pdf, entree.blob, entree.format);
      const octets = await pdf.save();
      return fin(new Blob([octets.slice().buffer], { type: "application/pdf" }));
    }

    case "donnees": {
      const { lireDonnees, ecrireDonnees } = await import("./donnees");
      avancer(null, "Lecture des données");
      const lu = await lireDonnees(entree.nom, entree.format, entree.blob);
      const lignes = lu.feuilles.reduce((s, f) => s + f.lignes.length, 0);
      if (DOCUMENTS.has(cible)) {
        const { ecrireDocument } = await import("./documents");
        avancer(0.5, `Mise en tableau (${lignes} lignes)`);
        const ecrit = await ecrireDocument(documentDeTableaux(lu.feuilles), cible, sansExtension(entree.nom));
        return fin(ecrit.blob, ecrit.avertissements);
      }
      avancer(0.5, `Écriture de ${lignes} lignes`);
      const ecrit = await ecrireDonnees(lu, cible, { separateur: reglages.separateur });
      if (ecrit.fichiers.length === 1) return fin(ecrit.fichiers[0].blob, ecrit.avertissements);
      const { ecrireArchive } = await import("./archives");
      const zip = await ecrireArchive(
        ecrit.fichiers.map((f) => ({ nom: `${sansExtension(entree.nom)} - ${f.suffixe}.${format(cible).extensions[0]}`, blob: f.blob })),
        "zip",
        () => {},
      );
      return fin(zip, ecrit.avertissements, `${sansExtension(entree.nom)}.zip`, "zip");
    }

    case "image": {
      const { decoder, encoder } = await import("./images");
      avancer(0.2, "Lecture de l'image");
      const pixels = await decoder(entree.blob, entree.format);
      avancer(0.6, `Écriture en ${format(cible).nom}`);
      return fin(await encoder(pixels, cible, reglages.qualite), v.note && v.fidelite === "partielle" ? [v.note] : []);
    }

    case "media": {
      const { convertirMedia } = await import("./medias");
      avancer(0, "Préparation");
      const r = await convertirMedia(entree.blob, cible, { qualite: reglages.qualiteMedia ?? null, extrait: reglages.extrait, signal: reglages.signal }, (f) => avancer(f, f < 1 ? "Conversion" : "Finalisation"));
      return fin(r.blob, r.avertissements);
    }

    case "video-gif": {
      const { videoVersGif } = await import("./medias");
      avancer(0, "Extraction des images");
      const r = await videoVersGif(entree.blob, { qualite: null, extrait: reglages.extrait, signal: reglages.signal }, (f) => avancer(f, f < 0.85 ? "Extraction des images" : "Assemblage du GIF"));
      return fin(r.blob, r.avertissements);
    }

    case "archive": {
      const { ecrireArchive, lireArchive } = await import("./archives");
      const sourceArchive = format(entree.format).famille === "archive";
      avancer(null, sourceArchive ? "Ouverture de l'archive" : "Compression");
      const fichiers = sourceArchive ? await lireArchive(entree.nom, entree.format, entree.blob) : [{ nom: entree.nom, blob: entree.blob }];
      if (!fichiers.length) throw new Error("Cette archive est vide.");
      const blob = await ecrireArchive(fichiers, cible, (f) => avancer(f, "Compression"));
      const avertissements = sourceArchive ? [`${fichiers.length} fichier${fichiers.length > 1 ? "s" : ""} repris.`] : [];
      if (!sourceArchive && blob.size >= entree.blob.size * 0.97 && ["jpg", "png", "webp", "mp3", "mp4", "webm", "m4a", "aac", "ogg", "docx", "xlsx", "pdf", "epub", "odt", "zip", "gz"].includes(entree.format))
        avertissements.push("Ce fichier était déjà compressé : l'archive n'est pas plus légère.");
      return fin(blob, avertissements);
    }
  }
}

/** Protège un résultat : PDF chiffré si c'est un PDF, sinon ZIP chiffré qui le contient. */
export async function proteger(r: Resultat, motDePasse: string, avancer: Avancement): Promise<Resultat> {
  const { protegerEnZip, protegerPdf } = await import("./securite");
  if (r.format === "pdf") {
    avancer(null, "Chiffrement AES-256 du PDF");
    return { ...r, blob: await protegerPdf(r.blob, motDePasse) };
  }
  avancer(0, "Chiffrement AES-256");
  const blob = await protegerEnZip([{ nom: r.nom, blob: r.blob }], motDePasse, (f) => avancer(f, "Chiffrement AES-256"));
  return {
    nom: `${r.nom.replace(/\.zip$/i, "")} (protégé).zip`,
    blob,
    format: "zip",
    avertissements: [...r.avertissements, "Ce format ne se chiffre pas lui-même : le fichier est rangé dans un ZIP chiffré (AES-256). Il s'ouvre avec 7-Zip, WinRAR, Keka ou The Unarchiver ; l'explorateur de Windows, lui, ne sait pas ouvrir ce type de ZIP."],
  };
}

/** Lit l'en-tête d'un fichier et en reconnaît le format. */
export async function reconnaitre(fichier: File): Promise<string | null> {
  const { detecter } = await import("../formats");
  const debut = new Uint8Array(await fichier.slice(0, 4096).arrayBuffer());
  let entrees: string[] | undefined;
  if (debut[0] === 0x50 && debut[1] === 0x4b) {
    try {
      const z = await import("@zip.js/zip.js");
      z.configure({ useWebWorkers: false });
      const lecteur = new z.ZipReader(new z.BlobReader(fichier));
      entrees = (await lecteur.getEntries()).map((e) => e.filename);
      await lecteur.close();
    } catch {
      entrees = [];
    }
  }
  return detecter(fichier.name, debut, entrees);
}
