import { type Exercice, typeExercice } from "./types";

/*
 * La vérification des réponses écrites, commune au défi, à l'entraînement, au carnet d'erreurs
 * et aux examens : on pardonne la casse, la ponctuation finale, les apostrophes typographiques
 * et les contractions (« don't » vaut « do not »), jamais la grammaire.
 */

/** Les contractions courantes, pour accepter « don't » comme « do not ». */
const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, "will not"],
  [/\bcan't\b/g, "cannot"],
  [/\bshan't\b/g, "shall not"],
  [/\blet's\b/g, "let us"],
  [/n't\b/g, " not"],
  [/'m\b/g, " am"],
  [/'re\b/g, " are"],
  [/'ve\b/g, " have"],
  [/'ll\b/g, " will"],
];

export const normaliser = (s: string) => {
  let t = s
    .trim()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”«»"]/g, "")
    .replace(/[.!?…]+$/g, "")
    .replace(/[,;:]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
  for (const [re, par] of CONTRACTIONS) t = t.replace(re, par);
  return t.replace(/\bcan not\b/g, "cannot").replace(/\s+/g, " ").trim();
};

/** Le nombre de lettres à changer pour passer d'un mot à l'autre. */
export function ecart(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export type Verdict = "juste" | "presque" | "faux";

/** Une réponse écrite comparée aux réponses acceptées : juste, presque (une lettre), ou fausse. */
export function verdictEcrit(valeur: string, acceptees: string[]): Verdict {
  const v = normaliser(valeur);
  if (!v) return "faux";
  if (acceptees.some((r) => normaliser(r) === v)) return "juste";
  if (v.length > 3 && acceptees.some((r) => ecart(normaliser(r), v) === 1)) return "presque";
  return "faux";
}

/** La phrase reconstituée, avec sa majuscule et sa ponctuation finale. */
export function phraseOrdre(morceaux: string[], fin?: string) {
  const t = morceaux.join(" ").replace(/\s+([,;:])/g, "$1");
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}${fin ?? ""}`;
}

/** Un ordre proposé est juste s'il suit l'ordre attendu ou l'une des variantes acceptées. */
export function ordreJuste(propose: string[], attendu: string[], variantes: string[][] = []) {
  const n = (l: string[]) => normaliser(l.join(" "));
  const p = n(propose);
  return [attendu, ...variantes].some((v) => n(v) === p);
}

/** Les mots de la toucher-phrase, avec ceux qu'il fallait trouver. */
export const motsAToucher = (p: string) => p.split(/\s+/).map((m) => ({ cible: m.startsWith("*"), texte: m.replace(/^\*/, "") }));

/** La bonne réponse, telle qu'on l'écrit dans la correction. */
export function bonneReponse(x: Exercice): string {
  switch (typeExercice(x)) {
    case "choix":
      return (x as { o: string[] }).o[0];
    case "ecrire":
    case "corriger":
      return (x as { r: string[] }).r[0];
    case "ordre": {
      const o = x as { m: string[]; fin?: string };
      return phraseOrdre(o.m, o.fin);
    }
    default:
      return motsAToucher((x as { p: string }).p)
        .filter((m) => m.cible)
        .map((m) => m.texte.replace(/[^\p{L}\p{N}'’-]+$/u, ""))
        .join(", ");
  }
}

/**
 * Les différences entre la phrase écrite et la bonne, mot à mot (plus longue sous-suite commune) :
 * ce qui est en trop dans la réponse, et ce qui manquait.
 */
export function differences(ecrit: string, juste: string): { mot: string; etat: "pareil" | "manque" | "trop" }[] {
  const a = ecrit.trim().split(/\s+/).filter(Boolean);
  const b = juste.trim().split(/\s+/).filter(Boolean);
  const cle = (m: string) => normaliser(m.replace(/[.,;:!?]+$/, ""));
  const L = Array.from({ length: a.length + 1 }, () => Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = cle(a[i]) === cle(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const sortie: { mot: string; etat: "pareil" | "manque" | "trop" }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (cle(a[i]) === cle(b[j])) {
      sortie.push({ mot: b[j], etat: "pareil" });
      i++;
      j++;
    } else if (L[i + 1][j] >= L[i][j + 1]) sortie.push({ mot: a[i++], etat: "trop" });
    else sortie.push({ mot: b[j++], etat: "manque" });
  }
  while (i < a.length) sortie.push({ mot: a[i++], etat: "trop" });
  while (j < b.length) sortie.push({ mot: b[j++], etat: "manque" });
  return sortie;
}
