/*
 * Range les dictées contrôlées dans le site : donnees/langues/dictees/<niveau>.json
 * (hors du dossier public : servies par /api/langues/dictees/…, après vérification des droits Premium)
 * (forme compacte : [anglais, traduction] pour chaque phrase). Un niveau qui ne passe pas le
 * contrôle n'est pas rangé.
 *   npx tsx scripts/langues/dictees/construire.mts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { controlerNiveau, DOSSIER, type FichierDictees, NIVEAUX } from "./controle";

for (const niveau of NIVEAUX) {
  if (!existsSync(`${DOSSIER}/sortie/${niveau}.json`)) {
    console.log(`ABSENT ${niveau}`);
    continue;
  }
  const r = controlerNiveau(niveau);
  if (r.problemes.length) {
    console.log(`REFUSÉ ${niveau} : ${r.problemes.length} problème(s), par exemple : ${r.problemes[0]}`);
    continue;
  }
  const f = JSON.parse(readFileSync(`${DOSSIER}/sortie/${niveau}.json`, "utf8")) as FichierDictees;
  const site = f.dictees.map((d) => ({ n: d.n, titre: d.titre.trim(), piege: d.piege.trim(), phrases: d.phrases.map((ph) => [ph.en.trim(), ph.fr.trim()]) }));
  writeFileSync(`donnees/langues/dictees/${niveau}.json`, `${JSON.stringify(site)}\n`);
  console.log(`RANGÉ ${niveau} : ${r.dictees} dictées, ${r.mots} mots`);
}
