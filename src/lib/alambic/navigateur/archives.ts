"use client";

/*
 * Archives, dans le navigateur. ZIP par zip.js (lecture et écriture en flux : les gros fichiers passent),
 * GZIP par le navigateur lui-même (CompressionStream), TAR par ../archives.ts.
 */
import { ecrireTar, lireTar } from "../archives";

export type FichierArchive = { nom: string; blob: Blob; date?: Date };

async function zipjs() {
  const z = await import("@zip.js/zip.js");
  z.configure({ useWebWorkers: false });
  return z;
}

async function gunzip(blob: Blob): Promise<Blob> {
  try {
    return await new Response(blob.stream().pipeThrough(new DecompressionStream("gzip"))).blob();
  } catch {
    throw new Error("Ce fichier .gz est abîmé : il ne se décompresse pas.");
  }
}

export async function lireArchive(nom: string, format: string, blob: Blob): Promise<FichierArchive[]> {
  if (format === "zip") {
    const z = await zipjs();
    const lecteur = new z.ZipReader(new z.BlobReader(blob));
    try {
      const entrees = await lecteur.getEntries();
      const sortie: FichierArchive[] = [];
      for (const e of entrees) {
        if (e.directory || e.filename.startsWith("__MACOSX/")) continue;
        if (e.encrypted) throw new Error("Ce ZIP est protégé par un mot de passe.");
        sortie.push({ nom: e.filename, blob: await e.getData!(new z.BlobWriter()), date: e.lastModDate });
      }
      return sortie;
    } catch (err) {
      if (err instanceof Error && err.message.includes("mot de passe")) throw err;
      throw new Error("Ce ZIP est abîmé ou incomplet.");
    } finally {
      await lecteur.close();
    }
  }
  if (format === "tar") return lireTar(new Uint8Array(await blob.arrayBuffer())).map((e) => ({ nom: e.nom, blob: new Blob([e.octets.slice().buffer]), date: e.date }));
  if (format === "gz") {
    const brut = await gunzip(blob);
    const debut = new Uint8Array(await brut.slice(257, 262).arrayBuffer());
    if (String.fromCharCode(...debut) === "ustar") return lireArchive(nom, "tar", brut);
    // Un seul fichier compressé (« notes.txt.gz ») : on retrouve son nom.
    return [{ nom: nom.replace(/\.gz$/i, "") || "fichier", blob: brut }];
  }
  throw new Error("Ce format n'est pas une archive.");
}

export async function ecrireArchive(fichiers: FichierArchive[], format: string, avancer: (f: number) => void): Promise<Blob> {
  if (format === "zip") {
    const z = await zipjs();
    const ecrivain = new z.ZipWriter(new z.BlobWriter("application/zip"), { level: 6 });
    const total = fichiers.reduce((s, f) => s + f.blob.size, 0) || 1;
    let fait = 0;
    for (const f of fichiers) {
      await ecrivain.add(f.nom, new z.BlobReader(f.blob), { lastModDate: f.date, onprogress: async (p) => avancer((fait + p) / total) });
      fait += f.blob.size;
    }
    return ecrivain.close();
  }
  const entrees = [];
  for (const f of fichiers) entrees.push({ nom: f.nom, octets: new Uint8Array(await f.blob.arrayBuffer()), date: f.date });
  const tar = new Blob([ecrireTar(entrees).slice().buffer], { type: "application/x-tar" });
  avancer(0.6);
  if (format === "tar") return tar;
  if (format === "gz") {
    const gz = await new Response(tar.stream().pipeThrough(new CompressionStream("gzip"))).blob();
    avancer(1);
    return new Blob([gz], { type: "application/gzip" });
  }
  throw new Error("Ce format n'est pas une archive.");
}
