/*
 * Contrôle un lot d'exercices d'entraînement (ou tous) avant de les ranger dans le site.
 *   npx tsx scripts/langues/entrainement/valider.mts conjugaison-a1a   (un lot)
 *   npx tsx scripts/langues/entrainement/valider.mts                   (tous les lots présents)
 * Sortie : la liste des problèmes, lot par lot ; code de sortie 1 s'il y en a.
 */
import { readdirSync } from "node:fs";
import { controlerLot } from "./controle";

const DOSSIER = "scripts/langues/entrainement";

const demandes = process.argv.slice(2);
{
  const lots = demandes.length ? demandes : readdirSync(`${DOSSIER}/entree`).map((f) => f.replace(/\.json$/, ""));
  let erreurs = 0;
  let total = 0;
  for (const nom of lots) {
    const r = controlerLot(nom);
    total += r.total;
    erreurs += r.problemes.length;
    if (r.problemes.length) console.log(r.problemes.slice(0, 60).join("\n") + (r.problemes.length > 60 ? `\n… et ${r.problemes.length - 60} autres` : ""));
    else console.log(`OK ${nom} : ${r.total} exercices`);
  }
  console.log(`${total} exercices contrôlés, ${erreurs} problème(s)`);
  process.exit(erreurs ? 1 : 0);
}
