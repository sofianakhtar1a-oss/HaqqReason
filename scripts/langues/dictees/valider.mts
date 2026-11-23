/*
 * Contrôle les dictées d'un niveau, ou de tous les niveaux présents.
 *   npx tsx scripts/langues/dictees/valider.mts A1
 *   npx tsx scripts/langues/dictees/valider.mts
 * Signale aussi, sans bloquer, les mots que les listes de vocabulaire du module rangent bien
 * au-dessus du niveau (deux niveaux ou plus).
 */
import { existsSync, readFileSync } from "node:fs";
import { TOUTES_LES_ENTREES } from "../../../src/lib/langues/themes/index";
import { controlerNiveau, DOSSIER, type FichierDictees, NIVEAUX } from "./controle";

const NIVEAU_MOT = new Map<string, number>();
for (const e of TOUTES_LES_ENTREES) {
  const cle = e.en.toLowerCase().replace(/^to /, "").trim();
  const n = (NIVEAUX as readonly string[]).indexOf(e.niveau);
  if (!cle.includes(" ") && (!NIVEAU_MOT.has(cle) || n < NIVEAU_MOT.get(cle)!)) NIVEAU_MOT.set(cle, n);
}

const demandes = process.argv[2] ? [process.argv[2]] : NIVEAUX.filter((n) => existsSync(`${DOSSIER}/sortie/${n}.json`));
let erreurs = 0;
for (const niveau of demandes) {
  const r = controlerNiveau(niveau);
  erreurs += r.problemes.length;
  if (r.problemes.length) console.log(r.problemes.slice(0, 80).join("\n") + (r.problemes.length > 80 ? `\n… et ${r.problemes.length - 80} autres` : ""));
  const rang = (NIVEAUX as readonly string[]).indexOf(niveau);
  if (rang >= 0 && existsSync(`${DOSSIER}/sortie/${niveau}.json`) && !r.problemes.some((x) => x.includes("JSON illisible"))) {
    const f = JSON.parse(readFileSync(`${DOSSIER}/sortie/${niveau}.json`, "utf8")) as FichierDictees;
    const hauts = new Set<string>();
    for (const d of f.dictees ?? [])
      for (const ph of d.phrases ?? [])
        for (const m of (ph.en ?? "").toLowerCase().split(/[^a-z']+/)) {
          const n = NIVEAU_MOT.get(m);
          if (n !== undefined && n >= rang + 2) hauts.add(`${m} (${NIVEAUX[n]}, dictée ${d.n})`);
        }
    if (hauts.size) console.log(`Avis (sans blocage) — mots rangés bien au-dessus de ${niveau} : ${[...hauts].slice(0, 40).join(", ")}`);
  }
  console.log(`${r.problemes.length ? "À REVOIR" : "OK"} ${niveau} : ${r.dictees} dictées, ${r.phrases} phrases, ${r.mots} mots`);
}
console.log(`${erreurs} problème(s)`);
process.exit(erreurs ? 1 : 0);
