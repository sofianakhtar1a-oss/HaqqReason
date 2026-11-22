"use client";

/*
 * Découper › « Ses images » : les photos et illustrations d'un PDF, chacune dans son fichier.
 * Les JPEG sortent tels quels (aucune perte) ; les autres images deviennent des PNG.
 */
import type { Resultat } from "./moteur";

type Avancer = (fraction: number | null, etape: string) => void;

const annule = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Annulé", "AbortError");
};

export async function extraireImages(octets: Uint8Array, pages: number[], base: string, avancer: Avancer, signal?: AbortSignal): Promise<Resultat> {
  const [{ charger }, { imagesDesPages }, { ecrireArchive }] = await Promise.all([import("./pdf"), import("../extraction"), import("./archives")]);
  avancer(null, "Recherche des images");
  const doc = await charger(octets);
  const { images, ignorees } = imagesDesPages(doc, pages);
  if (!images.length)
    throw new Error(
      ignorees
        ? "Les images de ces pages sont dans un format que ton navigateur ne sait pas restituer (fax, JBIG2…). « Une image par page » les garde, avec la page entière."
        : "Aucune image dans ces pages : elles ne contiennent que du texte et des dessins. Pour une image de chaque page, choisis « Une image par page ».",
    );
  const fichiers: { nom: string; blob: Blob }[] = [];
  const parPage = new Map<number, number>();
  let jpx = 0;
  let cmjn = 0;
  let opaques = 0;
  let ratees = ignorees;
  for (let i = 0; i < images.length; i++) {
    annule(signal);
    const im = images[i];
    avancer(i / images.length, `Image ${i + 1} sur ${images.length}`);
    const k = (parPage.get(im.page) ?? 0) + 1;
    parPage.set(im.page, k);
    const nom = `${base} - page ${im.page} - image ${k}`;
    if (im.cmjn) cmjn++;
    if (im.sansTransparence) opaques++;
    if (im.genre === "jpeg") fichiers.push({ nom: `${nom}.jpg`, blob: new Blob([im.octets.slice().buffer], { type: "image/jpeg" }) });
    else if (im.genre === "jpx") {
      jpx++;
      fichiers.push({ nom: `${nom}.jp2`, blob: new Blob([im.octets.slice().buffer], { type: "image/jp2" }) });
    } else {
      // Une image trop grande pour la mémoire du navigateur n'empêche pas d'enregistrer les autres.
      try {
        const c = document.createElement("canvas");
        c.width = im.largeur;
        c.height = im.hauteur;
        c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(im.rgba), im.largeur, im.hauteur), 0, 0);
        const png = await new Promise<Blob | null>((ok) => c.toBlob(ok, "image/png"));
        c.width = 0;
        if (!png) throw new Error("toBlob");
        fichiers.push({ nom: `${nom}.png`, blob: png });
      } catch {
        ratees++;
      }
    }
  }
  if (!fichiers.length) throw new Error("Les images de ces pages sont trop grandes pour la mémoire de ton navigateur. « Une image par page » les garde, avec la page entière.");
  const avertissements = [`${fichiers.length === 1 ? "L'image est sortie telle qu'elle est" : `Les ${fichiers.length} images sont sorties telles qu'elles sont`} dans le PDF : les photos JPEG ne sont pas recompressées.`];
  if (ratees) avertissements.push(`${ratees} autre${ratees > 1 ? "s images n'ont" : " image n'a"} pas pu être extraite${ratees > 1 ? "s" : ""} (fax, JBIG2, trop grande…) : « Une image par page » les garde, avec la page entière.`);
  if (jpx) avertissements.push("Les images JPEG 2000 (.jp2) s'ouvrent avec Aperçu (Mac) ou GIMP, pas toujours dans un navigateur.");
  if (cmjn) avertissements.push(`${cmjn > 1 ? `${cmjn} images sont` : "Une image est"} en couleurs d'imprimerie (CMJN) : hors d'un logiciel de mise en page, leurs couleurs peuvent paraître fausses.`);
  if (opaques) avertissements.push(`${opaques > 1 ? `${opaques} images perdent leur` : "Une image perd sa"} transparence (fond opaque).`);
  if (fichiers.length === 1) {
    const f = fichiers[0];
    return { nom: f.nom, blob: f.blob, format: f.nom.endsWith(".jpg") ? "jpg" : f.nom.endsWith(".png") ? "png" : "jp2", avertissements };
  }
  avancer(0.95, "Rangement dans un ZIP");
  return { nom: `${base} - ${fichiers.length} images.zip`, blob: await ecrireArchive(fichiers, "zip", () => {}), format: "zip", avertissements };
}
