/*
 * Aperçu d'une histoire pour la relecture : chaque phrase, sa traduction et les gloses des mots
 * pleins, avec des pistes à vérifier.
 *
 *   npx tsx scripts/langues/histoires/apercu.mts <id> [pages-NN.json] [--pistes]
 *
 * Gloses : « · » glose de la phrase, « ° » glose du lexique du lot (les mots-outils ne sont pas
 * affichés, sauf s'ils ont une glose de phrase).
 * Pistes (à vérifier, ce ne sont pas des erreurs certaines) :
 *   « ? » le sens de la glose n'apparaît pas dans la traduction (sens faux, ou traduction libre) ;
 *   « ≈ » il y apparaît sous une autre forme (accord en genre ou en nombre, temps du verbe).
 * Avec --pistes, seules les phrases qui ont une piste sont affichées.
 */
import { readFileSync } from "node:fs";
import { cleMot, estMot, motsDe } from "../../../src/lib/langues/histoires/texte";
import { DOSSIER, gloseDe, lots, type LotSource } from "./controle";

const [id, ...reste] = process.argv.slice(2);
if (!id) {
  console.error("Usage : npx tsx scripts/langues/histoires/apercu.mts <id> [pages-NN.json] [--pistes]");
  process.exit(1);
}
const seulesPistes = reste.includes("--pistes");
const fichierSeul = reste.find((a) => a.startsWith("pages-"));
const fichiers = lots(id).filter((f) => !fichierSeul || f === fichierSeul || `${f}` === `${fichierSeul}.json`);
if (!fichiers.length) {
  console.error(`Aucun lot pour « ${id} »${fichierSeul ? ` (${fichierSeul})` : ""}.`);
  process.exit(1);
}

const VIDES = new Set(
  "le la les l un une des de du d a au aux en et se s ne n pas qui que qu il elle on y ce c cet cette ces son sa ses mon ma mes ton ta tes leur leurs nous vous ils elles je j tu me m te t lui est pour par sur dans avec plus tres bien tout tous toute toutes etre avoir faire".split(" "),
);
const net = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();

/** Le sens à chercher dans la traduction : sans les parenthèses, ou ce qui suit « : » dans « (gave up : abandonna) ». */
function sensCherche(sens: string): string[] {
  let s = sens.trim();
  const expression = /^\(([^:]*):([^)]*)\)$/.exec(s);
  if (expression) s = expression[2];
  else s = s.replace(/\([^)]*\)/g, " ");
  return net(s)
    .split(" ")
    .filter((m) => m.length >= 3 && !VIDES.has(m));
}

/** « ok », « forme » (présent sous une autre forme) ou « absent ». */
function piste(sens: string, fr: string): "ok" | "forme" | "absent" {
  const cherches = sensCherche(sens);
  if (!cherches.length) return "ok";
  const motsFr = net(fr).split(" ");
  const exact = new Set(motsFr);
  if (cherches.some((m) => exact.has(m))) return "ok";
  const prefixe = (m: string) => m.slice(0, m.length <= 4 ? m.length : Math.max(4, Math.ceil(m.length * 0.6)));
  if (cherches.some((m) => motsFr.some((f) => f.startsWith(prefixe(m)) || m.startsWith(f.slice(0, Math.max(4, f.length - 1))) && f.length >= 4))) return "forme";
  return "absent";
}

const NATURES_PLEINES = new Set(["n", "v", "a", "d"]);
let nPistes = 0;
let nPhrases = 0;
for (const f of fichiers) {
  const lot = JSON.parse(readFileSync(`${DOSSIER}/sortie/${id}/${f}`, "utf8")) as LotSource;
  console.log(`\n=== ${id}/${f} (pages ${lot.debut} à ${lot.debut + lot.pages.length - 1}) ===`);
  lot.pages.forEach((page, k) => {
    const numero = lot.debut + k;
    let motsPage = 0;
    const sortie: string[] = [];
    if (page.titre) sortie.push(`  # ${page.titre} | ${page.titreFr ?? "(pas de titre français)"}`);
    page.p.forEach((para, j) =>
      para.forEach((ph, i) => {
        nPhrases++;
        const vus = new Map<string, number>();
        const gloses: string[] = [];
        let aPiste = false;
        for (const t of motsDe(ph.en)) {
          if (!estMot(t)) continue;
          motsPage++;
          const cle = cleMot(t);
          const rang = (vus.get(cle) ?? 0) + 1;
          vus.set(cle, rang);
          const trouve = gloseDe(cle, rang, ph, lot.lexique);
          if (!trouve || trouve.ou === "outil") continue;
          const [sens, , nature] = trouve.glose;
          let marque = "";
          if (nature && NATURES_PLEINES.has(nature) && cleMot(sens) !== cle) {
            const r = piste(sens, ph.fr);
            if (r !== "ok") {
              marque = r === "absent" ? " ?" : " ≈";
              aPiste = true;
              nPistes++;
            }
          }
          gloses.push(`${rang > 1 ? `${cle}#${rang}` : cle}=${sens}${trouve.ou === "phrase" ? "·" : "°"}${marque}`);
        }
        if (seulesPistes && !aPiste) return;
        sortie.push(`  [p${numero} §${j + 1}.${i + 1}] ${ph.en}`, `    FR : ${ph.fr}`, `    ${gloses.join("  ")}`);
      }),
    );
    console.log(`\n-- page ${numero} (${motsPage} mots)`);
    console.log(sortie.join("\n"));
  });
}
console.log(`\n${nPhrases} phrases, ${nPistes} piste(s) à vérifier (« ? » sens absent de la traduction, « ≈ » autre forme).`);
