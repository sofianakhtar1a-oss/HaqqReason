/**
 * Le Calame — les hadiths par leur référence : les recueils proposés, leurs noms en français,
 * et la traduction des degrés donnés par les savants (texte arabe et degrés : fawazahmed0/hadith-api,
 * domaine public).
 */

export const RECUEILS = [
  { cle: "bukhari", nom: "Ṣaḥīḥ al-Bukhārī", max: 7563, sahih: true },
  { cle: "muslim", nom: "Ṣaḥīḥ Muslim", max: 7563, sahih: true },
  { cle: "abudawud", nom: "Sunan Abī Dāwūd", max: 5274, sahih: false },
  { cle: "tirmidhi", nom: "Jāmiʿ at-Tirmidhī", max: 3956, sahih: false },
  { cle: "nasai", nom: "Sunan an-Nasāʾī", max: 5758, sahih: false },
  { cle: "ibnmajah", nom: "Sunan Ibn Mājah", max: 4341, sahih: false },
  { cle: "malik", nom: "Al-Muwaṭṭaʾ de Mālik", max: 1858, sahih: false },
  { cle: "nawawi", nom: "Les quarante hadiths d'an-Nawawī", max: 42, sahih: false },
  { cle: "qudsi", nom: "Quarante hadiths qudsī", max: 40, sahih: false },
] as const;
export type CleRecueil = (typeof RECUEILS)[number]["cle"];

export function recueilDe(cle: string) {
  return RECUEILS.find((r) => r.cle === cle) ?? null;
}

/** Le degré (clé du bloc hadith) qui correspond à ce que disent les savants. */
export function degreDepuis(degres: { nom: string; degre: string }[], sahihParConsensus: boolean): string {
  if (sahihParConsensus) return "sahih";
  const textes = degres.map((d) => d.degre.toLowerCase());
  const compte = (mot: RegExp) => textes.filter((t) => mot.test(t)).length;
  const sahih = compte(/sahih|sahīh|authentic/);
  const hasan = compte(/hasan|hassan|good/);
  const daif = compte(/da'?if|daeef|weak|munkar|shadh/);
  const mawdu = compte(/mawdu|fabricated|forged/);
  if (mawdu > 0 && mawdu >= sahih + hasan) return "mawdu";
  if (daif > sahih + hasan) return "daif";
  if (sahih >= hasan && sahih > 0) return "sahih";
  if (hasan > 0) return "hasan";
  return "";
}

/** Un degré tel qu'un savant l'a donné, glosé en français : « Daif » → « faible (ḍaʿīf) ». */
export function degreEnFrancais(degre: string): string {
  const d = degre.toLowerCase();
  if (/hasan\s*sahih/.test(d)) return "bon et authentique (ḥasan ṣaḥīḥ)";
  if (/sahih/.test(d)) return "authentique (ṣaḥīḥ)";
  if (/hasan/.test(d)) return "bon (ḥasan)";
  if (/mawdu|fabricated/.test(d)) return "forgé (mawḍūʿ)";
  if (/munkar/.test(d)) return "rejeté (munkar)";
  if (/shadh/.test(d)) return "isolé (shādhdh)";
  if (/da'?if|weak/.test(d)) return "faible (ḍaʿīf)";
  return degre;
}
