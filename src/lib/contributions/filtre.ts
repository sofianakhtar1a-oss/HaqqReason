/*
 * Filtre de politesse des contributions.
 *
 * Il tourne sur le serveur avant tout enregistrement, et il est volontairement
 * isolé de la base : on peut donc l'éprouver au banc d'essai, mot à mot.
 *
 * Trois verdicts :
 *   • « propre »   : rien à signaler, la contribution peut paraître.
 *   • « a_revoir » : rien d'insultant, mais un signe qui mérite un œil humain
 *                    (un lien, une adresse, un texte tout en majuscules…).
 *   • « refuse »   : grossièreté ou insulte caractérisée. La contribution
 *                    n'est jamais publiée.
 *
 * Ce fichier contient forcément des mots grossiers : c'est la liste de ce
 * qu'il faut arrêter. Ils ne sont jamais affichés à qui que ce soit.
 */

export type Verdict = "propre" | "a_revoir" | "refuse";

export type Analyse = {
  verdict: Verdict;
  /** Codes des motifs relevés, du plus grave au plus anodin. */
  motifs: string[];
};

/** Lettres de remplacement courantes pour masquer un mot (« p0rt4il »). */
const CHIFFRES_LETTRES: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "@": "a",
  $: "s",
  "€": "e",
  "µ": "u",
};

/** Minuscules, sans accents, chiffres-lettres remis en lettres. */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[0134578@$€µ]/g, (c) => CHIFFRES_LETTRES[c] ?? c);
}

/** Suite de mots séparés par une espace : sert aux recherches « mot entier ». */
export function enMots(texte: string): string {
  return ` ${normaliser(texte).replace(/[^a-z0-9]+/g, " ").trim()} `;
}

/**
 * Mot à mot, sans ponctuation et sans lettres répétées : sert à repérer les mots
 * déguisés (« c-o-n-n-a-r-d », « coooonnard », « p.u.t.a.i.n »).
 * Les mots restent séparés, pour qu'une insulte ne naisse jamais du hasard de
 * deux mots voisins (« donc on ardemment… »).
 */
export function colle(texte: string): string {
  const sansPonctuation = normaliser(texte).replace(/[^a-z ]/g, "");
  // Lettres isolées les unes des autres : on les recolle (« c o n n a r d »).
  const recolle = sansPonctuation.replace(/(?:\b[a-z] )+[a-z]\b/g, (m) => m.replace(/ /g, ""));
  return recolle
    .split(/ +/)
    .map((mot) => mot.replace(/(.)\1+/g, "$1"))
    .join(" ")
    .trim();
}

/**
 * Grossièretés et insultes nettes, cherchées à l'intérieur d'un mot pour
 * attraper les déguisements (« l'enculé », « puuutain »). Chaque entrée est
 * assez longue et assez typée pour n'apparaître dans aucun mot innocent.
 */
const INSULTES_COLLEES = [
  "encule",
  "enfoire",
  "conard",
  "conasse",
  "batard",
  "salopard",
  "salope",
  "putain",
  "pouffiasse",
  "connerie",
  "merdique",
  "pedale",
  "negro",
  "bougnoule",
  "youpin",
  "fuck",
  "bitch",
  "asshole",
  "motherfucker",
].map(colle);

/** Mots courts : cherchés en mot entier seulement, pour ne pas abîmer « concept » ou « classe ». */
const INSULTES_MOTS = [
  "con",
  "cons",
  "conne",
  "connes",
  "connard",
  "connards",
  "pute",
  "putes",
  "merde",
  "merdes",
  "chier",
  "chiant",
  "chiante",
  "couille",
  "couilles",
  "bite",
  "zob",
  "nique",
  "niquer",
  "foutre",
  "pd",
  "fdp",
  "ntm",
  "tg",
  "shit",
  "tapette",
  "clochard",
];

/** Suites de mots qui ne valent que prises ensemble. */
const INSULTES_SUITES = [
  "ta mere",
  "ta gueule",
  "ta race",
  "va te faire",
  "ferme la",
  "sale race",
  "sale arabe",
  "sale juif",
  "sale chien",
  "sale porc",
  "sale singe",
  "sale mecreant",
  "fils de pute",
];

/**
 * Mots agressifs quand ils visent quelqu'un. Ils ne font pas refuser la
 * contribution : ils la mettent de côté pour un œil humain, parce qu'ils
 * s'emploient aussi très bien dans un débat d'idées (« un raisonnement
 * malhonnête », « cette thèse est absurde »).
 */
const MOTS_DUR = [
  "idiot",
  "idiote",
  "idiots",
  "imbecile",
  "imbeciles",
  "stupide",
  "stupides",
  "debile",
  "debiles",
  "cretin",
  "cretins",
  "abruti",
  "abrutis",
  "bouffon",
  "bouffons",
  "nul",
  "nuls",
  "nulle",
  "menteur",
  "menteurs",
  "menteuse",
  "malhonnete",
  "malhonnetes",
  "ignorant",
  "ignorants",
  "ignorante",
  "absurde",
  "absurdes",
  "ridicule",
  "ridicules",
  "haine",
  "haineux",
  "secte",
  "sectes",
  "tuer",
  "mort aux",
  "fou",
  "folle",
];

const LIEN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|fr|io|me|ly|be|tv|info|xyz|ru|top)\b)/i;
const COURRIEL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const TELEPHONE = /(?:\+?\d[\s.-]?){9,}/;

/** Un mot entier figure-t-il dans le texte ? */
function contientMot(mots: string, liste: string[]): string | null {
  for (const mot of liste) if (mots.includes(` ${normaliser(mot)} `)) return mot;
  return null;
}

function contientSuite(mots: string, liste: string[]): string | null {
  for (const suite of liste) if (mots.includes(` ${normaliser(suite)} `)) return suite;
  return null;
}

/** Le mot déguisé est cherché à l'intérieur d'un mot, jamais à cheval sur deux. */
function contientColle(collé: string, liste: string[]): string | null {
  const mots = collé.split(" ");
  for (const cible of liste) if (cible.length >= 4 && mots.some((mot) => mot.includes(cible))) return cible;
  return null;
}

/** Part de majuscules parmi les lettres (pour repérer un texte qui crie). */
export function partDeMajuscules(texte: string): number {
  const lettres = texte.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (lettres.length < 12) return 0;
  const majuscules = lettres.replace(/[^A-ZÀ-Þ]/g, "").length;
  return majuscules / lettres.length;
}

/** Analyse un morceau de texte libre. */
export function analyser(texte: string): Analyse {
  const motifs: string[] = [];
  const mots = enMots(texte);
  const collé = colle(texte);

  if (contientColle(collé, INSULTES_COLLEES)) motifs.push("grossierete");
  if (contientMot(mots, INSULTES_MOTS)) motifs.push("insulte");
  if (contientSuite(mots, INSULTES_SUITES)) motifs.push("insulte");

  if (motifs.length > 0) return { verdict: "refuse", motifs: [...new Set(motifs)] };

  if (LIEN.test(texte)) motifs.push("lien");
  if (COURRIEL.test(texte)) motifs.push("courriel");
  if (TELEPHONE.test(texte)) motifs.push("telephone");
  if (contientMot(mots, MOTS_DUR)) motifs.push("ton_dur");
  if (partDeMajuscules(texte) > 0.6) motifs.push("majuscules");
  if (/(.)\1{5,}/.test(texte)) motifs.push("repetition");
  if (/[!?]{4,}/.test(texte)) motifs.push("ponctuation");

  return motifs.length > 0 ? { verdict: "a_revoir", motifs } : { verdict: "propre", motifs: [] };
}

/** Analyse une contribution entière : le pseudo compte autant que le texte. */
export function analyserContribution(parties: { pseudo?: string; titre: string; texte: string }): Analyse {
  const analyses = [parties.pseudo ?? "", parties.titre, parties.texte].filter(Boolean).map(analyser);
  const motifs = [...new Set(analyses.flatMap((a) => a.motifs))];
  if (analyses.some((a) => a.verdict === "refuse")) return { verdict: "refuse", motifs };
  if (analyses.some((a) => a.verdict === "a_revoir")) return { verdict: "a_revoir", motifs };
  return { verdict: "propre", motifs: [] };
}

/** Ce qu'on dit à l'auteur quand sa contribution est refusée. */
export const MESSAGE_REFUS =
  "Ta proposition contient des mots que le site n'accepte pas. Reformule-la calmement, sans insulte ni grossièreté, et renvoie-la : elle sera la bienvenue.";

/** Ce qu'on dit à l'auteur quand sa contribution attend une relecture. */
export const MESSAGE_ATTENTE = "Merci ! Ta proposition a bien été reçue. Elle paraîtra dès qu'elle aura été relue.";

/** Ce qu'on dit à l'auteur quand sa contribution paraît aussitôt. */
export const MESSAGE_PUBLIEE = "Merci ! Ta proposition est en ligne, les autres lecteurs peuvent la voir.";

/** Libellé lisible d'un motif, pour la page du créateur. */
export const LIBELLE_MOTIF: Record<string, string> = {
  grossierete: "grossièreté",
  insulte: "insulte",
  lien: "contient un lien",
  courriel: "contient une adresse e-mail",
  telephone: "contient un numéro de téléphone",
  ton_dur: "ton agressif",
  majuscules: "écrit en majuscules",
  repetition: "caractères répétés",
  ponctuation: "ponctuation excessive",
};

export function libelleMotifs(motifs: string[]): string {
  return motifs.map((m) => LIBELLE_MOTIF[m] ?? m).join(", ");
}
