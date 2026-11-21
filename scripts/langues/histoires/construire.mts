/*
 * Range les histoires contrôlées dans le site :
 *   public/langues/histoires/<id>.json        (le texte, les traductions, les gloses de chaque mot)
 *   src/lib/langues/histoires/catalogue.json  (la bibliothèque : titres, niveaux, résumés, tailles)
 * Une histoire qui ne passe pas le contrôle n'est pas rangée.
 *   npx tsx scripts/langues/histoires/construire.mts
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { cleMot, estMot, type Glose, motsDe } from "../../../src/lib/langues/histoires/texte";
import { TOUTES_LES_ENTREES } from "../../../src/lib/langues/themes/index";
import { controlerHistoire, DOSSIER, gloseDe, gloseFinale, type LotSource, lots, type Meta } from "./controle";

/** L'ordre de la bibliothèque, du plus simple au plus avancé. */
export const ORDRE = [
  "le-chat-du-phare",
  "une-semaine-a-londres",
  "la-carte-du-grenier",
  "la-nouvelle",
  "le-train-de-nuit",
  "le-robot-qui-peignait",
  "la-derniere-librairie",
  "rikki-tikki-tavi",
  "la-ligue-des-roux",
  "le-phoque-blanc",
  "la-lettre-volee",
  "la-porte-dans-le-mur",
];

const NIVEAUX = ["A1", "A2", "B1", "B2", "C1", "C2"];
/** Vitesse de lecture d'un élève, en mots par minute, selon le niveau. */
const VITESSE: Record<string, number> = { A1: 70, A2: 85, B1: 100, B2: 120, C1: 140, C2: 160 };
const NIVEAU_MOT = new Map<string, number>();
for (const e of TOUTES_LES_ENTREES) {
  const cle = e.en.toLowerCase().replace(/^to /, "").trim();
  const n = NIVEAUX.indexOf(e.niveau);
  if (!NIVEAU_MOT.has(cle) || n < NIVEAU_MOT.get(cle)!) NIVEAU_MOT.set(cle, n);
}
const CONTENU = new Set(["n", "v", "a", "d", "x", ""]);

type PhraseFinale = [en: string, fr: string, g: (number | null)[]];
type PageFinale = { t?: string; tf?: string; p: PhraseFinale[][]; m: number[] };

const SITE = "public/langues/histoires";
mkdirSync(SITE, { recursive: true });
const catalogue: Record<string, unknown>[] = [];
const presentes = existsSync(`${DOSSIER}/sortie`) ? readdirSync(`${DOSSIER}/sortie`) : [];
const ids = [...ORDRE.filter((id) => presentes.includes(id)), ...presentes.filter((id) => !ORDRE.includes(id)).sort()];

for (const id of ids) {
  const { problemes } = controlerHistoire(id);
  if (problemes.length) {
    console.log(`REFUSÉE ${id} : ${problemes.length} problème(s), par exemple : ${problemes[0]}`);
    continue;
  }
  const meta = JSON.parse(readFileSync(`${DOSSIER}/sortie/${id}/meta.json`, "utf8")) as Meta;
  const table: Glose[] = [];
  const index = new Map<string, number>();
  /** Les gloses générales des mots-outils (« le, la, les ») : la liseuse les présente comme un sens général. */
  const outils = new Set<number>();
  const ranger = (g: Glose) => {
    const k = JSON.stringify(g);
    if (!index.has(k)) {
      index.set(k, table.length);
      table.push(g);
    }
    return index.get(k)!;
  };
  const pages: PageFinale[] = [];
  let mots = 0;
  for (const f of lots(id)) {
    const lot = JSON.parse(readFileSync(`${DOSSIER}/sortie/${id}/${f}`, "utf8")) as LotSource;
    for (const page of lot.pages) {
      const cles = new Map<string, { i: number; rang: number }>();
      const p = page.p.map((para) =>
        para.map((ph): PhraseFinale => {
          const vus = new Map<string, number>();
          const g = motsDe(ph.en).map((t) => {
            if (!estMot(t)) return null;
            mots++;
            const cle = cleMot(t);
            const rang = (vus.get(cle) ?? 0) + 1;
            vus.set(cle, rang);
            const trouve = gloseDe(cle, rang, ph, lot.lexique)!;
            const finale = gloseFinale(trouve.glose, cle);
            const i = ranger(finale);
            if (trouve.ou === "outil") outils.add(i);
            // Les mots de la page : ceux qui ont du sens (pas les mots-outils, pas les noms propres).
            if (trouve.ou !== "outil" && CONTENU.has(finale[2])) {
              const lemme = finale[1].toLowerCase();
              const n = NIVEAU_MOT.get(lemme) ?? 6;
              if (!cles.has(lemme)) cles.set(lemme, { i, rang: n });
            }
            return i;
          });
          return [ph.en.trim(), ph.fr.trim(), g];
        }),
      );
      const niveau = NIVEAUX.indexOf(meta.niveau);
      const m = [...cles.values()]
        .filter((c) => c.rang >= Math.max(0, niveau - 1))
        .sort((a, b) => b.rang - a.rang)
        .slice(0, 12)
        .map((c) => c.i);
      const finale: PageFinale = { p, m };
      if (page.titre) finale.t = page.titre.trim();
      if (page.titreFr) finale.tf = page.titreFr.trim();
      pages.push(finale);
    }
  }
  const histoire = {
    v: 1,
    id,
    titre: meta.titre,
    titreFr: meta.titreFr,
    auteur: meta.auteur,
    ...(meta.annee ? { annee: meta.annee } : {}),
    niveau: meta.niveau,
    genre: meta.genre,
    resume: meta.resume,
    ...(meta.source ? { source: meta.source } : {}),
    mots,
    gloses: table,
    o: [...outils].sort((a, b) => a - b),
    pages,
    questions: meta.questions,
  };
  const texte = JSON.stringify(histoire);
  writeFileSync(`${SITE}/${id}.json`, texte);
  const version = createHash("sha1").update(texte).digest("hex").slice(0, 10);
  catalogue.push({
    id,
    titre: meta.titre,
    titreFr: meta.titreFr,
    auteur: meta.auteur,
    ...(meta.annee ? { annee: meta.annee } : {}),
    niveau: meta.niveau,
    genre: meta.genre,
    resume: meta.resume,
    ...(meta.source ? { source: meta.source } : {}),
    pages: pages.length,
    mots,
    minutes: Math.max(5, Math.round(mots / (VITESSE[meta.niveau] ?? 100))),
    chapitres: pages.filter((p) => p.t).length,
    version,
  });
  const poids = Buffer.byteLength(texte);
  console.log(`OK ${id} : ${meta.niveau}, ${pages.length} pages, ${mots} mots, ${table.length} gloses, ${Math.round(poids / 1024)} Ko`);
}
writeFileSync("src/lib/langues/histoires/catalogue.json", `${JSON.stringify(catalogue, null, 1)}\n`);
console.log(`${catalogue.length} histoire(s) dans la bibliothèque`);
