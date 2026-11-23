"use client";

/*
 * L'Alambic — « Rassembler », la lecture : le texte d'un fichier, quel que soit son genre.
 * Tout est lu dans le navigateur ; seuls les sons et les vidéos partent à la transcription
 * (comme dans « Transcrire »), et leur transcription est rangée dans la même bibliothèque.
 */
import { estMotDePasseFaux, estPdfProtege, estZipProtege } from "../erreurs";
import { decoderTexte, type GenreLecture, ressembleTexte, texteDeFeuilles, texteDrawingMl, texteNet } from "../rassemblement";
import type { LangueOcr } from "./ocr";

export type Avancer = (avancement: number | null, etape: string) => void;
export type Lu = { texte: string; via: "texte" | "reconnaissance" | "transcription"; note?: string };

const annule = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
};

/** Le texte d'un fichier. `genre` : sa famille de lecture (null : on tente la lecture comme du texte). */
export async function lireTexte(fichier: File, genre: GenreLecture | null, format: string | null, langues: LangueOcr[], avancer: Avancer, signal: AbortSignal): Promise<Lu> {
  annule(signal);
  switch (genre) {
    case "pdf": {
      avancer(null, "Lecture du PDF");
      const { lirePdf, texteLu } = await import("./ocr");
      const pages = await lirePdf(new Uint8Array(await fichier.arrayBuffer()), langues, (a, etape) => avancer(a, etape), signal);
      const scannees = pages.filter((p) => !p.deja).length;
      return {
        texte: texteNet(texteLu(pages)),
        via: scannees ? "reconnaissance" : "texte",
        note: scannees ? `${scannees} page${scannees > 1 ? "s" : ""} scannée${scannees > 1 ? "s" : ""} sur ${pages.length}, lue${scannees > 1 ? "s" : ""} par reconnaissance du texte : relis les noms propres et les chiffres.` : undefined,
      };
    }
    case "document": {
      avancer(null, "Lecture du document");
      const { lireDocument, ecrireDocument } = await import("./documents");
      const lu = await lireDocument(fichier.name, format ?? "docx", fichier, (f) => avancer(f * 0.8, "Lecture du document"));
      annule(signal);
      const ecrit = await ecrireDocument(lu.doc, "txt", lu.titre);
      return { texte: texteNet(decoderTexte(new Uint8Array(await ecrit.blob.arrayBuffer()))), via: "texte" };
    }
    case "texte":
      avancer(null, "Lecture du texte");
      return { texte: texteNet(decoderTexte(new Uint8Array(await fichier.arrayBuffer()))), via: "texte" };
    case "tableur":
      return { texte: await lireTableur(fichier, format, avancer), via: "texte" };
    case "presentation":
      return { texte: await lirePresentation(fichier, format, avancer), via: "texte" };
    case "image": {
      const [{ texte }] = await reconnaitreImages([{ fichier, format: format ?? "png" }], langues, avancer, signal);
      return { texte, via: "reconnaissance", note: "Texte reconnu dans une image : relis les noms propres et les chiffres." };
    }
    case "svg": {
      avancer(null, "Lecture du dessin");
      const d = new DOMParser().parseFromString(decoderTexte(new Uint8Array(await fichier.arrayBuffer())), "image/svg+xml");
      const lignes = [...d.querySelectorAll("text, title, desc")].map((e) => e.textContent?.replace(/\s+/g, " ").trim() ?? "").filter(Boolean);
      return { texte: lignes.join("\n"), via: "texte" };
    }
    case "media":
      return transcrire(fichier, avancer, signal);
    case "archive":
      throw new Error("Une archive se déballe : ses fichiers rejoignent la liste.");
    default: {
      // Format inconnu : si cela ressemble à du texte, on le lit tel quel.
      const octets = new Uint8Array(await fichier.arrayBuffer());
      if (!ressembleTexte(octets)) throw new Error("Ce format ne contient pas de texte lisible ici.");
      return { texte: texteNet(decoderTexte(octets)), via: "texte" };
    }
  }
}

/** Plusieurs images d'un coup : la reconnaissance ne se charge qu'une fois pour toutes. */
export async function reconnaitreImages(images: { fichier: Blob; format: string }[], langues: LangueOcr[], avancer: Avancer, signal: AbortSignal): Promise<{ texte: string }[]> {
  const { lireImages, texteLu } = await import("./ocr");
  const pages = await lireImages(images, langues, (a, etape) => avancer(a, etape), signal);
  return pages.map((p) => ({ texte: texteNet(texteLu([p])) }));
}

async function lireTableur(fichier: File, format: string | null, avancer: Avancer): Promise<string> {
  avancer(null, "Lecture du tableur");
  if (format === "ods" || fichier.name.toLowerCase().endsWith(".ods")) {
    const { unzipSync, strFromU8 } = await import("fflate");
    const z = unzipSync(new Uint8Array(await fichier.arrayBuffer()), { filter: (f) => f.name === "content.xml" });
    if (!z["content.xml"]) throw new Error("Ce classeur OpenDocument est incomplet : son contenu est introuvable.");
    const d = new DOMParser().parseFromString(strFromU8(z["content.xml"]), "application/xml");
    const T = "urn:oasis:names:tc:opendocument:xmlns:table:1.0";
    const feuilles = [...d.getElementsByTagNameNS(T, "table")].map((t) => {
      const lignes = [...t.getElementsByTagNameNS(T, "table-row")].map((r) =>
        [...r.getElementsByTagNameNS(T, "table-cell")].flatMap((c) => {
          const n = Math.min(50, Number(c.getAttributeNS(T, "number-columns-repeated") ?? "1") || 1);
          return Array<string>(n).fill(c.textContent ?? "");
        }),
      );
      return { nom: t.getAttributeNS(T, "name") ?? "Feuille", colonnes: [] as string[], lignes };
    });
    return texteNet(texteDeFeuilles(feuilles));
  }
  const { lireDonnees } = await import("./donnees");
  const lu = await lireDonnees(fichier.name, "xlsx", fichier);
  return texteNet(texteDeFeuilles(lu.feuilles));
}

async function lirePresentation(fichier: File, format: string | null, avancer: Avancer): Promise<string> {
  avancer(null, "Lecture des diapositives");
  const { unzipSync, strFromU8 } = await import("fflate");
  const octets = new Uint8Array(await fichier.arrayBuffer());
  const odp = format === "odp" || fichier.name.toLowerCase().endsWith(".odp");
  if (odp) {
    const z = unzipSync(octets, { filter: (f) => f.name === "content.xml" });
    if (!z["content.xml"]) throw new Error("Cette présentation OpenDocument est incomplète : son contenu est introuvable.");
    const d = new DOMParser().parseFromString(strFromU8(z["content.xml"]), "application/xml");
    const pages = [...d.getElementsByTagNameNS("urn:oasis:names:tc:opendocument:xmlns:drawing:1.0", "page")];
    return texteNet(
      pages
        .map((p, i) => {
          const lignes = [...p.getElementsByTagNameNS("urn:oasis:names:tc:opendocument:xmlns:text:1.0", "p")].map((x) => x.textContent?.trim() ?? "").filter(Boolean);
          return lignes.length ? `Diapositive ${i + 1}\n${lignes.join("\n")}` : "";
        })
        .filter(Boolean)
        .join("\n\n"),
    );
  }
  const z = unzipSync(octets, { filter: (f) => /^ppt\/(slides\/slide|notesSlides\/notesSlide)\d+\.xml$/.test(f.name) });
  const numero = (n: string) => Number(/(\d+)\.xml$/.exec(n)?.[1] ?? 0);
  const diapos = Object.keys(z)
    .filter((n) => n.startsWith("ppt/slides/"))
    .sort((a, b) => numero(a) - numero(b));
  if (!diapos.length) throw new Error("Aucune diapositive n'a été trouvée dans cette présentation.");
  return texteNet(
    diapos
      .map((n, i) => {
        const lignes = texteDrawingMl(strFromU8(z[n]));
        const notes = z[`ppt/notesSlides/notesSlide${numero(n)}.xml`];
        // Les notes contiennent aussi le numéro de la diapositive : on ne garde que les vraies phrases.
        const remarques = notes ? texteDrawingMl(strFromU8(notes)).filter((l) => !/^\d+$/.test(l)) : [];
        return [`Diapositive ${i + 1}`, ...lignes, ...(remarques.length ? [`Notes : ${remarques.join(" ")}`] : [])].join("\n");
      })
      .join("\n\n"),
  );
}

/** Un son ou une vidéo : transcrit (comme dans « Transcrire »), puis rangé dans la bibliothèque des transcriptions. */
async function transcrire(fichier: File, avancer: Avancer, signal: AbortSignal): Promise<Lu> {
  const [{ transcrireFichier }, { versTexte }, bibliotheque] = await Promise.all([import("../transcription/client"), import("../transcription/exports"), import("../transcription/bibliotheque")]);
  const ETAPES = { preparation: "Préparation du son", distillation: "Transcription", "mise-en-page": "Mise en page" } as const;
  let etape: string = ETAPES.preparation;
  const t = await transcrireFichier(
    fichier,
    null,
    {
      etape: (e) => {
        etape = ETAPES[e];
        avancer(null, etape);
      },
      progression: (f) => avancer(f, etape),
      distillat: () => undefined,
    },
    signal,
  );
  await bibliotheque.enregistrer(t).catch(() => undefined);
  await bibliotheque.enregistrerMedia(t.id, fichier).catch(() => undefined);
  const complet = versTexte(t);
  const debut = complet.indexOf("\n\n");
  return { texte: texteNet(debut >= 0 ? complet.slice(debut + 2) : complet), via: "transcription", note: "Transcrit automatiquement : la transcription est aussi rangée dans « Transcrire »." };
}

/** Les fichiers d'une archive (ZIP, TAR, TAR.GZ), qui rejoignent la liste. */
export async function deballer(fichier: File, format: string): Promise<File[]> {
  const { lireArchive } = await import("./archives");
  const contenu = await lireArchive(fichier.name, format, fichier);
  return contenu.filter((x) => !x.nom.endsWith("/") && x.blob.size > 0).map((x) => new File([x.blob], x.nom, { lastModified: x.date?.getTime() ?? fichier.lastModified }));
}

/** Une erreur dite simplement, avec l'issue quand il y en a une. */
export function messageLecture(e: unknown): string {
  if (estPdfProtege(e)) return "PDF protégé par un mot de passe : déverrouille-le d'abord dans « Déverrouiller », puis ajoute-le de nouveau.";
  if (estZipProtege(e)) return "Archive protégée par un mot de passe : ouvre-la d'abord dans « Déverrouiller ».";
  if (estMotDePasseFaux(e)) return "Le mot de passe n'ouvre pas ce fichier.";
  const m = e instanceof Error ? e.message : "";
  return m || "Ce fichier n'a pas pu être lu.";
}
