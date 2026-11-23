import type { Histoire } from "../histoires/catalogue";
import { motsDe } from "../histoires/texte";
import type { Niveau } from "../types";

/*
 * La dictée surprise : six phrases tirées au hasard dans les histoires du niveau, assez longues
 * pour le niveau, sans nom propre difficile, sans chiffres ni tirets. Tirées par le serveur, qui
 * seul lit les histoires (certaines sont réservées à Premium).
 */

export const NOMBRE_PHRASES = 6;
export const LONGUEURS: Record<Niveau, [number, number]> = { A1: [4, 9], A2: [5, 11], B1: [6, 14], B2: [7, 16], C1: [8, 18], C2: [8, 20] };

export type PhraseDictee = { en: string; fr: string };

/** Une phrase à dicter : sans guillemets, sans nom propre difficile, sans chiffres ni tirets. */
function phraseDictable(en: string) {
  return !/[0-9—–()[\];:]/.test(en);
}
const nettoyer = (en: string) => en.replace(/[“”"‘]/g, "").replace(/’/g, "'").replace(/\s+/g, " ").trim();

function melanger<T>(liste: T[], hasard: () => number): T[] {
  const t = [...liste];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

export function phrasesSurprise(histoires: Histoire[], niveau: Niveau, hasard: () => number = Math.random): PhraseDictee[] {
  const [min, max] = LONGUEURS[niveau];
  const candidates: PhraseDictee[] = [];
  for (const h of histoires)
    for (const page of h.pages)
      for (const para of page.p)
        for (const [en, fr, g] of para) {
          const n = motsDe(en).length;
          const nomPropre = g.some((k) => k !== null && h.gloses[k]?.[2] === "np");
          if (n >= min && n <= max && !nomPropre && phraseDictable(en)) candidates.push({ en: nettoyer(en), fr });
        }
  const vues = new Set<string>();
  return melanger(candidates, hasard)
    .filter((p) => !vues.has(p.en) && vues.add(p.en))
    .slice(0, NOMBRE_PHRASES);
}
