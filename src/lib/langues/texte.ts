/* Le texte d'une page de PDF, découpé en paragraphes, phrases et mots cliquables. */
import type { Phrase } from "@/lib/alambic/transcription/types";

const FIN_DE_PHRASE = /(?<=[.!?…]["”’)\]]?)\s+(?=["“‘(\[]?[\p{Lu}\p{N}])/u;
/** L'analyse mot à mot accepte 90 mots : au-delà, la phrase est coupée. */
const MOTS_MAX = 60;

export type PageDecoupee = { phrases: Phrase[]; paragraphes: number[][] };

export function decouperPhrases(texte: string): string[] {
  return texte
    .replace(/\s+/g, " ")
    .trim()
    .split(FIN_DE_PHRASE)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function decouperPage(texte: string): PageDecoupee {
  const phrases: Phrase[] = [];
  const paragraphes: number[][] = [];
  texte
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .forEach((para, n) => {
      const ids: number[] = [];
      for (const s of decouperPhrases(para)) {
        const mots = s.split(/\s+/).filter(Boolean);
        for (let k = 0; k < mots.length; k += MOTS_MAX) {
          const id = phrases.length;
          phrases.push({ id, debut: 0, fin: 0, paragraphe: n, mots: mots.slice(k, k + MOTS_MAX).map((t) => ({ t, d: 0, f: 0 })) });
          ids.push(id);
        }
      }
      if (ids.length) paragraphes.push(ids);
    });
  return { phrases, paragraphes };
}

/** Un passage sélectionné, en lots acceptés par la route de traduction (25 phrases, 1 100 signes chacune). */
export function lotsDePassage(passage: string): string[][] {
  const morceaux: string[] = [];
  for (const s of decouperPhrases(passage)) {
    if (s.length <= 1100) morceaux.push(s);
    else for (let k = 0; k < s.length; k += 1000) morceaux.push(s.slice(k, k + 1000));
  }
  const lots: string[][] = [];
  let lot: string[] = [];
  let signes = 0;
  for (const m of morceaux) {
    if (lot.length >= 25 || signes + m.length > 6000) {
      lots.push(lot);
      lot = [];
      signes = 0;
    }
    lot.push(m);
    signes += m.length;
  }
  if (lot.length) lots.push(lot);
  return lots;
}
