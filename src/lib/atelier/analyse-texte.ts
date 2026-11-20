/**
 * Le Calame — relire sans intelligence artificielle.
 *
 * Des mesures simples et explicables, calculées sur l'appareil : phrases, mots,
 * lisibilité (formule de Flesch adaptée au français par Kandel et Moles), mots les
 * plus employés, répétitions rapprochées, phrases trop longues, mots faibles et
 * tournures passives. Module pur : testable au banc d'essai.
 */

export const MOTS_VIDES = new Set(
  (
    "a à ai aie ait as au aux avec avoir c ça ce ceci cela celle celles celui ces cet cette ceux chez ci comme d dans de des du elle elles en es est et été être eu eux " +
    "il ils j je l la le les leur leurs lui m ma mais me même mes moi mon n ne ni nos notre nous on ont ou où par pas pour qu que quel quelle quelles quels qui s sa sans se ses " +
    "si son sont sur t ta te tes toi ton tu un une vos votre vous y était étaient sera seront fut furent ainsi alors aussi bien car donc dont encore entre leurs lors puis " +
    "quand très tout tous toute toutes plus moins peu trop non oui cette ceux-ci celles-ci là ici après avant depuis pendant selon vers sous tant"
  ).split(" "),
);

export const MOTS_FAIBLES = ["chose", "choses", "truc", "trucs", "faire", "fait", "faites", "il y a", "il y avait", "vraiment", "très", "beaucoup", "certain", "certains", "certaines", "quelque chose", "plutôt", "assez", "simplement", "en fait", "donc", "bref"];

const PARTICIPE = /^[\p{L}-]+(é|ée|és|ées|i|ie|is|ies|u|ue|us|ues|it|ite|its|ites|ert|erte|erts|ertes|int|inte|ints|intes)$/u;
const ETRE = new Set(["est", "sont", "était", "étaient", "été", "sera", "seront", "serait", "seraient", "fut", "furent", "soit", "soient", "être"]);

export type Phrase = { debut: number; fin: number; mots: number };

/** Découpe un texte en phrases (positions dans le texte). */
export function phrases(texte: string): Phrase[] {
  const sortie: Phrase[] = [];
  const re = /[^.!?…\n]+[.!?…]*["»”)]*\s*/g;
  for (const m of texte.matchAll(re)) {
    const brut = m[0];
    const mots = compter(brut);
    if (mots === 0) continue;
    const debut = m.index ?? 0;
    sortie.push({ debut, fin: debut + brut.trimEnd().length, mots });
  }
  return sortie;
}

export function motsDe(texte: string): string[] {
  return texte.toLowerCase().match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? [];
}

function compter(texte: string): number {
  return motsDe(texte).length;
}

/** Syllabes d'un mot français, par les groupes de voyelles (approximation classique). */
export function syllabes(mot: string): number {
  const m = mot.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüÿœæ]/g, "");
  if (!m) return 0;
  const groupes = m.match(/[aeiouyàâäéèêëîïôöùûüÿœæ]+/g)?.length ?? 0;
  // Le « e » muet final ne compte pas (sauf dans les mots d'une syllabe).
  const muet = /[^aeiouy]es?$/.test(m) && groupes > 1 ? 1 : 0;
  return Math.max(1, groupes - muet);
}

export type Lisibilite = { score: number; niveau: string; motsParPhrase: number; syllabesParMot: number };

/** Formule de Kandel et Moles (1958) : 207 − 1,015 × mots/phrase − 73,6 × syllabes/mot. */
export function lisibilite(texte: string): Lisibilite {
  const ps = phrases(texte);
  const mots = motsDe(texte);
  if (ps.length === 0 || mots.length === 0) return { score: 0, niveau: "—", motsParPhrase: 0, syllabesParMot: 0 };
  const motsParPhrase = mots.length / ps.length;
  const syllabesParMot = mots.reduce((s, m) => s + syllabes(m), 0) / mots.length;
  const score = Math.round(207 - 1.015 * motsParPhrase - 73.6 * syllabesParMot);
  const niveau = score >= 80 ? "Très facile" : score >= 70 ? "Facile" : score >= 60 ? "Assez facile" : score >= 50 ? "Standard" : score >= 40 ? "Assez difficile" : score >= 30 ? "Difficile" : "Très difficile";
  return { score, niveau, motsParPhrase: Math.round(motsParPhrase * 10) / 10, syllabesParMot: Math.round(syllabesParMot * 100) / 100 };
}

/** Les mots les plus employés (sans les mots outils), avec leur nombre. */
export function motsFrequents(texte: string, max = 20): { mot: string; n: number }[] {
  const compte = new Map<string, number>();
  for (const m of motsDe(texte)) {
    if (m.length < 3 || MOTS_VIDES.has(m) || /^\d+$/.test(m)) continue;
    compte.set(m, (compte.get(m) ?? 0) + 1);
  }
  return [...compte.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, max)
    .map(([mot, n]) => ({ mot, n }));
}

function racine(mot: string): string {
  return mot
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(s|x)$/, "")
    .replace(/(e|es)$/, "");
}

export type Signalement = { debut: number; fin: number; genre: "repetition" | "longue" | "faible" | "passif"; detail: string };

/**
 * Ce qu'une relecture attentive relèverait dans un bloc de texte : les positions sont
 * celles du texte donné. distance : écart (en mots) sous lequel une répétition se voit.
 */
export function analyser(texte: string, options: { repetitions: boolean; longues: boolean; faibles: boolean; passif: boolean }, distance = 25, seuilLongue = 35): Signalement[] {
  const sortie: Signalement[] = [];
  const re = /[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu;
  const mots = [...texte.matchAll(re)].map((m) => ({ mot: m[0].toLowerCase(), debut: m.index ?? 0, fin: (m.index ?? 0) + m[0].length }));

  if (options.repetitions) {
    const derniere = new Map<string, number>();
    mots.forEach((m, i) => {
      if (m.mot.length < 4 || MOTS_VIDES.has(m.mot)) return;
      const r = racine(m.mot);
      const avant = derniere.get(r);
      if (avant !== undefined && i - avant <= distance) {
        const premier = mots[avant];
        sortie.push({ debut: premier.debut, fin: premier.fin, genre: "repetition", detail: `« ${m.mot} » revient ${i - avant} mots plus loin` });
        sortie.push({ debut: m.debut, fin: m.fin, genre: "repetition", detail: `« ${m.mot} » déjà employé ${i - avant} mots plus tôt` });
      }
      derniere.set(r, i);
    });
  }

  if (options.longues) {
    for (const p of phrases(texte)) {
      if (p.mots > seuilLongue) sortie.push({ debut: p.debut, fin: p.fin, genre: "longue", detail: `Phrase de ${p.mots} mots` });
    }
  }

  if (options.faibles) {
    const bas = texte.toLowerCase();
    for (const f of MOTS_FAIBLES) {
      let depart = 0;
      for (;;) {
        const i = bas.indexOf(f, depart);
        if (i < 0) break;
        const avant = i > 0 ? bas[i - 1] : " ";
        const apres = i + f.length < bas.length ? bas[i + f.length] : " ";
        if (!/[\p{L}\p{N}]/u.test(avant) && !/[\p{L}\p{N}]/u.test(apres)) sortie.push({ debut: i, fin: i + f.length, genre: "faible", detail: `« ${f} » : un mot plus précis ?` });
        depart = i + f.length;
      }
    }
  }

  if (options.passif) {
    for (let i = 0; i < mots.length - 1; i++) {
      if (!ETRE.has(mots[i].mot)) continue;
      // « est … écrit », avec au plus un mot entre les deux (« est souvent écrit »).
      for (let j = i + 1; j <= Math.min(i + 2, mots.length - 1); j++) {
        if (PARTICIPE.test(mots[j].mot) && mots[j].mot.length > 3) {
          sortie.push({ debut: mots[i].debut, fin: mots[j].fin, genre: "passif", detail: "Tournure passive : la forme active serait-elle plus directe ?" });
          break;
        }
      }
    }
  }

  return sortie.sort((a, b) => a.debut - b.debut);
}
