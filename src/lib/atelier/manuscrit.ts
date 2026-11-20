import type { DocumentAtelier, ReglagesPage } from "./modele";

/*
 * Le Calame — le manuscrit en chapitres : plusieurs documents assemblés, dans l'ordre choisi, en un
 * seul document qui s'exporte d'un seul tenant (PDF, Word, EPUB…). Module pur.
 */

export type OptionsManuscrit = {
  titre: string;
  /** Le titre de chaque document devient un titre de chapitre. */
  titresDeChapitre: boolean;
  /** Les titres de chaque document descendent d'un niveau (sous le titre du chapitre). */
  decalerTitres: boolean;
  /** Chaque chapitre commence sur une nouvelle page. */
  nouvellePage: boolean;
  /** Une seule table des matières, bibliographie, index… pour tout le manuscrit. */
  tablesUniques: boolean;
};

export const OPTIONS_MANUSCRIT: Omit<OptionsManuscrit, "titre"> = { titresDeChapitre: true, decalerTitres: true, nouvellePage: true, tablesUniques: true };

type Noeud = { type: string; attrs?: Record<string, unknown>; content?: Noeud[]; text?: string; marks?: unknown[] };

/** Ce qui rassemble tout le document : une seule fois dans le manuscrit. */
const DEBUT = ["pageDeGarde", "sommaire"];
const FIN = ["tableFigures", "bibliographie", "indexSources", "glossaire", "indexAlpha"];
const TABLES = new Set([...DEBUT, ...FIN]);

/** Un titre descend d'un niveau ; le plus petit devient un paragraphe au style « Titre 4 ». */
function decaler(n: Noeud): Noeud {
  if (n.type === "heading") {
    const niveau = Number(n.attrs?.level ?? 2);
    if (niveau >= 4) return { type: "paragraph", attrs: { ...(n.attrs ?? {}), level: undefined, styleNomme: "titre4" }, ...(n.content ? { content: n.content } : {}) };
    return { ...n, attrs: { ...(n.attrs ?? {}), level: niveau + 1 } };
  }
  return n.content ? { ...n, content: n.content.map(decaler) } : n;
}

const propre = (n: Noeud): Noeud => {
  if (!n.attrs) return n;
  const attrs = Object.fromEntries(Object.entries(n.attrs).filter(([, v]) => v !== undefined));
  return { ...n, attrs, ...(n.content ? { content: n.content.map(propre) } : {}) };
};

export function assemblerManuscrit(chapitres: DocumentAtelier[], o: OptionsManuscrit): { titre: string; contenu: Noeud; reglages: ReglagesPage | undefined } {
  const corps: Noeud[] = [];
  const tables = new Map<string, Noeud>();
  chapitres.forEach((d, i) => {
    let blocs = ((d.contenu as Noeud | undefined)?.content ?? []) as Noeud[];
    if (o.tablesUniques) {
      blocs = blocs.filter((b) => {
        if (!TABLES.has(b.type)) return true;
        if (!tables.has(b.type)) tables.set(b.type, b);
        return false;
      });
    }
    if (o.titresDeChapitre && o.decalerTitres) blocs = blocs.map(decaler);
    if (i > 0 && o.nouvellePage) corps.push({ type: "sautPage" });
    if (o.titresDeChapitre) corps.push({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: (d.titre || `Chapitre ${i + 1}`).trim() || `Chapitre ${i + 1}` }] });
    corps.push(...blocs);
  });
  const debut = DEBUT.filter((t) => tables.has(t)).map((t) => tables.get(t) as Noeud);
  const fin = FIN.filter((t) => tables.has(t)).map((t) => tables.get(t) as Noeud);
  // La table des matières et ce qui suit partent sur leur propre page.
  const contenu = [...debut, ...(debut.length && corps.length ? [{ type: "sautPage" }] : []), ...corps, ...(fin.length ? [{ type: "sautPage" }] : []), ...fin].map(propre);
  return { titre: o.titre.trim() || "Manuscrit", contenu: { type: "doc", content: contenu.length ? contenu : [{ type: "paragraph" }] }, reglages: chapitres[0]?.reglages };
}
