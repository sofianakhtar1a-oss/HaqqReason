/*
 * Le karaoké bilingue : chaque mot s'allume à l'instant où il est dit.
 *
 * Format des données (déjà celui de la transcription, voir alambic/transcription/types.ts) :
 *   Phrase = { id, debut, fin, paragraphe, mots: [{ t: "Take", d: 41.20, f: 41.46 }, …] }
 *   — t : le mot tel qu'affiché ; d / f : début et fin en secondes (horodatage Whisper, mot par mot).
 *
 * La traduction n'a pas de voix : on calcule l'horodatage de ses mots (code pur, sans réseau).
 *   1. Ancres : quand l'analyse de la phrase donne le sens d'un mot de la vidéo (« gloses »)
 *      et qu'un mot de la traduction y figure, ce mot traduit s'allume avec son mot d'origine.
 *   2. Entre deux ancres, le temps se partage selon le poids de chaque mot : ses syllabes,
 *      plus une petite pause après une virgule ou un point.
 * Le résultat a exactement la forme des mots de la vidéo : { t, d, f }.
 */
import type { Glose, Mot, Phrase } from "../alambic/transcription/types";

const VOYELLES = /[aeiouyàâäéèêëîïôöùûüœæ]+/gi;

/** Poids parlé d'un mot : ses groupes de voyelles (≈ syllabes), plus une pause après la ponctuation. */
export function poidsMot(mot: string): number {
  const nu = mot.replace(/[^\p{L}\p{N}'’-]/gu, "");
  if (!nu) return 0.3;
  const syllabes = Math.max(1, (nu.match(VOYELLES) ?? []).length - (/[^aeiouy]e$/i.test(nu) && nu.length > 3 ? 1 : 0));
  const pause = /[.!?…]$/.test(mot) ? 0.9 : /[,;:]$/.test(mot) ? 0.5 : 0;
  // Un mot très court (« a », « le ») se dit plus vite qu'une syllabe pleine.
  return (nu.length <= 2 ? 0.6 : syllabes) + pause;
}

const nettoyer = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9']/g, "")
    // L'élision ne compte pas : « j'adore » se compare à « adore ».
    .replace(/^(?:qu|[cdjlmnst])'/, "")
    .replace(/'/g, "");

/** Mots trop fréquents pour servir d'ancre (ils apparaissent dans presque toutes les gloses). */
const VIDES = new Set(
  "le la les un une des de du d l a au aux et ou en y se ce ces son sa ses il elle on ne pas que qui est the a an of to and in on is it be".split(" "),
);

/**
 * Pour chaque mot traduit, l'index du mot de la vidéo dont il traduit le sens (ou -1).
 * Les ancres gardées suivent l'ordre du temps : une ancre qui ferait reculer l'horloge est écartée.
 */
export function ancres(source: Mot[], traduits: string[], gloses: Glose[] | undefined): number[] {
  const sortie = traduits.map(() => -1);
  if (!gloses?.length) return sortie;
  const parMot = new Map<number, Set<string>>();
  for (const g of gloses) {
    if (g.i < 0 || g.i >= source.length) continue;
    const mots = g.sens.split(/[\s/,;()]+/).map(nettoyer).filter((m) => m.length >= 3 && !VIDES.has(m));
    if (mots.length) parMot.set(g.i, new Set([...(parMot.get(g.i) ?? []), ...mots]));
  }
  let dernier = -1;
  traduits.forEach((tr, j) => {
    const cle = nettoyer(tr);
    if (cle.length < 3 || VIDES.has(cle)) return;
    for (const [i, sens] of parMot) {
      if (i <= dernier) continue;
      // « mangé » trouve « manger », « maisons » trouve « maison » : même début sur 4 lettres au moins.
      const trouve = [...sens].some((s) => s === cle || (s.length >= 4 && cle.length >= 4 && (s.startsWith(cle.slice(0, Math.max(4, cle.length - 2))) || cle.startsWith(s.slice(0, Math.max(4, s.length - 2))))));
      if (trouve) {
        sortie[j] = i;
        dernier = i;
        break;
      }
    }
  });
  return sortie;
}

/** Partage l'intervalle [debut, fin] entre des mots, selon leur poids. */
function partager(mots: string[], debut: number, fin: number): Mot[] {
  const poids = mots.map(poidsMot);
  const total = poids.reduce((a, b) => a + b, 0) || 1;
  const sortie: Mot[] = [];
  let t = debut;
  mots.forEach((m, k) => {
    const d = t;
    t += ((fin - debut) * poids[k]) / total;
    sortie.push({ t: m, d: arrondi(d), f: arrondi(k === mots.length - 1 ? fin : t) });
  });
  return sortie;
}

const arrondi = (x: number) => Math.round(x * 1000) / 1000;

/** L'horodatage mot par mot d'une traduction, calé sur la voix de la phrase d'origine. */
export function horodaterTraduction(phrase: Pick<Phrase, "debut" | "fin" | "mots">, traduction: string, gloses?: Glose[]): Mot[] {
  const mots = traduction.split(/\s+/).filter(Boolean);
  if (!mots.length) return [];
  // La voix réelle : du premier mot dit au dernier (plus juste que les bornes de la phrase).
  const debut = phrase.mots[0]?.d ?? phrase.debut;
  const fin = Math.max(debut + 0.2, phrase.mots.at(-1)?.f ?? phrase.fin);
  const a = ancres(phrase.mots, mots, gloses);
  // Les points fixes : début, chaque ancre (au début de son mot d'origine), fin.
  const fixes: { j: number; t: number }[] = [{ j: 0, t: debut }];
  a.forEach((i, j) => {
    if (i < 0 || j === 0) return;
    const t = Math.min(fin, Math.max(fixes.at(-1)!.t + 0.05, phrase.mots[i].d));
    fixes.push({ j, t });
  });
  fixes.push({ j: mots.length, t: fin });
  const sortie: Mot[] = [];
  for (let k = 0; k < fixes.length - 1; k++) {
    const tranche = mots.slice(fixes[k].j, fixes[k + 1].j);
    if (tranche.length) sortie.push(...partager(tranche, fixes[k].t, fixes[k + 1].t));
  }
  return sortie;
}

/** Avancée (0 → 1) de la voix dans un mot : sert au remplissage progressif du mot en cours. */
export function avancee(mot: Mot | undefined, t: number): number {
  if (!mot) return 0;
  const duree = Math.max(0.08, mot.f - mot.d);
  return Math.min(1, Math.max(0, (t - mot.d) / duree));
}
