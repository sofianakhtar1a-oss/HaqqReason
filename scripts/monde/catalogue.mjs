// Le catalogue du Portulan en anglais et en arabe : il se fabrique à partir des listes
// scripts/monde/traductions/*.txt, une entrée par ligne : « français || anglais || arabe ».
// Lancer : node scripts/monde/catalogue.mjs
//
// Dans le français d'un motif : {n} un nombre, {x} un texte traduit à son tour, {v} un texte gardé
// tel quel ; {d} « du / de la / de l' / des / d' / de » suivi d'un nom, {a} « au / aux / à la /
// à l' / à / en » suivi d'un nom, {l} un nom avec ou sans son article (le nom seul est traduit) ;
// « trouvé(s) » : une terminaison facultative. Dans les traductions, {1}, {2}… reprennent les
// morceaux dans l'ordre. Les lignes vides et celles qui commencent par # sont ignorées.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const dossier = join(ici, "traductions");
const sortie = join(ici, "../../src/app/monde/traductions/catalogue.ts");
const MORCEAUX = /\{[nxvdal]\}/g;
const normal = (s) => s.replace(/[\s  ]+/g, " ").trim();

const exacts = new Map();
const motifs = new Map();
let erreurs = 0;
const signaler = (ou, message) => {
  erreurs++;
  console.error(`${ou} : ${message}`);
};
for (const fichier of readdirSync(dossier).filter((f) => f.endsWith(".txt")).sort()) {
  readFileSync(join(dossier, fichier), "utf8")
    .split("\n")
    .forEach((ligne, i) => {
      const ou = `${fichier}:${i + 1}`;
      if (!ligne.trim() || ligne.startsWith("#")) return;
      const parties = ligne.split(" || ").map(normal);
      if (parties.length !== 3 || parties.some((x) => !x)) return signaler(ou, `trois parties attendues : ${ligne}`);
      const [fr, en, ar] = parties;
      const k = (fr.match(MORCEAUX) ?? []).length;
      if (k) {
        for (const t of [en, ar])
          for (const [, m] of t.matchAll(/\{(\d)\}/g)) if (Number(m) < 1 || Number(m) > k) signaler(ou, `{${m}} au-delà des ${k} morceaux`);
        motifs.set(fr, [en, ar]);
      } else {
        if (/\{\d\}/.test(en + ar)) signaler(ou, "un emplacement dans une entrée exacte");
        exacts.set(fr, [en, ar]);
      }
    });
}
if (erreurs) process.exit(1);
const js = (x) => JSON.stringify(x);
const lignes = [
  "// Fichier produit par scripts/monde/catalogue.mjs à partir de scripts/monde/traductions/*.txt : ne pas modifier à la main.",
  "// Chaque entrée : [français, anglais, arabe]. Dans les motifs, {n} est un nombre, {x} un texte traduit",
  "// à son tour, {v} un texte gardé tel quel, {d}/{a}/{l} un nom avec sa préposition ou son article ;",
  "// {1}, {2}… les reprennent dans la traduction.",
  'import type { Catalogue } from "../traduction";',
  "",
  "export const CATALOGUE: Catalogue = {",
  "  exacts: [",
  ...[...exacts].map(([fr, [en, ar]]) => `    [${js(fr)}, ${js(en)}, ${js(ar)}],`),
  "  ],",
  "  motifs: [",
  ...[...motifs].map(([fr, [en, ar]]) => `    [${js(fr)}, ${js(en)}, ${js(ar)}],`),
  "  ],",
  "};",
  "",
];
writeFileSync(sortie, lignes.join("\n"));
console.log(`${exacts.size} textes et ${motifs.size} motifs.`);
