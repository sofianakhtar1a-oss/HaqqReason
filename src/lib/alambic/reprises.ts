/*
 * Masquer : les pages gardées telles quelles ne doivent rien emporter d'une page masquée.
 *
 * Copier une page (pdf-lib) copie tout ce que ses objets désignent. Un lien vers une autre page, un
 * champ de formulaire partagé, un fil d'article feraient donc entrer dans le fichier masqué une page
 * entière que l'utilisateur croit caviardée — invisible, mais lisible avec un outil. On retire ces
 * renvois avant la copie, puis on vérifie le fichier produit. Pur : testé dans tests/test-alambic-studio.mts.
 */
import { PDFArray, PDFDict, PDFName, PDFRef, PDFStream, type PDFDocument, type PDFObject } from "@cantoo/pdf-lib";

const N = (n: string) => PDFName.of(n);
/** Annotations qui emportent des fichiers, des médias ou du code. */
const GENRES_RISQUES = new Set(["/FileAttachment", "/Sound", "/Movie", "/Screen", "/RichMedia", "/3D"]);
/** Actions qui exécutent, envoient ou ouvrent autre chose. */
const ACTIONS_RISQUEES = new Set(["/JavaScript", "/Launch", "/ImportData", "/SubmitForm", "/ResetForm", "/Rendition", "/GoToR", "/GoToE", "/Thread"]);

const estPage = (o: unknown) => o instanceof PDFDict && (o.lookup(N("Type")) === N("Page") || o.lookup(N("Type")) === N("Pages"));

/** L'objet mène-t-il, de référence en référence, à une page (ou à l'arbre des pages) ? */
export function menePage(doc: PDFDocument, depart: PDFObject | undefined, limite = 50_000): boolean {
  const vus = new Set<string>();
  const pile: (PDFObject | undefined)[] = [depart];
  let n = 0;
  while (pile.length) {
    if (++n > limite) return true; // trop grand pour être vérifié : on le traite comme dangereux
    const o = pile.pop();
    if (!o) continue;
    if (o instanceof PDFRef) {
      const cle = o.toString();
      if (vus.has(cle)) continue;
      vus.add(cle);
      const cible = doc.context.lookup(o);
      if (estPage(cible)) return true;
      pile.push(cible);
    } else if (estPage(o)) return true;
    else if (o instanceof PDFDict) for (const [, v] of o.entries()) pile.push(v);
    else if (o instanceof PDFArray) for (const v of o.asArray()) pile.push(v);
    else if (o instanceof PDFStream) for (const [, v] of o.dict.entries()) pile.push(v);
  }
  return false;
}

function risquee(d: PDFDict): boolean {
  const genre = d.lookup(N("Subtype"));
  if (genre instanceof PDFName && GENRES_RISQUES.has(genre.asString())) return true;
  const action = d.lookup(N("A"));
  const s = action instanceof PDFDict ? action.lookup(N("S")) : undefined;
  return s instanceof PDFName && ACTIONS_RISQUEES.has(s.asString());
}

/**
 * Prépare, dans le document source, les pages qui seront reprises telles quelles (indices à partir
 * de 0) : clés de page inutiles à l'affichage retirées (fils d'article, métadonnées, vignette,
 * actions), et annotations écartées si elles exécutent quelque chose ou renvoient vers une autre
 * page. Renvoie le nombre d'annotations retirées.
 */
export function assainirReprises(doc: PDFDocument, reprises: number[]): number {
  const toutes = doc.getPages();
  const pages = reprises.map((i) => toutes[i]).filter(Boolean);
  for (const p of pages) for (const cle of ["B", "Metadata", "PieceInfo", "Thumb", "AA"]) p.node.delete(N(cle));
  const annotations = (p: (typeof pages)[number]) => {
    const a = p.node.lookup(N("Annots"));
    return a instanceof PDFArray ? a : null;
  };
  // D'abord : plus de renvoi vers la page porteuse (/P) ni d'actions automatiques (/AA).
  for (const p of pages)
    for (const v of annotations(p)?.asArray() ?? []) {
      const d = v instanceof PDFRef ? doc.context.lookup(v) : v;
      if (d instanceof PDFDict) {
        d.delete(N("P"));
        d.delete(N("AA"));
      }
    }
  let retirees = 0;
  for (const p of pages) {
    const a = annotations(p);
    if (!a) continue;
    const gardees: PDFObject[] = [];
    for (const v of a.asArray()) {
      const d = v instanceof PDFRef ? doc.context.lookup(v) : v;
      if (!(d instanceof PDFDict) || risquee(d) || menePage(doc, d)) {
        retirees++;
        continue;
      }
      gardees.push(v);
    }
    if (gardees.length === a.size()) continue;
    if (gardees.length) p.node.set(N("Annots"), doc.context.obj(gardees));
    else p.node.delete(N("Annots"));
  }
  return retirees;
}

/** Nombre de pages présentes dans le fichier sans être dans l'arbre des pages (0 attendu). */
export function pagesHorsArbre(doc: PDFDocument): number {
  let pages = 0;
  for (const [, o] of doc.context.enumerateIndirectObjects()) if (o instanceof PDFDict && o.lookup(N("Type")) === N("Page")) pages++;
  return pages - doc.getPageCount();
}
