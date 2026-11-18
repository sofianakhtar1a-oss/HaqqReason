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

/*
 * Volume attendu : 589 mots d'origine, puis deux lots ajoutés sans doublon
 * (2 000 mots, puis 4 000 mots) : 6 589 entrées en tout.
 */
const TOTAL_ATTENDU = 589 + 2000 + 4000 + 5000;

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

ok(`48 thèmes (${themes.length} trouvés)`, themes.length === 48, themes.map((t) => t.id));
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

ok(`exactement ${TOTAL_ATTENDU} mots en tout (${toutes.length})`, toutes.length === TOTAL_ATTENDU, toutes.length);
const repartition = Object.fromEntries(NIVEAUX.map((n) => [n, toutes.filter((x) => x.niveau === n).length]));
console.log(`   ${toutes.length} mots · ${JSON.stringify(repartition)}`);
for (const t of [...themes].sort((a, b) => a.entrees.length - b.entrees.length)) console.log(`   ${t.id.padEnd(18)} ${t.entrees.length}`);

console.log(e ? `\n${e} échec(s)` : "\nTout est bon.");
process.exit(e ? 1 : 0);
