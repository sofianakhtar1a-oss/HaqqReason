/*
 * Découpage « sémantique » : on coupe aux frontières naturelles du sens (paragraphes, puis phrases),
 * jamais au milieu d'une phrase, en gardant le repère de chaque morceau (page, instant, ligne).
 * Aucun chevauchement : en mode « tout le contexte », rien n'est envoyé deux fois ; la recherche
 * ajoute plutôt les morceaux voisins quand elle a besoin de contexte.
 */
import { jetons, type Morceau, type Segment } from "./types";

const MOTS_CIBLE = 320;
const MOTS_MIN = 180;
const MOTS_MAX = 460;
const SECONDES_MAX = 100;
const LIGNES_PAR_MORCEAU = 30;
const SIGNES_PAR_PAGE = 3000;

const compterMots = (t: string) => (t.match(/\S+/g) ?? []).length;

/** Phrases d'un paragraphe (ponctuation latine et arabe). */
export function phrasesDe(paragraphe: string): string[] {
  return paragraphe.match(/[^.!?؟…]+(?:[.!?؟…]+["»”')\]]*|$)/g)?.map((p) => p.trim()).filter(Boolean) ?? [paragraphe];
}

/** Texte sans pages (Word, texte, Markdown) : pages estimées de 3 000 signes, coupées entre deux paragraphes. */
export function pagesEstimees(texte: string): Segment[] {
  const paragraphes = texte.split(/\n\s*\n|\n(?=#{1,6}\s)/).map((p) => p.trim()).filter(Boolean);
  const pages: Segment[] = [];
  let courant: string[] = [];
  let taille = 0;
  for (const p of paragraphes) {
    if (taille > 0 && taille + p.length > SIGNES_PAR_PAGE) {
      pages.push({ texte: courant.join("\n\n"), page: pages.length + 1 });
      courant = [];
      taille = 0;
    }
    courant.push(p);
    taille += p.length;
  }
  if (courant.length) pages.push({ texte: courant.join("\n\n"), page: pages.length + 1 });
  return pages;
}

type Unite = { texte: string; page?: number; t?: number; ligne?: number; finParagraphe: boolean };

function fabriquer(source: string, groupes: Unite[][]): Morceau[] {
  return groupes
    .filter((g) => g.length)
    .map((g, ordre) => {
      const texte = g
        .map((u, i) => (i > 0 && g[i - 1].finParagraphe ? `\n\n${u.texte}` : i > 0 ? ` ${u.texte}` : u.texte))
        .join("")
        .trim();
      return { id: `${source}:${ordre}`, source, ordre, texte, page: g[0].page, t: g[0].t, ligne: g[0].ligne, jetons: jetons(texte) };
    });
}

/** Documents : paragraphes, puis phrases si un paragraphe est trop long. Un morceau ne couvre jamais deux pages. */
export function decouperTexte(source: string, pages: Segment[]): Morceau[] {
  const unites: Unite[] = [];
  for (const pg of pages) {
    for (const para of pg.texte.split(/\n\s*\n|\n(?=#{1,6}\s)|\n(?=[-*•]\s)/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean)) {
      if (compterMots(para) <= MOTS_MAX * 0.6) unites.push({ texte: para, page: pg.page, finParagraphe: true });
      else {
        const ph = phrasesDe(para);
        ph.forEach((p, i) => unites.push({ texte: p, page: pg.page, finParagraphe: i === ph.length - 1 }));
      }
    }
  }
  const groupes: Unite[][] = [];
  let courant: Unite[] = [];
  let mots = 0;
  for (const u of unites) {
    const n = compterMots(u.texte);
    const precedent = courant[courant.length - 1];
    // Couper : morceau plein, ou assez long et on arrive en fin de paragraphe / sur une nouvelle page.
    const plein = mots + n > MOTS_MAX;
    const bonneFrontiere = mots >= MOTS_CIBLE || (mots >= MOTS_MIN && /^#{1,6}\s/.test(u.texte));
    // Jamais deux pages dans un même morceau : chaque citation garde ainsi son numéro de page exact.
    const nouvellePage = precedent !== undefined && precedent.page !== u.page;
    if (courant.length && (plein || nouvellePage || (bonneFrontiere && precedent?.finParagraphe))) {
      groupes.push(courant);
      courant = [];
      mots = 0;
    }
    courant.push(u);
    mots += n;
  }
  groupes.push(courant);
  return fabriquer(source, groupes);
}

/** Transcriptions : des phrases horodatées regroupées en passages d'environ 90 secondes. */
export function decouperTemps(source: string, phrases: Segment[]): Morceau[] {
  const groupes: Unite[][] = [];
  let courant: Unite[] = [];
  let mots = 0;
  for (const p of phrases) {
    const n = compterMots(p.texte);
    const debut = courant[0]?.t ?? p.t ?? 0;
    if (courant.length && (mots + n > MOTS_MAX || (mots >= MOTS_MIN && (p.t ?? 0) - debut >= SECONDES_MAX))) {
      groupes.push(courant);
      courant = [];
      mots = 0;
    }
    courant.push({ texte: p.texte, t: p.t, finParagraphe: false });
    mots += n;
  }
  groupes.push(courant);
  return fabriquer(source, groupes);
}

/** Tableaux : l'en-tête est répété en tête de chaque paquet de lignes, pour que chaque morceau se suffise. */
export function decouperLignes(source: string, lignes: Segment[]): Morceau[] {
  if (!lignes.length) return [];
  const [entete, ...corps] = lignes;
  const groupes: Unite[][] = [];
  for (let i = 0; i < corps.length; i += LIGNES_PAR_MORCEAU) {
    const paquet = corps.slice(i, i + LIGNES_PAR_MORCEAU);
    groupes.push([{ texte: `${entete.texte}`, ligne: paquet[0].ligne, finParagraphe: true }, ...paquet.map((l) => ({ texte: l.texte, ligne: l.ligne, finParagraphe: true }))]);
  }
  if (!corps.length) groupes.push([{ texte: entete.texte, ligne: 1, finParagraphe: true }]);
  return fabriquer(source, groupes).map((m, k) => ({ ...m, ligne: corps[k * LIGNES_PAR_MORCEAU]?.ligne ?? 1 }));
}
