/*
 * Du son au livre : les segments horodatés deviennent des phrases, puis des paragraphes.
 * Code pur (ni réseau, ni navigateur) : utilisé côté serveur et côté navigateur, et testé à part.
 */
import type { Fragment, Mot, Phrase } from "./types";

/* ---------- Alignement : le texte ponctué du segment, les instants des mots ---------- */

const DIACRITIQUES = /[ً-ٰٟۖ-ۭـ]/g;

/** Forme comparable d'un mot : sans ponctuation, sans voyelles arabes, sans accents ni majuscules. */
export function normaliser(mot: string): string {
  return mot
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(DIACRITIQUES, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

/**
 * Associe chaque mot du texte (avec sa ponctuation) aux instants donnés par le moteur.
 * Les mots sans correspondance reçoivent des instants répartis selon leur longueur.
 */
export function aligner(texte: string, debut: number, fin: number, mots: { t: string; d: number; f: number }[]): Mot[] {
  const jetons = texte.trim().split(/\s+/).filter(Boolean);
  if (!jetons.length) return [];
  const sortie: (Mot & { connu: boolean })[] = jetons.map((t) => ({ t, d: Number.NaN, f: Number.NaN, connu: false }));
  let k = 0;
  for (let j = 0; j < jetons.length && k < mots.length; j++) {
    const cible = normaliser(jetons[j]);
    if (!cible) continue;
    // On regarde le mot attendu et les deux suivants : Whisper découpe parfois un mot en deux.
    for (let pas = 0; pas < 3 && k + pas < mots.length; pas++) {
      const candidat = normaliser(mots[k + pas].t);
      if (candidat && (candidat === cible || (candidat.length > 2 && cible.startsWith(candidat)) || (cible.length > 2 && candidat.startsWith(cible)))) {
        let finMot = mots[k + pas].f;
        // Mot coupé en morceaux : on absorbe les morceaux suivants tant qu'ils complètent le jeton.
        let reconstitue = candidat;
        let n = k + pas + 1;
        while (reconstitue.length < cible.length && n < mots.length && cible.startsWith(reconstitue + normaliser(mots[n].t))) {
          reconstitue += normaliser(mots[n].t);
          finMot = mots[n].f;
          n++;
        }
        sortie[j] = { t: jetons[j], d: mots[k + pas].d, f: finMot, connu: true };
        k = n;
        break;
      }
    }
  }
  // Interpolation des trous, au prorata du nombre de lettres.
  let i = 0;
  while (i < sortie.length) {
    if (sortie[i].connu) {
      i++;
      continue;
    }
    let j = i;
    while (j < sortie.length && !sortie[j].connu) j++;
    const a = i > 0 ? sortie[i - 1].f : debut;
    const b = j < sortie.length ? sortie[j].d : fin;
    const lettres = sortie.slice(i, j).reduce((s, m) => s + Math.max(1, m.t.length), 0);
    let t = a;
    for (let x = i; x < j; x++) {
      const part = ((b - a) * Math.max(1, sortie[x].t.length)) / lettres;
      sortie[x] = { ...sortie[x], d: t, f: t + part };
      t += part;
    }
    i = j;
  }
  return sortie.map(({ t, d, f }) => ({ t, d: arrondir(d), f: arrondir(Math.max(f, d)) }));
}

const arrondir = (x: number) => Math.round(x * 1000) / 1000;

/* ---------- Réponse de Whisper → fragments propres ---------- */

/** Phrases que Whisper « entend » dans le silence (génériques de sous-titrage, appels à s'abonner). */
const HALLUCINATIONS = /(sous-titr|subtit|amara\.org|thanks? for watching|thank you for watching|merci d'avoir regard|اشترك|ترجمة نانسي|subtítulos|suscríbete|gracias por ver)/i;

type SegmentBrut = { start: number; end: number; text: string; no_speech_prob?: number; avg_logprob?: number; compression_ratio?: number };

export function depuisWhisper(segments: SegmentBrut[], mots: { word: string; start: number; end: number }[]): Fragment[] {
  const tous = mots.map((m) => ({ t: m.word.trim(), d: m.start, f: m.end })).filter((m) => m.t);
  const sortie: Fragment[] = [];
  let precedent = "";
  let repetitions = 0;
  for (const s of segments) {
    const texte = s.text.trim();
    if (!texte) continue;
    const nbMots = texte.split(/\s+/).length;
    if ((s.no_speech_prob ?? 0) > 0.6 && (s.avg_logprob ?? 0) < -0.8) continue;
    if ((s.compression_ratio ?? 0) > 2.6) continue;
    if (nbMots <= 10 && HALLUCINATIONS.test(texte)) continue;
    // Boucle de répétition (défaut connu de Whisper) : on garde deux occurrences au plus.
    if (normaliser(texte) === precedent) {
      repetitions++;
      if (repetitions >= 2) continue;
    } else {
      precedent = normaliser(texte);
      repetitions = 0;
    }
    const dedans = tous.filter((m) => m.d >= s.start - 0.08 && m.d < s.end + 0.08);
    sortie.push({ texte, d: s.start, f: s.end, mots: aligner(texte, s.start, s.end, dedans) });
  }
  return sortie;
}

/* ---------- Recollage des morceaux de 10 minutes ---------- */

export type Morceau = {
  /** Instant (dans le fichier entier) où commence le son envoyé. */
  decalage: number;
  /** Partie du morceau qui fait foi : les mots qui commencent avant « de » ou après « a » viennent du voisin. */
  de: number;
  a: number;
  fragments: Fragment[];
};

/** Mots du fichier entier, dans l'ordre, sans doublon aux coutures. Le drapeau marque une fin de segment. */
export function recoller(morceaux: Morceau[]): (Mot & { finSegment: boolean })[] {
  const sortie: (Mot & { finSegment: boolean })[] = [];
  for (const m of [...morceaux].sort((x, y) => x.decalage - y.decalage)) {
    for (const fr of m.fragments) {
      const mots = fr.mots?.length ? fr.mots : aligner(fr.texte, fr.d, fr.f, []);
      const gardes = mots.map((w) => ({ t: w.t, d: arrondir(w.d + m.decalage), f: arrondir(w.f + m.decalage) })).filter((w) => w.d >= m.de && w.d < m.a);
      gardes.forEach((w, i) => sortie.push({ ...w, finSegment: i === gardes.length - 1 }));
    }
  }
  return sortie;
}

/* ---------- Phrases et paragraphes ---------- */

const FIN_PHRASE = /[.!?؟…。]["»”'’)\]]*$/u;
const ABREVIATIONS = /^(mr|mrs|ms|dr|st|sr|sra|srta|dra|prof|etc|vs|p\.ej|no|ud|uds)\.$/i;

export function construirePhrases(mots: (Mot & { finSegment?: boolean })[]): Phrase[] {
  if (!mots.length) return [];
  // Les sous-titres automatiques et l'arabe arrivent souvent sans ponctuation : on coupe alors aux pauses.
  const ponctues = mots.filter((m) => FIN_PHRASE.test(m.t)).length;
  const auxPauses = ponctues < mots.length / 45;

  const groupes: Mot[][] = [];
  let courant: Mot[] = [];
  for (let i = 0; i < mots.length; i++) {
    const m = mots[i];
    courant.push({ t: m.t, d: m.d, f: m.f });
    const suivant = mots[i + 1];
    const pause = suivant ? suivant.d - m.f : Number.POSITIVE_INFINITY;
    const n = courant.length;
    let couper = !suivant;
    if (!couper && !auxPauses) {
      couper = (FIN_PHRASE.test(m.t) && !ABREVIATIONS.test(m.t) && n >= 2) || (n >= 60 && (pause > 0.35 || /[,;:،]$/.test(m.t))) || n >= 90;
    } else if (!couper) {
      couper = (n >= 6 && (pause >= 0.7 || (m.finSegment === true && pause >= 0.25))) || (n >= 28 && pause >= 0.3) || n >= 45;
    }
    if (couper) {
      groupes.push(courant);
      courant = [];
    }
  }
  if (courant.length) groupes.push(courant);

  const phrases: Phrase[] = [];
  let paragraphe = 0;
  let dansParagraphe = 0;
  let motsParagraphe = 0;
  groupes.forEach((g, id) => {
    const avant = phrases[phrases.length - 1];
    const silence = avant ? g[0].d - avant.fin : 0;
    if (avant && ((silence >= 1.6 && dansParagraphe >= 2) || dansParagraphe >= 6 || motsParagraphe >= 110)) {
      paragraphe++;
      dansParagraphe = 0;
      motsParagraphe = 0;
    }
    phrases.push({ id, debut: g[0].d, fin: g[g.length - 1].f, mots: g, paragraphe });
    dansParagraphe++;
    motsParagraphe += g.length;
  });
  return phrases;
}

/** Phrase en cours de lecture (recherche dichotomique). Renvoie -1 avant la première. */
export function phraseA(phrases: Phrase[], t: number): number {
  let bas = 0;
  let haut = phrases.length - 1;
  let trouve = -1;
  while (bas <= haut) {
    const milieu = (bas + haut) >> 1;
    if (phrases[milieu].debut <= t + 0.05) {
      trouve = milieu;
      bas = milieu + 1;
    } else haut = milieu - 1;
  }
  return trouve;
}

/** Mot en cours dans une phrase (le dernier mot commencé). */
export function motA(phrase: Phrase, t: number): number {
  let trouve = -1;
  for (let i = 0; i < phrase.mots.length; i++) {
    if (phrase.mots[i].d <= t + 0.03) trouve = i;
    else break;
  }
  return trouve;
}
