/*
 * Citations : « [Rapport_2026.pdf, p. 14] » ou « [Vidéo YouTube - Titre, 12:45] » deviennent des boutons
 * qui ouvrent la source à la bonne page, au bon instant. Plusieurs citations dans un même crochet
 * (séparées par « ; ») sont reconnues une à une. Code pur, testé à part.
 */
import type { Source } from "./types";

export type Citation = { brut: string; nom: string; source?: Source; page?: number; t?: number; ligne?: number; etiquette: string };

const REPERE = /^(.*?),\s*(?:(p(?:age|\.)?\s*~?\s*(\d+)(?:\s*[-–]\s*\d+)?)|((?:\d{1,2}:)?\d{1,2}:\d{2})(?:\s*[-–]\s*(?:\d{1,2}:)?\d{1,2}:\d{2})?|(lignes?\s*(\d+)(?:\s*[-–]\s*\d+)?))\s*$/i;

const plat = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\.(pdf|docx?|txt|md|markdown|csv|mp3|m4a|wav|mp4|webm|ogg|mov)$/i, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

function secondes(m: string): number {
  return m.split(":").map(Number).reduce((s, x) => s * 60 + x, 0);
}

export function trouverSource(nom: string, sources: Source[]): Source | undefined {
  const cible = plat(nom.replace(/^(vid[ée]o\s+youtube|youtube|audio|vid[ée]o)\s*[-–—:]\s*/i, ""));
  if (!cible) return undefined;
  return (
    sources.find((s) => plat(s.nom) === cible) ??
    sources.find((s) => cible.length >= 4 && (plat(s.nom).includes(cible) || cible.includes(plat(s.nom))))
  );
}

/** Une citation entre crochets (sans les crochets), éventuellement multiple. */
export function lireCitations(interieur: string, sources: Source[]): Citation[] {
  const sortie: Citation[] = [];
  for (const partie of interieur.split(/\s*;\s*/)) {
    const m = REPERE.exec(partie.trim());
    if (!m) continue;
    const nom = m[1].trim();
    const source = trouverSource(nom, sources);
    const page = m[3] ? Number(m[3]) : undefined;
    const t = m[4] ? secondes(m[4]) : undefined;
    const ligne = m[6] ? Number(m[6]) : undefined;
    const etiquette = page !== undefined ? `p. ${page}` : t !== undefined ? m[4] : `ligne ${ligne}`;
    sortie.push({ brut: partie.trim(), nom: source?.nom ?? nom, source, page, t, ligne, etiquette });
  }
  return sortie;
}

const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Remplace les citations du Markdown par des boutons HTML (avant le rendu Markdown).
 * Les liens Markdown [texte](adresse) sont laissés tels quels.
 */
export function lierCitations(markdown: string, sources: Source[]): string {
  return markdown.replace(/\[([^[\]\n]{3,400})\](?!\()/g, (tout, interieur: string) => {
    const cites = lireCitations(interieur, sources);
    if (!cites.length) return tout;
    return cites
      .map((c) => {
        const attributs = [
          c.source ? `data-source="${echapper(c.source.id)}"` : 'data-inconnue="1"',
          c.page !== undefined ? `data-page="${c.page}"` : "",
          c.t !== undefined ? `data-t="${c.t}"` : "",
          c.ligne !== undefined ? `data-ligne="${c.ligne}"` : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `<button type="button" class="cb-cite" ${attributs} title="${echapper(c.brut)}"><span class="cb-cite-nom">${echapper(c.nom)}</span><span class="cb-cite-repere">${echapper(c.etiquette)}</span></button>`;
      })
      .join("");
  });
}
