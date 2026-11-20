/**
 * Le Calame — le Coran par sa référence. Les noms des sourates (translittération française),
 * la lecture d'une référence (« 2:255 », « 2:1-5 », « Al-Baqara 255 », « baqara 1 à 5 ») et
 * la mise en forme d'une plage de versets.
 *
 * Le texte arabe vient de Tanzil.net (« Quran Simple »), reproduit sans modification, dans un
 * fichier servi par l'application (public/calame/coran-*.json).
 */

export const SOURATES = [
  "Al-Fâtiha", "Al-Baqara", "Âl ʿImrân", "An-Nisâʾ", "Al-Mâʾida", "Al-Anʿâm", "Al-Aʿrâf", "Al-Anfâl", "At-Tawba", "Yûnus",
  "Hûd", "Yûsuf", "Ar-Raʿd", "Ibrâhîm", "Al-Hijr", "An-Nahl", "Al-Isrâʾ", "Al-Kahf", "Maryam", "Tâ-Hâ",
  "Al-Anbiyâʾ", "Al-Hajj", "Al-Muʾminûn", "An-Nûr", "Al-Furqân", "Ash-Shuʿarâʾ", "An-Naml", "Al-Qasas", "Al-ʿAnkabût", "Ar-Rûm",
  "Luqmân", "As-Sajda", "Al-Ahzâb", "Sabaʾ", "Fâtir", "Yâ-Sîn", "As-Sâffât", "Sâd", "Az-Zumar", "Ghâfir",
  "Fussilat", "Ash-Shûrâ", "Az-Zukhruf", "Ad-Dukhân", "Al-Jâthiya", "Al-Ahqâf", "Muhammad", "Al-Fath", "Al-Hujurât", "Qâf",
  "Adh-Dhâriyât", "At-Tûr", "An-Najm", "Al-Qamar", "Ar-Rahmân", "Al-Wâqiʿa", "Al-Hadîd", "Al-Mujâdala", "Al-Hashr", "Al-Mumtahana",
  "As-Saff", "Al-Jumuʿa", "Al-Munâfiqûn", "At-Taghâbun", "At-Talâq", "At-Tahrîm", "Al-Mulk", "Al-Qalam", "Al-Hâqqa", "Al-Maʿârij",
  "Nûh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyâma", "Al-Insân", "Al-Mursalât", "An-Nabaʾ", "An-Nâziʿât", "ʿAbasa",
  "At-Takwîr", "Al-Infitâr", "Al-Mutaffifîn", "Al-Inshiqâq", "Al-Burûj", "At-Târiq", "Al-Aʿlâ", "Al-Ghâshiya", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duhâ", "Ash-Sharh", "At-Tîn", "Al-ʿAlaq", "Al-Qadr", "Al-Bayyina", "Az-Zalzala", "Al-ʿÂdiyât",
  "Al-Qâriʿa", "At-Takâthur", "Al-ʿAsr", "Al-Humaza", "Al-Fîl", "Quraysh", "Al-Mâʿûn", "Al-Kawthar", "Al-Kâfirûn", "An-Nasr",
  "Al-Masad", "Al-Ikhlâs", "Al-Falaq", "An-Nâs",
] as const;

/** Nombre de versets de chaque sourate. */
export const VERSETS_PAR_SOURATE = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73,
  54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

/** Nombre maximal de versets dans un même bloc. */
export const MAX_PLAGE = 50;

const plier = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ʿʾ'’`-]/g, "")
    .toLowerCase()
    .replace(/^(al|an|ar|as|at|az|ad|ash|adh)(?=\w)/, "")
    .replace(/\s+/g, "");

/** La sourate dont le nom ressemble le plus à ce qui est tapé (« baqara », « al-baqarah », « l'ikhlas »). */
export function sourateParNom(nom: string): number | null {
  const q = plier(nom.replace(/^l[’']/i, ""));
  if (!q) return null;
  const noms = SOURATES.map((s) => plier(s));
  let i = noms.findIndex((n) => n === q);
  if (i < 0) i = noms.findIndex((n) => n.startsWith(q) || q.startsWith(n));
  if (i < 0) i = noms.findIndex((n) => n.replace(/h$/, "") === q.replace(/h$/, ""));
  return i >= 0 ? i + 1 : null;
}

export type ReferenceCoran = { sourate: number; debut: number; fin: number };

/** « 2:255 », « 2 : 1-5 », « Al-Baqara 255 », « baqara 1 à 5 », « (96, 1) » → sourate et versets. */
export function lireReference(texte: string): ReferenceCoran | { erreur: string } {
  const t = texte.trim().replace(/[()]/g, " ");
  if (!t) return { erreur: "Tape une référence, par exemple 2:255 ou 2:1-5." };
  let sourate: number | null = null;
  let reste = t;
  const chiffres = /^(\d{1,3})\s*[:.,\s]\s*(.+)$/.exec(t);
  if (chiffres) {
    sourate = Number(chiffres[1]);
    reste = chiffres[2];
  } else {
    const nomEtVersets = /^([^\d]+?)\s*(?:\(?\d{1,3}\)?\s*[,:]\s*)?(\d.*)$/.exec(t);
    if (!nomEtVersets) return { erreur: "Je ne reconnais pas cette référence. Essaie 2:255, ou « Al-Baqara 255 »." };
    sourate = sourateParNom(nomEtVersets[1]);
    if (!sourate) return { erreur: `Je ne trouve pas la sourate « ${nomEtVersets[1].trim()} ».` };
    reste = nomEtVersets[2];
  }
  if (!sourate || sourate < 1 || sourate > 114) return { erreur: "Le Coran compte 114 sourates." };
  const versets = /^(\d{1,3})(?:\s*(?:-|–|à|a)\s*(\d{1,3}))?\s*$/.exec(reste.trim());
  if (!versets) return { erreur: "Après la sourate, donne un verset (255) ou une plage (1-5)." };
  const debut = Number(versets[1]);
  const fin = versets[2] ? Number(versets[2]) : debut;
  const max = VERSETS_PAR_SOURATE[sourate - 1];
  if (debut < 1 || fin < debut) return { erreur: "La plage de versets est à l'envers." };
  if (fin > max) return { erreur: `La sourate ${SOURATES[sourate - 1]} compte ${max} versets.` };
  if (fin - debut + 1 > MAX_PLAGE) return { erreur: `Pas plus de ${MAX_PLAGE} versets dans un même bloc.` };
  return { sourate, debut, fin };
}

/** « Al-Baqara (2), 255 » ou « Al-Baqara (2), 1-5 ». */
export function libelleReference(r: ReferenceCoran): string {
  return `${SOURATES[r.sourate - 1]} (${r.sourate}), ${r.debut === r.fin ? r.debut : `${r.debut}-${r.fin}`}`;
}

const CHIFFRES_ARABES = "٠١٢٣٤٥٦٧٨٩";
export const enChiffresArabes = (n: number) => String(n).replace(/\d/g, (c) => CHIFFRES_ARABES[Number(c)]);

/** Le texte d'une plage, chaque verset suivi de son numéro dans le signe de fin de verset (۝). */
export function texteDeLaPlage(sourates: string[][], r: ReferenceCoran, numeros: boolean): string {
  const versets = sourates[r.sourate - 1]?.slice(r.debut - 1, r.fin) ?? [];
  return versets.map((v, i) => (numeros ? `${v} ۝${enChiffresArabes(r.debut + i)}` : v)).join(" ");
}

/** Pour trier un index des versets : la sourate, puis le premier verset, tirés d'une légende « Coran, Al-Baqara (2), 255 ». */
export function cleDeTri(reference: string): [number, number] {
  const m = /\((\d{1,3})\)\s*,?\s*(\d{1,3})/.exec(reference) ?? /(\d{1,3})\s*:\s*(\d{1,3})/.exec(reference);
  return m ? [Number(m[1]), Number(m[2])] : [999, 999];
}
