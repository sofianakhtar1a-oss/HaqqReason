/*
 * Choix des extraits envoyés au modèle (RAG).
 * 1. Si toutes les sources cochées tiennent dans le budget : on envoie TOUT, dans l'ordre. Aucune perte.
 * 2. Sinon, recherche hybride : mots (BM25) + sens (vecteurs), fusionnés par rang (RRF).
 *    Chaque source cochée reçoit un minimum garanti, pour qu'aucune ne soit oubliée,
 *    et les meilleurs passages sont complétés par leurs voisins immédiats.
 * 3. Synthèse, divergences, glossaire : couverture régulière de chaque source (début, milieu, fin).
 */
import type { Action, Morceau } from "./types";

const VIDES = new Set(
  (
    "le la les un une des du de d l et ou en au aux à a ce ces cet cette qui que quoi dont où est sont été être avoir ai as avons ont il elle ils elles on nous vous je tu se sa son ses leur leurs ne pas plus par pour sur dans avec sans sous entre mais donc or ni car si comme y " +
    "the a an and or of to in on at by for with from is are was were be been it its this that these those as not but if then so do does did have has had he she they we you i his her their our your what which who whom how why when where " +
    "el la los las un una unos unas y o de del en con por para es son fue ser que no se su sus lo le les al como más pero " +
    "في من على إلى عن مع هذا هذه ذلك التي الذي و ثم أو أن إن كان ما لا لم قد هو هي هم"
  ).split(" "),
);

export function motsCles(texte: string): string[] {
  return texte
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((m) => m.replace(/^(al|ال)(?=\p{L}{3})/u, "").replace(/(?<=\p{L}{4})s$/u, ""))
    .filter((m) => m.length > 1 && !VIDES.has(m));
}

/** BM25 : pertinence lexicale de chaque morceau pour la question. */
export function bm25(morceaux: Morceau[], question: string): Map<string, number> {
  const termes = [...new Set(motsCles(question))];
  const scores = new Map<string, number>();
  if (!termes.length || !morceaux.length) return scores;
  const docs = morceaux.map((m) => motsCles(m.texte));
  const moyenne = docs.reduce((s, d) => s + d.length, 0) / docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) if (termes.includes(t)) df.set(t, (df.get(t) ?? 0) + 1);
  const k1 = 1.4;
  const b = 0.72;
  docs.forEach((d, i) => {
    const tf = new Map<string, number>();
    for (const t of d) if (df.has(t)) tf.set(t, (tf.get(t) ?? 0) + 1);
    let s = 0;
    for (const [t, f] of tf) {
      const idf = Math.log(1 + (docs.length - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      s += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / moyenne));
    }
    if (s > 0) scores.set(morceaux[i].id, s);
  });
  return scores;
}

export function cosinus(a: number[], b: number[]): number {
  let p = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    p += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? p / Math.sqrt(na * nb) : 0;
}

/** Fusion des classements (Reciprocal Rank Fusion) : robuste, sans calibrer les échelles de scores. */
function fusion(classements: string[][], k = 60): Map<string, number> {
  const total = new Map<string, number>();
  for (const c of classements) c.forEach((id, rang) => total.set(id, (total.get(id) ?? 0) + 1 / (k + rang + 1)));
  return total;
}

export type Selection = { morceaux: Morceau[]; mode: "complet" | "recherche" | "couverture"; jetonsTotal: number; jetonsEnvoyes: number };

export function selectionner(o: {
  morceaux: Morceau[];
  ordreSources: string[];
  question: string;
  action?: Action;
  budget: number;
  vecteurQuestion?: number[] | null;
}): Selection {
  const { morceaux, ordreSources, budget } = o;
  const jetonsTotal = morceaux.reduce((s, m) => s + m.jetons, 0);
  const ranger = (liste: Morceau[]) =>
    [...liste].sort((a, b) => ordreSources.indexOf(a.source) - ordreSources.indexOf(b.source) || a.ordre - b.ordre);
  if (jetonsTotal <= budget) return { morceaux: ranger(morceaux), mode: "complet", jetonsTotal, jetonsEnvoyes: jetonsTotal };

  const parSource = new Map<string, Morceau[]>();
  for (const m of morceaux) parSource.set(m.source, [...(parSource.get(m.source) ?? []), m]);
  for (const l of parSource.values()) l.sort((a, b) => a.ordre - b.ordre);
  const choisis = new Map<string, Morceau>();
  let utilises = 0;
  const prendre = (m: Morceau | undefined) => {
    if (!m || choisis.has(m.id) || utilises + m.jetons > budget) return false;
    choisis.set(m.id, m);
    utilises += m.jetons;
    return true;
  };

  // Classement hybride (sert aussi en mode couverture, pour privilégier ce qui touche la question).
  const lexical = [...bm25(morceaux, o.question).entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const classements = [lexical];
  if (o.vecteurQuestion?.length) {
    const sens = morceaux
      .filter((m) => m.vecteur?.length)
      .map((m) => [m.id, cosinus(o.vecteurQuestion!, m.vecteur!)] as const)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    if (sens.length) classements.push(sens);
  }
  const score = fusion(classements);
  const classes = [...morceaux].sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0));
  const parId = new Map(morceaux.map((m) => [m.id, m]));
  const voisin = (m: Morceau, d: number) => parId.get(`${m.source}:${m.ordre + d}`);

  const couverture = o.action === "synthese" || o.action === "divergences" || o.action === "glossaire";
  if (couverture) {
    // Chaque source reçoit sa part, répartie régulièrement du début à la fin.
    const part = budget / parSource.size;
    for (const liste of parSource.values()) {
      const tailleMoy = liste.reduce((s, m) => s + m.jetons, 0) / liste.length;
      const combien = Math.max(1, Math.floor(part / tailleMoy));
      const pas = Math.max(1, liste.length / combien);
      for (let x = 0; x < liste.length && utilises < budget; x += pas) prendre(liste[Math.floor(x)]);
    }
    for (const m of classes) if (!prendre(m) && utilises >= budget * 0.98) break;
    return { morceaux: ranger([...choisis.values()]), mode: "couverture", jetonsTotal, jetonsEnvoyes: utilises };
  }

  // Minimum garanti, par tours : le meilleur passage de chaque source, puis le deuxième.
  const meilleursParSource = [...parSource.values()].map((liste) => [...liste].sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0)));
  for (const tour of [0, 1]) for (const meilleurs of meilleursParSource) prendre(meilleurs[tour]);
  // Puis les meilleurs passages de tout le corpus, chacun avec ses voisins pour le contexte.
  for (const m of classes) {
    if ((score.get(m.id) ?? 0) === 0 && choisis.size > 0) break;
    prendre(m);
    prendre(voisin(m, -1));
    prendre(voisin(m, 1));
    if (utilises >= budget * 0.97) break;
  }
  // Budget restant : le début de chaque source (souvent l'introduction, qui situe le reste).
  for (const liste of parSource.values()) for (const m of liste.slice(0, 3)) prendre(m);
  return { morceaux: ranger([...choisis.values()]), mode: "recherche", jetonsTotal, jetonsEnvoyes: utilises };
}
