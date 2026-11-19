import { PAYS } from "./donnees";
import type { Pays } from "./types";

/*
 * Le Portulan : dire les pays en bon français. « la France », « du Maroc », « aux États-Unis »,
 * « à Cuba », « d'Israël » ; et le pluriel des habitants (« les Portugais », « les Néo-Zélandais »).
 * L'article se déduit du nom (voyelle, terminaison en -e), avec la liste des exceptions.
 */

export type Article = "le" | "la" | "l'" | "les" | "";

/** Sans article : des îles, des cités-États, des noms qui en ont un d'office (« La Réunion »). */
const SANS_ARTICLE = new Set([
  "cu", "cy", "mt", "mg", "mu", "mc", "sg", "bh", "dj", "om", "il", "ht", "tw", "hk", "mo", "sm", "lc", "vc", "kn", "st", "tt", "ag", "pr",
  "je", "gg", "gi", "nr", "aw", "cw", "sx", "mf", "bl", "pm", "wf", "yt", "ai", "ms", "gu", "nu", "tk", "ax", "re", "sh",
]);
/** Au pluriel. */
const PLURIEL = new Set(["us", "nl", "ae", "ph", "km", "mv", "sc", "bs", "fj", "ws", "to", "pw", "ki", "tv", "bm", "bq", "tf", "as", "mp", "vg", "vi", "ky", "tc", "fk", "pn", "cc", "ck", "mh", "sb", "fo", "io", "um", "hm"]);
/** Masculins qui finissent par -e (le Mexique), et noms à h aspiré (le Honduras, la Hongrie). */
const MASCULIN_EN_E = new Set(["mx", "kh", "mz", "zw", "bz", "sr", "cv", "gb"]);
const H_ASPIRE = new Set(["hn", "hu"]);
/** Féminins qui ne finissent pas par -e. */
const FEMININ = new Set(["cd", "sl"]);
/** « à » devant les noms sans article, sauf ceux-ci, qui prennent « en ». */
const EN_SANS_ARTICLE = new Set(["il", "ht"]);
/** Des îles au féminin : « à la Barbade », pas « en Barbade ». */
const A_LA = new Set(["bb", "gd", "dm"]);
/** « l'île de Man », « les îles Salomon » : en cours de phrase, l'île prend une minuscule. */
const ile = (nom: string) => nom.replace(/^Île/, "île").replace(/^Îles/, "îles");

const voyelle = (s: string) => /^[aeiouàâäåéèêëîïôöùûüœæ]/i.test(s.normalize("NFC"));

function calculer(p: Pays): Article {
  const c = p.code;
  if (SANS_ARTICLE.has(c)) return "";
  if (PLURIEL.has(c) || /^(Îles|Iles) /.test(p.nom)) return "les";
  if (H_ASPIRE.has(c)) return c === "hu" ? "la" : "le";
  if (voyelle(p.nom)) return "l'";
  if (FEMININ.has(c)) return "la";
  if (/e$/.test(p.nom.split(/[ -]/)[0]) && !MASCULIN_EN_E.has(c)) return "la";
  // « Corée du Sud », « Guinée équatoriale » : c'est le premier mot qui compte.
  return "le";
}

const ARTICLES = new Map(PAYS.map((p) => [p.code, calculer(p)]));

export const articleDe = (p: Pays): Article => ARTICLES.get(p.code) ?? "";

/** « la France », « le Maroc », « l'Inde », « les États-Unis », « Cuba ». */
export function leNom(p: Pays): string {
  const a = articleDe(p);
  const n = ile(p.nom);
  return a === "l'" ? `l'${n}` : a ? `${a} ${n}` : p.nom;
}

/** « de la France », « du Maroc », « de l'Inde », « des États-Unis », « de Cuba », « d'Israël ». */
export function duNom(p: Pays): string {
  const a = articleDe(p);
  const n = ile(p.nom);
  if (a === "le") return `du ${n}`;
  if (a === "les") return `des ${n}`;
  if (a === "la") return `de la ${n}`;
  if (a === "l'") return `de l'${n}`;
  return voyelle(p.nom) || /^Haï/.test(p.nom) ? `d'${p.nom}` : `de ${p.nom}`;
}

/** « en France », « au Maroc », « en Iran », « aux États-Unis », « à Cuba », « en Israël ». */
export function auNom(p: Pays): string {
  const a = articleDe(p);
  const n = ile(p.nom);
  if (/^Île /.test(p.nom)) return `sur l'${n}`;
  if (A_LA.has(p.code)) return `à la ${n}`;
  if (a === "le") return `au ${n}`;
  if (a === "les") return `aux ${n}`;
  if (a === "la" || a === "l'") return `en ${n}`;
  return EN_SANS_ARTICLE.has(p.code) ? `en ${p.nom}` : `à ${p.nom}`;
}

/** La première lettre en capitale (en début de phrase : « Le Maroc », « Les États-Unis »). */
export const capitaliser = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Le pluriel des habitants ---------- */

/** Les préfixes qui ne prennent pas la marque du pluriel : Néo-Zélandais, Sud-Africains, Bissau-Guinéens… */
const PREFIXES = new Set(["Néo", "Sud", "Nord", "Est", "Saint", "Sainte", "Sri", "Cap", "Bissau", "Équato", "Sierra"]);

const plurielMot = (m: string) => (/[sxz]$/.test(m) ? m : `${m}s`);

/** « Portugais » → « Portugais » ; « Marocaine » → « Marocaines » ; « Kittitien-et-Névicien » → « Kittitiens-et-Néviciens ». */
export function pluriel(gentile: string): string {
  return gentile
    .split(/(-|\s)/)
    .map((x) => (x === "-" || /^\s$/.test(x) || x === "et" || PREFIXES.has(x) || !x ? x : plurielMot(x)))
    .join("");
}

/** « les Marocains », pour un pays (null : pas de gentilé connu). */
export const habitantsDe = (p: Pays): string | null => (p.gentile ? pluriel(p.gentile[0]) : null);
