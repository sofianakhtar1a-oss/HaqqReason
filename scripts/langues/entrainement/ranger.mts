/*
 * Range les lots contrôlés dans le site : src/lib/regles/entrainement/<section>-<niveau>.json.
 * Un lot qui ne passe pas le contrôle n'est pas rangé (le fichier du site garde alors l'ancienne version).
 *   npx tsx scripts/langues/entrainement/ranger.mts
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { controlerLot } from "./controle";

const DOSSIER = "scripts/langues/entrainement";
const SITE = "src/lib/regles/entrainement";

type Entree = { section: string; niveau: string; lecons: { id: string }[] };
const lots = readdirSync(`${DOSSIER}/entree`)
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

const parFichier = new Map<string, { ordre: string[]; exercices: Record<string, unknown[]>; lots: string[]; refuses: string[] }>();
for (const nom of lots) {
  const entree = JSON.parse(readFileSync(`${DOSSIER}/entree/${nom}.json`, "utf8")) as Entree;
  const fichier = `${entree.section}-${entree.niveau.toLowerCase()}`;
  const f = parFichier.get(fichier) ?? { ordre: [], exercices: {}, lots: [], refuses: [] };
  parFichier.set(fichier, f);
  f.ordre.push(...entree.lecons.map((l) => l.id));
  if (!existsSync(`${DOSSIER}/sortie/${nom}.json`)) continue;
  const { problemes } = controlerLot(nom);
  if (problemes.length) {
    f.refuses.push(`${nom} (${problemes.length} problème(s))`);
    continue;
  }
  const sortie = JSON.parse(readFileSync(`${DOSSIER}/sortie/${nom}.json`, "utf8")) as Record<string, unknown[]>;
  Object.assign(f.exercices, sortie);
  f.lots.push(nom);
}

let total = 0;
for (const [fichier, f] of parFichier) {
  const chemin = `${SITE}/${fichier}.json`;
  // Les leçons d'un lot refusé gardent leurs exercices déjà rangés.
  const avant = existsSync(chemin) ? (JSON.parse(readFileSync(chemin, "utf8")) as Record<string, unknown[]>) : {};
  const ids = f.ordre.filter((id) => f.exercices[id] ?? avant[id]);
  const lignes = ids.map((id) => {
    const ex = (f.exercices[id] ?? avant[id]) as unknown[];
    total += ex.length;
    return `${JSON.stringify(id)}: [\n${ex.map((x) => `  ${JSON.stringify(x)}`).join(",\n")}\n]`;
  });
  writeFileSync(chemin, `{\n${lignes.join(",\n")}\n}\n`);
  console.log(`${fichier} : ${ids.length} / ${f.ordre.length} leçons${f.lots.length ? ` (lots ${f.lots.join(", ")})` : ""}${f.refuses.length ? ` ; refusés : ${f.refuses.join(", ")}` : ""}`);
}
console.log(`${total} exercices rangés`);
