/*
 * Contrôle du vocabulaire du Truchement : chaque mot n'existe qu'une fois dans tout le site,
 * chaque entrée est complète, son exemple contient le mot, et les six niveaux sont représentés.
 * Lancer : npm run test:vocabulaire
 */
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NIVEAUX, type Theme } from "../src/lib/langues/types";

let e = 0;
const ok = (n: string, c: boolean, x: unknown = "") => {
  console.log((c ? "OK " : "ECHEC ") + n + (c ? "" : ` ${JSON.stringify(x).slice(0, 600)}`));
  if (!c) e++;
};

const dossier = join(dirname(fileURLToPath(import.meta.url)), "../src/lib/langues/themes");
const fichiers = readdirSync(dossier).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "outil.ts");
const themes: Theme[] = [];
for (const f of fichiers) {
  const mod = await import(pathToFileURL(join(dossier, f)).href);
  for (const v of Object.values(mod)) if (v && typeof v === "object" && "entrees" in v) themes.push(v as Theme);
}

/* Les 12 thèmes d'origine : leurs mots sont déjà présents, le lot nouveau est le reste. */
const ORIGINE = new Set(["famille", "quotidien", "nourriture", "maison", "voyage", "ville", "travail", "ecole", "sante", "emotions", "meteo", "nature"]);

/** Forme de comparaison d'un mot : sans « to », sans casse, sans ponctuation finale. */
const cle = (en: string) =>
  en
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/-/g, " ")
    .replace(/^to\s+/, "")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim();

const toutes = themes.flatMap((t) => t.entrees.map((x) => ({ ...x, theme: t.id })));
const vus = new Map<string, string[]>();
for (const x of toutes) vus.set(cle(x.en), [...(vus.get(cle(x.en)) ?? []), `${x.theme}:${x.en}`]);
const doublons = [...vus.entries()].filter(([, l]) => l.length > 1);

ok(`33 thèmes (${themes.length} trouvés)`, themes.length === 33, themes.map((t) => t.id));
ok(`aucun mot en double dans tout le site (${toutes.length} entrées)`, doublons.length === 0, doublons);
ok("aucun identifiant de thème en double", new Set(themes.map((t) => t.id)).size === themes.length);
ok("toutes les prononciations entre barres obliques", toutes.every((x) => /^\/.+\/$/.test(x.api)), toutes.filter((x) => !/^\/.+\/$/.test(x.api)).map((x) => x.en));
ok("tous les champs remplis", toutes.every((x) => x.en && x.fr && x.exEn && x.exFr));
ok("les six niveaux CECRL sont représentés", NIVEAUX.every((n) => toutes.some((x) => x.niveau === n)));

/* Un exemple peut conjuguer le verbe (« married » pour « to marry ») : on cherche la racine du premier mot. */
const sansMot = toutes.filter((x) => {
  const b = cle(x.en);
  const racine = b.split(" ")[0];
  const ex = x.exEn.toLowerCase();
  return !ex.includes(b) && !ex.includes(racine.slice(0, Math.max(3, racine.length - 2)));
});
ok(`chaque exemple contient le mot (${sansMot.length} à corriger)`, sansMot.length === 0, sansMot.map((x) => `${x.en} → ${x.exEn}`));

const lot = toutes.filter((x) => !ORIGINE.has(x.theme));
const repartition = Object.fromEntries(NIVEAUX.map((n) => [n, lot.filter((x) => x.niveau === n).length]));
ok(`lot nouveau de exactement 2 000 mots (${lot.length})`, lot.length === 2000, lot.length);
console.log(`   lot nouveau : ${lot.length} mots · ${JSON.stringify(repartition)}`);
for (const t of themes.filter((t) => !ORIGINE.has(t.id))) console.log(`   ${t.id.padEnd(16)} ${t.entrees.length}`);

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
