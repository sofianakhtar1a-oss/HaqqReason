// Les captures comparées du Portulan : photographie les pages publiques (et leurs images
// d'aperçu), puis les compare pixel par pixel aux captures de référence. Un rapport HTML montre,
// pour chaque écran, la référence, la capture du jour et leurs différences en rouge.
//
//   npm i --no-save playwright-core            (une fois ; puis « npx playwright install chromium »
//                                               si aucun Chromium n'est déjà là)
//   node scripts/monde/captures.mjs [adresse]   compare (adresse par défaut : http://127.0.0.1:3110)
//   node scripts/monde/captures.mjs [adresse] --references   enregistre les références
//
// La première fois, les captures deviennent les références (elles restent sur la machine, hors
// du dépôt : le rendu des polices change d'un ordinateur à l'autre). Ensuite, on compare.
// Variables : CHROMIUM (le chemin d'un Chromium déjà installé), SEUIL (part de pixels changés
// tolérée, 0,02 par défaut). Sortie : tests/captures/rapport/index.html ; code 1 si un écran
// a trop changé.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const ici = dirname(fileURLToPath(import.meta.url));
const racine = join(ici, "../../tests/captures");
const dossierReferences = join(racine, "references");
const dossierRapport = join(racine, "rapport");
const args = process.argv.slice(2);
const base = (args.find((a) => !a.startsWith("--")) ?? "http://127.0.0.1:3110").replace(/\/$/, "");
const enregistrer = args.includes("--references");
const SEUIL = Number(process.env.SEUIL ?? 0.02);

/** Les écrans : une adresse, une taille, un thème. Les images d'aperçu sont lues telles quelles. */
const ECRANS = [
  { nom: "pays-index", chemin: "/monde/pays", largeur: 1280, hauteur: 900 },
  { nom: "pays-maroc", chemin: "/monde/pays/maroc", largeur: 1280, hauteur: 900, pleine: true },
  { nom: "pays-japon-clair-mobile", chemin: "/monde/pays/japon", largeur: 390, hauteur: 844, theme: "light", pleine: true },
  { nom: "invitation-duel", chemin: "/monde/rejoindre/duel/ABC234", largeur: 1280, hauteur: 900 },
  { nom: "apercu-maroc", chemin: "/monde/pays/maroc/opengraph-image", image: true },
  { nom: "apercu-duel", chemin: "/monde/rejoindre/duel/ABC234/opengraph-image", image: true },
];

let chromium;
try {
  ({ chromium } = await import("playwright-core"));
} catch {
  console.error("Il faut playwright-core : npm i --no-save playwright-core (et un Chromium : npx playwright install chromium).");
  process.exit(2);
}

/** Deux images de même taille : la part de pixels qui diffèrent, et l'image des différences. */
function comparer(a, b) {
  if (a.width !== b.width || a.height !== b.height) return { part: 1, diff: null, taille: true };
  const diff = new PNG({ width: a.width, height: a.height });
  let changes = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]);
    // Une différence à peine visible (l'anticrénelage d'une lettre) ne compte pas.
    const change = d > 48;
    if (change) changes++;
    const gris = Math.round((a.data[i] + a.data[i + 1] + a.data[i + 2]) / 3);
    diff.data[i] = change ? 255 : gris * 0.35;
    diff.data[i + 1] = change ? 40 : gris * 0.35;
    diff.data[i + 2] = change ? 60 : gris * 0.35;
    diff.data[i + 3] = 255;
  }
  return { part: changes / (a.width * a.height), diff };
}

mkdirSync(dossierReferences, { recursive: true });
mkdirSync(dossierRapport, { recursive: true });
const navigateur = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const resultats = [];
for (const e of ECRANS) {
  let png;
  if (e.image) {
    const r = await fetch(`${base}${e.chemin}`);
    if (!r.ok) {
      resultats.push({ ...e, erreur: `réponse ${r.status}` });
      continue;
    }
    png = Buffer.from(await r.arrayBuffer());
  } else {
    // Les animations s'arrêtent : deux captures du même écran doivent être identiques.
    const contexte = await navigateur.newContext({ viewport: { width: e.largeur, height: e.hauteur }, locale: "fr-FR", reducedMotion: "reduce", deviceScaleFactor: 1 });
    if (e.theme) await contexte.addInitScript((t) => localStorage.setItem("hr-theme", t), e.theme);
    const page = await contexte.newPage();
    await page.goto(`${base}${e.chemin}`, { waitUntil: "load" });
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
    await page.waitForTimeout(1200);
    png = await page.screenshot({ fullPage: Boolean(e.pleine) });
    await contexte.close();
  }
  const fichier = `${e.nom}.png`;
  writeFileSync(join(dossierRapport, `maintenant-${fichier}`), png);
  const reference = join(dossierReferences, fichier);
  if (enregistrer || !existsSync(reference)) {
    writeFileSync(reference, png);
    resultats.push({ ...e, nouveau: true });
    continue;
  }
  const r = comparer(PNG.sync.read(readFileSync(reference)), PNG.sync.read(png));
  writeFileSync(join(dossierRapport, `reference-${fichier}`), readFileSync(reference));
  if (r.diff) writeFileSync(join(dossierRapport, `difference-${fichier}`), PNG.sync.write(r.diff));
  resultats.push({ ...e, part: r.part, taille: r.taille });
}
await navigateur.close();

const pourcent = (x) => `${(x * 100).toFixed(2).replace(".", ",")} %`;
const lignes = resultats.map((r) => {
  const etat = r.erreur ? `erreur : ${r.erreur}` : r.nouveau ? "nouvelle référence" : r.taille ? "la taille a changé" : `${pourcent(r.part)} des pixels ont changé`;
  const alerte = r.erreur || r.taille || (r.part ?? 0) > SEUIL;
  const images = r.nouveau || r.erreur ? `<img src="maintenant-${r.nom}.png" alt="">` : `<img src="reference-${r.nom}.png" alt="Référence"><img src="maintenant-${r.nom}.png" alt="Maintenant">${r.taille ? "" : `<img src="difference-${r.nom}.png" alt="Différences">`}`;
  return `<section${alerte ? ' class="alerte"' : ""}><h2>${r.nom} <small>${r.chemin}</small></h2><p>${etat}</p><div class="images">${images}</div></section>`;
});
writeFileSync(
  join(dossierRapport, "index.html"),
  `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Captures comparées du Portulan</title><style>body{font:16px system-ui,sans-serif;margin:2rem;background:#0b1233;color:#f4efe1}h1{font-weight:800}section{margin:2rem 0;padding:1rem 1.2rem;border:1px solid #39407a;border-radius:14px}section.alerte{border-color:#ff6b6b}h2 small{font-weight:400;color:#b9bbd3}.images{display:flex;gap:1rem;overflow-x:auto}.images img{max-width:32%;min-width:240px;border:1px solid #39407a;border-radius:8px;background:#fff}</style><h1>Captures comparées du Portulan</h1><p>${base} · ${new Date().toLocaleString("fr-FR")} · seuil : ${pourcent(SEUIL)}</p>${lignes.join("")}</html>`,
);
const echecs = resultats.filter((r) => r.erreur || r.taille || (r.part ?? 0) > SEUIL);
for (const r of resultats) console.log(`${r.erreur || r.taille || (r.part ?? 0) > SEUIL ? "ÉCART" : "OK   "} ${r.nom}${r.nouveau ? " (référence enregistrée)" : r.part !== undefined ? ` · ${pourcent(r.part)}` : ""}${r.erreur ? ` · ${r.erreur}` : ""}`);
console.log(`Rapport : ${join(dossierRapport, "index.html")}`);
process.exit(echecs.length ? 1 : 0);
