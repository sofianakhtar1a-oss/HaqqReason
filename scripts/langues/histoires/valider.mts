/*
 * Contrôle une histoire, ou l'un de ses lots, avant de la ranger dans le site.
 *   npx tsx scripts/langues/histoires/valider.mts le-chat-du-phare            (toute l'histoire)
 *   npx tsx scripts/langues/histoires/valider.mts la-ligue-des-roux pages-02  (un seul lot)
 *   npx tsx scripts/langues/histoires/valider.mts                             (toutes les histoires présentes)
 */
import { existsSync, readdirSync } from "node:fs";
import { controlerHistoire, DOSSIER } from "./controle";

const [id, lot] = process.argv.slice(2);
const ids = id ? [id] : existsSync(`${DOSSIER}/sortie`) ? readdirSync(`${DOSSIER}/sortie`) : [];
let erreurs = 0;
for (const h of ids) {
  const r = controlerHistoire(h, lot ? `${lot.replace(/\.json$/, "")}.json` : undefined);
  erreurs += r.problemes.length;
  if (r.problemes.length) console.log(r.problemes.slice(0, 80).join("\n") + (r.problemes.length > 80 ? `\n… et ${r.problemes.length - 80} autres` : ""));
  console.log(`${r.problemes.length ? "À REVOIR" : "OK"} ${h}${lot ? ` (${lot})` : ""} : ${r.pages} pages, ${r.mots} mots`);
}
console.log(`${erreurs} problème(s)`);
process.exit(erreurs ? 1 : 0);
