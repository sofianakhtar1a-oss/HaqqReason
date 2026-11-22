/*
 * Écrit le PDF organisé : les pages dans l'ordre voulu, pivotées, dupliquées, avec les pages blanches.
 * Fonctionne aussi dans Node (testé dans tests/test-alambic-studio.mts).
 */
import { degrees, PDFDocument, type PDFPage } from "@cantoo/pdf-lib";
import type { PageOrdonnee } from "./pages";

export async function ecrireOrganise(sources: Map<string, PDFDocument>, pages: PageOrdonnee[], titre?: string): Promise<Uint8Array> {
  if (!pages.length) throw new Error("Il ne reste aucune page : garde-en au moins une.");
  const sortie = await PDFDocument.create();
  if (titre) sortie.setTitle(titre);
  sortie.setProducer("HaqqReason — L'Alambic");

  // Chaque source est recopiée en une fois (polices et images partagées ne sont copiées qu'une fois) ;
  // une page utilisée deux fois (duplication) est recopiée à part.
  const copiees = new Map<string, Map<number, PDFPage>>();
  for (const [id, doc] of sources) {
    const indices = [...new Set(pages.filter((p) => p.source === id).map((p) => p.index))].sort((a, b) => a - b);
    if (!indices.length) continue;
    const liste = await sortie.copyPages(doc, indices);
    copiees.set(id, new Map(indices.map((i, k) => [i, liste[k]])));
  }

  const dejaPlacees = new Set<PDFPage>();
  for (const p of pages) {
    let page: PDFPage;
    if (p.source === null) {
      page = sortie.addPage(p.taille ?? [595.28, 841.89]);
    } else {
      const doc = sources.get(p.source);
      const copie = copiees.get(p.source)?.get(p.index);
      if (!doc || !copie) throw new Error("Une page vient d'un PDF qui n'est plus là.");
      page = dejaPlacees.has(copie) ? (await sortie.copyPages(doc, [p.index]))[0] : copie;
      dejaPlacees.add(page);
      sortie.addPage(page);
    }
    const actuelle = page.getRotation().angle;
    const voulue = (((actuelle + p.rotation) % 360) + 360) % 360;
    if (voulue !== actuelle) page.setRotation(degrees(voulue));
  }
  return sortie.save();
}
