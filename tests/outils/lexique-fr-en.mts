// Le lexique français → anglais du Calame, tiré des thèmes du Truchement (une fois, à chaque mise à jour des thèmes).
// Lancer : npx tsx tests/outils/lexique-fr-en.mts
import { createHash } from "node:crypto";
import { readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { TOUTES_LES_ENTREES } from "../../src/lib/langues/themes/index";

const sansAccents = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
/** « le chien », « (se) laver », « chien, chienne » : chaque forme française devient une clé. */
function cles(fr: string): string[] {
  return fr
    .split(/[,;/]|\bou\b/)
    .map((x) => sansAccents(x.replace(/\([^)]*\)/g, " ").replace(/^(le|la|les|l'|un|une|des|se|s'|to)\s*/i, "").trim()))
    .filter((x) => x.length > 1 && x.length < 40);
}

const lexique: Record<string, [string, string][]> = {};
for (const e of TOUTES_LES_ENTREES) {
  for (const c of cles(e.fr)) {
    const liste = (lexique[c] ??= []);
    if (!liste.some(([en]) => en === e.en) && liste.length < 6) liste.push([e.en, e.nature ?? ""]);
  }
}
const texte = JSON.stringify(lexique);
const empreinte = createHash("sha256").update(texte).digest("hex").slice(0, 10);
for (const f of readdirSync("public/calame")) if (/^lexique-fr-en-[0-9a-f]+\.json$/.test(f)) unlinkSync(`public/calame/${f}`);
writeFileSync(`public/calame/lexique-fr-en-${empreinte}.json`, texte);
// Le nom du fichier change avec son contenu (cache du navigateur) : le Calame le lit ici.
writeFileSync(
  "src/lib/atelier/lexique-fichier.ts",
  `/** Le lexique français → anglais tiré des thèmes du Truchement (généré par tests/outils/lexique-fr-en.mts). */\nexport const FICHIER_LEXIQUE = "/calame/lexique-fr-en-${empreinte}.json";\n`,
);
console.log(`lexique-fr-en-${empreinte}.json : ${Object.keys(lexique).length} entrées, ${(texte.length / 1024).toFixed(0)} Ko`);
