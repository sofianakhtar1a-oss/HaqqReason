/*
 * Le contrôle des dictées (partagé par valider.mts et construire.mts) : 20 dictées de 8 phrases par
 * niveau, longueurs, signes permis, noms propres, piège, doublons. Voir CONSIGNES.md.
 */
import { existsSync, readFileSync } from "node:fs";
import { estMot, motsDe } from "../../../src/lib/langues/histoires/texte";

export const DOSSIER = "scripts/langues/dictees";
export const NIVEAUX = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export const NOMBRE_DICTEES = 20;
export const PHRASES_PAR_DICTEE = 8;

export type PhraseDicteeSource = { en: string; fr: string };
export type DicteeSource = { n: number; titre: string; piege: string; phrases: PhraseDicteeSource[] };
export type FichierDictees = { niveau: string; dictees: DicteeSource[] };

/** Mots par phrase et par dictée, selon le niveau. */
export const LONGUEURS: Record<string, { phrase: [number, number]; dictee: [number, number] }> = {
  A1: { phrase: [5, 9], dictee: [45, 68] },
  A2: { phrase: [6, 12], dictee: [55, 90] },
  B1: { phrase: [8, 15], dictee: [75, 110] },
  B2: { phrase: [9, 17], dictee: [85, 125] },
  C1: { phrase: [10, 19], dictee: [95, 140] },
  C2: { phrase: [11, 21], dictee: [105, 155] },
};

/** Les majuscules permises au milieu d'une phrase (pas de nom de personne). */
const PERMIS = new Set(
  (
    "I I'm I've I'll I'd Mum Dad Grandma Grandpa " +
    "Monday Tuesday Wednesday Thursday Friday Saturday Sunday " +
    "January February March April May June July August September October November December " +
    "English French British Britain England Scotland Scottish Wales Welsh Ireland Irish Europe European " +
    "Africa African America American Asia Asian Australia Australian Canada Canadian " +
    "France Paris London Spain Spanish Italy Italian Rome Germany German Berlin Portugal Portuguese " +
    "Japan Japanese China Chinese India Indian Morocco Moroccan Algeria Algerian Tunisia Egypt Arabic Arab " +
    "Turkey Turkish Greece Greek Russia Russian Brazil Mexico Mexican Iceland Norway Sweden Atlantic Pacific " +
    "Earth Moon Sun Internet Mediterranean Thames Edinburgh Manchester Scandinavia"
  ).split(" "),
);

const SIGNES = /^[A-Z][A-Za-z' ,]*[A-Za-z'][.?!]$/;
const unPeu = (s: string) => (s.length > 70 ? `${s.slice(0, 70)}…` : s);
export const compter = (en: string) => motsDe(en).filter(estMot).length;

/** Les mots d'une phrase, sans la ponctuation qui les entoure. */
const mots = (en: string) => en.split(/\s+/).map((m) => m.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, ""));

export function controlerNiveau(niveau: string, donnees?: FichierDictees): { problemes: string[]; avis: string[]; dictees: number; phrases: number; mots: number } {
  const p: string[] = [];
  const avis: string[] = [];
  const chemin = `${DOSSIER}/sortie/${niveau}.json`;
  let f: FichierDictees | undefined = donnees;
  if (!f) {
    if (!existsSync(chemin)) return { problemes: [`${niveau} : ${chemin} absent`], avis, dictees: 0, phrases: 0, mots: 0 };
    try {
      f = JSON.parse(readFileSync(chemin, "utf8")) as FichierDictees;
    } catch (e) {
      return { problemes: [`${niveau} : JSON illisible (${(e as Error).message})`], avis, dictees: 0, phrases: 0, mots: 0 };
    }
  }
  const L = LONGUEURS[niveau];
  if (!L) return { problemes: [`niveau inconnu « ${niveau} »`], avis, dictees: 0, phrases: 0, mots: 0 };
  if (f.niveau !== niveau) p.push(`${niveau} : « niveau » vaut « ${f.niveau} »`);
  if (!Array.isArray(f.dictees)) return { problemes: [...p, `${niveau} : « dictees » doit être une liste`], avis, dictees: 0, phrases: 0, mots: 0 };
  if (f.dictees.length !== NOMBRE_DICTEES) p.push(`${niveau} : ${f.dictees.length} dictées au lieu de ${NOMBRE_DICTEES}`);
  const vues = new Map<string, number>();
  let total = 0;
  let phrases = 0;
  f.dictees.forEach((d, k) => {
    const ou = `${niveau} n° ${d?.n ?? k + 1}`;
    if (d?.n !== k + 1) p.push(`${ou} : « n » doit valoir ${k + 1}`);
    if (typeof d?.titre !== "string" || !d.titre.trim() || d.titre.length > 40 || /[.]$/.test(d.titre)) p.push(`${ou} : titre manquant, trop long ou terminé par un point`);
    if (!Array.isArray(d?.phrases) || d.phrases.length !== PHRASES_PAR_DICTEE) {
      p.push(`${ou} : il faut exactement ${PHRASES_PAR_DICTEE} phrases`);
      return;
    }
    let motsDictee = 0;
    const texte = new Set<string>();
    d.phrases.forEach((ph, j) => {
      const ici = `${ou} phrase ${j + 1}`;
      if (typeof ph?.en !== "string" || typeof ph?.fr !== "string" || !ph.en.trim() || !ph.fr.trim()) return void p.push(`${ici} : « en » et « fr » sont obligatoires`);
      const en = ph.en;
      if (en !== en.trim() || /\s{2,}/.test(en)) p.push(`${ici} : espaces en trop dans « ${unPeu(en)} »`);
      if (!SIGNES.test(en)) p.push(`${ici} : signes non permis (lettres, espaces, virgules, apostrophe droite, un . ? ou ! final) dans « ${unPeu(en)} »`);
      if (/ ,|,(?! )|,$/.test(en.replace(/[.?!]$/, ""))) p.push(`${ici} : virgule mal placée dans « ${unPeu(en)} »`);
      if (/[’‘]/.test(en)) p.push(`${ici} : écris l'apostrophe droite ' dans « ${unPeu(en)} »`);
      const n = compter(en);
      motsDictee += n;
      if (n < L.phrase[0] || n > L.phrase[1]) p.push(`${ici} : ${n} mots (attendu de ${L.phrase[0]} à ${L.phrase[1]} en ${niveau}) « ${unPeu(en)} »`);
      mots(en)
        .slice(1)
        .forEach((m) => {
          if (/^[A-Z]/.test(m) && !PERMIS.has(m) && !PERMIS.has(m.replace(/'s$/, ""))) p.push(`${ici} : majuscule au milieu de la phrase « ${m} » (pas de nom de personne) dans « ${unPeu(en)} »`);
        });
      for (const m of mots(en)) if (m) texte.add(m.toLowerCase());
      const cle = en.toLowerCase();
      if (vues.has(cle)) p.push(`${ici} : la même phrase existe déjà (dictée n° ${vues.get(cle)})`);
      else vues.set(cle, d.n);
      if (ph.fr.trim() === en.trim()) p.push(`${ici} : la traduction recopie l'anglais`);
    });
    total += motsDictee;
    phrases += d.phrases.length;
    if (motsDictee < L.dictee[0] || motsDictee > L.dictee[1]) p.push(`${ou} : ${motsDictee} mots en tout (attendu de ${L.dictee[0]} à ${L.dictee[1]} en ${niveau})`);
    if (typeof d.piege !== "string" || !d.piege.trim() || d.piege.length > 160) p.push(`${ou} : le piège est manquant ou dépasse 160 caractères`);
    else {
      const cites = [...d.piege.matchAll(/«\s*([^»]+?)\s*»/g)].map((x) => x[1].toLowerCase().replace(/[.?!,]$/, ""));
      const present = cites.some((c) => c.split(/\s+/).every((w) => texte.has(w.replace(/[^a-z']/g, ""))));
      if (!present) p.push(`${ou} : le piège doit citer entre « » un mot anglais présent dans la dictée (cités : ${cites.join(", ") || "aucun"})`);
    }
  });
  return { problemes: p, avis, dictees: f.dictees.length, phrases, mots: total };
}
